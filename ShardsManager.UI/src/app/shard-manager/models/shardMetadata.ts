import { Chunk } from './chunk';
export interface ShardMetadata {
  shardName: string;
  chunkRange?: string[];
}
