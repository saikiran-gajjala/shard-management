import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

import { HomeComponent } from './home/home.component';
import { Shell } from '@app/shell/shell.service';
import { ShardsComponent } from './shards/shards.component';
import { ChunkHomeComponent } from './chunk-home/chunk-home.component';

const routes: Routes = [
  Shell.childRoutes([
    { path: 'home', component: HomeComponent },
    { path: 'shards/:connectionId', component: ShardsComponent },
    {
      path: 'chunks/:connectionId/:shardName/:database/:collection',
      component: ChunkHomeComponent,
    },
    { path: '**', component: HomeComponent },
  ]),
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [],
})
export class HomeRoutingModule {}
