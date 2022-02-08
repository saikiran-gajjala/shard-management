using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using ShardsManager.API.Constants;

namespace ShardsManager.API.Models
{
  [BsonIgnoreExtraElements]
  public class ShardCollection
  {
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonElement(MetadataConstants.DistributionMode)]
    public string DistributionMode { get; set; }

    [BsonElement(MetadataConstants.Dropped)]
    public bool Dropped { get; set; }
  }
}
