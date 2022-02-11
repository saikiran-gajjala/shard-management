import { IndexField } from './models';

export interface IndexMetadata {
  indexName: string;
  indexFields: IndexField[];
}
