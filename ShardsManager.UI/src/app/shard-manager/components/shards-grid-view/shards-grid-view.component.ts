import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import * as models from '../../models/models';

@Component({
  selector: 'shards-grid-view',
  templateUrl: './shards-grid-view.component.html',
  styleUrls: ['./shards-grid-view.component.scss']
})
export class ShardsGridViewComponent implements OnInit {
  @Input() shards: models.Shard[];
  @Input() collectionStats: models.CollectionStats;
  constructor() { }

  ngOnInit(): void {
  }
}
