using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using ShardsManager.API.DAL.Interfaces;
using ShardsManager.API.Models;
using ShardsManager.API.Utilities.Interfaces;

namespace ShardsManager.API.Controllers
{
  [ApiController]
  [Route("metadata")]
  public class MetadataController : Controller
  {
    private readonly ILogger<MetadataController> _logger;
    private readonly IMetadataDAL metadataDAL;
    private readonly IMemoryCache memoryCache;
    private readonly IShardsDAL shardsDAL;
    private readonly IMongoCommondUtils mongoCommandUtils;

    public MetadataController(ILogger<MetadataController> logger, IMetadataDAL metadataDAL, IShardsDAL shardsDAL, IMemoryCache memoryCache, IMongoCommondUtils mongoCommandUtils)
    {
      this._logger = logger;
      this.metadataDAL = metadataDAL;
      this.memoryCache = memoryCache;
      this.shardsDAL = shardsDAL;
      this.mongoCommandUtils = mongoCommandUtils;
    }

    /// <summary>
    /// Validates the mongodb connection string
    /// </summary>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(MongoConnecivityResponse), 200)]
    public async Task<IActionResult> ValidateConnection([FromBody] MongoConnectionAttributes attributes)
    {
      var response = new MongoConnecivityResponse();
      BsonDefaults.GuidRepresentation = GuidRepresentation.Standard;
      var mongoClient = new MongoClient(attributes.ConnectionString);
      this.metadataDAL.Initialize(mongoClient);
      var connectionId = Guid.NewGuid().ToString("N");
      response.IsConnectionSuccess = await this.metadataDAL.ValidateConnectionString(attributes.ConnectionString);
      if (response.IsConnectionSuccess)
      {
        var shards = await this.shardsDAL.GetShards();
        response.IsShardedCluster = shards.Count > 0;
        if (response.IsShardedCluster)
        {
          var mongoAttributes = new MongoConnectionAttributes()
          {
            ConnectionString = attributes.ConnectionString,
            ConnectionId = connectionId,
            MongoClient = mongoClient
          };

          var cacheExpiryOptions = new MemoryCacheEntryOptions
          {
            AbsoluteExpiration = DateTime.Now.AddMinutes(30),
            Priority = CacheItemPriority.High,
            SlidingExpiration = TimeSpan.FromHours(1)
          };
          response.ConnectionId = mongoAttributes.ConnectionId;
          this.memoryCache.Set(mongoAttributes.ConnectionId, mongoAttributes, cacheExpiryOptions);
        }
      }

      return new OkObjectResult(response);
    }

    /// <summary>
    /// Fetches the metadata of existing databases, collections and their indexes
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    public async Task<IActionResult> GetMetadata()
    {
      var dbMetadatas = new List<DbMetadata>();
      var dataBases = await this.metadataDAL.GetDatabases();
      foreach (var db in dataBases)
      {
        var dbMetadata = new DbMetadata()
        {
          Database = db
        };
        dbMetadatas.Add(dbMetadata);
        dbMetadata.CollectionsMetadata = new List<CollectionMetadata>();
        var collections = await this.metadataDAL.GetCollections(db);
        foreach (var collection in collections)
        {
          var collectionMetadata = new CollectionMetadata()
          {
            CollectionName = collection,
            IndexesMetadata = await this.metadataDAL.GetIndexes(db, collection)
          };
          dbMetadata.CollectionsMetadata.Add(collectionMetadata);
        }
      }
      return new OkObjectResult(dbMetadatas);
    }

    /// <summary>
    /// Fetches the metadata of existing databases, collections and their indexes
    /// </summary>
    /// <returns></returns>
    [HttpGet("collectionStats/{database}/{collection}")]
    public async Task<IActionResult> GetCollectionStats(string database, string collection)
    {
      var stats = this.mongoCommandUtils.GetCollectionStats(database, collection);
      return new OkObjectResult(stats);
    }
  }
}
