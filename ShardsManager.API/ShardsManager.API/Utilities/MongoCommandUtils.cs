using System;
using System.Collections.Generic;
using System.Threading;
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
    private readonly IMongoDatabase mongodataBase;
    private readonly ILogger<MongoCommandUtils> logger;

    public MongoCommandUtils(IMongoClient mongoClient, ILogger<MongoCommandUtils> logger)
    {
      this.mongodataBase = mongoClient.GetDatabase(UtilConstants.AdminDatabase);
      this.logger = logger;
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
      var state = response.GetElement("mode").Value.AsString != "off";
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
