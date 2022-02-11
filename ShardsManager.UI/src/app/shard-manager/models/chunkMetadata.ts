import { RangeOfKey } from './rangeOfKey';

export interface ChunkMetadata {
  chunkStartPosition?: number;
  chunkEndPosition?: number;
  chunkRanges?: Array<RangeOfKey>;
  appendChunkIndex?: boolean;
  targetShard?: string;
}
