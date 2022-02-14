import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ShardManagerService } from '@app/shard-manager/services/shard-manager.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import * as models from '../../models/models';

@Component({
  selector: 'shard-metadata',
  templateUrl: './shard-metadata.component.html',
  styleUrls: ['./shard-metadata.component.scss']
})
export class ShardMetadataComponent implements OnInit {
  @Input() connectionId: string;
  @Output() databaseChange = new EventEmitter<models.DbMetadata>();
  @Output() collectionChange = new EventEmitter<models.CollectionMetadata>();
  @Output() collectionStatsChange = new EventEmitter<models.CollectionStats>();
  visibleSidebar: boolean = true;
  dbMetadata: models.DbMetadata[] = [];
  clusterType: string;
  selectedDatabase: models.DbMetadata;
  selectedDatabaseShardState: string = 'Non-Sharded';
  collectionsMetadata: models.CollectionMetadata[] = [];
  selectedCollection: models.CollectionMetadata;
  indexesMetadata: models.IndexMetadata[] = [];
  selectedCollectionShardState: string = 'Non-Sharded';
  indexes: models.IndexInfo[] = [];
  selectedIndex: models.IndexInfo;
  shardsMetadata: models.ShardMetadata[] = [];
  chunks: models.Chunk[] = [];
  displayChunks = false;
  selectedCollectionShardKey: string;
  shardKey: models.ShardKey[] = [];

  constructor(
    private shardManagerService: ShardManagerService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private spinner: NgxSpinnerService,
  ) { }

  ngOnInit(): void {
    this.getMetadata();
  }
  onDatabaseChange() {
    this.clearFields();
    this.collectionsMetadata = this.selectedDatabase.collectionsMetadata;
    this.databaseChange.emit(this.selectedDatabase);
    if (this.collectionsMetadata.length > 0) {
      this.selectedCollection = this.collectionsMetadata[0];
      this.onCollectionChange();
    }
    this.spinner.show();
    this.fetchDBShardStatus();
  }

  onCollectionChange() {
    this.spinner.show();
    this.clearFields();
    this.indexesMetadata = this.selectedCollection.indexesMetadata;
    this.collectionChange.emit(this.selectedCollection);
    for (let i = 0; i < this.indexesMetadata.length; i++) {
      let indexes = '{';
      let indexFields = this.indexesMetadata[i].indexFields;
      for (let j = 0; j < indexFields.length; j++) {
        indexes = indexes + `${indexFields[j].name} : ${indexFields[j].value}`;
        if (j + 1 !== indexFields.length) {
          indexes = indexes + ' , ';
        }
      }
      indexes = indexes + '}';
      this.indexes.push({
        label: this.indexesMetadata[i].indexName,
        value: indexes,
      });

      if (this.indexes.length > 0) {
        this.selectedIndex = this.indexes[0];
      }
    }
    this.fetchCollectionShardStatus();
  }

  enableDatabaseSharding() {
    this.confirmationService.confirm({
      message: `Are you sure you want to enable sharding for the database '${this.selectedDatabase.database}'`,
      header: 'Enable DB Sharding',
      accept: () => {
        this.spinner.show();
        this.shardManagerService
          .shardDatabase(this.selectedDatabase.database, this.connectionId)
          .subscribe(
            (result: boolean) => {
              this.spinner.hide();
              this.fetchDBShardStatus();
              if (result) {
                this.messageService.add({
                  severity: 'success',
                  detail: 'Sharded the database succesfully!',
                });
              } else {
                this.messageService.add({
                  severity: 'error',
                  detail: 'Failed to shard the database',
                });
              }
            },
            (error: HttpErrorResponse) => {
              this.spinner.hide();
              this.messageService.add({
                severity: 'error',
                detail: 'Failed to shard the database',
              });
            }
          );
      },
    });
  }

  enableCollectionSharding() {
    this.confirmationService.confirm({
      message: `Are you sure you want to enable sharding for the collection '${this.selectedCollection.collectionName}' with index '${this.selectedIndex.value}'`,
      header: 'Enable Collection Sharding',
      accept: () => {
        this.spinner.show();
        const indexFields = this.indexesMetadata.filter(
          (x) => x.indexName === this.selectedIndex.label
        )[0].indexFields;
        this.shardManagerService
          .shardCollection(
            this.selectedDatabase.database,
            this.selectedCollection.collectionName,
            indexFields,
            this.connectionId
          )
          .subscribe(
            (result: boolean) => {
              this.spinner.hide();
              this.fetchCollectionShardStatus();
              if (result) {
                this.messageService.add({
                  severity: 'success',
                  detail: 'Sharded the database succesfully!',
                });
              } else {
                this.messageService.add({
                  severity: 'error',
                  detail: 'Failed to shard the collection',
                });
              }
            },
            (error: HttpErrorResponse) => {
              this.spinner.hide();
              this.messageService.add({
                severity: 'error',
                detail: 'Failed to shard the collection',
              });
            }
          );
      },
    });
  }

  fetchCollectionStats() {
    this.shardManagerService
      .fetchCollectionStats(
        this.selectedDatabase.database,
        this.selectedCollection.collectionName,
        this.connectionId)
      .subscribe(
        (collectionStats: models.CollectionStats) => {
          this.collectionStatsChange.emit(collectionStats);
        },
        (error: HttpErrorResponse) => {
          this.spinner.hide();
          this.messageService.add({
            severity: 'error',
            detail: 'Failed to fetch the Shard Stats for the selected database and collection!',
          });
        }
      );
  }
  viewChunks() {
    this.spinner.show();
    this.shardsMetadata = [];
    this.shardManagerService
      .fetchChunks(
        this.selectedDatabase.database,
        this.selectedCollection.collectionName,
        this.connectionId
      )
      .subscribe(
        (chunks: models.Chunk[]) => {
          this.spinner.hide();
          this.chunks = chunks;
          this.displayChunks = true;
          this.chunks.forEach((chunk) => {
            chunk.shard = chunk.shard.replace('shard=', '');
            const existingShard = this.shardsMetadata.filter(
              (x) => x.shardName === chunk.shard
            );
            if (existingShard && existingShard.length > 0) {
              let { minKey, maxKey } = this.fetchChunkKeys(chunk);
              if (!existingShard[0].chunkRange) {
                existingShard[0].chunkRange = [];
              }
              existingShard[0].chunkRange.push(
                `{min : ${minKey} , max : ${maxKey}}`
              );
            } else {
              let { minKey, maxKey } = this.fetchChunkKeys(chunk);
              const shardMetadata: models.ShardMetadata = {
                shardName: chunk.shard,
              };
              if (!shardMetadata.chunkRange) {
                shardMetadata.chunkRange = [];
              }
              shardMetadata.chunkRange.push(
                `{min : ${minKey} , max : ${maxKey}}`
              );
              this.shardsMetadata.push(shardMetadata);
            }
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

  private fetchChunkKeys(chunk: models.Chunk) {
    let minKey = '{';
    for (let j = 0; j < chunk.min.length; j++) {
      minKey = minKey + `${chunk.min[j].name} : ${chunk.min[j].value}`;
      if (j + 1 !== chunk.min.length) {
        minKey = minKey + ' , ';
      }
    }
    minKey = minKey + '}';

    let maxKey = '{';
    for (let j = 0; j < chunk.max.length; j++) {
      maxKey = maxKey + `${chunk.max[j].name} : ${chunk.max[j].value}`;
      if (j + 1 !== chunk.min.length) {
        maxKey = maxKey + ' , ';
      }
    }
    maxKey = maxKey + '}';
    return { minKey, maxKey };
  }



  private getMetadata() {
    this.shardManagerService.fetchMetadata(this.connectionId).subscribe(
      (dbMeta: models.DbMetadata[]) => {
        this.dbMetadata = dbMeta;
        this.spinner.hide();
        if (this.dbMetadata.length > 0) {
          this.selectedDatabase = this.dbMetadata[0];
          this.onDatabaseChange();
        }
      },
      (error: HttpErrorResponse) => {
        this.spinner.hide();
        this.messageService.add({
          severity: 'error',
          detail: 'Failed to fetch the cluster metadata!',
        });
      }
    );
  }

  private fetchCollectionShardStatus() {
    this.selectedCollectionShardKey = '';
    this.shardManagerService
      .fetchCollectionShardStatus(
        this.selectedDatabase.database,
        this.selectedCollection.collectionName,
        this.connectionId
      )
      .subscribe(
        (state: models.CollectionShardStatus) => {
          this.spinner.hide();
          this.selectedCollectionShardState = state.shardStatus
            ? 'Sharded'
            : 'Non-Sharded';
          this.shardKey = state.shardKeys;
          let shardKey = '{';
          for (let j = 0; j < state.shardKeys.length; j++) {
            shardKey =
              shardKey +
              `${state.shardKeys[j].name}:${state.shardKeys[j].indexType}`;
            if (j + 1 !== state.shardKeys.length) {
              shardKey = shardKey + ', ';
            }
          }
          shardKey = shardKey + '}';
          if (state.shardKeys.length > 0) {
            this.selectedCollectionShardKey = shardKey;
          }
        },
        (error: HttpErrorResponse) => {
          this.spinner.hide();
          this.messageService.add({
            severity: 'error',
            detail: 'Failed to fetch the collection metadata',
          });
        }
      );
  }

  private fetchDBShardStatus() {
    this.shardManagerService
      .fetchDbShardStatus(this.selectedDatabase.database, this.connectionId)
      .subscribe((state: boolean) => {
        this.selectedDatabaseShardState = state ? 'Sharded' : 'Non-Sharded';
        this.spinner.hide();
      });
  }

  private clearFields() {
    this.indexes = [];
    this.chunks = [];
    this.displayChunks = false;
    this.shardKey = [];
    this.selectedCollectionShardKey = '';
  }
}
