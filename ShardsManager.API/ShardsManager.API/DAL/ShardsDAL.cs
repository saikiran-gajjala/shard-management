using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Driver;
using ShardsManager.API.Constants;
using ShardsManager.API.DAL.Interfaces;
using ShardsManager.API.Models;


namespace ShardsManager.API.DAL
{
  public class ShardsDAL : BaseDAL, IShardsDAL
  {
    private readonly IMongoDatabase mongodataBase;
    private readonly IMongoCollection<BsonDocument> shardsCollection;
    private readonly IMongoCollection<BsonDocument> databasesCollection;
    private readonly ILogger<ShardsDAL> logger;

    public ShardsDAL(IMongoClient mongoClient, ILogger<ShardsDAL> logger) : base(mongoClient)
    {
      this.mongodataBase = mongoClient.GetDatabase(CommonConstants.Database);
      var databaseWithWriteConcern = this.mongodataBase.WithWriteConcern(WriteConcern.WMajority).WithReadConcern(ReadConcern.Majority);
      this.shardsCollection = databaseWithWriteConcern.GetCollection<BsonDocument>(ShardsConstants.ShardsCollectionName);
      this.databasesCollection = databaseWithWriteConcern.GetCollection<BsonDocument>(ShardsConstants.DatabaseCollectionName);
      this.logger = logger;
    }

    /// <summary>
    /// Get all the metadata for the databases regarding the shards
    /// </summary>
    public async Task<List<ConfigDatabase>> GetDatabaseShards()
    {
      try
      {
        var databasesDtosCursor = await this.databasesCollection.FindAsync(new BsonDocument());
        var dbsDtos = databasesDtosCursor.ToList();
        var dbs = new ConcurrentBag<ConfigDatabase>();
        // Parallelizing the serialization to make it faster.
        Parallel.ForEach(dbsDtos, dbDto =>
        {
          var dbModel = BsonSerializer.Deserialize<ConfigDatabase>(dbDto);
          dbs.Add(dbModel);
        });


        return dbs.ToList();
      }
      catch (MongoException ex)
      {
        this.logger.LogError("Exception while fetching the database shards", ex);
      }

      return new List<ConfigDatabase>();
    }


    /// <summary>
    /// Gets all the available shards
    /// </summary>
    public async Task<List<Shard>> GetShards()
    {
      try
      {
        // Will use _id index
        var shardsDtosCursor = await this.shardsCollection.FindAsync(new BsonDocument());
        var shardsDtos = shardsDtosCursor.ToList();
        var shards = new ConcurrentBag<Shard>();
        // Parallelizing the serialization to make it faster.
        Parallel.ForEach(shardsDtos, shardDto =>
        {
          var shardModel = BsonSerializer.Deserialize<Shard>(shardDto);
          shards.Add(shardModel);
        });

        return shards.ToList();
      }
      catch (MongoException ex)
      {
        this.logger.LogError("Exception while fetching all shards", ex);
      }
      return new List<Shard>();
    }

    /// <summary>
    /// Gets all the metadata of the collection which are sharded.
    /// </summary>
    public new async Task<List<ConfigCollection>> GetCollectionShards()
    {
      try
      {
        return await base.GetCollectionShards();
      }
      catch (MongoException ex)
      {
        this.logger.LogError("Exception while fetching all collections shards", ex);
      }

      return new List<ConfigCollection>();
    }
  }
}
