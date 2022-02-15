import { Chunk } from './chunk';
export interface ChunkFlatInfo {
  chunkId: string;
  minKeyChunkRange?: string[];
  maxKeyChunkRange?: string[];
  chunkSize?: string;
  noOfObjects?: string;
}
