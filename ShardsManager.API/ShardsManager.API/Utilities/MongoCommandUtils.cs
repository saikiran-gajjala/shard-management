using System;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using ShardsManager.API.Constants;
using ShardsManager.API.Models;
using ShardsManager.API.Utilities.Interfaces;
using Range = ShardsManager.API.Models.Range;

namespace ShardsManager.API.Utilities
{
  public class MongoCommandUtils : IMongoCommondUtils
  {
    private readonly ILogger<MongoCommandUtils> logger;
    private IMongoClient mongoClient;
    private IMongoDatabase mongodataBase;


    public MongoCommandUtils(ILogger<MongoCommandUtils> logger)
    {
      this.logger = logger;
    }

    /// <summary>
    /// Initializes the mongo components
    /// </summary>
    public void Initialize(IMongoClient mongoClient)
    {
      this.mongoClient = mongoClient;
      this.mongodataBase = mongoClient.GetDatabase(UtilConstants.AdminDatabase);
    }

    /// <summary>
    /// Shards a database
    /// </summary>
    /// <param name="database">Name of the database</param>
    public bool EnableDBSharding(string database)
    {
      try
      {
        var shardDbResult = this.mongodataBase.RunCommand<MongoDB.Bson.BsonDocument>(new BsonDocument() {

            { "enableSharding",$"{database}" }
        });
      }
      catch (MongoCommandException ex)
      {
        this.logger.LogError("Exception while sharding the database", ex);
        return false;
      }

      return true;
    }

    /// <summary>
    /// Shards a collection in MongoDB
    /// </summary>
    /// <param name="database">Name of the database</param>
    /// <param name="collection">Name of the collection</param>
    /// <param name="indexFields"></param>
    public bool EnableCollectionSharding(string database, string collection, List<IndexField> indexFields)
    {
      var commandDict = new Dictionary<string, object>
      {
        { "shardCollection", $"{database}.{collection}" }
      };
      var indexKeys = new Dictionary<string, object>();
      foreach (var indexField in indexFields)
      {
        indexKeys.Add(indexField.Name, indexField.Value);
      }
      commandDict.Add("key", indexKeys);
      var bsonDocument = new BsonDocument(commandDict);
      var commandDoc = new BsonDocumentCommand<BsonDocument>(bsonDocument);
      try
      {
        this.mongodataBase.RunCommand(commandDoc);
      }
      catch (MongoCommandException ex)
      {
        this.logger.LogError("Exception while sharding the collection", ex);
        return false;
      }

      return true;
    }

    /// <summary>
    /// Starts or stops the auto balancer
    /// </summary>
    /// <param name="start">On or Off</param>
    public bool ManageBalancer(bool start)
    {
      var commandDict = new Dictionary<string, object>();
      if (start)
      {
        commandDict.Add("balancerStart", 1);
      }
      else
      {
        commandDict.Add("balancerStop", 1);
      }
      var bsonDocument = new BsonDocument(commandDict);
      var commandDoc = new BsonDocumentCommand<BsonDocument>(bsonDocument);
      try
      {
        this.mongodataBase.RunCommand(commandDoc);
      }
      catch (MongoCommandException ex)
      {
        this.logger.LogError("Exception while enabling/disabling the balancer", ex);
        return false;
      }

      return true;
    }

    /// <summary>
    /// Fetches the balancer state
    /// </summary>
    public bool GetBalancerState()
    {
      var commandDict = new Dictionary<string, object>
      {
        { "balancerStatus", 1 }
      };
      var bsonDocument = new BsonDocument(commandDict);
      var commandDoc = new BsonDocumentCommand<BsonDocument>(bsonDocument);
      var response = this.mongodataBase.RunCommand(commandDoc);
      var state = response.GetElement(UtilConstants.Mode).Value.AsString != "off";
      return state;
    }

    /// <summary>
    /// Presplits chunks in an empty collection
    /// </summary>
    public bool PreSplitChunks(string database, string collection, ChunkMetadata preSplitMetadata)
    {
      for (int x = preSplitMetadata.ChunkStartPosition; x <= preSplitMetadata.ChunkEndPosition; x++)
      {
        var commandDict = new Dictionary<string, object>
        {
          { "split", $"{database}.{collection}" }
        };
        var ranges = new Dictionary<string, object>();
        foreach (var chunkRange in preSplitMetadata.ChunkRanges)
        {
          FetchChunkRange(preSplitMetadata, x, ranges, chunkRange);

        }
        commandDict.Add("middle", ranges);
        var bsonDocument = new BsonDocument(commandDict);
        var commandDoc = new BsonDocumentCommand<BsonDocument>(bsonDocument);
        try
        {
          this.mongodataBase.RunCommand(commandDoc);
        }
        catch (MongoCommandException ex)
        {
          this.logger.LogError("Exception while pre-splitting the chunks", ex);
          return false;
        }
      }

      return true;
    }

    /// <summary>
    /// Moves chunks in a collection from one shard to an another
    /// </summary>
    public bool MoveChunk(string database, string collection, ChunkMetadata chunkMetadata)
    {
      for (int x = chunkMetadata.ChunkStartPosition; x <= chunkMetadata.ChunkEndPosition; x++)
      {
        var commandDict = new Dictionary<string, object>
        {
          { "moveChunk", $"{database}.{collection}" }
        };
        var ranges = new Dictionary<string, object>();
        foreach (var chunkRange in chunkMetadata.ChunkRanges)
        {
          FetchChunkRange(chunkMetadata, x, ranges, chunkRange);

        }
        commandDict.Add("find", ranges);
        commandDict.Add("to", chunkMetadata.TargetShard);
        var bsonDocument = new BsonDocument(commandDict);
        var commandDoc = new BsonDocumentCommand<BsonDocument>(bsonDocument);
        try
        {
          this.mongodataBase.RunCommand(commandDoc);
        }
        catch (MongoCommandException ex)
        {
          this.logger.LogError("Exception while moving the chunks", ex);
          return false;
        }
      }
      return true;
    }

    /// <summary>
    /// Gets the stats of the collection
    /// </summary>
    public CollectionStats GetCollectionStats(string database, string collection)
    {
      var db = this.mongoClient.GetDatabase(database);
      var commandDict = new Dictionary<string, object>
      {
        { "collStats", collection }
      };
      var bsonDocument = new BsonDocument(commandDict);
      var commandDoc = new BsonDocumentCommand<BsonDocument>(bsonDocument);
      var response = db.RunCommand(commandDoc);
      var shardElements = response.GetElement(UtilConstants.Shards).Value.ToBsonDocument().Elements;
      var collStats = new CollectionStats
      {
        ShardStats = new List<ShardStats>(),
        NoOfChunks = response.GetElement(UtilConstants.NoOfChunks).Value.AsInt32,
        DataStorageSize = response.GetElement(UtilConstants.StorageSize).Value.AsInt32,
        IndexStorageSize = response.GetElement(UtilConstants.TotalIndexSize).Value.AsInt32,
        NoOfDocuments = response.GetElement(UtilConstants.Count).Value.AsInt32,
        NoOfIndexes = response.GetElement(UtilConstants.NoOfIndexes).Value.AsInt32,
        TotalStorageSize = response.GetElement(UtilConstants.TotalSize).Value.AsInt32
      };

      foreach (var shard in shardElements)
      {
        var shardEle = shard.Value.ToBsonDocument();
        var shardStats = new ShardStats
        {
          ShardName = shard.Name,
          StorageSize = shardEle.GetElement(UtilConstants.StorageSize).Value.AsInt32,
          FreeStorageSize = shardEle.GetElement(UtilConstants.FreeStorageSize).Value.AsInt32,
          NoOfDocuments = shardEle.GetElement(UtilConstants.Count).Value.AsInt32
        };
        collStats.ShardStats.Add(shardStats);
      }

      return collStats;
    }

    private static void FetchChunkRange(ChunkMetadata preSplitMetadata, int x, Dictionary<string, object> ranges, Range chunkRange)
    {
      switch (chunkRange.BsonType)
      {
        case UtilConstants.IntegerType:
          var value = Convert.ToInt32(chunkRange.Value);
          if (preSplitMetadata.AppendChunkIndex)
          {
            value = x;
          }
          ranges.Add(chunkRange.Name, new BsonInt32(value));
          break;
        case UtilConstants.StringType:
          var strValue = chunkRange.Value;
          if (preSplitMetadata.AppendChunkIndex)
          {
            strValue += x;
          }
          ranges.Add(chunkRange.Name, new BsonString(strValue));
          break;
        case UtilConstants.MinKeyType:
          ranges.Add(chunkRange.Name, BsonValue.Create(BsonMinKey.Value));
          break;
        case UtilConstants.MaxKeyType:
          ranges.Add(chunkRange.Name, BsonValue.Create(BsonMaxKey.Value));
          break;
      }
    }
  }
}
