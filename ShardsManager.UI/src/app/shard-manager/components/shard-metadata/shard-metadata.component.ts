import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ShardManagerService } from '@app/shard-manager/services/shard-manager.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import * as models from '../../models/models';

@Component({
  selector: 'shard-metadata',
  templateUrl: './shard-metadata.component.html',
  styleUrls: ['./shard-metadata.component.scss'],
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
  selectedCollectionShardKey: string;
  shardKey: models.ShardKey[] = [];

  constructor(
    private shardManagerService: ShardManagerService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private spinner: NgxSpinnerService
  ) {}

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
              this.fetchCollectionStats();
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
        this.connectionId
      )
      .subscribe(
        (collectionStats: models.CollectionStats) => {
          this.collectionStatsChange.emit(collectionStats);
        },
        (error: HttpErrorResponse) => {
          this.spinner.hide();
          this.messageService.add({
            severity: 'error',
            detail:
              'Failed to fetch the Shard Stats for the selected database and collection!',
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
              shardKey = shardKey + ',';
            }
          }
          shardKey = shardKey + '}';
          if (state.shardKeys.length > 0) {
            this.selectedCollectionShardKey = shardKey;
          }

          if (this.selectedCollectionShardState === 'Sharded') {
            this.fetchCollectionStats();
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
    this.shardKey = [];
    this.selectedCollectionShardKey = '';
  }
}
