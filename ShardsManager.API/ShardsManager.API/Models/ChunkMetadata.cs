using System;
using System.Collections.Generic;

namespace ShardsManager.API.Models
{
  public class ChunkMetadata
  {
    public int ChunkStartPosition { get; set; }
    public int ChunkEndPosition { get; set; }
    public List<Range> ChunkRanges { get; set; }
    public bool AppendChunkIndex { get; set; }
    public string TargetShard { get; set; }
  }
}
