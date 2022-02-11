import { Component, OnInit } from '@angular/core';
import * as models from '../../models/models';
import { ShardManagerService } from '../../services/shard-manager.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'app-shards',
  templateUrl: './shards.component.html',
  styleUrls: ['./shards.component.scss']
})
export class ShardsComponent implements OnInit {
  visibleSidebar: boolean = true;
  shards: Array<models.Shard> = [];
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
  showEditChunksDialog = false;
  displayChunks = false;
  autoBalancerStatus: string;
  selectedAutoBalancerState = false;
  balancerButtonLabel: string;
  selectedCollectionShardKey: string;
  loopStart: string = '1';
  loopEnd: string = '2';
  shardKey: models.ShardKey[] = [];
  bsonTypes: models.BsonType[] = [
    { name: 'String', value: 'String' },
    { name: 'Integer', value: 'Int32' },
    { name: 'MaxKey', value: 'MaxKey' },
    { name: 'MinKey', value: 'MaxKey' },
  ];
  connectionId: string;
  constructor(
    private shardManagerService: ShardManagerService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.spinner.show();
    this.activatedRoute.params.subscribe((res) => {
      this.connectionId = res.connectionId;
    });
    this.getAllShards();
    this.getMetadata();
  }
  onDatabaseChange() {
    this.clearFields();
    this.collectionsMetadata = this.selectedDatabase.collectionsMetadata;
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

  onSplitChunksClick() {
    this.spinner.show();
    this.displaySplitChunksDialog(true);
    this.fetchBalancerState();
  }

  modifyBalancerState() {
    this.selectedAutoBalancerState = !this.selectedAutoBalancerState;
    const state = this.selectedAutoBalancerState ? 'enable' : 'disable';
    this.confirmationService.confirm({
      message: `Are you sure you want to ${state} the auto balancer?`,
      header: 'Enable/Disable Auto Balancer',
      accept: () => {
        this.shardManagerService
          .startStopBalancer(this.selectedAutoBalancerState, this.connectionId)
          .subscribe(
            (state: boolean) => {
              this.spinner.hide();
              const stateMsg = this.selectedAutoBalancerState
                ? 'Enabled'
                : 'Disabled';
              if (state) {
                this.messageService.add({
                  severity: 'success',
                  detail: stateMsg + ' the balancer successfully!',
                });
              } else {
                this.messageService.add({
                  severity: 'error',
                  detail: 'Failed to enable/disable the balancer!',
                });
              }
              this.fetchBalancerState();
            },
            (error: HttpErrorResponse) => {
              this.spinner.hide();
              this.messageService.add({
                severity: 'error',
                detail: 'Failed to enable/disable the balancer!',
              });
            }
          );
      },
    });
  }
  displaySplitChunksDialog(flag: boolean) {
    this.showEditChunksDialog = flag;
  }

  onBsonTypeChange(shardKey: models.ShardKey) {
    shardKey.dataType = shardKey.bsonType.value;
  }

  splitChunk() {
    const chunkRanges: models.RangeOfKey[] = [];
    this.shardKey.forEach((x) => {
      const rangeOfKey: models.RangeOfKey = {
        name: x.name,
        value: x.value,
        bsonType: x.dataType,
      };
      if (x.dataType === 'Int32') {
        rangeOfKey.value = '1';
      } else if (x.dataType === 'MaxKey') {
        rangeOfKey.value = 'BsonMaxKey';
      } else if (x.dataType === 'MinKey') {
        rangeOfKey.value = 'BsonMinKey';
      } else if (x.dataType === 'String') {
        rangeOfKey.bsonType = x.dataType;
      }
      chunkRanges.push(rangeOfKey);
    });
    const chunkMetadata: models.ChunkMetadata = {
      chunkStartPosition: Number(this.loopStart),
      chunkEndPosition: Number(this.loopEnd),
      appendChunkIndex: true,
      chunkRanges: chunkRanges,
    };

    this.confirmationService.confirm({
      message: `Are you sure you want to initiate the chunk split?`,
      header: 'Chunk Split',
      accept: () => {
        this.spinner.show();
        this.shardManagerService
          .preSplitChunks(
            this.selectedDatabase.database,
            this.selectedCollection.collectionName,
            chunkMetadata,
            this.connectionId
          )
          .subscribe(
            (state: boolean) => {
              this.spinner.hide();
              if (state) {
                this.messageService.add({
                  severity: 'success',
                  detail: 'Splitted the chunk(s) succesfully!',
                });
              } else {
                this.messageService.add({
                  severity: 'error',
                  detail: 'Failed to split the chunks!',
                });
              }
              this.fetchBalancerState();
              this.displaySplitChunksDialog(false);
            },
            (error: HttpErrorResponse) => {
              this.spinner.hide();
              this.messageService.add({
                severity: 'error',
                detail: 'Failed to split the chunks!',
              });
            }
          );
      },
    });
  }

  private fetchBalancerState() {
    this.shardManagerService.fetchBalancerState(this.connectionId).subscribe(
      (state: boolean) => {
        this.spinner.hide();
        this.autoBalancerStatus = state ? 'Enabled' : 'Disabled';
        this.balancerButtonLabel = state
          ? 'Disable Balancer'
          : 'Enable Balancer';
        this.selectedAutoBalancerState = state;
      },
      (error: HttpErrorResponse) => {
        this.spinner.hide();
        this.messageService.add({
          severity: 'error',
          detail: 'Failed to fetch the auto balancer status!',
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

  private getAllShards() {
    this.shardManagerService.fetchShards(this.connectionId).subscribe(
      (mongoShards: models.Shard[]) => {
        this.shards = mongoShards;
        if (this.shards.length > 0) {
          this.clusterType = 'Sharded';
        } else if (this.shards.length == 0) {
          this.clusterType = 'Non-Sharded';
        }
      },
      (error: HttpErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          detail: 'Failed to fetch all the shards!',
        });
      }
    );
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

