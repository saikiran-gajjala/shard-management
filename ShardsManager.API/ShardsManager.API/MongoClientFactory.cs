using MongoDB.Bson;
using MongoDB.Driver;

namespace ShardsManager.API
{
  public static class MongoClientFactory
  {
    public static IMongoClient GetMongoClient(string connectionId)
    {
      BsonDefaults.GuidRepresentation = GuidRepresentation.Standard;
      var connectionString = connectionId;
      return new MongoClient(connectionString);
    }
  }
}
