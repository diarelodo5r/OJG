import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <mat-card class="cardWithShadow">
      <mat-card-header>
        <mat-card-title>Blog Post #{{ id }}</mat-card-title>
        <mat-card-subtitle>Placeholder detail page</mat-card-subtitle>
      </mat-card-header>
      <img mat-card-image src="/assets/images/blog/blog-img{{ id || 1 }}.jpg" alt="blog" />
      <mat-card-content class="p-24">
        <p>
          This is a placeholder for the blog post details. You can fetch content by id ({{ id }}) later.
        </p>
      </mat-card-content>
    </mat-card>
  `,
})
export class BlogDetailComponent {
  id!: number;
  
  constructor(private route: ActivatedRoute) {
    this.id = Number(this.route.snapshot.paramMap.get('id')) || 1;
  }
}
