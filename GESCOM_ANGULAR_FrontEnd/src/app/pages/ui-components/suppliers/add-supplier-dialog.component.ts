import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ProductService } from '../../../services/product.service';
import { NotifyService } from '../../../services/notify.service';

@Component({
  selector: 'app-add-supplier-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatIconModule],
  template: `
    <div class="modal-dialog modal-dialog-centered modal-md">
      <div class="modal-content app-dialog">
        <div class="app-dialog-body">
          <div class="app-dialog-header">
            <div class="title">
              <mat-icon>add_business</mat-icon>
              <div class="text">
                <h3 class="m-0">Nouveau fournisseur</h3>
                <small class="muted">Renseignez les informations</small>
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
                    <mat-label>Email</mat-label>
                    <input matInput formControlName="contact_email" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Téléphone</mat-label>
                    <input matInput formControlName="contact_phone" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Adresse</mat-label>
                    <input matInput formControlName="address" />
                  </mat-form-field>

                  <div class="actions mt-3 d-flex gap-2 justify-content-end">
                    <button mat-button type="button" (click)="onCancel()">Annuler</button>
                    <button mat-flat-button color="primary" [disabled]="form.invalid" type="submit">
                      <mat-icon>save</mat-icon>
                      Créer
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
export class AddSupplierDialogComponent {
  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<AddSupplierDialogComponent>,
    private fb: FormBuilder,
    private productService: ProductService,
    private notify: NotifyService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      contact_email: [''],
      contact_phone: [''],
      address: [''],
    });
  }

  onCancel(): void { this.dialogRef.close(); }

  onSave(): void {
    if (this.form.invalid) return;
    this.productService.createSupplier(this.form.value).subscribe({
      next: (created) => {
        this.notify.successToast('Fournisseur créé');
        this.dialogRef.close({ created });
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erreur lors de la création';
        this.notify.error(msg, 'Erreur');
      }
    });
  }
}
