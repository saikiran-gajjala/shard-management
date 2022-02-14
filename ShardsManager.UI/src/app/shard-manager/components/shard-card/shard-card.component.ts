import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as models from '../../models/models';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'shard-card',
  templateUrl: './shard-card.component.html',
  styleUrls: ['./shard-card.component.scss']
})
export class ShardCardComponent implements OnInit, OnChanges {
  @Input() shard: models.Shard;
  @Input() collectionStats: models.CollectionStats;
  shardStats: models.ShardStats;
  datasources: Array<any> = [
    { name: 'MySQL', value: 'mysql' },
    { name: 'Microsoft SQL Server', value: 'mssql' },
    { name: 'Postgre SQL', value: 'postgresql' },
    { name: 'Oracle SQL', value: 'oracle' },
  ];
  constructor(private router: Router,) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    if (this.collectionStats) {
      this.shardStats = this.collectionStats.shardStats.filter(x => x.shardName === this.shard.id)[0];
    }
  }

  open(id: string) {
    this.router.navigate([`steps/${id}/metadata`]);
  }

  fetchDataSourceKey(value: string) {
    const source = this.datasources.filter((x) => x.value === value);
    if (source && source.length > 0) {
      return source[0].name;
    }

    return '';
  }
}
