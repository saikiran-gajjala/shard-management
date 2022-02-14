namespace ShardsManager.API.Models
{
  public class MongoConnectivityResponse
  {
    public string ConnectionId { get; set; }
    public bool IsConnectionSuccess { get; set; }
    public bool IsShardedCluster { get; set; }
  }
}
