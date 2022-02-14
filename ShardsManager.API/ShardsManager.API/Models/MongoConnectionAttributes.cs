using MongoDB.Driver;

namespace ShardsManager.API.Models
{
  public class MongoConnectionAttributes : MongoConnectionRequestParams
  {
    public IMongoClient MongoClient { get; set; }
  }
}
