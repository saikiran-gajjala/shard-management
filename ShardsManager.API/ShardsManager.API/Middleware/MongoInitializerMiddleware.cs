using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MongoDB.Driver;
using Newtonsoft.Json;
using ShardsManager.API.DAL;
using ShardsManager.API.DAL.Interfaces;
using ShardsManager.API.Middleware;
using ShardsManager.API.Models;
using ShardsManager.API.Utilities;
using ShardsManager.API.Utilities.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ShardsManager.API.Middleware
{
  public class MongoInitializerMiddleware
  {
    private readonly RequestDelegate next;
    private readonly IServiceCollection services;
    private readonly IMemoryCache memoryCache;

    public MongoInitializerMiddleware(RequestDelegate next, IServiceCollection services, IMemoryCache memoryCache)
    {
      this.next = next;
      this.services = services;
      this.memoryCache = memoryCache;
    }

    public async Task Invoke(HttpContext context)
    {
      var mongoConnectionString = context.Request.Headers["ConnectionString"].ToString();
      var connectionId = context.Request.Headers["ConnectionId"].ToString();
      IMongoClient mongoClient = null;
      if (!this.memoryCache.TryGetValue(connectionId, out MongoConnectionAttributes connectionAttributes))
      {
        BsonDefaults.GuidRepresentation = GuidRepresentation.Standard;
        if (string.IsNullOrEmpty(mongoConnectionString))
        {
          throw new Exception("Request does not have the valid mongodb connection string or the connectionId!!");
        }
        mongoClient = new MongoClient(mongoConnectionString);
        var mongoAttributes = new MongoConnectionAttributes()
        {
          ConnectionString = mongoConnectionString,
          ConnectionId = Guid.NewGuid().ToString("N"),
          MongoClient = mongoClient
        };

        var cacheExpiryOptions = new MemoryCacheEntryOptions
        {
          AbsoluteExpiration = DateTime.Now.AddMinutes(30),
          Priority = CacheItemPriority.High,
          SlidingExpiration = TimeSpan.FromHours(1)
        };
        var metadata = context.RequestServices.GetService<IMetadataDAL>();
        metadata.Initialize(mongoClient);
        var isValid = await metadata.ValidateConnectionString(mongoAttributes.ConnectionString);
        if (isValid)
        {
          this.memoryCache.Set(mongoAttributes.ConnectionId, mongoAttributes, cacheExpiryOptions);
        }
      }
      else
      {
        mongoClient = connectionAttributes.MongoClient;
      }

      var chunksDAL = context.RequestServices.GetService<IChunksDAL>();
      chunksDAL.Initialize(mongoClient);
      var shardsDAL = context.RequestServices.GetService<IShardsDAL>();
      shardsDAL.Initialize(mongoClient);
      var metadataDAL = context.RequestServices.GetService<IMetadataDAL>();
      metadataDAL.Initialize(mongoClient);
      var mongoCommandsUtils = context.RequestServices.GetService<IMongoCommondUtils>();
      mongoCommandsUtils.Initialize(mongoClient);
      await this.next(context);
    }
  }
}

public static class MongoMiddlewareExtensions
{
  public static IApplicationBuilder UseMongoMiddleware(this IApplicationBuilder builder)
  {
    return builder.UseMiddleware<MongoInitializerMiddleware>();
  }
}

