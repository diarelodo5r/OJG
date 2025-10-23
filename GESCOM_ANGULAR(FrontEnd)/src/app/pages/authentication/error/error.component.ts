import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss'
})
export class AppErrorComponent {

}
