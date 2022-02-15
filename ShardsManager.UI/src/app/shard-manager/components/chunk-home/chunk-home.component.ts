import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ShardManagerService } from '@app/shard-manager/services/shard-manager.service';
import * as _ from 'lodash';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import * as models from '../../models/models';

@Component({
  selector: 'app-chunk-home',
  templateUrl: './chunk-home.component.html',
  styleUrls: ['./chunk-home.component.scss'],
})
export class ChunkHomeComponent implements OnInit {
  shardName: string;
  database: string;
  collection: string;
  connectionId: string;
  selectedChunks: models.ChunkFlatInfo[] = [];
  chunksInfo: models.ChunkFlatInfo[] = [];
  chunks: models.Chunk[] = [];
  chunkRangeCount: number = 1;
  cols: any[] = [];
  // optionalColumns: any[] = [];
  chunkMetaDataState: false;
  constructor(
    private shardManagerService: ShardManagerService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((res) => {
      this.connectionId = res.connectionId;
      this.shardName = res.shardName;
      this.database = res.database;
      this.collection = res.collection;
    });
    this.getChunks(false);
    // this.setOptionalColumns();
  }
  onMoveChunksClick() {}

  fetchChunkMetadata() {
    if (this.chunkMetaDataState) {
      this.getChunks(true);
    }
  }
  getChunks(fetchChunkMetadata: boolean) {
    this.spinner.show();
    this.chunksInfo = [];
    this.shardManagerService
      .fetchChunks(
        this.database,
        this.collection,
        this.connectionId,
        fetchChunkMetadata
      )
      .subscribe(
        (chunks: models.Chunk[]) => {
          this.spinner.hide();
          this.chunks = _.orderBy(chunks, 'id', 'asc');
          if (chunks.length > 0) {
            for (var i = 0; i < chunks[0].max.length; i++) {
              this.cols.push({
                field: `${chunks[0].max[i].name}`,
                header: `${chunks[0].max[i].name}`,
              });
            }
            this.chunkRangeCount = chunks[0].max.length;
          }
          this.chunks.forEach((chunk) => {
            const chunkInfo: models.ChunkFlatInfo = {
              chunkId: chunk.id,
            };

            chunkInfo.minKeyChunkRange = [];
            chunk.min.forEach((minKey) => {
              chunkInfo.minKeyChunkRange.push(minKey.value);
            });

            chunkInfo.maxKeyChunkRange = [];
            chunk.max.forEach((maxKey) => {
              chunkInfo.maxKeyChunkRange.push(maxKey.value);
            });
            chunkInfo.chunkSize = chunk.sizeInMB
              ? chunk.sizeInMB.toString()
              : '-';
            chunkInfo.noOfObjects = chunk.noOfObjects
              ? chunk.noOfObjects.toString()
              : '-';
            this.chunksInfo.push(chunkInfo);
          });
        },
        (error: HttpErrorResponse) => {
          this.spinner.hide();
          this.messageService.add({
            severity: 'error',
            detail: 'Failed to fetch the chunks for the collection!',
          });
        }
      );
  }

  onFilter(event: any) {}

  // private setOptionalColumns() {
  //   this.optionalColumns = [
  //     { field: "healthSystemName", header: "Health System" },
  //     { field: "healthSystemId", header: "Health System Id" },
  //   ];
  // }
}
