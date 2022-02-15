import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SharedModule } from '@shared';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from '../components/home/home.component';
import { SidebarModule } from 'primeng/sidebar';
import { ListboxModule } from 'primeng/listbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { StepsModule } from 'primeng/steps';
import { TreeModule } from 'primeng/tree';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TreeTableModule } from 'primeng/treetable';
import { DialogModule } from 'primeng/dialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ShardManagerService } from '../services/shard-manager.service';
import { ShardsComponent } from './shards/shards.component';
import { ShardsGridViewComponent } from './shards-grid-view/shards-grid-view.component';
import { ShardCardComponent } from './shard-card/shard-card.component';
import { ShardMetadataComponent } from './shard-metadata/shard-metadata.component';
import { ChunkHomeComponent } from './chunk-home/chunk-home.component';
import { CheckboxModule } from 'primeng/checkbox';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    SharedModule,
    HomeRoutingModule,
    SidebarModule,
    ListboxModule,
    ButtonModule,
    ReactiveFormsModule,
    StepsModule,
    CardModule,
    TreeModule,
    DropdownModule,
    TabViewModule,
    ToastModule,
    TableModule,
    TreeTableModule,
    DialogModule,
    RadioButtonModule,
    TooltipModule,
    ConfirmDialogModule,
    MultiSelectModule,
    PaginatorModule,
    CheckboxModule,
  ],
  declarations: [
    HomeComponent,
    ShardsComponent,
    ShardsGridViewComponent,
    ShardCardComponent,
    ShardMetadataComponent,
    ChunkHomeComponent,
  ],
  exports: [
    FormsModule,
    ButtonModule,
    ReactiveFormsModule,
    StepsModule,
    CardModule,
    TreeModule,
    DropdownModule,
    TabViewModule,
    ToastModule,
    TableModule,
    TreeTableModule,
    DialogModule,
    RadioButtonModule,
    TooltipModule,
    ConfirmDialogModule,
    MultiSelectModule,
    PaginatorModule,
    ListboxModule,
    CheckboxModule,
  ],
  providers: [MessageService, ShardManagerService, ConfirmationService],
})
export class HomeModule { }
