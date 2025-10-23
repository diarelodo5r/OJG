import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-menu',
  imports: [MatCardModule, MatMenuModule, MatIconModule, NgIcon, MatButtonModule],
  templateUrl: './menu.component.html',
})
export class AppMenuComponent {
  constructor() {}
}
