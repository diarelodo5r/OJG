import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../../services/product.service';
import type { User } from '../../../models/product.interface';
import { NotifyService } from '../../../services/notify.service';
import { MatSelectModule } from '@angular/material/select';
import { RbacService, RoleDto } from '../../../services/rbac.service';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  template: `
    <div class="modal-dialog modal-dialog-centered modal-md">
      <div class="modal-content product-dialog-content">
        <div class="modal-body">
          <div class="product-header-bar">
            <div class="title">
              <mat-icon>person_add</mat-icon>
              <div class="text">
                <h3 class="m-0">Nouvel utilisateur</h3>
                <small class="muted">Renseignez les informations de l'utilisateur</small>
              </div>
            </div>
            <button mat-icon-button aria-label="Close" (click)="onCancel()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="edit-layout" [formGroup]="form">
            <div class="right" style="flex: 1 1 100%">
              <div class="summary">
                <div class="summary-content">
                  <div class="form-grid">
                    <mat-form-field appearance="outline" class="w-100">
                      <mat-label>Nom d'utilisateur</mat-label>
                      <input matInput formControlName="username" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-100">
                      <mat-label>Email</mat-label>
                      <input matInput type="email" formControlName="email" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-100">
                      <mat-label>Rôles</mat-label>
                      <mat-select formControlName="role_ids" multiple required>
                        <mat-option *ngFor="let r of roles" [value]="r.id">{{ r.name }}</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <div class="row-cols-2">
                      <mat-form-field appearance="outline" class="w-100">
                        <mat-label>Mot de passe</mat-label>
                        <input matInput type="password" formControlName="password" />
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="w-100">
                        <mat-label>Confirmation</mat-label>
                        <input matInput type="password" formControlName="password_confirmation" />
                      </mat-form-field>
                    </div>
                  </div>

                  <div class="actions mt-3 d-flex gap-2 justify-content-end">
                    <button mat-button (click)="onCancel()">Annuler</button>
                    <button mat-flat-button color="primary" [disabled]="form.invalid || loading" (click)="onCreate()">
                      <mat-icon *ngIf="!loading">check</mat-icon>
                      <span *ngIf="!loading">Créer</span>
                      <span *ngIf="loading"><mat-spinner diameter="20"></mat-spinner></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .modal-content { border-radius: 16px; padding: 0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.25); background: var(--app-surface); }
    .modal-body { padding: 16px 20px 20px; background: var(--app-surface); }
    .product-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 12px; background: linear-gradient(135deg, var(--app-header-grad-1), var(--app-header-grad-2)); margin-bottom: 12px; }
    .product-header-bar .title { display: flex; align-items: center; gap: 12px; }
    .product-header-bar .title mat-icon { color: var(--app-icon); }
    .product-header-bar .title .text h3 { font-weight: 600; font-size: 18px; margin: 0; }
    .product-header-bar .title .text .muted { color: var(--app-text-muted); }
    .edit-layout { display: flex; gap: 24px; align-items: flex-start; }
    .summary { background: var(--app-surface-2); border: 1px solid var(--app-border); border-radius: 12px; }
    .summary-content { padding: 12px; }
    .form-grid { display: flex; flex-direction: column; gap: 14px; }
    .row-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .actions { margin-top: 8px; }
    @media (max-width: 900px) {
      .row-cols-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class AddUserDialogComponent {
  form: FormGroup;
  loading = false;
  roles: RoleDto[] = [];

  constructor(
    private dialogRef: MatDialogRef<AddUserDialogComponent>,
    private fb: FormBuilder,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private notify: NotifyService,
    private rbac: RbacService,
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      role_ids: [[], [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required]],
    });
    this.rbac.listRoles().subscribe({
      next: (roles) => this.roles = roles || [],
      error: () => (this.roles = [])
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value as any;
    if (v.password !== v.password_confirmation) {
      this.notify.error('Les mots de passe ne correspondent pas');
      return;
    }

    this.loading = true;
    // Do not send role_ids in register payload; only user credentials/fields
    const { role_ids, ...createPayload } = v;
    this.productService.createUser(createPayload).subscribe({
      next: (user: User) => {
        const roleIds: number[] = Array.isArray(this.form.value.role_ids) ? this.form.value.role_ids.map((x: any) => Number(x)).filter((n: any) => !!n) : [];
        if (user?.id && roleIds.length) {
          this.productService.syncUserRoles(user.id, roleIds).subscribe({
            next: () => {
              this.loading = false;
              this.notify.successToast('Utilisateur créé');
              this.dialogRef.close({ created: { ...user, role_ids: roleIds } });
            },
            error: () => {
              this.loading = false;
              this.notify.error('Utilisateur créé, mais attribution du rôle échouée');
              this.dialogRef.close({ created: user });
            }
          });
        } else {
          this.loading = false;
          this.notify.successToast('Utilisateur créé');
          this.dialogRef.close({ created: user });
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || "Création impossible";
        this.notify.error(msg, 'Erreur');
      }
    });
  }
}
