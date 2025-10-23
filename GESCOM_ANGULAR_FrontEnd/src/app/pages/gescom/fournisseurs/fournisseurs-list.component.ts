import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { FournisseursService } from '../../../services/gescom/fournisseurs.service';
import { ArticlesService } from '../../../services/gescom/articles.service';
import { Fournisseur } from '../../../interfaces/gescom/fournisseur.model';
import { GenericTableComponent, GenericTableColumn, ColumnTemplateDirective } from '../../ui-components/tables/generic-table.component';
import { MatDialog } from '@angular/material/dialog';
import { EditEntityDialogComponent, EditFieldConfig } from '../../ui-components/tables/edit-entity-dialog.component';
import { of, Observable } from 'rxjs';
import { NotifyService } from '../../../services/notify.service';

@Component({
  standalone: true,
  selector: 'app-fournisseurs-list',
  template: `
  <app-generic-table
    #fournisseursTable
    [title]="'Table Fournisseurs'"
    [columns]="fournisseurColumns"
    [filters]="fournisseurFilters"
    [selectionEnabled]="true"
    [displayedActions]="true"
    [enableEdit]="true"
    [enableDelete]="true"
    [enableArchive]="false"
    [pageSize]="10"
    [pageSizeOptions]="[5,10,25,50]"
    [searchPlaceholder]="'Rechercher par nom, téléphone...'"
    [dataLoader]="dataLoader"
    [exportFilename]="'GESCOM_Fournisseurs'"
    (view)="openView($event)"
    (edit)="openEdit($event)"
    (del)="delete($event)"
    (rowsLoaded)="onRowsLoaded($event)"
    (loadError)="onLoadError($event)"
  >
    <ng-template columnTemplate="article_id" let-row>
      <span class="fw-semibold">{{ row.article?.nom_article || 'N/A' }}</span>
    </ng-template>
  </app-generic-table>
  `,
  imports: [CommonModule, MaterialModule, GenericTableComponent, ColumnTemplateDirective],
})
export class FournisseursListComponent {
  @ViewChild('fournisseursTable') table?: GenericTableComponent;
  rows: Fournisseur[] = [];

  fournisseurColumns: GenericTableColumn[] = [
    { key: 'created_at', label: 'Créé le', type: 'date', dateFormat: 'short' },
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'telephone', label: 'Téléphone', type: 'text' },
    { key: 'adresse', label: 'Adresse', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'article_id', label: 'Article', type: 'custom' },
    { key: 'prixArticle', label: 'Prix achat (XOF)', type: 'number', align: 'end' },
    { key: 'updated_at', label: 'Modifié le', type: 'date', dateFormat: 'short' },
  ];
  fournisseurFilters: Array<{ key: string; label: string; type?: any; dataPath?: string; filterPath?: string }> = [
    { 
      key: 'article_id', 
      label: 'Article', 
      type: 'select',
      dataPath: 'article.nom_article', // Afficher le nom de l'article
      filterPath: 'article_id' // Filtrer par l'ID de l'article
    },
    { 
      key: 'nom', 
      label: 'Nom fournisseur', 
      type: 'select',
      dataPath: 'nom', 
      filterPath: 'nom' 
    },
  ];

  constructor(
    private fournisseurs: FournisseursService, 
    private articlesService: ArticlesService,
    private dialog: MatDialog,
    private notify: NotifyService, 
  ) {}

  readonly dataLoader = (): Observable<Fournisseur[]> => this.fournisseurs.all();

  onRowsLoaded(rows: Fournisseur[]): void {
    this.rows = rows;
  }

  onLoadError(error: any): void {
    console.error('Failed to load suppliers:', error);
    this.notify.error('Impossible de charger les fournisseurs');
  }

  refreshTable(): void {
    this.table?.reload();
  }

  delete(row: Fournisseur) {
    if (!row.id) return;
    this.notify.confirm({ title: 'Confirmer', text: 'Supprimer ce fournisseur ?' }).then(res => {
      if (!res.isConfirmed) return;
      this.fournisseurs.delete(row.id!).subscribe({
        next: () => {
          this.notify.success('Fournisseur supprimé');
          this.refreshTable();
        },
        error: () => this.notify.error('Suppression impossible')
      });
    });
  }

  openView(row: Fournisseur) {
    const fields: EditFieldConfig[] = [
      { key: 'nom', label: 'Nom du fournisseur', type: 'text' },
      { key: 'telephone', label: 'Téléphone', type: 'text' },
      { key: 'adresse', label: 'Adresse', type: 'text' },
      { key: 'article_nom', label: 'Article fourni', type: 'text', value: row.article?.nom_article || 'N/A' },
      { key: 'prixArticle', label: 'Prix d\'achat (XOF)', type: 'number' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'created_at', label: 'Créé le', type: 'date' },
      { key: 'updated_at', label: 'Modifié le', type: 'date' },
    ];
    this.dialog.open(EditEntityDialogComponent, {
      data: { title: 'Détails fournisseur', entity: 'Fournisseur', value: row, fields, readOnly: true, onSave: () => of(row) },
      width: '720px', panelClass: 'dialog-dark-theme'
    });
  }

  openEdit(row: Fournisseur) {
    // Charger les articles pour le select
    this.articlesService.all().subscribe(articles => {
      const fields: EditFieldConfig[] = [
        { key: 'nom', label: 'Nom du fournisseur', type: 'text', required: true, placeholder: 'Entrez le nom du fournisseur' },
        { key: 'telephone', label: 'Téléphone', type: 'text', placeholder: 'Ex: +221 77 123 45 67' },
        { key: 'adresse', label: 'Adresse', type: 'text', placeholder: 'Adresse complète du fournisseur' },
        { 
          key: 'article_id', 
          label: 'Article fourni', 
          type: 'select-create',
          options: articles.map(a => ({ label: a.nom_article, value: a.id })),
          allowCreate: true,
          createPrompt: 'Créer un nouvel article',
          onCreate: (nom: string) => this.articlesService.create({ 
            nom_article: nom, 
            famille_id: 1,
            quantite_standard: 100
          })
        },
        { 
          key: 'prixArticle', 
          label: 'Prix d\'achat (XOF)', 
          type: 'number', 
          min: 0, 
          step: 0.01,
          required: true,
          placeholder: 'Prix d\'achat unitaire'
        },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Informations supplémentaires...' },
      ];
      
      this.dialog.open(EditEntityDialogComponent, {
        data: {
          title: 'Modifier fournisseur', 
          entity: 'Fournisseur', 
          value: row, 
          fields,
          onSave: (changes: Partial<Fournisseur>) => {
            const id = row.id; 
            if (!id) return of(null);
            return Object.keys(changes).length ? this.fournisseurs.update(id, changes) : of(row);
          },
        },
        width: '720px', 
        panelClass: 'dialog-dark-theme',
      }).afterClosed().subscribe(res => {
        if (res?.updated) {
          this.refreshTable();
        }
      });
    });
  }
}
