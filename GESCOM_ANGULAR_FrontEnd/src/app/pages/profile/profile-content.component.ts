import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-profile-content',
  standalone: true,
  imports: [CommonModule, MaterialModule, NgIcon],
  templateUrl: './profile-content.component.html',
  styleUrl: './profile-content.component.scss'
})
export class ProfileContentComponent {}
