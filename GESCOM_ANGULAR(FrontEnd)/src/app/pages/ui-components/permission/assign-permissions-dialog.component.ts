import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../material.module';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';

export interface AssignDialogData {
  roleId: number;
  availablePermissionNames: string[];
  bindings: Array<{ resource: string; permissions: string[] }>;
}

@Component({
  selector: 'app-assign-permissions-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MaterialModule],
  template: `
    <h2 mat-dialog-title>Affecter les permissions aux ressources</h2>
    <mat-dialog-content class="d-block">
      <div class="m-b-12">
        <br>
        <form [formGroup]="rowForm" class="d-flex align-items-end" style="gap: 12px;">
          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Ressource (ex: sidebar.products, page.users, table.orders)</mat-label>
            <input matInput formControlName="resource" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Permissions</mat-label>
            <mat-select formControlName="permissions" multiple>
              <mat-option *ngFor="let p of data.availablePermissionNames" [value]="p">{{ p }}</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="addRow()" [disabled]="rowForm.invalid">Ajouter</button>
        </form>
      </div>

      <div class="m-t-12">
        <table class="w-100" style="border-collapse: collapse;">
          <thead>
            <tr style="text-align: left;">
              <th style="padding: 8px;">Ressource</th>
              <th style="padding: 8px;">Permissions</th>
              <th style="padding: 8px; width: 80px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of bindings; let i = index" style="border-top: 1px solid rgba(0,0,0,0.08);">
              <td style="padding: 8px;">{{ b.resource }}</td>
              <td style="padding: 8px;">
                <span class="mat-body-small">{{ b.permissions.join(', ') || '—' }}</span>
              </td>
              <td style="padding: 8px;">
                <button mat-icon-button color="primary" (click)="editRow(i)" matTooltip="Modifier"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" (click)="removeRow(i)" matTooltip="Supprimer"><mat-icon>delete</mat-icon></button>
              </td>
            </tr>
            <tr *ngIf="bindings.length === 0">
              <td colspan="3" style="padding: 12px; color: var(--mat-sys-outline, rgba(0,0,0,0.6));">Aucun rattachement.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-flat-button color="primary" (click)="onSave()">Enregistrer</button>
    </mat-dialog-actions>
  `
})
export class AssignPermissionsDialogComponent {
  bindings: Array<{ resource: string; permissions: string[] }> = [];
  rowForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AssignDialogData,
    private ref: MatDialogRef<AssignPermissionsDialogComponent>,
    private fb: FormBuilder
  ) {
    this.bindings = [...(data.bindings || [])];
    this.rowForm = this.fb.group({
      resource: ['', [Validators.required, Validators.maxLength(200)]],
      permissions: [[], [Validators.required]]
    });
  }

  addRow() {
    if (this.rowForm.invalid) return;
    const value = this.rowForm.value as { resource: string; permissions: string[] };
    this.bindings.push({ resource: value.resource.trim(), permissions: value.permissions });
    this.rowForm.reset({ resource: '', permissions: [] });
  }

  editRow(index: number) {
    const row = this.bindings[index];
    this.rowForm.setValue({ resource: row.resource, permissions: row.permissions });
    this.bindings.splice(index, 1);
  }

  removeRow(index: number) {
    this.bindings.splice(index, 1);
  }

  onCancel() { this.ref.close(); }
  onSave() { this.ref.close(this.bindings); }
}
