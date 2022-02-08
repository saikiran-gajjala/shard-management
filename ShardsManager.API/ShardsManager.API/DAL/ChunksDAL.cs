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

namespace ShardsManager.API.DAL
{
  public class ChunksDAL : BaseDAL, IChunksDAL
  {
    private readonly IMongoDatabase mongodataBase;
    private readonly IMongoCollection<BsonDocument> chunkCollection;
    private readonly ILogger<ChunksDAL> logger;
    public ChunksDAL(IMongoClient mongoClient, ILogger<ChunksDAL> logger) : base(mongoClient)
    {
      this.mongodataBase = mongoClient.GetDatabase(CommonConstants.Database);
      var databaseWithWriteConcern = this.mongodataBase.WithWriteConcern(WriteConcern.WMajority).WithReadConcern(ReadConcern.Majority);
      this.chunkCollection = databaseWithWriteConcern.GetCollection<BsonDocument>(ChunkConstants.ChunksCollectionName);
      this.logger = logger;
    }

    /// <summary>
    /// Gets all the chunks of a collection
    /// </summary>
    /// <param name="database">Name of the database</param>
    /// <param name="collection">Name of the collection</param>
    /// <returns></returns>
    public async Task<List<Chunk>> GetAllChunks(string database, string collection)
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
        if (!chunkDtos.Any())
        {
          // It has been observed that sometimes the chunk collection will not have the "ns" field to filter. Which used to fetch zero records.
          // The following code is alternative way to fetch chunks if there is no "ns field"
          var collectionsMetadata = await base.GetCollectionShards();
          var collectionMetadata = collectionsMetadata.Where(x => x.Id == $"{database}.{collection}").FirstOrDefault();
          var uuidFilter = new BsonDocument
          {
            [ChunkConstants.UUID] = new BsonBinaryData(collectionMetadata.Uuid, GuidRepresentation.Standard)
          };
          // Will use 'uuid_1_lastmod_1' index
          chunksCursor = await this.chunkCollection.FindAsync(uuidFilter);
          chunkDtos = chunksCursor.ToList();
        }
        var chunks = new List<Chunk>();
        foreach (var chunkDto in chunkDtos)
        {
          Chunk chunk = new Chunk();
          chunk.Id = chunkDto.GetElement(CommonConstants.UnderScoreId).ToString();
          chunk.Shard = chunkDto.GetElement(ChunkConstants.Shard).ToString();
          var minKeyElements = chunkDto.GetElement(ChunkConstants.Min).Value.ToBsonDocument().Elements.ToList();
          var maxKeyElements = chunkDto.GetElement(ChunkConstants.Max).Value.ToBsonDocument().Elements.ToList();
          chunk.Min = this.FetchChunkRanges(minKeyElements);
          chunk.Max = this.FetchChunkRanges(maxKeyElements);
          chunks.Add(chunk);
        }

        return chunks;
      }
      catch (MongoException ex)
      {
        this.logger.LogError("Exception while fetching the chunks", ex);
      }

      return new List<Chunk>();
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
  }
}
