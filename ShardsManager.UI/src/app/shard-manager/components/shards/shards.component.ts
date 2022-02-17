import { Component, OnInit } from '@angular/core';
import * as models from '../../models/models';
import { ShardManagerService } from '../../services/shard-manager.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { CollectionStats } from '../../models/collectionStats';

@Component({
  selector: 'shards',
  templateUrl: './shards.component.html',
  styleUrls: ['./shards.component.scss'],
})
export class ShardsComponent implements OnInit {
  visibleSidebar: boolean = true;
  shards: Array<models.Shard> = [];
  showEditChunksDialog = false;
  connectionId: string;
  shardKey: models.ShardKey[] = [];
  loopStart: string = '1';
  loopEnd: string = '2';
  selectedDatabase: models.DbMetadata;
  databaseShardState: boolean = false;
  selectedCollection: models.CollectionMetadata;
  collectionShardState: boolean = false;
  collectionStats: models.CollectionStats;
  bsonTypes: models.BsonType[] = [
    { name: 'String', value: 'String' },
    { name: 'Integer', value: 'Int32' },
    { name: 'MaxKey', value: 'MaxKey' },
    { name: 'MinKey', value: 'MaxKey' },
  ];
  options: any[];
  autoRefreshOptionSelected: string = 'off';
  balancerSelected: string = 'off';
  autoRefreshHandler: any;
  constructor(
    private shardManagerService: ShardManagerService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute
  ) {
    this.options = [
      { label: 'Off', value: 'off' },
      { label: 'On', value: 'on' },
    ];
  }

  ngOnInit() {
    this.spinner.show();
    this.activatedRoute.params.subscribe((res) => {
      this.connectionId = res.connectionId;
    });
    this.getAllShards();
    this.fetchBalancerState();
  }

  onSplitChunksClick() {
    if (
      !this.selectedDatabase ||
      !this.selectedCollection ||
      !this.databaseShardState ||
      !this.collectionShardState
    ) {
      this.messageService.add({
        severity: 'error',
        detail: 'Please choose valid sharded database and collection!',
      });
      return;
    }
    this.displaySplitChunksDialog(true);
  }

  displaySplitChunksDialog(flag: boolean) {
    this.showEditChunksDialog = flag;
  }

  onBsonTypeChange(shardKey: models.ShardKey) {
    shardKey.dataType = shardKey.bsonType.value;
  }

  onDatabaseChange(database: models.DbMetadata) {
    this.selectedDatabase = database;
  }

  onCollectionChange(collection: models.CollectionMetadata) {
    this.selectedCollection = collection;
  }

  onCollectionStatChange(collectionStats: models.CollectionStats) {
    this.collectionStats = collectionStats;
  }

  onShardKeyChange(shardKey: models.ShardKey[]) {
    this.shardKey = shardKey;
  }

  autoRefresh() {
    if (this.autoRefreshOptionSelected === 'on') {
      this.autoRefreshHandler = setInterval(() => this.getAllShards(), 2000);
    } else {
      clearInterval(this.autoRefreshHandler);
    }
  }

  onDbShardStatusChange(state: boolean) {
    this.databaseShardState = state;
  }

  onCollectionShardStatusChange(state: boolean) {
    this.collectionShardState = state;
  }

  private getAllShards() {
    this.shardManagerService.fetchShards(this.connectionId).subscribe(
      (mongoShards: models.Shard[]) => {
        this.shards = mongoShards;
      },
      (error: HttpErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          detail: 'Failed to fetch all the shards!',
        });
      }
    );
  }
  private fetchBalancerState() {
    this.spinner.show();
    this.shardManagerService.fetchBalancerState(this.connectionId).subscribe(
      (state: boolean) => {
        this.spinner.hide();
        this.balancerSelected = state ? 'on' : 'off';
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

  modifyBalancerState() {
    var newState = this.balancerSelected === 'on';
    const newStateMsg = newState ? 'enable' : 'disable';
    this.confirmationService.confirm({
      message: `Are you sure you want to ${newStateMsg} the auto balancer?`,
      header: 'Enable/Disable Auto Balancer',
      accept: () => {
        this.shardManagerService
          .startStopBalancer(newState, this.connectionId)
          .subscribe(
            (state: boolean) => {
              this.spinner.hide();
              const stateMsg = newState ? 'Enabled' : 'Disabled';
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
}
