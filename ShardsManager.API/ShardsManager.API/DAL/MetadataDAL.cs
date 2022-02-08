using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using ShardsManager.API.Constants;
using ShardsManager.API.DAL.Interfaces;
using ShardsManager.API.Models;

namespace ShardsManager.API.DAL
{
  public class MetadataDAL : IMetadataDAL
  {
    private readonly IMongoClient mongoClient;
    private readonly ILogger<MetadataDAL> logger;
    public MetadataDAL(IMongoClient mongoClient, ILogger<MetadataDAL> logger)
    {
      this.mongoClient = mongoClient;
      this.logger = logger;
    }

    /// <summary>
    /// Gets the metadata of all the databases
    /// </summary>
    public async Task<List<string>> GetDatabases()
    {
      try
      {
        var databases = await this.mongoClient.ListDatabaseNamesAsync();
        return databases.ToList().Where(x => x != MetadataConstants.AdminDatabase && x != MetadataConstants.LocalDatabase && x != MetadataConstants.ConfigDatabase).ToList();
      }
      catch (MongoException ex)
      {
        this.logger.LogError("Exception while fetching the databases", ex);
      }

      return new List<string>();

    }

    /// <summary>
    /// Gets the metadata of all the collections
    /// </summary>
    public async Task<List<string>> GetCollections(string database)
    {
      try
      {
        var mongodataBase = mongoClient.GetDatabase(database);
        var collections = await mongodataBase.ListCollectionNamesAsync();
        return collections.ToList();
      }
      catch (MongoException ex)
      {
        this.logger.LogError($"Exception while fetching the collections in database : {database}", ex);
      }

      return new List<string>();
    }

    /// <summary>
    /// Gets the metadata of all the indexes in a given database and collection
    /// </summary>
    public async Task<List<IndexMetadata>> GetIndexes(string database, string collection)
    {
      try
      {
        var indexMetadatas = new List<IndexMetadata>();
        var mongodataBase = mongoClient.GetDatabase(database);
        var coll = mongodataBase.GetCollection<BsonDocument>(collection);
        var indexes = await coll.Indexes.List().ToListAsync();
        foreach (var index in indexes)
        {
          var indexMetadata = new IndexMetadata
          {
            IndexName = index.GetElement(MetadataConstants.Name).Value.AsString
          };
          indexMetadatas.Add(indexMetadata);
          var bsonElements = index.GetElement(MetadataConstants.Key).Value.ToBsonDocument().Elements.ToList();
          var fields = new List<IndexField>();
          foreach (var element in bsonElements)
          {
            IndexField indexField = new IndexField()
            {
              Name = element.Name,
              Value = element.Value.AsInt32
            };
            fields.Add(indexField);
          }

          indexMetadata.IndexFields = fields;
        }

        return indexMetadatas;
      }
      catch (MongoException ex)
      {
        this.logger.LogError($"Exception while fetching the indexes for the database : {database}, collection : {collection}", ex);
      }

      return new List<IndexMetadata>();
    }
  }
}
