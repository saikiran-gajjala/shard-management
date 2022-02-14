export interface CollectionStats {
  noOfDocuments: number;
  dataStorageSizeInMB: number;
  indexStorageSizeInMB: number;
  totalStorageSizeInMB: number;
  noOfIndexes: number;
  noOfChunks: number;
  shardStats: ShardStats[];
}

export interface ShardStats {
  shardName: string;
  storageSizeInMB: number;
  freeStorageSizeInMB: number;
  noOfDocuments: number;
  noOfChunks: number;
}
