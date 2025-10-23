import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import type { ProductCategory } from '../../../models/product.interface';
import { ProductService } from '../../../services/product.service';
import { NotifyService } from '../../../services/notify.service';

@Component({
  selector: 'app-edit-category-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatIconModule],
  template: `
    <div class="modal-dialog modal-dialog-centered modal-md">
      <div class="modal-content app-dialog">
        <div class="app-dialog-body">
          <div class="app-dialog-header">
            <div class="title">
              <mat-icon>edit</mat-icon>
              <div class="text">
                <h3 class="m-0">Modifier la catégorie</h3>
                <small class="muted">Mettez à jour les informations</small>
              </div>
            </div>
            <button mat-icon-button aria-label="Close" (click)="onCancel()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <form class="app-detail-layout" [formGroup]="form" (ngSubmit)="onSave()">
            <div class="app-detail-right" style="flex:1 1 100%">
              <div class="app-surface-card">
                <div class="content">
                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Nom</mat-label>
                    <input matInput formControlName="name" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Description</mat-label>
                    <input matInput formControlName="description" />
                  </mat-form-field>

                  <div class="actions mt-3 d-flex gap-2 justify-content-end">
                    <button mat-button type="button" (click)="onCancel()">Annuler</button>
                    <button mat-flat-button color="primary" [disabled]="form.invalid" type="submit">
                      <mat-icon>save</mat-icon>
                      Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class EditCategoryDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { category: ProductCategory },
    private dialogRef: MatDialogRef<EditCategoryDialogComponent>,
    private fb: FormBuilder,
    private productService: ProductService,
    private notify: NotifyService
  ) {}

  ngOnInit(): void {
    const c = this.data.category;
    this.form = this.fb.group({
      name: [c.name || '', [Validators.required, Validators.minLength(3)]],
      description: [c.description || ''],
    });
  }

  onCancel(): void { this.dialogRef.close(); }

  onSave(): void {
    if (this.form.invalid || !this.data.category?.id) return;
    const id = this.data.category.id;
    this.productService.updateCategory(id, this.form.value).subscribe({
      next: (updated) => {
        this.notify.successToast('Catégorie mise à jour');
        this.dialogRef.close({ updated });
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erreur lors de la mise à jour';
        this.notify.error(msg, 'Erreur');
      }
    });
  }
}
