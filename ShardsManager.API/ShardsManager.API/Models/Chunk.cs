using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using ShardsManager.API.Constants;

namespace ShardsManager.API.Models
{
  [BsonIgnoreExtraElements]
  public class Chunk
  {
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonElement(ChunkConstants.Shard)]
    public string Shard { get; set; }

    [BsonElement(ChunkConstants.Min)]
    public List<Range> Min { get; set; } = new List<Range>();

    [BsonElement(ChunkConstants.Max)]
    public List<Range> Max { get; set; } = new List<Range>();

    [BsonElement(ChunkConstants.Shard)]
    public double SizeInMB { get; set; }

    [BsonElement(ChunkConstants.Shard)]
    public long NoOfObjects { get; set; }
  }

  public class Range
  {
    public string Name { get; set; }
    public string Value { get; set; }
    public string BsonType { get; set; }
  }
}
