using System.Collections.Generic;

namespace ShardsManager.API.Models
{
  public class CollectionShardResponse
  {
    public bool ShardStatus { get; set; }
    public List<ShardKey> ShardKeys { get; set; }
  }
}
