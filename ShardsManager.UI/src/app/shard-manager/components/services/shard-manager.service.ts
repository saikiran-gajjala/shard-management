import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './../../../../environments/environment';
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

  fetchMetadata(): Observable<Array<models.DbMetadata>> {
    return this.http.get<Array<models.DbMetadata>>(`${this.baserUrl}/metadata`);
  }

  fetchShards(): Observable<Array<models.Shard>> {
    return this.http.get<Array<models.Shard>>(`${this.baserUrl}/shards`);
  }

  fetchDbShardStatus(database: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.baserUrl}/shards/dbShardStatus/${database}`
    );
  }

  fetchCollectionShardStatus(
    database: string,
    collection: string
  ): Observable<models.CollectionShardStatus> {
    return this.http.get<models.CollectionShardStatus>(
      `${this.baserUrl}/shards/collShardStatus/${database}/${collection}`
    );
  }

  shardDatabase(database: string): Observable<boolean> {
    return this.http.post<boolean>(
      `${this.baserUrl}/shards/shardDB/${database}`,
      {}
    );
  }

  shardCollection(
    database: string,
    collection: string,
    indexFields: models.IndexField[]
  ): Observable<boolean> {
    return this.http.post<boolean>(
      `${this.baserUrl}/shards/shardCollection/${database}/${collection}`,
      indexFields
    );
  }

  startStopBalancer(start: boolean): Observable<boolean> {
    return this.http.post<boolean>(
      `${this.baserUrl}/shards/balancerState/${start}`,
      {}
    );
  }

  fetchBalancerState(): Observable<boolean> {
    return this.http.get<boolean>(`${this.baserUrl}/shards/balancerState`);
  }

  fetchChunks(
    database: string,
    collection: string
  ): Observable<models.Chunk[]> {
    return this.http.get<models.Chunk[]>(
      `${this.baserUrl}/chunks/${database}/${collection}`
    );
  }

  preSplitChunks(
    database: string,
    collection: string,
    chunkMetadata: models.ChunkMetadata
  ): Observable<boolean> {
    return this.http.post<boolean>(
      `${this.baserUrl}/chunks/presplit/${database}/${collection}`,
      chunkMetadata
    );
  }

  moveChunk(
    database: string,
    collection: string,
    chunkMetadata: models.ChunkMetadata
  ): Observable<boolean> {
    return this.http.post<boolean>(
      `${this.baserUrl}/chunks/moveChunk/${database}/${collection}`,
      chunkMetadata
    );
  }
}
