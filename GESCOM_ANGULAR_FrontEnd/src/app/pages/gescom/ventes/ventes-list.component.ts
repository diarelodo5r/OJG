import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { VentesService } from '../../../services/gescom/ventes.service';
import { ClientsService } from '../../../services/gescom/clients.service';
import { Vente } from '../../../interfaces/gescom/vente.model';
import { RouterModule } from '@angular/router';
import { GenericTableComponent, GenericTableColumn, GenericColumnType, ColumnTemplateDirective } from '../../ui-components/tables/generic-table.component';
import { MatDialog } from '@angular/material/dialog';
import { EditEntityDialogComponent, EditFieldConfig } from '../../ui-components/tables/edit-entity-dialog.component';
import { of, Observable, switchMap, map } from 'rxjs';
import { NotifyService } from '../../../services/notify.service';

@Component({
  standalone: true,
  selector: 'app-ventes-list',
  templateUrl: './ventes-list.component.html',
  styleUrls: ['./ventes-list.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, RouterModule, GenericTableComponent, ColumnTemplateDirective],
})
export class VentesListComponent {
  @ViewChild('ventesTable') table?: GenericTableComponent;
  rows: Vente[] = [];
  // displayedColumns = ['created_at', 'nom_article_snapshot', 'client_id', 'quantite', 'montant', 'actions'];

  venteColumns: GenericTableColumn[] = [
    { key: 'created_at', label: 'Date', type: 'date', dateFormat: 'short' },
    { key: 'nom_article_snapshot', label: 'Article', type: 'text' },
    { key: 'nom_famille_snapshot', label: 'Famille', type: 'select' },
    { key: 'client', label: 'Client', type: 'custom', searchPath: 'client.nom' },
    { key: 'lot_snapshot', label: 'Lot', type: 'text' },
    { key: 'reference_snapshot', label: 'Réf.', type: 'text' },
    { key: 'quantite', label: 'Qté', type: 'number', align: 'end' },
    { key: 'prix_vente_snapshot', label: 'P.U. (XOF)', type: 'number', align: 'end' },
    { key: 'montant', label: 'Montant (XOF)', type: 'custom', align: 'end' },
    { key: 'nom_fournisseur_snapshot', label: 'Fournisseur', type: 'select' },
  ];

  venteFilters: Array<{ key: string; label: string; type?: GenericColumnType; dataPath?: string; filterPath?: string }> = [
    { 
      key: 'nom_article_snapshot', 
      label: 'Article', 
      type: 'select',
      dataPath: 'nom_article_snapshot',
      filterPath: 'nom_article_snapshot'
    },
    { 
      key: 'nom_famille_snapshot', 
      label: 'Famille', 
      type: 'select',
      dataPath: 'nom_famille_snapshot',
      filterPath: 'nom_famille_snapshot'
    },
    { 
      key: 'client_id', 
      label: 'Client', 
      type: 'select',
      dataPath: 'client.nom',
      filterPath: 'client_id'
    },
    { 
      key: 'lot_snapshot', 
      label: 'N° Lot', 
      type: 'select',
      dataPath: 'lot_snapshot',
      filterPath: 'lot_snapshot'
    },
    { 
      key: 'reference_snapshot', 
      label: 'Référence', 
      type: 'select',
      dataPath: 'reference_snapshot',
      filterPath: 'reference_snapshot'
    },
    { 
      key: 'nom_fournisseur_snapshot', 
      label: 'Fournisseur', 
      type: 'select',
      dataPath: 'nom_fournisseur_snapshot',
      filterPath: 'nom_fournisseur_snapshot'
    },
  ];

  constructor(
    private ventes: VentesService, 
    private dialog: MatDialog,
    private notify: NotifyService,
    private clients: ClientsService
  ) {}
  
  readonly dataLoader = (): Observable<Vente[]> => this.ventes.all().pipe(
    switchMap((ventes) =>
      !ventes.length
        ? of(ventes)
        : this.clients.all().pipe(
            map((clients) => {
              const clientMap = new Map(clients.map((client) => [client.id, client]));

              return ventes.map((vente) => ({
                ...vente,
                client: vente.client ?? (vente.client_id ? clientMap.get(vente.client_id) : undefined),
              }));
            })
          )
    )
  );

  /**
   * Formate le prix en CFA (complet)
   * Utilise la méthode du service pour cohérence
   */
  formatPrice(price: number | string | null | undefined): string {
    return this.ventes.formatPrice(price);
  }

  /**
   * Formate le prix de façon simplifiée (style YouTube: K, M, B)
   * Utilise la méthode du service pour cohérence
   */
  formatPriceShort(price: number | string | null | undefined): string {
    return this.ventes.formatPriceShort(price);
  }

  refreshTable(): void {
    this.table?.reload();
  }

  onRowsLoaded(rows: Vente[]): void {
      this.rows = rows;
    }

  delete(row: Vente) {
    if (!row.id) return;
    this.notify
      .confirm({ title: 'Confirmer la suppression', text: `Supprimer cette vente ?\nArticle: ${row.nom_article_snapshot}\nMontant: ${this.formatPrice(row.montant)}` })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.ventes.delete(row.id!).subscribe({
          next: () => {
            this.notify.success('Vente supprimée avec succès');
            this.refreshTable();
          },
          error: (err) => {
            console.error('Erreur lors de la suppression:', err);
            this.notify.error('Impossible de supprimer la vente');
          }
        });
      });
  }
  archive(row: Vente) {
    // TODO: implement archive flow via backend when available
    console.log('Archive vente', row.id);
    this.notify.info('Fonctionnalité d\'archivage en cours de développement');
  }

  /**
   * Ouvre le modal d'édition pour modifier une vente
   * Permet uniquement la modification du client et de la description
   * Les snapshots (article, prix, quantité, montant) ne sont pas modifiables pour conserver l'historique
   */
  openEdit(row: Vente) {
    if (!row.id) return;

    // Charger la liste des clients pour le select
    this.clients.all().subscribe({
      next: (clientsList) => {
        const fields: EditFieldConfig[] = [
          { 
            key: 'client_id', 
            label: 'Client', 
            type: 'select',
            required: true,
            options: clientsList.map(c => ({ value: c.id, label: c.nom })),
            value: row.client_id
          },
          { 
            key: 'description', 
            label: 'Description / Notes', 
            type: 'textarea',
            placeholder: 'Ajoutez des notes ou une description pour cette vente...'
          },
        ];

        const dialogRef = this.dialog.open(EditEntityDialogComponent, {
          data: {
            title: 'Modifier la vente',
            subtitle: `Article: ${row.nom_article_snapshot} | Quantité: ${row.quantite} | Montant: ${this.formatPrice(row.montant)}`,
            entity: 'Vente',
            value: { 
              ...row,
              client_id: row.client_id,
              description: row.description || ''
            },
            fields,
            readOnly: false,
            onSave: (updatedData: Partial<Vente>) => {
              // Préparer les données pour l'API (seulement client_id et description)
              const updatePayload: any = {};
              if (updatedData.client_id !== undefined) updatePayload.client_id = updatedData.client_id;
              if (updatedData.description !== undefined) updatePayload.description = updatedData.description;

              console.log('[VentesList] Updating vente with payload:', updatePayload);
              return this.ventes.update(row.id!, updatePayload);
            },
          },
          width: '600px',
          panelClass: 'dialog-dark-theme',
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.notify.success('Vente modifiée avec succès');
            this.refreshTable();
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des clients:', err);
        this.notify.error('Impossible de charger la liste des clients');
      }
    });
  }
  onLoadError(error: any): void {
    console.error('Failed to load Sells:', error);
    this.notify.error('Impossible de charger les ventes');
  }

  /**
   * Affiche tous les détails d'une vente en lecture seule
   * Inclut tous les snapshots capturés lors de la création
   */
  openView(row: Vente) {
    const fields: EditFieldConfig[] = [
      { key: 'created_at', label: 'Date de création', type: 'date' },
      { key: 'updated_at', label: 'Dernière modification', type: 'date' },
      { key: 'nom_article_snapshot', label: 'Article', type: 'text' },
      { key: 'nom_famille_snapshot', label: 'Famille', type: 'text' },
      { key: 'client', label: 'Client', type: 'text', value: row.client?.nom || 'N/A' },
      { key: 'quantite', label: 'Quantité vendue', type: 'number' },
      { key: 'montant', label: 'Montant total (XOF)', type: 'number', suffix: 'CFA' },
      { key: 'prix_vente_snapshot', label: 'Prix de vente unitaire', type: 'number', suffix: 'CFA' },
      { key: 'prix_achat_snapshot', label: 'Prix d\'achat (snapshot)', type: 'number', suffix: 'CFA' },
      { key: 'nom_fournisseur_snapshot', label: 'Fournisseur', type: 'text' },
      { key: 'lot_snapshot', label: 'N° Lot', type: 'text' },
      { key: 'reference_snapshot', label: 'Référence', type: 'text' },
      { key: 'conditionnement_snapshot', label: 'Conditionnement', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ];

    this.dialog.open(EditEntityDialogComponent, {
      data: {
        title: 'Détails de la vente',
        entity: 'Vente',
        value: row,
        fields,
        readOnly: true,
        onSave: () => of(row)
      },
      width: '800px',
      panelClass: 'dialog-dark-theme',
    });
  }
}
