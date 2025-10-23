import { Component, OnInit, ViewChild } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { Supplier } from '../../../models/product.interface';
import { ProductService } from '../../../services/product.service';
import { NotifyService } from '../../../services/notify.service';
import { SupplierDetailDialogComponent } from './supplier-detail-dialog.component';
import { EditSupplierDialogComponent } from './edit-supplier-dialog.component';
import { AddSupplierDialogComponent } from './add-supplier-dialog.component';

@Component({
  selector: 'app-suppliers',
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
    MatSelectModule,
    MatCheckboxModule,
  ],
  templateUrl: './suppliers.component.html',
})
export class SuppliersComponent implements OnInit {
  displayedColumns: string[] = ['select', 'id', 'name', 'contact_email', 'contact_phone', 'address', 'created_at', 'actions'];
  dataSource = new MatTableDataSource<Supplier>([]);

  filterValue = '';
  // Filtres avancés
  emailDomain: string = '';
  hasPhone: 'all' | 'yes' | 'no' = 'all';
  creating = false;
  editRowId: number | null = null;

  createForm!: FormGroup;
  editForm!: FormGroup;

  loading = false;
  selection = new SelectionModel<Supplier>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductService,
    private fb: FormBuilder,
    private notify: NotifyService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      contact_email: [''],
      contact_phone: [''],
      address: [''],
    });
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      contact_email: [''],
      contact_phone: [''],
      address: [''],
    });
    this.loadSuppliers();
    // Étendre le prédicat pour email domain + has phone
    const baseFilter = this.dataSource.filterPredicate;
    this.dataSource.filterPredicate = (data: Supplier, filter: string) => {
      try {
        const f = JSON.parse(filter || '{}');
        const text = (f.text || '').toString();
        let ok = true;
        if (text) {
          const t = text.toLowerCase();
          ok = (data.name || '').toLowerCase().includes(t)
            || (data.contact_email || '').toLowerCase().includes(t)
            || (data.address || '').toLowerCase().includes(t);
        }
        if (!ok) return false;
        if (f.domain) {
          const em = (data.contact_email || '').toLowerCase();
          if (!em.includes(String(f.domain).toLowerCase())) return false;
        }
        if (f.hasPhone && f.hasPhone !== 'all') {
          const has = !!(data.contact_phone && String(data.contact_phone).trim());
          if (f.hasPhone === 'yes' && !has) return false;
          if (f.hasPhone === 'no' && has) return false;
        }
        return true;
      } catch {
        return baseFilter ? baseFilter.call(this.dataSource, data, filter) : true;
      }
    };
  }

  // Multi-select helpers
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

  toggleAllRows(): void { this.masterToggle(); }

  checkboxLabel(row?: Supplier): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`;
  }

  deleteSelected(): void {
    const selected = this.selection.selected;
    if (!selected.length) return;
    this.notify
      .confirm({ title: 'Supprimer la sélection', text: `Supprimer ${selected.length} fournisseur(s) ?` })
      .then((res) => {
        if (!res.isConfirmed) return;
        const ids = selected.map(s => s.id).filter((id): id is number => typeof id === 'number');
        if (!ids.length) return;
        let success = 0; let done = 0;
        ids.forEach((id) => {
          this.productService.deleteSupplier(id).subscribe({
            next: () => { success++; },
            complete: () => {
              done++;
              if (done === ids.length) {
                this.dataSource.data = this.dataSource.data.filter(s => !ids.includes(s.id!));
                this.selection.clear();
                if (success) this.notify.successToast(`${success} fournisseur(s) supprimé(s)`);
              }
            }
          });
        });
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(value: string) {
    this.filterValue = value.trim().toLowerCase();
    this.applyAdvancedFilters();
  }

  applyAdvancedFilters(): void {
    const payload = {
      text: this.filterValue,
      domain: this.emailDomain,
      hasPhone: this.hasPhone,
    };
    this.dataSource.filter = JSON.stringify(payload);
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  clearAdvancedFilters(): void {
    this.emailDomain = '';
    this.hasPhone = 'all';
    this.applyAdvancedFilters();
  }

  loadSuppliers() {
    this.loading = true;
    this.productService.getSuppliers().subscribe({
      next: (list) => {
        this.dataSource.data = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notify.error("Erreur lors du chargement des fournisseurs");
      },
    });
  }

  toggleCreate() {
    this.creating = !this.creating;
    if (!this.creating) this.createForm.reset();
  }

  openCreateSupplier() {
    const dialogRef = this.dialog.open(AddSupplierDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: ['dialog-dark-theme', 'product-detail-dialog'],
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.created) {
        this.dataSource.data = [result.created, ...this.dataSource.data];
        this.notify.successToast('Fournisseur créé');
      }
    });
  }

  submitCreate() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.notify
      .confirm({ title: 'Confirmer', text: 'Créer ce fournisseur ?' })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.productService.createSupplier(this.createForm.value).subscribe({
          next: (s) => {
            this.notify.success('Fournisseur créé');
            this.dataSource.data = [s, ...this.dataSource.data];
            this.toggleCreate();
          },
          error: () => this.notify.error("Création impossible"),
        });
      });
  }

  startEdit(row: Supplier) {
    const dialogRef = this.dialog.open(EditSupplierDialogComponent, {
      data: { supplier: row },
      width: '700px',
      maxWidth: '95vw',
      panelClass: ['dialog-dark-theme', 'product-detail-dialog'],
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.updated) {
        const updated = result.updated as Supplier;
        const current = [...this.dataSource.data];
        const idx = current.findIndex(s => s.id === updated.id);
        if (idx !== -1) {
          current[idx] = { ...current[idx], ...updated };
          this.dataSource.data = current;
        }
        this.notify.successToast('Fournisseur mis à jour');
      }
    });
  }

  cancelEdit() {
    this.editRowId = null;
    this.editForm.reset();
  }

  saveEdit(row: Supplier) {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const id = row.id!;
    this.notify
      .confirm({ title: 'Confirmer', text: 'Enregistrer les modifications de ce fournisseur ?' })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.productService.updateSupplier(id, this.editForm.value).subscribe({
          next: (updated) => {
            this.notify.success('Fournisseur modifié');
            this.dataSource.data = this.dataSource.data.map((s) => (s.id === id ? updated : s));
            this.cancelEdit();
          },
          error: () => this.notify.error("Mise à jour impossible"),
        });
      });
  }

  delete(row: Supplier) {
    if (!row.id) return;
    this.notify
      .confirm({ title: 'Confirmer', text: `Supprimer le fournisseur "${row.name}" ?` })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.productService.deleteSupplier(row.id!).subscribe({
          next: () => {
            this.notify.success('Fournisseur supprimé');
            this.dataSource.data = this.dataSource.data.filter((s) => s.id !== row.id);
          },
          error: () => this.notify.error("Suppression impossible"),
        });
      });
  }

  viewSupplier(row: Supplier) {
    this.dialog.open(SupplierDetailDialogComponent, {
      data: { supplier: row },
      width: '650px',
      maxWidth: '95vw',
      panelClass: ['dialog-dark-theme', 'product-detail-dialog'],
      autoFocus: false,
    });
  }
}
