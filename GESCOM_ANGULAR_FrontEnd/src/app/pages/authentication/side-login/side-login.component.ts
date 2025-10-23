import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { NgIcon } from '@ng-icons/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule,
    NgIcon,
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
