import { CollectionMetadata } from './collectionMetadata';
export interface DbMetadata {
  database: string;
  collectionsMetadata?: CollectionMetadata[];
}
