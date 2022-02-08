import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SharedModule } from '@shared';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
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
    ListboxModule,
  ],
  declarations: [HomeComponent],
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
  ],
  providers: [MessageService, ShardManagerService, ConfirmationService],
})
export class HomeModule {}
