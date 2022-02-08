using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ShardsManager.API.DAL.Interfaces;
using ShardsManager.API.Models;
using ShardsManager.API.Utilities.Interfaces;

namespace ShardsManager.API.Controllers
{
  [ApiController]
  [Route("chunks")]
  public class ChunksController : Controller
  {
    private readonly ILogger<ChunksController> _logger;
    private readonly IChunksDAL chunksDAL;
    private readonly IMongoCommondUtils mongoCommandUtils;

    public ChunksController(ILogger<ChunksController> logger, IChunksDAL chunksDAL, IMongoCommondUtils mongoCommandUtils)
    {
      this._logger = logger;
      this.chunksDAL = chunksDAL;
      this.mongoCommandUtils = mongoCommandUtils;
    }

    /// <summary>
    /// Fetches all chunks
    /// </summary>
    /// <returns></returns>
    [HttpGet("{database}/{collection}")]
    public async Task<IActionResult> GetChunks(string database, string collection)
    {
      var chunks = await this.chunksDAL.GetAllChunks(database, collection);
      return new OkObjectResult(chunks);
    }

    /// <summary>
    /// Presplits chunks in an empty collection
    /// </summary>
    [HttpPost("presplit/{database}/{collection}")]
    public IActionResult PreSplitChunks(string database, string collection, [FromBody] ChunkMetadata preSplitMetadata)
    {
      if (preSplitMetadata == null || preSplitMetadata.ChunkRanges == null)
      {
        return new BadRequestResult();
      }
      var result = this.mongoCommandUtils.PreSplitChunks(database, collection, preSplitMetadata);
      return new OkObjectResult(result);
    }

    /// <summary>
    /// Moves chunks in a collection from one shard to an another
    /// </summary>
    [HttpPost("moveChunk/{database}/{collection}")]
    public IActionResult MoveChunks(string database, string collection, [FromBody] ChunkMetadata preSplitMetadata)
    {
      if (preSplitMetadata == null || preSplitMetadata.ChunkRanges == null)
      {
        return new BadRequestResult();
      }
      var result = this.mongoCommandUtils.MoveChunk(database, collection, preSplitMetadata);
      return new OkObjectResult(result);
    }
  }
}
