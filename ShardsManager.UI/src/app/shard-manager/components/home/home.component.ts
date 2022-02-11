import { Component, OnInit } from '@angular/core';
import * as models from '../../models/models';
import { ShardManagerService } from '../../services/shard-manager.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  connectionString: string = 'mongodb://localhost:26000/config?retryWrites=true&w=majority';
  constructor(
    private shardManagerService: ShardManagerService,
    private messageService: MessageService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  onValidate() {
    this.spinner.show();
    this.shardManagerService
      .validateConnectionString(this.connectionString)
      .subscribe(
        (response: models.MongoConnectionResponse) => {
          this.spinner.hide();
          if (response.isConnectionSuccess && response.isShardedCluster && response.connectionId !== '') {
            this.messageService.add({
              severity: 'success',
              detail: 'Connection Successful'
            });
            this.router.navigate([`shards/${response.connectionId}`]);
          } else if (!response.isConnectionSuccess) {
            this.messageService.add({
              severity: 'error',
              detail: 'Failed to connect to the mongodb. Please check the connection string or whitelist the IP Address',
            });
          } else if (response.isConnectionSuccess && !response.isShardedCluster) {
            this.messageService.add({
              severity: 'error',
              detail: 'The Connected mongodb instance is not a sharded cluster!',
            });
          }
        },
        (error: HttpErrorResponse) => {
          this.spinner.hide();
          this.messageService.add({
            severity: 'error',
            detail: 'Failed to connect to mongodb',
          });
        }
      );
  }
}
