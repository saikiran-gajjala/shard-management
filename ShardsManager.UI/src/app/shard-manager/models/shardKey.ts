import { BsonType } from './bsonType';
export interface ShardKey {
  name: string;
  indexType: number;
  value?: string;
  dataType?: string;
  bsonType?: BsonType;
}
