export interface MongoConnectionResponse {
  connectionId: string;
  isConnectionSuccess: boolean;
  isShardedCluster: boolean;
}
