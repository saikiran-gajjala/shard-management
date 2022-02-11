using MongoDB.Driver;

namespace ShardsManager.API.Models
{
  public class MongoConnectionAttributes
  {
    public string ConnectionId { get; set; }
    public string ConnectionString { get; set; }
    public IMongoClient MongoClient { get; set; }
  }
}
