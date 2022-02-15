import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as models from '../../models/models';
import { filter } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'shard-card',
  templateUrl: './shard-card.component.html',
  styleUrls: ['./shard-card.component.scss'],
})
export class ShardCardComponent implements OnInit, OnChanges {
  @Input() shard: models.Shard;
  @Input() connectionId: string;
  @Input() collectionStats: models.CollectionStats;
  @Input() database: string;
  @Input() collection: string;
  shardStats: models.ShardStats;
  datasources: Array<any> = [
    { name: 'MySQL', value: 'mysql' },
    { name: 'Microsoft SQL Server', value: 'mssql' },
    { name: 'Postgre SQL', value: 'postgresql' },
    { name: 'Oracle SQL', value: 'oracle' },
  ];
  constructor(private router: Router, private messageService: MessageService) {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.collectionStats) {
      this.shardStats = this.collectionStats.shardStats.filter(
        (x) => x.shardName === this.shard.id
      )[0];
    }
  }

  open(id: string) {
    if (!this.shard || !this.database || !this.collection) {
      this.messageService.add({
        severity: 'error',
        detail: 'Please choose valid database and collection!!',
      });
    }
    this.router.navigate([
      `chunks/${this.connectionId}/${id}/${this.database}/${this.collection}`,
    ]);
  }

  fetchDataSourceKey(value: string) {
    const source = this.datasources.filter((x) => x.value === value);
    if (source && source.length > 0) {
      return source[0].name;
    }

    return '';
  }
}
