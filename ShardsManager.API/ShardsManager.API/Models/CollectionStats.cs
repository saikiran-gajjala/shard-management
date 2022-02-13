using System;
using System.Collections.Generic;

namespace ShardsManager.API.Models
{
  public class CollectionStats
  {
    public long NoOfDocuments { get; set; }
    public long DataStorageSize { get; set; }
    public long IndexStorageSize { get; set; }
    public long TotalStorageSize { get; set; }
    public long NoOfIndexes { get; set; }
    public long NoOfChunks { get; set; }
    public List<ShardStats> ShardStats { get; set; }
  }

  public class ShardStats
  {
    public string ShardName { get; set; }
    public long StorageSize { get; set; }
    public long FreeStorageSize { get; set; }
    public long NoOfDocuments { get; set; }
  }
}