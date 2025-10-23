import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ClientsService } from '../../../services/gescom/clients.service';
import { Client } from '../../../interfaces/gescom/client.model';
import { GenericTableComponent, GenericTableColumn } from '../../ui-components/tables/generic-table.component';
import { MatDialog } from '@angular/material/dialog';
import { EditEntityDialogComponent, EditFieldConfig } from '../../ui-components/tables/edit-entity-dialog.component';
import { of } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-clients-list',
  template: `
  <app-generic-table
    [title]="'Table Clients'"
    [data]="dataSource.data"
    [columns]="clientColumns"
    [defaultSort]="{ active: 'created_at', direction: 'desc' }"
    [selectionEnabled]="true"
    [displayedActions]="true"
    (view)="openView($event)"
    [enableEdit]="true"
    [enableDelete]="true"
    [enableArchive]="false"
    [pageSize]="10"
    [pageSizeOptions]="[5,10,25,50]"
    [searchPlaceholder]="'Rechercher par nom, téléphone...'"
    (edit)="openEdit($event)"
    (del)="delete($event)"
  ></app-generic-table>
  `,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, GenericTableComponent],
})
export class ClientsListComponent implements OnInit {
  displayedColumns = ['nom','telephone','actions'];
  dataSource = new MatTableDataSource<Client>([]);
  searchCtrl = new FormControl('');
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  clientColumns: GenericTableColumn[] = [
    { key: 'created_at', label: 'Créé le', type: 'date', dateFormat: 'short' },
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'telephone', label: 'Téléphone', type: 'text' },
    { key: 'adresse', label: 'Adresse', type: 'text' },
    { key: 'updated_at', label: 'Modifié le', type: 'date', dateFormat: 'short' },
  ];

  constructor(private svc: ClientsService, private dialog: MatDialog) {}
  ngOnInit(): void {
    this.svc.all().subscribe(rows => { this.dataSource.data = rows; if (this.paginator) this.dataSource.paginator = this.paginator; });
    this.searchCtrl.valueChanges.subscribe(()=>this.apply());
  }
  apply(){ const v=(this.searchCtrl.value||'').toLowerCase(); this.dataSource.filterPredicate=(d)=> [d.nom, d.telephone, d.adresse].some(x => (x||'').toLowerCase().includes(v)); this.dataSource.filter=Math.random()+''; }

  delete(row: Client) { /* implement as needed */ }

  openView(row: Client) {
    const fields: EditFieldConfig[] = [
      { key: 'nom', label: 'Nom', type: 'text' },
      { key: 'telephone', label: 'Téléphone', type: 'text' },
      { key: 'adresse', label: 'Adresse', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'created_at', label: 'Créé le', type: 'date' },
    ];
    this.dialog.open(EditEntityDialogComponent, {
      data: { title: 'Détails client', entity: 'Client', value: row, fields, readOnly: true, onSave: () => of(row) },
      width: '720px', panelClass: 'dialog-dark-theme'
    });
  }

  openEdit(row: Client) {
    const fields: EditFieldConfig[] = [
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'telephone', label: 'Téléphone', type: 'text' },
      { key: 'adresse', label: 'Adresse', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ];
    this.dialog.open(EditEntityDialogComponent, {
      data: {
        title: 'Modifier client', entity: 'Client', value: row, fields,
        onSave: (changes: Partial<Client>) => {
          const id = row.id; if (!id) return of(null);
          return Object.keys(changes).length ? this.svc.update(id, changes) : of(row);
        },
      },
      width: '720px', panelClass: 'dialog-dark-theme',
    }).afterClosed().subscribe(res => {
      if (res?.updated) {
        const updated: Client = res.updated; const idx = this.dataSource.data.findIndex(r=>r.id===updated.id);
        if (idx>-1) { this.dataSource.data[idx] = { ...this.dataSource.data[idx], ...updated } as Client; (this.dataSource as any)._updateChangeSubscription?.(); }
      }
    });
  }
}
