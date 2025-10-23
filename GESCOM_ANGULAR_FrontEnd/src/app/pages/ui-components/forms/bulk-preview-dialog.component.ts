import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

export interface BulkPreviewRow {
  name: string;
  description: string;
  price: number;
  quantity: number;
  category_id: number;
  supplier_id: number;
}

export interface BulkPreviewData {
  rows: BulkPreviewRow[];
  categories: { id: number; name: string }[];
  suppliers: { id: number; name: string }[];
}

@Component({
  selector: 'app-bulk-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule],
  template: `
    <h2 mat-dialog-title>Aperçu des produits ({{ data.rows.length }})</h2>
    <div mat-dialog-content>
      <div class="table-responsive">
        <table mat-table [dataSource]="data.rows" class="mat-elevation-z1 w-100">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef> Nom </th>
            <td mat-cell *matCellDef="let r"> {{ r.name }} </td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef> Prix (€) </th>
            <td mat-cell *matCellDef="let r"> {{ r.price | number: '1.2-2' }} </td>
          </ng-container>
          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef> Qté </th>
            <td mat-cell *matCellDef="let r"> {{ r.quantity }} </td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef> Catégorie </th>
            <td mat-cell *matCellDef="let r"> {{ resolveCategory(r.category_id) }} </td>
          </ng-container>
          <ng-container matColumnDef="supplier">
            <th mat-header-cell *matHeaderCellDef> Fournisseur </th>
            <td mat-cell *matCellDef="let r"> {{ resolveSupplier(r.supplier_id) }} </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
      <div class="m-t-8 text-muted">
        Vérifiez les informations avant d'enregistrer. Les photos ne sont pas incluses en mode multiple.
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button (click)="dialogRef.close(false)">Annuler</button>
      <button mat-flat-button color="primary" (click)="dialogRef.close(true)">Confirmer et enregistrer</button>
    </div>
  `,
})
export class BulkPreviewDialogComponent {
  displayedColumns = ['name', 'price', 'quantity', 'category', 'supplier'];

  constructor(
    public dialogRef: MatDialogRef<BulkPreviewDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: BulkPreviewData
  ) {}

  resolveCategory(id: number): string {
    const c = this.data.categories.find((x) => x.id === id);
    return c ? c.name : `#${id}`;
    }

  resolveSupplier(id: number): string {
    const s = this.data.suppliers.find((x) => x.id === id);
    return s ? s.name : `#${id}`;
  }
}
