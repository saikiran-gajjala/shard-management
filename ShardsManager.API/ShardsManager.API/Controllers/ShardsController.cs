using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ShardsManager.API.Constants;
using ShardsManager.API.DAL.Interfaces;
using ShardsManager.API.Models;
using ShardsManager.API.Utilities.Interfaces;

namespace ShardsManager.API.Controllers
{
  [ApiController]
  [Route("shards")]
  public class ShardsController : Controller
  {
    private readonly ILogger<ShardsController> _logger;
    private readonly IShardsDAL shardsDAL;
    private readonly IMongoCommondUtils mongoCommandUtils;

    public ShardsController(ILogger<ShardsController> logger, IShardsDAL shardsDAL, IMongoCommondUtils mongoCommandUtils)
    {
      this._logger = logger;
      this.shardsDAL = shardsDAL;
      this.mongoCommandUtils = mongoCommandUtils;
    }

    /// <summary>
    /// Fetches all shards
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetShards()
    {
      var shards = await this.shardsDAL.GetShards();
      return new OkObjectResult(shards);
    }

    /// <summary>
    /// Fetches the sharding status of a database
    /// </summary>
    /// <param name="database">Name of the database</param>
    [HttpGet("dbShardStatus/{database}")]
    public async Task<IActionResult> GetDatabaseShardStatus(string database)
    {
      var dbs = await this.shardsDAL.GetDatabaseShards();
      var isSharded = dbs.Where(x => x.Id == database).Select(x => x.Partitioned).FirstOrDefault();
      return new OkObjectResult(isSharded);
    }

    /// <summary>
    /// Fetches the sharding status of a collection
    /// </summary>
    /// <param name="database">Name of the database</param>
    /// <param name="collection">Name of the collection</param>
    [HttpGet("collShardStatus/{database}/{collection}")]
    public async Task<IActionResult> GetShards(string database, string collection)
    {
      var collections = await this.shardsDAL.GetCollectionShards();
      var collectionMetadata = collections.Where(x => x.Id == $"{ database}.{collection}");
      var response = new CollectionShardResponse()
      {
        ShardStatus = false,
        ShardKeys = new List<ShardKey>()
      };
      if (collectionMetadata != null && collectionMetadata.Count() > 0)
      {
        response.ShardStatus = collectionMetadata.FirstOrDefault().DistributionMode == MetadataConstants.Sharded;
        response.ShardKeys = collectionMetadata.FirstOrDefault().ShardKeys;
      }
      return new OkObjectResult(response);
    }

    /// <summary>
    /// Shards a database
    /// </summary>
    /// <param name="database">Name of the database</param>
    [HttpPost("shardDB/{database}")]
    public IActionResult ShardDatabase(string database)
    {
      var response = this.mongoCommandUtils.EnableDBSharding(database);
      return new OkObjectResult(response);
    }

    /// <summary>
    /// Shards a collection in MongoDB
    /// </summary>
    /// <param name="database">Name of the database</param>
    /// <param name="collection">Name of the collection</param>
    /// <param name="indexFields"></param>
    [HttpPost("shardCollection/{database}/{collection}")]
    public IActionResult ShardCollection(string database, string collection, [FromBody] List<IndexField> indexFields)
    {
      var response = this.mongoCommandUtils.EnableCollectionSharding(database, collection, indexFields);
      return new OkObjectResult(response);
    }

    /// <summary>
    /// Starts or stops the auto balancer
    /// </summary>
    /// <param name="state">On or Off</param>
    [HttpPost("balancerState/{state}")]
    public IActionResult ManageBalancerState(bool state)
    {
      var response = this.mongoCommandUtils.ManageBalancer(state);
      return new OkObjectResult(response);
    }

    /// <summary>
    /// Fetches the balancer state
    /// </summary>
    [HttpGet("balancerState")]
    public IActionResult GetBalancerState()
    {
      var response = this.mongoCommandUtils.GetBalancerState();
      return new OkObjectResult(response);
    }
  }
}
