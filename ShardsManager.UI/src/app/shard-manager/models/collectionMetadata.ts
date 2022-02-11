import { IndexMetadata } from './indexMetadata';
export interface CollectionMetadata {
  collectionName: string;
  indexesMetadata: IndexMetadata[];
}
