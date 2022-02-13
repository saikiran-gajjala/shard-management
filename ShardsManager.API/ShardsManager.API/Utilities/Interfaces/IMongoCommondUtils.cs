using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MongoDB.Driver;
using ShardsManager.API.Models;

namespace ShardsManager.API.Utilities.Interfaces
{
  public interface IMongoCommondUtils
  {
    bool EnableCollectionSharding(string database, string collection, List<IndexField> indexFields);
    bool EnableDBSharding(string database);
    bool GetBalancerState();
    CollectionStats GetCollectionStats(string database, string collection);
    void Initialize(IMongoClient mongoClient);
    bool ManageBalancer(bool start);
    bool MoveChunk(string database, string collection, ChunkMetadata chunkMetadata);
    bool PreSplitChunks(string database, string collection, ChunkMetadata preSplitMetadata);
  }
}
