import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { User } from '../../../models/product.interface';
import { ProductService } from '../../../services/product.service';
import { NotifyService } from '../../../services/notify.service';
import { environment } from '../../../environment';
// (no MAT_DIALOG_DATA needed here)
import { ImagePreviewDialog } from '../tables/tables.component';
import { UserDetailDialogComponent } from './user-detail-dialog.component';
import { EditUserDialogComponent } from './edit-user-dialog.component';
import { AddUserDialogComponent } from './add-user-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { RbacService, RoleDto } from '../../../services/rbac.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSelectModule,
  ],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['select', 'id', 'username', 'email', 'role_id', 'description', 'created_at', 'updated_at', 'actions'];
  dataSource = new MatTableDataSource<User>([]);

  filterValue = '';
  // Filtres avancés
  selectedRoleIds: number[] = [];
  creating = false;
  editRowId: number | null = null;

  createForm!: FormGroup;
  editForm!: FormGroup;

  loading = false;
  selection = new SelectionModel<User>(true, []);
  // URL de l'API et base host pour normaliser des chemins d'images
  apiUrl = environment.apiBaseUrl;
  apiHostBase = this.apiUrl.replace(/\/?api\/?$/, '');
  defaultAvatar = 'assets/images/profile/user-7.jpg';
  private photoUrlCache = new Map<number, string>();
  roles: RoleDto[] = [];
  private userRolesMap = new Map<number, RoleDto[]>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductService,
    private fb: FormBuilder,
    private notify: NotifyService,
    private dialog: MatDialog,
    private rbac: RbacService
  ) {}

  ngOnInit(): void {
    // Charger les rôles pour affichage et inline edit
    this.rbac.listRoles().subscribe({
      next: (roles) => this.roles = roles || [],
      error: () => (this.roles = [])
    });
    this.createForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required]],
      role_id: [''],
    });
    this.editForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      role_ids: [[], [Validators.required]],
    });
    this.loadUsers();

    // Étendre le prédicat pour intégrer le filtre par rôles + texte
    const baseFilter = this.dataSource.filterPredicate;
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      try {
        const f = JSON.parse(filter || '{}');
        const text = (f.text || '').toString();
        let ok = true;
        if (text) {
          // Appliquer un texte simple sur username / email
          const t = text.toLowerCase();
          ok = (data.username || (data as any).name || '').toLowerCase().includes(t)
            || (data.email || '').toLowerCase().includes(t);
        }
        if (!ok) return false;
        if (Array.isArray(f.roleIds) && f.roleIds.length) {
          const names = this.getUserRoleNames(data.id);
          // Récupérer les IDs depuis le cache si disponibles
          const roles = (this as any).userRolesMap?.get(data.id!) || [];
          const hasAny = roles.some((r: any) => f.roleIds.includes(Number(r.id)));
          if (!hasAny) return false;
        }
        return true;
      } catch {
        return baseFilter ? baseFilter.call(this.dataSource, data, filter) : true;
      }
    };
  }

  // Sélection multiple
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numRows > 0 && numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  toggleAllRows(): void {
    this.masterToggle();
  }

  checkboxLabel(row?: User): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`;
  }

  deleteSelected(): void {
    const selected = this.selection.selected;
    if (!selected.length) return;
    this.notify
      .confirm({ title: 'Supprimer la sélection', text: `Supprimer ${selected.length} utilisateur(s) ?` })
      .then((res) => {
        if (!res.isConfirmed) return;
        const ids = selected.map(u => u.id).filter((id): id is number => typeof id === 'number');
        if (!ids.length) return;
        let success = 0; let done = 0;
        ids.forEach((id) => {
          this.productService.deleteUser(id).subscribe({
            next: () => { success++; },
            complete: () => {
              done++;
              if (done === ids.length) {
                this.dataSource.data = this.dataSource.data.filter(u => !ids.includes(u.id!));
                this.selection.clear();
                if (success) this.notify.successToast(`${success} utilisateur(s) supprimé(s)`);
              }
            }
          });
        });
      });
  }

  getRoleName(id: any): string | undefined {
    const rid = typeof id === 'string' ? Number(id) : id;
    return this.roles.find(r => r.id === rid)?.name;
  }

  getUserRoleNames(userId?: number): string[] {
    if (!userId) return [];
    const roles = this.userRolesMap.get(userId) || [];
    return roles.map((r: any) => r.name).filter(Boolean);
  }

  private preloadUserPhotos(users: User[]): void {
    const idsToFetch = users
      .map(u => u.id)
      .filter((id): id is number => typeof id === 'number' && !this.photoUrlCache.has(id));
    if (!idsToFetch.length) return;
    idsToFetch.forEach((id) => {
      this.productService.getUserPhoto(id).subscribe({
        next: (blob) => {
          if (!(blob instanceof Blob)) return;
          const objectUrl = URL.createObjectURL(blob);
          const prev = this.photoUrlCache.get(id);
          if (prev) { try { URL.revokeObjectURL(prev); } catch {} }
          this.photoUrlCache.set(id, objectUrl);
        },
        error: () => {
          // Silencieux: on utilisera l'avatar par défaut
        }
      });
    });
  }

  // Helpers d'avatar
  getUserAvatar(user: any): string {
    if (user?.id != null && this.photoUrlCache.has(user.id)) {
      return this.photoUrlCache.get(user.id)!;
    }
    const photo = user?.photo || user?.avatar || user?.imagePath;
    const url = this.normalizePhoto(photo);
    return url || this.defaultAvatar;
  }

  private normalizePhoto(photo?: string): string | undefined {
    if (!photo) return undefined;
    if (photo.startsWith('http') || photo.startsWith('assets/')) return photo;
    const cleanPath = photo.startsWith('/') ? photo : `/${photo}`;
    if (cleanPath.startsWith('/storage/')) return `${this.apiHostBase}${cleanPath}`;
    return `${this.apiUrl}${cleanPath}`;
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.defaultAvatar;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    for (const url of this.photoUrlCache.values()) {
      try { URL.revokeObjectURL(url); } catch {}
    }
    this.photoUrlCache.clear();
  }

  applyFilter(value: string) {
    this.filterValue = value.trim().toLowerCase();
    this.applyAdvancedFilters();
  }

  applyAdvancedFilters(): void {
    const payload = {
      text: this.filterValue,
      roleIds: this.selectedRoleIds,
    };
    this.dataSource.filter = JSON.stringify(payload);
  }

  clearAdvancedFilters(): void {
    this.selectedRoleIds = [];
    this.applyAdvancedFilters();
  }

  loadUsers() {
    this.loading = true;
    this.productService.getUsers().subscribe({
      next: (list) => {
        this.dataSource.data = (list || []).map((u: any) => ({ ...u }));
        this.loading = false;
        // Précharger les photos utilisateurs protégées
        this.preloadUserPhotos(this.dataSource.data);
        // Charger les rôles (pivot) pour chaque user afin d'afficher les noms
        for (const u of this.dataSource.data) {
          if (u.id) {
            this.productService.getUserRoles(u.id).subscribe({
              next: (roles) => this.userRolesMap.set(u.id!, roles as any),
              error: () => {}
            });
          }
        }
      },
      error: () => {
        this.loading = false;
        this.notify.error("Erreur lors du chargement des utilisateurs");
      },
    });
  }

  toggleCreate() {
    // Deprecated inline create toggle kept for backward compatibility
    this.creating = !this.creating;
    if (!this.creating) this.createForm.reset();
  }

  submitCreate() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const payload = { ...this.createForm.value };
    if (payload.password !== payload.password_confirmation) {
      this.notify.error('Les mots de passe ne correspondent pas');
      return;
    }
    this.notify
      .confirm({ title: 'Confirmer', text: 'Créer cet utilisateur ?' })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.productService.createUser(payload).subscribe({
          next: (u: User) => {
            this.notify.success('Utilisateur créé');
            this.dataSource.data = [u, ...this.dataSource.data];
            this.toggleCreate();
          },
          error: () => this.notify.error("Création impossible"),
        });
      });
  }

  openAddUserDialog(): void {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: ['dialog-dark-theme', 'product-detail-dialog'],
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.created) {
        const created = result.created as User;
        this.dataSource.data = [created, ...this.dataSource.data];
        this.notify.successToast('Utilisateur créé');
      }
    });
  }

  startEdit(row: User) {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      data: { user: row },
      width: '700px',
      maxWidth: '95vw',
      panelClass: ['dialog-dark-theme', 'product-detail-dialog'],
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.updated) {
        const updated = result.updated as User;
        const current = [...this.dataSource.data];
        const idx = current.findIndex(u => u.id === updated.id);
        if (idx !== -1) {
          current[idx] = { ...current[idx], ...updated };
          this.dataSource.data = current;
        }
        this.notify.successToast('Utilisateur mis à jour');
      }
    });
  }

  cancelEdit() {
    this.editRowId = null;
    this.editForm.reset();
  }

  saveEdit(row: User) {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const id = row.id!;
    const { role_ids, ...rest } = this.editForm.value as any;
    this.notify
      .confirm({ title: 'Confirmer', text: "Enregistrer les modifications pour cet utilisateur ?" })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.productService.updateUser(id, rest).subscribe({
          next: (updated) => {
            const rids: number[] = Array.isArray(role_ids) ? role_ids.map((x: any) => Number(x)).filter((n: any) => !!n) : [];
            const applyLocal = (u: User) => {
              this.notify.success('Utilisateur modifié');
              // keep table row updated; roles names cache will be refreshed by next call
              this.dataSource.data = this.dataSource.data.map((it) => (it.id === id ? { ...u } : it));
              if (id) {
                this.productService.getUserRoles(id).subscribe({
                  next: (roles) => this.userRolesMap.set(id, roles as any),
                  error: () => {}
                });
              }
              this.cancelEdit();
            };
            if (rids.length) {
              this.productService.syncUserRoles(id, rids).subscribe({
                next: () => applyLocal(updated),
                error: () => {
                  this.notify.error("Profil mis à jour, mais attribution du rôle échouée");
                  applyLocal(updated);
                }
              });
            } else {
              applyLocal(updated);
            }
          },
          error: () => this.notify.error("Mise à jour impossible"),
        });
      });
  }

  delete(row: User) {
    if (!row.id) return;
    this.notify
      .confirm({ title: 'Confirmer', text: `Supprimer l'utilisateur "${row.username || row.name}" ?` })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.productService.deleteUser(row.id!).subscribe({
          next: () => {
            this.notify.success('Utilisateur supprimé');
            this.dataSource.data = this.dataSource.data.filter((u) => u.id !== row.id);
          },
          error: () => this.notify.error("Suppression impossible"),
        });
      });
  }

  onViewImage(user: User): void {
    const src = this.getUserAvatar(user as any);
    this.dialog.open(ImagePreviewDialog, {
      data: { src, title: user.username || (user as any).name || `User #${user.id}` },
      panelClass: ['dialog-dark-theme', 'image-preview-dialog-content'],
      maxWidth: '90vw',
      width: '680px'
    });
  }
  onViewImageDetails(user: User): void {
    const src = this.getUserAvatar(user as any);
    this.dialog.open(UserDetailDialogComponent, {
      data: { user, src },
      panelClass: ['dialog-dark-theme', 'product-detail-dialog'],
      maxWidth: '95vw',
      width: '650px',
      autoFocus: false,
    });
  }
}
