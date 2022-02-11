using System.Collections.Generic;
using System.Threading.Tasks;
using MongoDB.Driver;
using ShardsManager.API.Models;

namespace ShardsManager.API.DAL.Interfaces
{
  public interface IChunksDAL
  {
    Task<List<Chunk>> GetAllChunks(string database, string collection, bool fetchChunkMetadata = false);
    Task<int> GetMaxChunkSize();
    void Initialize(IMongoClient mongoClient);
    Task<bool> UpdateMaxChunkSize(int chunkMaxSizeInMB);
  }
}