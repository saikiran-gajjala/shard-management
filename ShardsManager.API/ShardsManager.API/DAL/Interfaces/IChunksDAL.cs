using System.Collections.Generic;
using System.Threading.Tasks;
using ShardsManager.API.Models;

namespace ShardsManager.API.DAL.Interfaces
{
  public interface IChunksDAL
  {
    Task<List<Chunk>> GetAllChunks(string database, string collection);
  }
}