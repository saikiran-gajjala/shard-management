import { ShardKey } from './shardKey';

export interface CollectionShardStatus {
  shardStatus: boolean;
  shardKeys: ShardKey[];
}
