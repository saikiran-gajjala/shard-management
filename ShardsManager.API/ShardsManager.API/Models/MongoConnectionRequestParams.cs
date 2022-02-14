using MongoDB.Driver;

namespace ShardsManager.API.Models
{
  public class MongoConnectionRequestParams
  {
    public string ConnectionId { get; set; }
    public string ConnectionString { get; set; }
    //public IMongoClient MongoClient { get; set; }
  }
}
