using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ShardsManager.API.DAL.Interfaces;
using ShardsManager.API.Models;

namespace ShardsManager.API.Controllers
{
  [ApiController]
  [Route("metadata")]
  public class MetadataController : Controller
  {
    private readonly ILogger<MetadataController> _logger;
    private readonly IMetadataDAL metadataDAL;

    public MetadataController(ILogger<MetadataController> logger, IMetadataDAL metadataDAL)
    {
      this._logger = logger;
      this.metadataDAL = metadataDAL;
    }

    /// <summary>
    /// Fetches the metadata of existing databases, collections and their indexes
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    public async Task<IActionResult> GetMetadata()
    {
      var dbMetadatas = new List<DbMetadata>();
      var dataBases = await this.metadataDAL.GetDatabases();
      foreach (var db in dataBases)
      {
        var dbMetadata = new DbMetadata()
        {
          Database = db
        };
        dbMetadatas.Add(dbMetadata);
        dbMetadata.CollectionsMetadata = new List<CollectionMetadata>();
        var collections = await this.metadataDAL.GetCollections(db);
        foreach (var collection in collections)
        {
          var collectionMetadata = new CollectionMetadata()
          {
            CollectionName = collection,
            IndexesMetadata = await this.metadataDAL.GetIndexes(db, collection)
          };
          dbMetadata.CollectionsMetadata.Add(collectionMetadata);
        }
      }
      return new OkObjectResult(dbMetadatas);
    }
  }
}
