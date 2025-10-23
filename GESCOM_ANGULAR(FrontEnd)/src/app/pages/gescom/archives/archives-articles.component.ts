import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-archives-articles',
  template: `<h2>Articles Archivés</h2>`,
  imports: [CommonModule],
})
export class ArchivesArticlesComponent {}
