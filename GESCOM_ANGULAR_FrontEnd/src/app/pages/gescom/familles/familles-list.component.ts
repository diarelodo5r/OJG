import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FamillesService } from '../../../services/gescom/familles.service';
import { Famille } from '../../../interfaces/gescom/famille.model';
import { GenericTableComponent, GenericTableColumn } from '../../ui-components/tables/generic-table.component';
import { MatDialog } from '@angular/material/dialog';
import { EditEntityDialogComponent, EditFieldConfig } from '../../ui-components/tables/edit-entity-dialog.component';
import { of } from 'rxjs';
import { NotifyService } from '../../../services/notify.service';

@Component({
  standalone: true,
  selector: 'app-familles-list',
  template: `
  <app-generic-table
    [title]="'Table Familles'"
    [data]="dataSource.data"
    [columns]="familleColumns"
    [defaultSort]="{ active: 'created_at', direction: 'desc' }"
    [selectionEnabled]="true"
    [displayedActions]="true"
    [exportFilename]="'GESCOM_Familles'"
    (view)="openView($event)"
    [enableEdit]="true"
    [enableDelete]="true"
    [enableArchive]="false"
    [pageSize]="10"
    [pageSizeOptions]="[5,10,25,50]"
    [searchPlaceholder]="'Rechercher par nom...'"
    (edit)="openEdit($event)"
    (del)="delete($event)"
  ></app-generic-table>
  `,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, GenericTableComponent],
})
export class FamillesListComponent implements OnInit {
  displayedColumns = ['nom_famille','actions'];
  dataSource = new MatTableDataSource<Famille>([]);
  searchCtrl = new FormControl('');
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  familleColumns: GenericTableColumn[] = [
    { key: 'created_at', label: 'Créé le', type: 'date', dateFormat: 'short' },
    { key: 'nom_famille', label: 'Famille', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'updated_at', label: 'Modifié le', type: 'date', dateFormat: 'short' },
  ];

  constructor(
    private familles: FamillesService, 
    private dialog: MatDialog,
    private notify: NotifyService, 
  ) 
  {}
  ngOnInit(): void { this.familles.all().subscribe(rows => { this.dataSource.data = rows; if (this.paginator) this.dataSource.paginator = this.paginator; }); this.searchCtrl.valueChanges.subscribe(()=>this.apply()); }
  apply(){ const v=(this.searchCtrl.value||'').toLowerCase(); this.dataSource.filterPredicate=(d)=> (d.nom_famille||'').toLowerCase().includes(v); this.dataSource.filter=Math.random()+''; }

  delete(row: Famille) { if(!row.id) return; this.notify.confirm({ title: 'Confirmer', text: 'Supprimer cette famille ?' }).then(res=>{ if(!res.isConfirmed) return; this.familles.delete(row.id!).subscribe({ next: ()=>{ this.dataSource.data=this.dataSource.data.filter(f=>f.id!==row.id); this.notify.success('famille supprimée'); }, error: ()=> this.notify.error('Suppression impossible') }); });  }
  
  openView(row: Famille) {
    const fields: EditFieldConfig[] = [
      { key: 'nom_famille', label: 'Famille', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'created_at', label: 'Créé le', type: 'date' },
    ];
    this.dialog.open(EditEntityDialogComponent, {
      data: { title: 'Détails famille', entity: 'Famille', value: row, fields, readOnly: true, onSave: () => of(row) },
      width: '720px', panelClass: 'dialog-dark-theme'
    });
  }

  openEdit(row: Famille) {
    const fields: EditFieldConfig[] = [
      { key: 'nom_famille', label: 'Famille', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ];
    this.dialog.open(EditEntityDialogComponent, {
      data: {
        title: 'Modifier famille', entity: 'Famille', value: row, fields,
        onSave: (changes: Partial<Famille>) => { const id=row.id; if(!id) return of(null); return Object.keys(changes).length ? this.familles.update(id, changes) : of(row); },
      }, width: '720px', panelClass: 'dialog-dark-theme'
    }).afterClosed().subscribe(res => {
      if (res?.updated) { const updated: Famille = res.updated; const idx=this.dataSource.data.findIndex(r=>r.id===updated.id); if(idx>-1){ this.dataSource.data[idx]={...this.dataSource.data[idx],...updated} as Famille; (this.dataSource as any)._updateChangeSubscription?.(); } }
    });
  }
}
