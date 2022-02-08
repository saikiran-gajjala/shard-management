using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using ShardsManager.API.Constants;

namespace ShardsManager.API.Models
{
  [BsonIgnoreExtraElements]
  public class Shard
  {
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonElement(ShardsConstants.Host)]
    public string Host { get; set; }

    [BsonElement(ShardsConstants.State)]
    public int State { get; set; }
  }
}
