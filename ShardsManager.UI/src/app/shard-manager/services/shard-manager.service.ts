import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './../../../environments/environment';
import * as models from '../models/models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShardManagerService {
  baserUrl: string;
  constructor(private http: HttpClient) {
    this.baserUrl = environment.apiUrl;
  }

  validateConnectionString(
    connectionString: string
  ): Observable<models.MongoConnectionResponse> {
    const headers = new HttpHeaders({ connectionString: connectionString });
    return this.http.post<models.MongoConnectionResponse>(
      `${this.baserUrl}/metadata/validate`,
      {
        connectionString: connectionString,
      },
      { headers }
    );
  }

  fetchMetadata(connectionId: string): Observable<Array<models.DbMetadata>> {
    const headers = new HttpHeaders({ connectionId: connectionId });
    return this.http.get<Array<models.DbMetadata>>(
      `${this.baserUrl}/metadata`,
      { headers }
    );
  }

  fetchShards(connectionId: string): Observable<Array<models.Shard>> {
    const headers = new HttpHeaders({ connectionId: connectionId });
    return this.http.get<Array<models.Shard>>(`${this.baserUrl}/shards`, {
      headers,
    });
  }

  fetchDbShardStatus(
    database: string,
    connectionId: string
  ): Observable<boolean> {
    const headers = new HttpHeaders({ connectionId: connectionId });
    return this.http.get<boolean>(
      `${this.baserUrl}/shards/dbShardStatus/${database}`,
      { headers }
    );
  }

  fetchCollectionStats(
    database: string,
    collection: string,
    connectionId: string
  ): Observable<models.CollectionStats> {
    const headers = new HttpHeaders({ connectionId: connectionId });
    return this.http.get<models.CollectionStats>(
      `${this.baserUrl}/metadata/collectionStats/${database}/${collection}`,
      { headers }
    );
  }

  fetchCollectionShardStatus(
    database: string,
    collection: string,
    connectionId: string
  ): Observable<models.CollectionShardStatus> {
    const headers = new HttpHeaders({ connectionId: connectionId });
    return this.http.get<models.CollectionShardStatus>(
      `${this.baserUrl}/shards/collShardStatus/${database}/${collection}`,
      { headers }
    );
  }

  shardDatabase(database: string, connectionId: string): Observable<boolean> {
    const headers = new HttpHeaders({ connectionId: connectionId });
    return this.http.post<boolean>(
      `${this.baserUrl}/shards/shardDB/${database}`,
      {},
      { headers }
    );
  }

  shardCollection(
    database: string,
    collection: string,
    indexFields: models.IndexField[],
    connectionId: string
  ): Observable<boolean> {
    const headers = new HttpHeaders({ connectionId: connectionId });
    return this.http.post<boolean>(
      `${this.baserUrl}/shards/shardCollection/${database}/${collection}`,
      indexFields,
      { headers }
    );
  }

  startStopBalancer(start: boolean, connectionId: string): Observable<boolean> {
    const headers = new HttpHeaders({ connectionId: connectionId });
    return this.http.post<boolean>(
      `${this.baserUrl}/shards/balancerState/${start}`,
      {},
      { headers }
    );
  }

  fetchBalancerState(connectionId: string): Observable<boolean> {
    const headers = new HttpHeaders({ connectionId: connectionId });
    return this.http.get<boolean>(`${this.baserUrl}/shards/balancerState`, {
      headers,
    });
  }

  fetchChunks(
    database: string,
    collection: string,
    connectionId: string,
    fetchChunkMetadata: boolean
  ): Observable<models.Chunk[]> {
    const headers = new HttpHeaders({ connectionId: connectionId });
    return this.http.get<models.Chunk[]>(
      `${this.baserUrl}/chunks/${database}/${collection}?fetchChunkMetadata=${fetchChunkMetadata}`,
      { headers }
    );
  }

  preSplitChunks(
    database: string,
    collection: string,
    chunkMetadata: models.ChunkMetadata,
    connectionId: string
  ): Observable<boolean> {
    const headers = new HttpHeaders({ connectionId: connectionId });
    return this.http.post<boolean>(
      `${this.baserUrl}/chunks/presplit/${database}/${collection}`,
      chunkMetadata,
      { headers }
    );
  }

  moveChunk(
    database: string,
    collection: string,
    chunkMetadata: models.ChunkMetadata,
    connectionId: string
  ): Observable<boolean> {
    const headers = new HttpHeaders({ connectionId: connectionId });
    return this.http.post<boolean>(
      `${this.baserUrl}/chunks/moveChunk/${database}/${collection}`,
      chunkMetadata,
      { headers }
    );
  }
}
