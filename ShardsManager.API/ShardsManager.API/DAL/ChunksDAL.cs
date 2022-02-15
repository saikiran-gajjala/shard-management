using ShardsManager.API.DAL.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using ShardsManager.API.Constants;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System.Collections.Generic;
using ShardsManager.API.Models;
using System.Linq;
using Range = ShardsManager.API.Models.Range;
using System;
using System.Collections.Concurrent;

namespace ShardsManager.API.DAL
{
  public class ChunksDAL : BaseDAL, IChunksDAL
  {
    private IMongoDatabase mongodataBase;
    private IMongoCollection<BsonDocument> chunkCollection;
    private IMongoCollection<BsonDocument> configSettingsCollection;
    private readonly ILogger<ChunksDAL> logger;
    public ChunksDAL(ILogger<ChunksDAL> logger)
    {
      this.logger = logger;
    }

    /// <summary>
    /// Initializes the mongo components
    /// </summary>
    public new void Initialize(IMongoClient mongoClient)
    {
      this.mongodataBase = mongoClient.GetDatabase(CommonConstants.Database);
      var databaseWithWriteConcern = this.mongodataBase.WithWriteConcern(WriteConcern.WMajority).WithReadConcern(ReadConcern.Majority);
      this.chunkCollection = databaseWithWriteConcern.GetCollection<BsonDocument>(ChunkConstants.ChunksCollectionName);
      this.configSettingsCollection = databaseWithWriteConcern.GetCollection<BsonDocument>(ChunkConstants.ConfigSettingsCollectionName);
      base.Initialize(mongoClient);
    }

    /// <summary>
    /// Gets all the chunks of a collection
    /// </summary>
    /// <param name="database">Name of the database</param>
    /// <param name="collection">Name of the collection</param>
    /// <param name="fetchChunkMetadata">Flag to fetch the chunk's metadata</param>
    /// <returns></returns>
    public async Task<List<Chunk>> GetAllChunks(string database, string collection, bool fetchChunkMetadata = false)
    {
      try
      {
        var filter = new BsonDocument
        {
          [ChunkConstants.Namespace] = $"{database}.{collection}"
        };
        // Will use 'ns_1_lastmod_1' index
        var chunksCursor = await this.chunkCollection.FindAsync(filter);
        var chunkDtos = chunksCursor.ToList();
        var collectionsMetadata = await base.GetCollectionShards();
        var collectionMetadata = collectionsMetadata.Where(x => x.Id == $"{database}.{collection}").FirstOrDefault();
        if (!chunkDtos.Any())
        {
          // It has been observed that sometimes the chunk collection will not have the "ns" field to filter. Which used to fetch zero records.
          // The following code is alternative way to fetch chunks if there is no "ns field"
          var uuidFilter = new BsonDocument
          {
            [ChunkConstants.UUID] = new BsonBinaryData(collectionMetadata.Uuid, GuidRepresentation.Standard)
          };
          // Will use 'uuid_1_lastmod_1' index
          chunksCursor = await this.chunkCollection.FindAsync(uuidFilter);
          chunkDtos = chunksCursor.ToList();
        }
        var shardKey = new Dictionary<string, object>();
        foreach (var shardKeyItem in collectionMetadata.ShardKeys)
        {
          shardKey.Add(shardKeyItem.Name, shardKeyItem.IndexType);
        }
        var chunks = new ConcurrentBag<Chunk>();
        Parallel.ForEach(chunkDtos, chunkDto =>
        {
          var chunk = new Chunk();
          chunk.Id = chunkDto.GetElement(CommonConstants.UnderScoreId).Value.ToString();
          chunk.Shard = chunkDto.GetElement(ChunkConstants.Shard).Value.ToString();
          var minKeyElements = chunkDto.GetElement(ChunkConstants.Min).Value.ToBsonDocument().Elements.ToList();
          var maxKeyElements = chunkDto.GetElement(ChunkConstants.Max).Value.ToBsonDocument().Elements.ToList();
          chunk.Min = this.FetchChunkRanges(minKeyElements);
          chunk.Max = this.FetchChunkRanges(maxKeyElements);
          if (fetchChunkMetadata)
          {
            this.FillChunkMetadata(database, collection, chunk, shardKey);
          }
          chunks.Add(chunk);
        });

        return chunks.ToList();
      }
      catch (MongoException ex)
      {
        this.logger.LogError("Exception while fetching the chunks", ex);
      }

      return new List<Chunk>();
    }

    /// <summary>
    /// Gets all the chunks of a collection
    /// </summary>
    /// <returns></returns>
    public async Task<int> GetMaxChunkSize()
    {
      var chunkMaxSize = 64;// Default chunk size
      try
      {
        var filter = new BsonDocument
        {
          [CommonConstants.UnderScoreId] = ChunkConstants.ChunkSize
        };
        var chunksSizeCursor = await this.configSettingsCollection.FindAsync(filter);
        var chunksSizeDocument = chunksSizeCursor.ToList().FirstOrDefault();
        if (chunksSizeDocument == null)
        {
          return chunkMaxSize;
        }

        chunkMaxSize = chunksSizeDocument.GetElement(ChunkConstants.Value).Value.AsInt32;
      }
      catch (MongoException ex)
      {
        this.logger.LogError("Exception while fetching the maxium chunk size", ex);
      }

      return chunkMaxSize;
    }

    /// <summary>
    /// Updates the maxium chunk size
    /// </summary>
    public async Task<bool> UpdateMaxChunkSize(int chunkMaxSizeInMB)
    {
      try
      {
        var filter = new BsonDocument
        {
          [CommonConstants.UnderScoreId] = ChunkConstants.ChunkSize
        };
        var updateDefinition = Builders<BsonDocument>.Update.Set(ChunkConstants.Value, chunkMaxSizeInMB);
        var options = new UpdateOptions()
        {
          IsUpsert = true
        };
        var result = await this.configSettingsCollection.UpdateOneAsync(
                 filter,
                 updateDefinition,
                 options);

        return result.IsAcknowledged;
      }
      catch (MongoException ex)
      {
        this.logger.LogError("Exception while updating the maxium chunk size", ex);
      }

      return false;
    }


    private List<Range> FetchChunkRanges(List<BsonElement> minKeyElements)
    {
      var ranges = new List<Range>();
      foreach (var minKeyElement in minKeyElements)
      {
        var range = new Range()
        {
          Name = minKeyElement.Name,
          Value = minKeyElement.Value.ToString(),
          BsonType = minKeyElement.Value.BsonType.ToString()
        };
        ranges.Add(range);
      }
      return ranges;
    }

    /// <summary>
    /// Fills the chunk metadata
    /// </summary>
    public bool FillChunkMetadata(string database, string collection, Chunk chunk, Dictionary<string, object> shardKey)
    {
      var minKey = new Dictionary<string, object>();
      foreach (var min in chunk.Min)
      {
        FetchChunkRanges(minKey, min);
      }

      var maxKey = new Dictionary<string, object>();
      foreach (var max in chunk.Max)
      {
        FetchChunkRanges(maxKey, max);
      }

      var commandDict = new Dictionary<string, object>
        {
          { ChunkConstants.DataSize, $"{database}.{collection}" },
          { ChunkConstants.KeyPattern,  shardKey},
          { ChunkConstants.Min, minKey },
          { ChunkConstants.Max, maxKey},
          { ChunkConstants.MaxTimeMS, 10000}
        };
      var bsonDocument = new BsonDocument(commandDict);
      var commandDoc = new BsonDocumentCommand<BsonDocument>(bsonDocument);
      try
      {
        var result = this.mongodataBase.RunCommand(commandDoc);
        chunk.SizeInMB = result.GetElement(ChunkConstants.Size).Value.AsDouble / 1024 / 1024;
        chunk.NoOfObjects = 0;
        if (long.TryParse(result.GetElement(ChunkConstants.NoOfObjects).Value.ToString(), out long noOfObjects))
        {
          chunk.NoOfObjects = noOfObjects;
        }
      }
      catch (MongoCommandException ex)
      {
        this.logger.LogError("Exception while fetching the chunk sizes", ex);
        return false;
      }

      return true;
    }

    private void FetchChunkRanges(Dictionary<string, object> rangeKeys, Range range)
    {
      switch (range.BsonType)
      {
        case UtilConstants.IntegerType:
          var value = Convert.ToInt32(range.Value);
          rangeKeys.Add(range.Name, new BsonInt32(value));
          break;
        case UtilConstants.StringType:
          var strValue = range.Value;
          rangeKeys.Add(range.Name, new BsonString(strValue));
          break;
        case UtilConstants.MinKeyType:
          rangeKeys.Add(range.Name, BsonValue.Create(BsonMinKey.Value));
          break;
        case UtilConstants.MaxKeyType:
          rangeKeys.Add(range.Name, BsonValue.Create(BsonMaxKey.Value));
          break;
        case UtilConstants.DateTime:
          var date = DateTime.Parse(range.Value);
          rangeKeys.Add(range.Name, new BsonDateTime(date));
          break;
      }
    }
  }
}
