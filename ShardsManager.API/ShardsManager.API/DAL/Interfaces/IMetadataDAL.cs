using MongoDB.Driver;
using ShardsManager.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ShardsManager.API.DAL.Interfaces
{
  public interface IMetadataDAL
  {
    Task<List<string>> GetDatabases();
    Task<List<string>> GetCollections(string database);
    Task<List<IndexMetadata>> GetIndexes(string database, string collection);
    Task<bool> ValidateConnectionString(string connectionString);
    void Initialize(IMongoClient mongoClient);
  }
}
