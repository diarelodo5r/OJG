import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UtilisateursService, Utilisateur } from '../../../services/gescom/utilisateurs.service';
import { SelectionModel } from '@angular/cdk/collections';
import { NotifyService } from '../../../services/notify.service';
import { environment } from '../../../environment';
import { forkJoin, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { GenericTableComponent, GenericTableColumn, GenericColumnType, ColumnTemplateDirective } from '../../ui-components/tables/generic-table.component';
import { MatDialog } from '@angular/material/dialog';
import { EditEntityDialogComponent, EditFieldConfig } from '../../ui-components/tables/edit-entity-dialog.component';
import { ImagePreviewDialogComponent } from '../../ui-components/image-preview-dialog.component';
import { ImageCacheService } from '../../../services/image-cache.service';

@Component({
  standalone: true,
  selector: 'app-utilisateurs-list',
  templateUrl: './utilisateurs-list.component.html',
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, GenericTableComponent, ColumnTemplateDirective],
})
export class UtilisateursListComponent implements OnInit {
  dataSource = new MatTableDataSource<Utilisateur>([]);
  searchCtrl = new FormControl('');
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  selection = new SelectionModel<Utilisateur>(true, []);

  defaultImage = 'assets/images/profile/user-1.jpg';
  apiUrl = environment.apiBaseUrl;
  
  // Cache des images converties en ObjectURL
  imageUrls = new Map<number, string>();

  utilisateurColumns: GenericTableColumn[] = [
    { key: 'utilisateur', label: 'Utilisateur', type: 'custom' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'role', label: 'Rôle', type: 'text' },
    { key: 'telephone', label: 'Téléphone', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'created_at', label: 'Créé le', type: 'date', dateFormat: 'short' },
    { key: 'updated_at', label: 'Modifié le', type: 'date', dateFormat: 'short' },
  ];

  utilisateurFilters: Array<{ key: string; label: string; type?: GenericColumnType }> = [
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'role', label: 'Rôle', type: 'text' },
  ];

  constructor(
    private utilisateurs: UtilisateursService,
    private notify: NotifyService,
    private dialog: MatDialog,
    private imageCache: ImageCacheService
  ) {}

  ngOnInit(): void {
    this.load();
    this.searchCtrl.valueChanges.subscribe(() => this.applyFilter());
  }

  load() {
    this.utilisateurs.all().subscribe(rows => {
      this.dataSource.data = rows;
      if (this.paginator) this.dataSource.paginator = this.paginator;
      
      // Précharger toutes les images des utilisateurs
      this.preloadUserImages(rows);
    });
  }

  applyFilter() {
    const v = (this.searchCtrl.value || '').toLowerCase();
    this.dataSource.filterPredicate = (d) =>
      [d.nom, d.email, d.role, d.telephone].some(x => (x || '').toLowerCase().includes(v));
    this.dataSource.filter = Math.random() + '';
  }

  onSelectionChange(rows: Utilisateur[]) {
    this.selection.clear();
    (rows || []).forEach(r => this.selection.select(r));
  }

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

  onDelete(payload: Utilisateur | Utilisateur[]) {
    if (Array.isArray(payload)) {
      this.selection.setSelection(...payload);
      return this.deleteSelected();
    }
    return this.delete(payload as Utilisateur);
  }

  deleteSelected(): void {
    const sel = this.selection.selected;
    if (!sel.length) return;
    this.notify.confirm({ title: 'Supprimer la sélection', text: `Supprimer ${sel.length} utilisateur(s) ?` }).then(res => {
      if (!res.isConfirmed) return;
      const ids = sel.map(u => u.id).filter((id): id is number => typeof id === 'number');
      if (!ids.length) return;
      forkJoin(ids.map(id => this.utilisateurs.delete(id))).subscribe({
        complete: () => {
          this.dataSource.data = this.dataSource.data.filter(u => !ids.includes(u.id!));
          this.selection.clear();
          this.notify.successToast('Sélection supprimée');
        },
        error: () => this.notify.error('Suppression impossible pour certains éléments')
      });
    });
  }

  delete(row: Utilisateur) {
    if (!row.id) return;
    this.notify.confirm({ title: 'Confirmer', text: 'Supprimer cet utilisateur ?' }).then(res => {
      if (!res.isConfirmed) return;
      this.utilisateurs.delete(row.id!).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter(u => u.id !== row.id);
          this.notify.success('Utilisateur supprimé');
        },
        error: () => this.notify.error('Suppression impossible')
      });
    });
  }

  archive(row: Utilisateur) {
    console.log('archive utilisateur', row.id);
  }

  openView(row: Utilisateur) {
    const fields: EditFieldConfig[] = [
      { key: 'nom', label: 'Nom', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'role', label: 'Rôle', type: 'text' },
      { key: 'telephone', label: 'Téléphone', type: 'text' },
      { key: 'adresse', label: 'Adresse', type: 'textarea' },
      { key: 'sexe', label: 'Sexe', type: 'text' },
      { key: 'created_at', label: 'Créé le', type: 'date' },
    ];

    this.dialog.open(EditEntityDialogComponent, {
      data: {
        title: 'Détails utilisateur',
        entity: 'Utilisateur',
        value: row,
        fields,
        readOnly: true,
        getImageUrl: (user: Utilisateur) => this.getUtilisateurPhotoUrl(user),
        onSave: () => of(row)
      },
      width: '600px',
      panelClass: 'dialog-dark-theme'
    });
  }

  openEdit(row: Utilisateur) {
    const fields: EditFieldConfig[] = [
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'role', label: 'Rôle', type: 'select', options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Utilisateur', value: 'user' },
        { label: 'Gestionnaire', value: 'manager' },
      ]},
      { key: 'telephone', label: 'Téléphone', type: 'text' },
      { key: 'sexe', label: 'Sexe', type: 'select', options: [
        { label: 'Masculin', value: 'M' },
        { label: 'Féminin', value: 'F' },
      ]},
      { key: 'adresse', label: 'Adresse', type: 'textarea' },
      { key: 'photo', label: 'Photo', type: 'image' },
    ];

    this.dialog.open(EditEntityDialogComponent, {
      data: {
        title: 'Modifier utilisateur',
        entity: 'Utilisateur',
        value: row,
        fields,
        getImageUrl: (user: Utilisateur) => this.getUtilisateurPhotoUrl(user),
        onSave: (changes: Partial<Utilisateur>, file?: File | null) => {
          const id = row.id;
          if (!id) return of(null);
          
          // Si un fichier est fourni, uploader d'abord la photo
          if (file) {
            return this.utilisateurs.uploadPhoto(id, file).pipe(
              switchMap((uploadResult: { message: string; path: string }) => {
                // Ajouter le chemin de la photo aux changements
                const updatedChanges = { ...changes, photo: uploadResult.path };
                // Mettre à jour l'utilisateur avec les changements et le chemin de la photo
                return Object.keys(updatedChanges).length 
                  ? this.utilisateurs.update(id, updatedChanges) 
                  : of({ ...row, photo: uploadResult.path });
              }),
              tap((updated: Utilisateur) => {
                // Invalider le cache d'image pour forcer le rechargement
                if (updated && updated.id) {
                  const imageUrl = `${this.apiUrl}/utilisateurs/${updated.id}/photo`;
                  this.imageCache.removeFromCache(imageUrl);
                  // Recharger l'image
                  this.imageCache.getImage(imageUrl, this.defaultImage).subscribe(objectUrl => {
                    this.imageUrls.set(updated.id!, objectUrl);
                  });
                }
              })
            );
          }
          
          // Si pas de fichier, juste mettre à jour les autres champs
          return Object.keys(changes).length ? this.utilisateurs.update(id, changes) : of(row);
        },
      },
      width: '600px',
      panelClass: 'dialog-dark-theme',
    }).afterClosed().subscribe(res => {
      if (res?.updated) {
        const updated: Utilisateur = res.updated;
        const idx = this.dataSource.data.findIndex(r => r.id === updated.id);
        if (idx > -1) {
          this.dataSource.data[idx] = { ...this.dataSource.data[idx], ...updated } as Utilisateur;
          (this.dataSource as any)._updateChangeSubscription?.();
        } else {
          this.load();
        }
      }
    });
  }

  /**
   * Précharge toutes les images des utilisateurs
   */
  preloadUserImages(utilisateurs: Utilisateur[]): void {
    utilisateurs.forEach(user => {
      if (user.id && user.photo) {
        const imageUrl = `${this.apiUrl}/utilisateurs/${user.id}/photo`;
        this.imageCache.getImage(imageUrl, this.defaultImage).subscribe(objectUrl => {
          this.imageUrls.set(user.id!, objectUrl);
        });
      }
    });
  }

  /**
   * Obtient l'URL de la photo d'un utilisateur (ObjectURL depuis le cache)
   */
  getUtilisateurPhotoUrl(utilisateur: Utilisateur): string {
    if (!utilisateur.id) return this.defaultImage;
    
    // Vérifier si l'image est déjà dans le cache local
    if (this.imageUrls.has(utilisateur.id)) {
      return this.imageUrls.get(utilisateur.id)!;
    }
    
    // Si l'utilisateur a une photo, charger l'image depuis le backend
    if (utilisateur.photo) {
      const imageUrl = `${this.apiUrl}/utilisateurs/${utilisateur.id}/photo`;
      this.imageCache.getImage(imageUrl, this.defaultImage).subscribe(objectUrl => {
        this.imageUrls.set(utilisateur.id!, objectUrl);
      });
      // Retourner l'image par défaut en attendant le chargement
      return this.defaultImage;
    }
    
    return this.defaultImage;
  }

  /**
   * Ouvre le modal d'aperçu d'image
   */
  onViewImage(utilisateur: Utilisateur): void {
    const src = this.getUtilisateurPhotoUrl(utilisateur);
    this.dialog.open(ImagePreviewDialogComponent, {
      data: { src, title: utilisateur.nom || 'Utilisateur' },
      panelClass: ['dialog-dark-theme', 'image-preview-dialog-content'],
      maxWidth: '90vw',
      width: '680px'
    });
  }

  /**
   * Gestion des erreurs d'image
   */
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.defaultImage;
  }

  /**
   * Nettoyage lors de la destruction du composant
   */
  ngOnDestroy(): void {
    // Libérer les ObjectURLs pour éviter les fuites mémoire
    this.imageUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.imageUrls.clear();
  }
}
