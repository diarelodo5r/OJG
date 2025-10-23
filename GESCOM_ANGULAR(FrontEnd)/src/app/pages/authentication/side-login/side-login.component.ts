import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { AppTablerIconsModule } from '../../../app-tabler-icons.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule,
    // Icons configured via NgModule wrapper
    AppTablerIconsModule,
  ],
  templateUrl: './side-login.component.html',
  styleUrls: ['./side-login.component.scss']
})
export class AppSideLoginComponent {
  // Controls the visibility of the password field
  hidePassword = true;

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
