import { RangeOfKey } from './rangeOfKey';

export interface Chunk {
  id: string;
  shard: string;
  min: Array<RangeOfKey>;
  max: Array<RangeOfKey>;
}
