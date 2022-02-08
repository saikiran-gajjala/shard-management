using ShardsManager.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ShardsManager.API.DAL.Interfaces
{
  public interface IShardsDAL
  {
    Task<List<ConfigCollection>> GetCollectionShards();
    Task<List<ConfigDatabase>> GetDatabaseShards();
    Task<List<Shard>> GetShards();
  }
}