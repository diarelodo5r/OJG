import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { AppTablerIconsModule } from '../../../app-tabler-icons.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-side-register',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule,
    // Icons configured via NgModule wrapper
    AppTablerIconsModule,
  ],
  templateUrl: './side-register.component.html',
  styleUrl: './side-register.component.scss'
})
export class AppSideRegisterComponent {
  // Controls the visibility of password fields
  hidePassword = true;
  hideConfirmPassword = true;

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}
