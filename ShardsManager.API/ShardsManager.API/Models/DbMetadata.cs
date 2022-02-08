using System;
using System.Collections.Generic;

namespace ShardsManager.API.Models
{
  public class DbMetadata
  {
    public string Database { get; set; }

    public List<CollectionMetadata> CollectionsMetadata { get; set; }
  }

  public class CollectionMetadata
  {
    public string CollectionName { get; set; }

    public List<IndexMetadata> IndexesMetadata { get; set; }
  }

  public class IndexMetadata
  {
    public string IndexName { get; set; }

    public List<IndexField> IndexFields { get; set; }
  }
}
