import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { I18nModule } from '@app/i18n';
import { ShellComponent } from './shell.component';
import { HeaderComponent } from './header/header.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    NgbModule,
    I18nModule,
    RouterModule,
    ToastModule,
    NgxSpinnerModule,
    ConfirmDialogModule,
  ],
  declarations: [HeaderComponent, ShellComponent],
})
export class ShellModule {}
