using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using ShardsManager.API.Constants;

namespace ShardsManager.API.Models
{
  [BsonIgnoreExtraElements]
  public class ConfigDatabase
  {
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonElement(MetadataConstants.Primary)]
    public string PrimaryShard { get; set; }

    [BsonElement(MetadataConstants.Partitioned)]
    public bool Partitioned { get; set; }
  }
}
