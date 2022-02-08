import { Component, OnInit } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  providers: [MessageService, ConfirmationService],
})
export class ShellComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
