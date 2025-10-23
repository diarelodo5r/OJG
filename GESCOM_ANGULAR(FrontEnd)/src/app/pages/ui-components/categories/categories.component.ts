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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { ProductCategory } from '../../../models/product.interface';
import { ProductService } from '../../../services/product.service';
import { NotifyService } from '../../../services/notify.service';
import { CategoryDetailDialogComponent } from './category-detail-dialog.component';
import { EditCategoryDialogComponent } from './edit-category-dialog.component';
import { AddCategoryDialogComponent } from './add-category-dialog.component';

@Component({
  selector: 'app-categories',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
  ],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit {
  displayedColumns: string[] = ['select', 'id', 'name', 'description', 'created_at', 'actions'];
  dataSource = new MatTableDataSource<ProductCategory>([]);

  filterValue = '';
  // Filtres avancés
  initialLetter: string = 'all';
  createdFrom?: Date;
  createdTo?: Date;
  creating = false;
  editRowId: number | null = null;

  createForm!: FormGroup;
  editForm!: FormGroup;

  loading = false;
  selection = new SelectionModel<ProductCategory>(true, []);

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
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
    });
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
    });
    this.loadCategories();
    // Étendre le prédicat pour intégrer lettre initiale et date de création
    const baseFilter = this.dataSource.filterPredicate;
    this.dataSource.filterPredicate = (data: ProductCategory, filter: string) => {
      try {
        const f = JSON.parse(filter || '{}');
        const text = (f.text || '').toString();
        let ok = true;
        if (text) {
          const t = text.toLowerCase();
          ok = (data.name || '').toLowerCase().includes(t)
            || (data.description || '').toLowerCase().includes(t);
        }
        if (!ok) return false;
        if (f.initial && f.initial !== 'all') {
          const first = (data.name || '').charAt(0).toLowerCase();
          if (first !== String(f.initial).toLowerCase()) return false;
        }
        if (f.from || f.to) {
          const created = data.created_at ? new Date(data.created_at as any) : undefined;
          if (created) {
            if (f.from && created < new Date(f.from)) return false;
            if (f.to) {
              const to = new Date(f.to);
              // include entire end day
              to.setHours(23,59,59,999);
              if (created > to) return false;
            }
          }
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

  checkboxLabel(row?: ProductCategory): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`;
  }

  deleteSelected(): void {
    const selected = this.selection.selected;
    if (!selected.length) return;
    this.notify
      .confirm({ title: 'Supprimer la sélection', text: `Supprimer ${selected.length} catégorie(s) ?` })
      .then((res) => {
        if (!res.isConfirmed) return;
        const ids = selected.map(c => c.id).filter((id): id is number => typeof id === 'number');
        if (!ids.length) return;
        let success = 0; let done = 0;
        ids.forEach((id) => {
          this.productService.deleteCategory(id).subscribe({
            next: () => { success++; },
            complete: () => {
              done++;
              if (done === ids.length) {
                this.dataSource.data = this.dataSource.data.filter(c => !ids.includes(c.id!));
                this.selection.clear();
                if (success) this.notify.successToast(`${success} catégorie(s) supprimée(s)`);
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
      initial: this.initialLetter,
      from: this.createdFrom ? this.createdFrom.toISOString() : null,
      to: this.createdTo ? this.createdTo.toISOString() : null,
    };
    this.dataSource.filter = JSON.stringify(payload);
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  clearAdvancedFilters(): void {
    this.initialLetter = 'all';
    this.createdFrom = undefined;
    this.createdTo = undefined;
    this.applyAdvancedFilters();
  }

  loadCategories() {
    this.loading = true;
    this.productService.getCategories().subscribe({
      next: (list) => {
        this.dataSource.data = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notify.error("Erreur lors du chargement des catégories");
      },
    });
  }

  toggleCreate() {
    this.creating = !this.creating;
    if (!this.creating) this.createForm.reset();
  }

  openCreateCategory() {
    const dialogRef = this.dialog.open(AddCategoryDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: ['dialog-dark-theme', 'product-detail-dialog'],
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.created) {
        this.dataSource.data = [result.created, ...this.dataSource.data];
        this.notify.successToast('Catégorie créée');
      }
    });
  }

  submitCreate() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.notify
      .confirm({ title: 'Confirmer', text: 'Créer cette catégorie ?' })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.productService.createCategory(this.createForm.value).subscribe({
          next: (c) => {
            this.notify.success('Catégorie créée');
            this.dataSource.data = [c, ...this.dataSource.data];
            this.toggleCreate();
          },
          error: () => this.notify.error("Création impossible"),
        });
      });
  }

  startEdit(row: ProductCategory) {
    const dialogRef = this.dialog.open(EditCategoryDialogComponent, {
      data: { category: row },
      width: '700px',
      maxWidth: '95vw',
      panelClass: ['dialog-dark-theme', 'product-detail-dialog'],
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.updated) {
        const updated = result.updated as ProductCategory;
        const current = [...this.dataSource.data];
        const idx = current.findIndex(c => c.id === updated.id);
        if (idx !== -1) {
          current[idx] = { ...current[idx], ...updated };
          this.dataSource.data = current;
        }
        this.notify.successToast('Catégorie mise à jour');
      }
    });
  }

  cancelEdit() {
    this.editRowId = null;
    this.editForm.reset();
  }

  saveEdit(row: ProductCategory) {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const id = row.id!;
    this.notify
      .confirm({ title: 'Confirmer', text: 'Enregistrer les modifications de cette catégorie ?' })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.productService.updateCategory(id, this.editForm.value).subscribe({
          next: (updated) => {
            this.notify.success('Catégorie modifiée');
            this.dataSource.data = this.dataSource.data.map((c) => (c.id === id ? updated : c));
            this.cancelEdit();
          },
          error: () => this.notify.error("Mise à jour impossible"),
        });
      });
  }

  delete(row: ProductCategory) {
    if (!row.id) return;
    this.notify
      .confirm({ title: 'Confirmer', text: `Supprimer la catégorie "${row.name}" ?` })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.productService.deleteCategory(row.id!).subscribe({
          next: () => {
            this.notify.success('Catégorie supprimée');
            this.dataSource.data = this.dataSource.data.filter((c) => c.id !== row.id);
          },
          error: () => this.notify.error("Suppression impossible"),
        });
      });
  }

  viewCategory(row: ProductCategory) {
    this.dialog.open(CategoryDetailDialogComponent, {
      data: { category: row },
      width: '650px',
      maxWidth: '95vw',
      panelClass: ['dialog-dark-theme', 'product-detail-dialog'],
      autoFocus: false,
    });
  }
}
