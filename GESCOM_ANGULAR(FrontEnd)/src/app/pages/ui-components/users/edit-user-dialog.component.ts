import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../../services/product.service';
import type { User } from '../../../models/product.interface';
import { NotifyService } from '../../../services/notify.service';
import { ImagePreviewDialog } from '../tables/tables.component';
import { MatSelectModule } from '@angular/material/select';
import { RbacService, RoleDto } from '../../../services/rbac.service';

@Component({
  selector: 'app-edit-user-dialog',
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
              <mat-icon>edit</mat-icon>
              <div class="text">
                <h3 class="m-0">Modifier l'utilisateur</h3>
                <small class="muted">Mettez à jour les informations et la photo</small>
              </div>
            </div>
            <button mat-icon-button aria-label="Close" (click)="onCancel()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="edit-layout" [formGroup]="form">
            <div class="left">
              <div class="image-holder">
                <img [src]="previewUrl || currentImageUrl" [alt]="form.value.username || 'Utilisateur'" (error)="onImgError($event)" (click)="openPreview()" style="cursor:pointer;" />
                <button class="image-action" mat-mini-fab color="primary" (click)="fileInput.click()" [disabled]="loading" aria-label="Changer la photo">
                  <mat-icon>photo_camera</mat-icon>
                </button>
                <input #fileInput type="file" accept="image/*" hidden (change)="onFileSelected($event)" />
              </div>
            </div>
            <div class="right">
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

                    <mat-form-field appearance="outline" class="w-100">
                      <mat-label>Balance</mat-label>
                      <input matInput type="number" formControlName="balance" />
                    </mat-form-field>
                  </div>

                  <div class="actions mt-3 d-flex gap-2 justify-content-end">
                    <button mat-button (click)="onCancel()">Annuler</button>
                    <button mat-flat-button color="primary" [disabled]="form.invalid || loading" (click)="onSave()">
                      <mat-icon *ngIf="!loading">save</mat-icon>
                      <span *ngIf="!loading">Enregistrer</span>
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
    .left { flex: 1 1 45%; }
    .right { flex: 1 1 55%; }
    .summary { background: var(--app-surface-2); border: 1px solid var(--app-border); border-radius: 12px; }
    .summary-content { padding: 12px; }
    .image-holder { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--app-border); background: var(--app-surface-2); }
    .image-holder img { width: 100%; height: auto; max-height: 320px; object-fit: cover; display: block; }
    .image-holder .image-action { position: absolute; right: 12px; bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
    .form-grid { display: flex; flex-direction: column; gap: 14px; }
    .row-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .actions { margin-top: 8px; }
    @media (max-width: 900px) {
      .edit-layout { flex-direction: column; }
      .left, .right { flex: 1 1 100%; }
      .image-holder img { max-height: 260px; }
    }
  `]
})
export class EditUserDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  currentImageUrl: string | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  private objectUrlToRevoke: string | null = null;
  roles: RoleDto[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { user: User },
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    private fb: FormBuilder,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private notify: NotifyService,
    private dialog: MatDialog,
    private rbac: RbacService
  ) {
    const u: any = data.user;
    this.form = this.fb.group({
      username: [u.username || u.name || '', [Validators.required, Validators.maxLength(255)]],
      email: [u.email || '', [Validators.required, Validators.email]],
      role_ids: [[], [Validators.required]],
      balance: [u.balance ?? 0, []],
    });
    const path = u.photo || u.imagePath;
    this.currentImageUrl = typeof path === 'string' && path.length ? path : 'assets/images/profile/user-7.jpg';
  }

  ngOnInit(): void {
    // Charger les rôles pour la liste déroulante et pré-remplir ceux de l'utilisateur
    this.rbac.listRoles().subscribe({
      next: (roles) => {
        this.roles = roles || [];
      },
      error: () => (this.roles = [])
    });
    if (this.data.user?.id) {
      this.productService.getUserRoles(this.data.user.id).subscribe({
        next: (urs) => {
          const ids = (urs || []).map((r: any) => r.id);
          this.form.patchValue({ role_ids: ids });
        },
        error: () => {
          // ignore
        }
      });
    }
    const id = this.data.user?.id;
    if (!id) return;
    this.productService.getUserPhoto(id).subscribe({
      next: (blob) => {
        if (!(blob instanceof Blob)) return;
        const url = URL.createObjectURL(blob);
        if (this.objectUrlToRevoke) { try { URL.revokeObjectURL(this.objectUrlToRevoke); } catch {} }
        this.objectUrlToRevoke = url;
        this.currentImageUrl = url;
      },
      error: () => {
        // ignore
      }
    });
  }

  ngOnDestroy(): void {
    if (this.objectUrlToRevoke) {
      try { URL.revokeObjectURL(this.objectUrlToRevoke); } catch {}
      this.objectUrlToRevoke = null;
    }
  }

  onCancel(): void { this.dialogRef.close(); }

  onSave(): void {
    if (this.form.invalid || !this.data.user?.id) return;
    const id = this.data.user.id;
    const payload: Partial<User> & { balance?: number } = {
      username: this.form.value.username,
      email: this.form.value.email,
      // role assignment handled separately via sync endpoint
    } as any;
    if (this.form.value.balance !== undefined) (payload as any).balance = Number(this.form.value.balance) || 0;

    this.loading = true;
    this.productService.updateUser(id, payload).subscribe({
      next: (updated) => {
        const roleIds: number[] = Array.isArray(this.form.value.role_ids) ? this.form.value.role_ids.map((x: any) => Number(x)).filter((n: any) => !!n) : [];
        const proceedClose = () => {
          // Upload photo if selected
          if (this.selectedFile) {
            this.productService.uploadUserPhoto?.(id, this.selectedFile).subscribe({
              next: () => {
                this.loading = false;
                this.notify.successToast("Profil et photo mis à jour");
                this.dialogRef.close({ updated: { ...updated, role_ids: roleIds } });
              },
              error: () => {
                this.loading = false;
                this.notify.error("Profil mis à jour, mais échec de l'upload de la photo", 'Erreur');
                this.dialogRef.close({ updated });
              }
            });
          } else {
            this.loading = false;
            this.notify.successToast('Profil mis à jour');
            this.dialogRef.close({ updated });
          }
        };

        if (id && roleIds.length) {
          this.productService.syncUserRoles(id, roleIds).subscribe({
            next: () => proceedClose(),
            error: () => {
              // Continue even if role sync fails, but notify
              this.notify.error("Profil mis à jour, mais attribution du rôle échouée");
              proceedClose();
            }
          });
        } else {
          proceedClose();
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || 'Erreur lors de la mise à jour';
        this.notify.error(msg, 'Erreur');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    if (!allowed.includes(file.type)) {
      this.notify.error('Format image invalide (JPG, PNG, WEBP)', 'Erreur');
      input.value = '';
      return;
    }
    if (file.size > maxSize) {
      this.notify.error('Image trop lourde (max 5MB)', 'Erreur');
      input.value = '';
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => { this.previewUrl = reader.result as string; };
    reader.readAsDataURL(file);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/profile/user-7.jpg';
  }

  openPreview(): void {
    const src = this.previewUrl || this.currentImageUrl || 'assets/images/profile/user-7.jpg';
    this.dialog.open(ImagePreviewDialog, {
      data: { src, title: this.form.value.username || 'Utilisateur' },
      panelClass: ['dialog-dark-theme', 'image-preview-dialog-content'],
      maxWidth: '90vw',
      width: '680px',
    });
  }
}
