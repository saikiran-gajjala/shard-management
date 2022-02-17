import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import * as models from '../../models/models';

@Component({
  selector: 'shards-grid-view',
  templateUrl: './shards-grid-view.component.html',
  styleUrls: ['./shards-grid-view.component.scss'],
})
export class ShardsGridViewComponent implements OnInit {
  @Input() shards: models.Shard[];
  @Input() connectionId: string;
  @Input() collectionStats: models.CollectionStats;
  @Input() database: string;
  @Input() collection: string;
  @Input() databaseShardState: boolean = false;
  @Input() collectionShardState: boolean = false;
  constructor() {}

  ngOnInit(): void {}
}
