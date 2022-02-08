using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Driver;
using ShardsManager.API.Constants;
using ShardsManager.API.Models;

namespace ShardsManager.API.DAL
{
  public class BaseDAL
  {
    private readonly IMongoDatabase mongodataBase;
    private readonly IMongoCollection<BsonDocument> collectionsCollection;
    public BaseDAL(IMongoClient mongoClient)
    {
      this.mongodataBase = mongoClient.GetDatabase(CommonConstants.Database);
      var databaseWithWriteConcern = this.mongodataBase.WithWriteConcern(WriteConcern.WMajority).WithReadConcern(ReadConcern.Majority);
      this.collectionsCollection = databaseWithWriteConcern.GetCollection<BsonDocument>(MetadataConstants.CollectionsCollectionName);
    }

    /// <summary>
    /// Fetches the metadata of all collections in mongodb
    /// </summary>
    public async Task<List<ConfigCollection>> GetCollectionShards()
    {
      var collectionDtosCursor = await this.collectionsCollection.FindAsync(new BsonDocument());
      var collDtos = collectionDtosCursor.ToList();
      var collections = new List<ConfigCollection>();
      foreach (var configCollection in collDtos)
      {
        this.FillConfigCollections(collections, configCollection);
      }

      return collections;
    }

    private void FillConfigCollections(List<ConfigCollection> collections, BsonDocument configCollection)
    {
      var configCol = new ConfigCollection
      {
        Id = configCollection.GetValue(CommonConstants.UnderScoreId).AsString
      };

      if (configCollection.TryGetValue(MetadataConstants.Dropped, out BsonValue dropped))
      {
        configCol.IsCollectionDropped = dropped.AsBoolean;
      }

      if (configCollection.TryGetValue(MetadataConstants.Key, out BsonValue key))
      {
        var shardKeyElements = key.ToBsonDocument().Elements.ToList();
        configCol.ShardKeys = shardKeyElements.Select(x => new ShardKey
        {
          Name = x.Name,
          IndexType = x.Value.ToString()
        }).ToList();
        configCol.DistributionMode = MetadataConstants.Sharded;
      }

      if (configCollection.TryGetValue(MetadataConstants.UUID, out BsonValue uuid))
      {
        configCol.Uuid = uuid.AsGuid;
      }

      collections.Add(configCol);
    }
  }
}
