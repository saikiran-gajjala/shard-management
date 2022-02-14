using System;
using System.Collections.Generic;

namespace ShardsManager.API.Models
{
  public class CollectionStats
  {
    public long NoOfDocuments { get; set; }
    public double DataStorageSizeInMB { get; set; }
    public double IndexStorageSizeInMB { get; set; }
    public double TotalStorageSizeInMB { get; set; }
    public long NoOfIndexes { get; set; }
    public long NoOfChunks { get; set; }
    public List<ShardStats> ShardStats { get; set; }
  }

  public class ShardStats
  {
    public string ShardName { get; set; }
    public double StorageSizeInMB { get; set; }
    public double FreeStorageSizeInMB { get; set; }
    public long NoOfDocuments { get; set; }
    public long NoOfChunks { get; set; }
  }
}
