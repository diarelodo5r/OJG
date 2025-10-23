import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { RbacService, PermissionDto, RoleDto } from '../../../services/rbac.service';
import { PermissionsService } from '../../../services/permissions.service';
import { MatCardModule } from '@angular/material/card';
import { NotifyService } from '../../../services/notify.service';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Inject } from '@angular/core';
import { AssignPermissionsDialogComponent } from './assign-permissions-dialog.component';
import { PermissionBindingService } from '../../../services/permission-binding.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-permission',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, MatCardModule, MatDialogModule, MatIconModule, MatButtonModule, MatInputModule, MatCheckboxModule, MatSelectModule, MatPaginatorModule, MatExpansionModule, ScrollingModule, MatChipsModule, MatMenuModule, MatTableModule],
  templateUrl: './permission.component.html',
  styleUrls: ['./permission.component.scss']
})
export class AppPermissionComponent implements OnInit {
  // Data
  permissions: PermissionDto[] = [];
  roles: RoleDto[] = [];
  selectedRoleId: number | null = null;
  loading = false;
  saving = false;

  // UI state
  permissionSearch = '';
  permNameServerError = '';
  roleNameServerError = '';
  roleSearch = '';

  // Multi-select model for assigning permissions via dropdown
  selectedPermissionIds: number[] = [];

  // Forms
  permForm!: FormGroup;
  roleForm!: FormGroup;

  constructor(private fb: FormBuilder, private rbac: RbacService, private notify: NotifyService, private dialog: MatDialog, private permsSvc: PermissionsService, private bindingSvc: PermissionBindingService) {
    // Ensure forms instantiated via constructor to avoid initialization ordering issues
    this.permForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['']
    });
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.loading = true;
    Promise.all([this.rbac.listPermissions().toPromise(), this.rbac.listRoles().toPromise()])
      .then(([perms, roles]) => {
        this.permissions = perms || [];
        this.roles = roles || [];
        if (this.roles.length && (this.selectedRoleId == null || !this.roles.find(r => r.id === this.selectedRoleId))) {
          this.selectedRoleId = this.roles[0].id;
        }
        this.syncSelectedPermissionIds();
        this.loadRuntimePermissionsForSelectedRole();
      })
      .finally(() => (this.loading = false));
  }

  // Create Permission
  createPermission(): void {
    if (this.permForm.invalid) return;
    this.saving = true;
    this.permNameServerError = '';
    this.permForm.get('name')?.setErrors(null);
    this.rbac.createPermission(this.permForm.value as any).subscribe({
      next: (p) => {
        this.permissions = [...this.permissions, p];
        this.permForm.reset();
        this.notify.success('Permission créée');
      },
      error: (e) => {
        const errors = e?.error?.errors as Record<string, string[] | string> | undefined;
        if (errors?.['name']) {
          const msg = Array.isArray(errors['name']) ? errors['name'][0] : errors['name'];
          this.permNameServerError = msg;
          this.permForm.get('name')?.setErrors({ server: true });
        }
        this.notify.error(e?.error?.message || 'Échec de création de la permission', 'Erreur');
      },
      complete: () => (this.saving = false)
    });
  }

  // Create Role
  createRole(): void {
    if (this.roleForm.invalid) return;
    this.saving = true;
    this.roleNameServerError = '';
    this.roleForm.get('name')?.setErrors(null);
    this.rbac.createRole({ name: this.roleForm.value.name! }).subscribe({
      next: (r) => {
        this.roles = [...this.roles, r];
        this.roleForm.reset();
        this.selectedRoleId = r.id;
        this.notify.success('Rôle créé');
        this.loadRuntimePermissionsForSelectedRole();
      },
      error: (e) => {
        const errors = e?.error?.errors as Record<string, string[] | string> | undefined;
        if (errors?.['name']) {
          const msg = Array.isArray(errors['name']) ? errors['name'][0] : errors['name'];
          this.roleNameServerError = msg;
          this.roleForm.get('name')?.setErrors({ server: true });
        }
        this.notify.error(e?.error?.message || 'Échec de création du rôle', 'Erreur');
      },
      complete: () => (this.saving = false)
    });
  }

  // Assignment helpers
  roleHasPermission(permId: number): boolean {
    const role = this.roles.find(r => r.id === this.selectedRoleId);
    return !!role?.permissions?.some(p => p.id === permId);
  }

  onTogglePermission(perm: PermissionDto, checked: boolean): void {
    const role = this.roles.find(r => r.id === this.selectedRoleId);
    if (!role) return;
    const currentIds = new Set<number>((role.permissions || []).map(p => p.id));
    if (checked) currentIds.add(perm.id); else currentIds.delete(perm.id);
    const permission_ids = Array.from(currentIds);
    this.saving = true;
    this.rbac.updateRole(role.id, { permission_ids }).subscribe({
      next: (updated) => {
        // Update local role
        this.roles = this.roles.map(r => r.id === updated.id ? updated : r);
        this.notify.success('Permissions du rôle mises à jour');
        this.syncSelectedPermissionIds();
        this.loadRuntimePermissionsForSelectedRole();
      },
      error: (e) => {
        this.notify.error(e?.error?.message || 'Échec de mise à jour du rôle', 'Erreur');
      },
      complete: () => (this.saving = false)
    });
  }

  // Helpers for template to avoid arrow functions inside expressions
  selectedRole(): RoleDto | undefined {
    return this.roles.find(r => r.id === this.selectedRoleId);
  }
  selectedRolePermissions(): PermissionDto[] {
    return this.selectedRole()?.permissions || [];
  }

  // Keep selectedPermissionIds in sync with the selected role
  private syncSelectedPermissionIds(): void {
    const ids = (this.selectedRolePermissions() || []).map(p => p.id);
    this.selectedPermissionIds = ids;
  }

  // Edit/Delete Permission
  editPermission(p: PermissionDto): void {
    const ref = this.dialog.open(EditNameDialog, { data: { title: 'Modifier la permission', name: p.name } });
    ref.afterClosed().subscribe((name?: string) => {
      if (!name || name === p.name) return;
      this.saving = true;
      this.rbac.updatePermission(p.id, { name }).subscribe({
        next: (updated) => {
          this.permissions = this.permissions.map(x => x.id === updated.id ? updated : x);
          // also update in roles cache
          this.roles = this.roles.map(r => ({
            ...r,
            permissions: (r.permissions || []).map(px => px.id === updated.id ? updated : px)
          }));
          this.notify.success('Permission mise à jour');
        },
        error: (e) => this.notify.error(e?.error?.message || 'Échec de mise à jour', 'Erreur'),
        complete: () => (this.saving = false)
      });
    });
  }
  deletePermission(p: PermissionDto): void {
    const ref = this.dialog.open(ConfirmDialog, { data: { title: 'Supprimer', message: `Supprimer la permission "${p.name}" ?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.saving = true;
      this.rbac.deletePermission(p.id).subscribe({
        next: () => {
          this.permissions = this.permissions.filter(x => x.id !== p.id);
          // remove from roles cache
          this.roles = this.roles.map(r => ({
            ...r,
            permissions: (r.permissions || []).filter(px => px.id !== p.id)
          }));
          this.notify.success('Permission supprimée');
        },
        error: (e) => this.notify.error(e?.error?.message || 'Échec de suppression', 'Erreur'),
        complete: () => (this.saving = false)
      });
    });
  }

  // Edit/Delete Role
  editRole(r: RoleDto): void {
    const ref = this.dialog.open(EditNameDialog, { data: { title: 'Modifier le rôle', name: r.name } });
    ref.afterClosed().subscribe((name?: string) => {
      if (!name || name === r.name) return;
      this.saving = true;
      this.rbac.updateRole(r.id, { name }).subscribe({
        next: (updated) => {
          this.roles = this.roles.map(x => x.id === updated.id ? updated : x);
          this.notify.success('Rôle mis à jour');
        },
        error: (e) => this.notify.error(e?.error?.message || 'Échec de mise à jour du rôle', 'Erreur'),
        complete: () => (this.saving = false)
      });
    });
  }
  deleteRole(r: RoleDto): void {
    const ref = this.dialog.open(ConfirmDialog, { data: { title: 'Supprimer', message: `Supprimer le rôle "${r.name}" ?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.saving = true;
      this.rbac.deleteRole(r.id).subscribe({
        next: () => {
          this.roles = this.roles.filter(x => x.id !== r.id);
          if (this.selectedRoleId === r.id) this.selectedRoleId = this.roles[0]?.id ?? null;
          this.notify.success('Rôle supprimé');
        },
        error: (e) => this.notify.error(e?.error?.message || 'Échec de suppression du rôle', 'Erreur'),
        complete: () => (this.saving = false)
      });
    });
  }

  // Filtered permissions list
  filteredPermissions(): PermissionDto[] {
    const term = (this.permissionSearch || '').toLowerCase().trim();
    if (!term) return this.permissions;
    return this.permissions.filter(p => p.name.toLowerCase().includes(term));
  }

  // Pagination for permissions
  pageIndex = 0;
  pageSize = 5;
  onPage(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }
  filteredPermissionsPaged(): PermissionDto[] {
    const list = this.filteredPermissions();
    const start = this.pageIndex * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  // Filter roles by name (for large datasets)
  filteredRoles(): RoleDto[] {
    const term = (this.roleSearch || '').toLowerCase().trim();
    if (!term) return this.roles;
    return this.roles.filter(r => (r.name || '').toLowerCase().includes(term));
  }

  // Pagination for roles (for table UI)
  rolePageIndex = 0;
  rolePageSize = 5;
  onRolePage(event: PageEvent) {
    this.rolePageIndex = event.pageIndex;
    this.rolePageSize = event.pageSize;
  }
  filteredRolesPaged(): RoleDto[] {
    const list = this.filteredRoles();
    const start = this.rolePageIndex * this.rolePageSize;
    return list.slice(start, start + this.rolePageSize);
  }

  // Stub to wire runtime permissions (placeholder for NgxPermissionsService)
  private loadRuntimePermissionsForSelectedRole() {
    try {
      const perms = (this.selectedRolePermissions() || []).map(p => p.name);
      this.permsSvc.load(perms);
      console.debug('[Permissions] Runtime permissions loaded:', perms);
    } catch {}
  }

  onRoleSelectionChange(roleId: number) {
    this.selectedRoleId = roleId;
    this.syncSelectedPermissionIds();
    this.loadRuntimePermissionsForSelectedRole();
  }

  // Bulk assignment when using the multi-select dropdown
  onPermissionsMultiChange(ids: number[]) {
    this.selectedPermissionIds = ids;
    const role = this.roles.find(r => r.id === this.selectedRoleId);
    if (!role) return;
    const permission_ids = [...ids];
    this.saving = true;
    this.rbac.updateRole(role.id, { permission_ids }).subscribe({
      next: (updated) => {
        this.roles = this.roles.map(r => r.id === updated.id ? updated : r);
        this.notify.success('Permissions du rôle mises à jour');
        this.syncSelectedPermissionIds();
        this.loadRuntimePermissionsForSelectedRole();
      },
      error: (e) => this.notify.error(e?.error?.message || 'Échec de mise à jour du rôle', 'Erreur'),
      complete: () => (this.saving = false)
    });
  }

  // Convenience methods for template (avoid arrow functions inline)
  selectAllFilteredPermissions(): void {
    const allIds = this.filteredPermissions().map(p => p.id);
    this.onPermissionsMultiChange(allIds);
  }
  clearAllPermissions(): void {
    this.onPermissionsMultiChange([]);
  }
  // Names for selected permission ids (used in select trigger)
  getSelectedPermissionNames(): string[] {
    if (!this.selectedPermissionIds?.length) return [];
    const idToName = new Map<number, string>(this.permissions.map(p => [p.id, p.name]));
    return this.selectedPermissionIds.map(id => idToName.get(id)).filter((x): x is string => !!x);
  }
  openAssignDialog(): void {
    if (!this.selectedRoleId) return;
    const availablePermissionNames = this.permissions.map(p => p.name);
    const existing = this.bindingSvc.getBindings(this.selectedRoleId);

    const ref = this.dialog.open(AssignPermissionsDialogComponent, {
      data: {
        roleId: this.selectedRoleId,
        availablePermissionNames,
        bindings: existing
      },
      width: '720px',
      maxWidth: '95vw',
      panelClass: ['dialog-dark-theme']
    });

    ref.afterClosed().subscribe((bindings?: { resource: string; permissions: string[] }[]) => {
      if (!bindings) return;
      this.bindingSvc.saveBindings(this.selectedRoleId!, bindings);
      this.notify.success('Affectations enregistrées');
    });
  }
}

// Simple Edit Name Dialog
@Component({
  selector: 'app-edit-name-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Nom</mat-label>
        <input matInput [(ngModel)]="name" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-flat-button color="primary" (click)="save()">Enregistrer</button>
    </mat-dialog-actions>
  `
})
export class EditNameDialog {
  name: string;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; name: string }, private ref: MatDialogRef<EditNameDialog>) {
    this.name = data.name;
  }
  save() { this.ref.close((this.name || '').trim()); }
}

// Simple Confirm Dialog
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Annuler</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">Confirmer</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }) {}
}
