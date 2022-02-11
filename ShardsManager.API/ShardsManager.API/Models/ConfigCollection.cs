using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using ShardsManager.API.Constants;

namespace ShardsManager.API.Models
{

  [BsonIgnoreExtraElements]
  public class ConfigCollection
  {
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonElement(MetadataConstants.Key)]
    public List<ShardKey> ShardKeys { get; set; } = new List<ShardKey>();

    [BsonElement(MetadataConstants.Dropped)]
    public bool IsCollectionDropped { get; set; }

    [BsonElement(MetadataConstants.DistributionMode)]
    public string DistributionMode { get; set; } = "non-sharded";

    [BsonElement(MetadataConstants.UUID)]
    [BsonRepresentation(BsonType.String)]
    public Guid Uuid { get; set; }
  }

  public class ShardKey
  {
    public string Name { get; set; }
    public int IndexType { get; set; }
  }
}
