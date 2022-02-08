import { BsonType } from './bsonType';
export interface ShardKey {
  name: string;
  indexType: string;
  value?: string;
  dataType?: string;
  bsonType?: BsonType;
}
