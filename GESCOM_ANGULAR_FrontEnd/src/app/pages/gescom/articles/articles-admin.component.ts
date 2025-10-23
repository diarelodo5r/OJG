import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-articles-admin',
  template: `<h2>Modifier Articles (Admin)</h2>`,
  imports: [CommonModule],
})
export class ArticlesAdminComponent {}
