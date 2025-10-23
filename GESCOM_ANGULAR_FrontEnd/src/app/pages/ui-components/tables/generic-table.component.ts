import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, AfterViewInit, ChangeDetectorRef, ContentChildren, QueryList, TemplateRef, Directive, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SelectionModel } from '@angular/cdk/collections';
import { MaterialModule } from '../../../material.module';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ExportService, ExportColumn } from '../../../services/export.service';
import Swal from 'sweetalert2';

export type GenericColumnType = 'text' | 'number' | 'date' | 'custom' | 'select';

export interface GenericTableColumn {
  key: string;
  label: string;
  type?: GenericColumnType;
  dateFormat?: string; // e.g. 'short', 'mediumDate'
  align?: 'start' | 'center' | 'end';
  searchPath?: string; // optional path for global search value extraction
}

@Directive({
  selector: '[columnTemplate]',
  standalone: true
})
export class ColumnTemplateDirective {
  @Input() columnTemplate!: string;
  constructor(public template: TemplateRef<any>) {}
}

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, MatTableModule, MatPaginatorModule, MatSortModule, MatProgressSpinnerModule],
  template: `
    <div class="row">
      <div class="col-12">
        <mat-card class="cardWithShadow">
          <mat-card-header>
            <mat-card-title>{{ title }}</mat-card-title>
          </mat-card-header>
          <mat-card-content class="b-t-5 p-4">
          <mat-form-field appearance="outline" class="w-100 mb-3">
              <mat-label>{{ searchPlaceholder }}</mat-label>
              <input matInput [formControl]="searchCtrl" [placeholder]="searchPlaceholder" />
              <button *ngIf="searchCtrl.value" matSuffix mat-icon-button aria-label="Effacer" (click)="searchCtrl.setValue('')">
                <mat-icon>close</mat-icon>
              </button>
            </mat-form-field>
            <div class="table-header d-flex align-items-center justify-content-between mb-3">
              <div class="d-flex align-items-center gap-2">
                <mat-form-field *ngIf="columnToggleEnabled" appearance="outline" class="m-0" style="min-width: 220px;">
                  <mat-label>Colonnes</mat-label>
                  <mat-select [value]="visibleColumnKeys" multiple (selectionChange)="onToggleColumns($event.value)">
                    <mat-option *ngFor="let c of columns" [value]="c.key">{{ c.label }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <!-- Key filters -->
            <div *ngIf="filters?.length" class="d-flex flex-wrap gap-2 mb-2" [formGroup]="filterForm">
              <ng-container *ngFor="let f of filters">
                <mat-form-field appearance="outline" style="min-width: 200px;">
                  <mat-label>{{ f.label }}</mat-label>
                  <input *ngIf="(f.type||'text')==='text'" matInput [formControlName]="f.key" />
                  <input *ngIf="(f.type||'text')==='number'" type="number" matInput [formControlName]="f.key" />
                  <input *ngIf="(f.type||'text')==='date'" type="date" matInput [formControlName]="f.key" />
                  <mat-select *ngIf="(f.type||'text')==='select'" [formControlName]="f.key">
                    <mat-option [value]="''">Tous</mat-option>
                    <mat-option *ngFor="let opt of getFilterOptions(f.key)" [value]="opt.value">{{ opt.label }}</mat-option>
                  </mat-select>
                  <button *ngIf="filterForm.get(f.key)?.value" matSuffix mat-icon-button (click)="filterForm.get(f.key)?.setValue(''); $event.stopPropagation();"><mat-icon>close</mat-icon></button>
                </mat-form-field>
              </ng-container>
            </div>

            <!-- Action buttons section -->
            <div class="table-actions-section mb-3">
              <ng-content select="[table-actions]"></ng-content>
            </div>

            <!-- Export buttons -->
            <div *ngIf="exportEnabled" class="export-section mb-3">
              <div class="d-flex flex-wrap gap-2 align-items-center">
                <button mat-raised-button (click)="showExportOptions = !showExportOptions" class="export-toggle-btn">
                  <mat-icon>download</mat-icon>
                  {{ showExportOptions ? 'Masquer exports' : 'Exporter les données' }}
                </button>
                
                <div *ngIf="showExportOptions" class="export-buttons-container d-flex flex-wrap gap-2 align-items-center">
                  <div class="export-divider"></div>
                  
                  <!-- Export filtered data -->
                  <div class="export-group">
                    <span class="export-label">Données filtrées:</span>
                    <button mat-stroked-button color="warn" (click)="exportFiltered('pdf')" class="export-btn">
                      <mat-icon>picture_as_pdf</mat-icon>
                      PDF
                    </button>
                    <button mat-stroked-button style="color: #28a745;" (click)="exportFiltered('excel')" class="export-btn">
                      <mat-icon>table_chart</mat-icon>
                      Excel
                    </button>
                    <button mat-stroked-button color="primary" (click)="exportFiltered('csv')" class="export-btn">
                      <mat-icon>description</mat-icon>
                      CSV
                    </button>
                  </div>
                  
                  <!-- Export selected rows -->
                  <div *ngIf="selectionEnabled && selection.selected.length > 0" class="export-group">
                    <div class="export-divider"></div>
                    <span class="export-label">Lignes sélectionnées ({{ selection.selected.length }}):</span>
                    <button mat-stroked-button color="warn" (click)="exportSelected('pdf')" class="export-btn">
                      <mat-icon>picture_as_pdf</mat-icon>
                      PDF
                    </button>
                    <button mat-stroked-button style="color: #28a745;" (click)="exportSelected('excel')" class="export-btn">
                      <mat-icon>table_chart</mat-icon>
                      Excel
                    </button>
                    <button mat-stroked-button color="primary" (click)="exportSelected('csv')" class="export-btn">
                      <mat-icon>description</mat-icon>
                      CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="table-container mat-elevation-z8">
              <div class="table-loading-overlay" *ngIf="loading">
                <mat-progress-spinner diameter="48" mode="indeterminate"></mat-progress-spinner>
              </div>
              <div class="table-responsive section-gap">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <button *ngIf="selectionEnabled && selection.selected.length > 0" mat-stroked-button color="warn" (click)="onDeleteSelectedClick()">
                    <mat-icon>delete</mat-icon>
                    Supprimer la sélection
                  </button>
                </div>
                <table mat-table [dataSource]="dataSource" matSort [matSortActive]="sortActive" [matSortDirection]="sortDirection" class="w-100">
                <!-- Select Column -->
                <ng-container *ngIf="selectionEnabled" matColumnDef="select">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-checkbox color="primary"
                                  (change)="masterToggle()"
                                  [checked]="isAllSelected()"
                                  [indeterminate]="selection.hasValue() && !isAllSelected()">
                    </mat-checkbox>
                  </th>
                  <td mat-cell *matCellDef="let row">
                    <mat-checkbox color="primary"
                                  (click)="$event.stopPropagation()"
                                  (change)="selection.toggle(row); selectionChange.emit(selection.selected)"
                                  [checked]="selection.isSelected(row)">
                    </mat-checkbox>
                  </td>
                </ng-container>

                <!-- Dynamic Data Columns -->
                <ng-container *ngFor="let c of columns" [matColumnDef]="c.key">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> {{ c.label }} </th>
                  <td mat-cell *matCellDef="let row" [class.text-end]="c.align==='end'" [class.text-center]="c.align==='center'">
                    <ng-container *ngIf="getColumnTemplate(c.key) as template; else defaultCell">
                      <ng-container *ngTemplateOutlet="template; context: { $implicit: row, row: row }"></ng-container>
                    </ng-container>
                    <ng-template #defaultCell>
                      <ng-container [ngSwitch]="c.type || 'text'">
                        <span *ngSwitchCase="'number'"> {{ row[c.key] }} </span>
                        <span *ngSwitchCase="'date'"> {{ row[c.key] | date:(c.dateFormat || 'short') }} </span>
                        <span *ngSwitchDefault 
                              [matTooltip]="shouldShowTooltip(row[c.key]) ? row[c.key] : ''"
                              matTooltipPosition="above"
                              class="text-truncate-cell">
                          {{ truncateText(row[c.key]) }}
                        </span>
                      </ng-container>
                    </ng-template>
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container *ngIf="displayedActions" matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef class="text-end"> Actions </th>
                  <td mat-cell *matCellDef="let row" class="text-end">
                    <button *ngIf="enableView" mat-icon-button (click)="view.emit(row)" matTooltip="Voir">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    <button *ngIf="enableEdit" mat-icon-button color="primary" (click)="edit.emit(row)" matTooltip="Modifier">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button *ngIf="enableDelete" mat-icon-button color="warn" (click)="del.emit(row)" matTooltip="Supprimer">
                      <mat-icon>delete</mat-icon>
                    </button>
                    <button *ngIf="enableArchive" mat-icon-button (click)="archive.emit(row)" matTooltip="Archiver">
                      <mat-icon>archive</mat-icon>
                    </button>
                    <ng-content select="[table-row-actions]"></ng-content>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
              </table>
              </div>
              <mat-paginator [pageSize]="pageSize" [pageSizeOptions]="pageSizeOptions" showFirstLastButtons></mat-paginator>
            </div>

          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .table-header { gap: 8px; }
    
    .table-container {
      background: var(--bs-card-bg, #fff);
      border-radius: 8px;
      overflow: hidden;
      position: relative;
    }
    
    .table-loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.75);
      z-index: 2;
    }

    :host-context(.dark-theme) .table-loading-overlay {
      background: rgba(26, 26, 26, 0.85);
    }

    .table-responsive {
      overflow-x: auto;
      overflow-y: auto;
      max-height: calc(100vh - 300px);
      position: relative;
    }
    
    .section-gap {
      padding: 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    ::ng-deep .mat-mdc-paginator {
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      background: var(--bs-card-bg, #fff);
    }
    
    ::ng-deep .mat-mdc-paginator-outer-container {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      width: 100% !important;
      padding: 8px 16px !important;
    }
    
    ::ng-deep .mat-mdc-paginator-container {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      min-width: 100% !important;
      padding: 0 !important;
    }
    
    ::ng-deep .mat-mdc-paginator-page-size {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }
    
    ::ng-deep .mat-mdc-paginator-range-actions {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }
    
    .text-truncate-cell {
      display: inline-block;
      max-width: 100%;
      cursor: default;
    }
    
    .export-section {
      background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    :host-context(.dark-theme) .export-section {
      background: linear-gradient(135deg, #2a2d35 0%, #1e2028 100%);
      border-color: rgba(255, 255, 255, 0.08);
    }
    
    .export-toggle-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    }
    
    .export-toggle-btn:hover {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
      transform: translateY(-1px);
    }
    
    .export-buttons-container {
      flex: 1;
      padding-left: 8px;
    }
    
    .export-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .export-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #666;
      white-space: nowrap;
    }
    
    :host-context(.dark-theme) .export-label {
      color: #aaa;
    }
    
    .export-divider {
      width: 1px;
      height: 32px;
      background: rgba(0, 0, 0, 0.12);
      margin: 0 8px;
    }
    
    :host-context(.dark-theme) .export-divider {
      background: rgba(255, 255, 255, 0.12);
    }
    
    .export-btn {
      min-width: 90px !important;
      transition: all 0.2s ease;
    }
    
    .export-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  `]
})
export class GenericTableComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() title = 'Liste';
  @Input() data: any[] = [];
  @Input() columns: GenericTableColumn[] = [];
  @Input() selectionEnabled = true;
  @Input() displayedActions = true;
  @Input() enableView = true;
  @Input() enableEdit = true;
  @Input() enableDelete = true;
  @Input() enableArchive = true;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() searchPlaceholder = 'Rechercher...';
  @Input() trackByIdKey = 'id';
  @Input() defaultSort: { active: string; direction: 'asc' | 'desc' } | null = null;
  @Input() columnToggleEnabled = true;
  @Input() filters: Array<{ 
    key: string; 
    label: string; 
    type?: GenericColumnType | string;
    dataPath?: string; // Chemin pour extraire la valeur (ex: 'article.nom_article')
    filterPath?: string; // Chemin pour filtrer (ex: 'article_id')
  }> = [];
  @Input() dataLoader?: () => Observable<any[]>;
  @Input() autoLoadOnInit = true;
  @Input() exportEnabled = true;
  @Input() exportFilename = 'export';
  @Input() exportTitle?: string;

  @Output() view = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() del = new EventEmitter<any>();
  @Output() archive = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() rowsLoaded = new EventEmitter<any[]>();
  @Output() loadError = new EventEmitter<any>();

  @ContentChildren(ColumnTemplateDirective) columnTemplates!: QueryList<ColumnTemplateDirective>;

  dataSource = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);
  searchCtrl = new FormControl('');
  filterForm = new FormGroup({});
  visibleColumnKeys: string[] = [];
  
  // Cache des options de filtres pour éviter les recalculs
  private filterOptionsCache = new Map<string, Array<{ label: string; value: any }>>();
  loading = false;
  private dataLoaderSub?: Subscription;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  showExportOptions = false;

  get displayedColumns(): string[] {
    const base = this.columns.map(c => c.key).filter(k => this.isColumnVisible(k));
    const sel = this.selectionEnabled ? ['select'] : [];
    const act = this.displayedActions ? ['actions'] : [];
    return [...sel, ...base, ...act];
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.visibleColumnKeys = this.columns.map(c => c.key);
    // build filters form
    const group: Record<string, FormControl> = {};
    (this.filters || []).forEach(f => group[f.key] = new FormControl(''));
    this.filterForm = new FormGroup(group);
    this.dataSource.filterPredicate = (row: any, filter: string) => {
      // global search
      const lc = (this.searchCtrl.value || '').toString().trim().toLowerCase();
      const vals = this.columns.map(c => this.getSearchableValue(row, c));
      const matchesGlobal = !lc || vals.some(v => (v + '').toLowerCase().includes(lc));
      // key filters (AND)
      const ff = this.filterForm.value as Record<string, any>;
      const matchesFilters = Object.keys(ff).every(k => {
        const val = ff[k];
        if (val === null || val === undefined || val === '') return true;
        
        const cfg = (this.filters || []).find(f => f.key === k);
        const type = cfg?.type || 'text';
        
        // Utiliser filterPath si défini, sinon key
        const filterPath = cfg?.filterPath || k;
        const cell = this.getNestedValue(row, filterPath);

        if (type === 'number') return Number(cell) === Number(val);
        if (type === 'date') return (cell ? (new Date(cell).toISOString().slice(0,10)) : '') === (val + '');
        if (type === 'select') return this.stringifyValue(cell) === this.stringifyValue(val);
        return this.stringifyValue(cell).toLowerCase().includes(this.stringifyValue(val).toLowerCase());
      });
      return matchesGlobal && matchesFilters;
    };
    this.searchCtrl.valueChanges.subscribe(() => this.applyFilter());
    this.filterForm.valueChanges.subscribe(() => this.applyFilter());

    if (this.dataLoader && this.autoLoadOnInit) {
      this.reload();
    } else {
      this.updateDataSource(this.data || []);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.filterForm) {
      this.updateDataSource(this.data || []);
    }
  }

  ngAfterViewInit(): void {
    // Wire paginator and sort after view init to avoid ExpressionChanged errors
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.dataLoaderSub?.unsubscribe();
  }

  // Fallbacks for strict template bindings
  get sortActive(): string {
    // Use provided default sort active, else pick the first visible data column (excluding select/actions)
    if (this.defaultSort?.active) return this.defaultSort.active;
    const firstDataCol = this.displayedColumns.find(k => k !== 'select' && k !== 'actions');
    return firstDataCol ?? '';
  }

  get sortDirection(): SortDirection {
    // Use provided direction, else default to 'asc' for compatibility
    return (this.defaultSort?.direction ?? 'asc') as SortDirection;
  }

  applyFilter() {
    const val = (this.searchCtrl.value || '').toString();
    this.dataSource.filter = val ? Math.random().toString() : Math.random().toString();
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numRows > 0 && numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.dataSource.data);
    }
    this.selectionChange.emit(this.selection.selected);
  }

  onDeleteSelectedClick(): void {
    this.del.emit(this.selection.selected);
  }

  reload(): void {
    if (!this.dataLoader) {
      return;
    }
    this.dataLoaderSub?.unsubscribe();
    this.loading = true;
    this.dataLoaderSub = this.dataLoader()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (rows) => {
          this.updateDataSource(rows || []);
          this.rowsLoaded.emit(rows ?? []);
        },
        error: (err) => {
          this.loadError.emit(err);
        }
      });
  }

  /**
   * Tronque le texte à 25 caractères maximum
   */
  truncateText(value: any, maxLength: number = 25): string {
    if (value == null) return '';
    const text = String(value);
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Vérifie si le tooltip doit être affiché
   */
  shouldShowTooltip(value: any, maxLength: number = 25): boolean {
    if (value == null) return false;
    return String(value).length > maxLength;
  }

  isColumnVisible(key: string): boolean { return this.visibleColumnKeys.includes(key); }
  onToggleColumns(keys: string[]) { this.visibleColumnKeys = keys; }
  
  getColumnTemplate(key: string): TemplateRef<any> | null {
    if (!this.columnTemplates) return null;
    const directive = this.columnTemplates.find(d => d.columnTemplate === key);
    return directive ? directive.template : null;
  }

  /**
   * Récupère une valeur imbriquée dans un objet (ex: 'article.nom_article')
   */
  private getNestedValue(obj: any, path: string): any {
    if (!path || !obj) return obj;
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  /**
   * Construit le cache des options pour tous les filtres select
   */
  private buildFilterOptionsCache(): void {
    this.filterOptionsCache.clear();
    
    if (!this.dataSource.data || this.dataSource.data.length === 0) return;
    
    // Générer les options pour chaque filtre de type 'select'
    (this.filters || []).forEach(filter => {
      if (filter.type === 'select') {
        // Map pour stocker paires [filterValue -> displayLabel]
        const valueToLabelMap = new Map<any, string>();
        
        this.dataSource.data.forEach(row => {
          // Valeur utilisée pour filtrer (ex: article_id = 1)
          const filterPath = filter.filterPath || filter.key;
          const filterValue = this.getNestedValue(row, filterPath);

          // Valeur affichée (ex: article.nom_article = "Paracétamol")
          const dataPath = filter.dataPath || filter.key;
          const displayValue = this.getNestedValue(row, dataPath);

          if (filterValue !== null && filterValue !== undefined && filterValue !== '') {
            // Utiliser displayValue si disponible, sinon filterValue
            const labelValue = this.stringifyValue(displayValue);
            const label = labelValue ? labelValue : this.stringifyValue(filterValue);

            valueToLabelMap.set(filterValue, label);
          }
        });
        
        // Convertir en tableau d'options triées par label
        const options = Array.from(valueToLabelMap.entries())
          .map(([value, label]) => ({ label, value }))
          .sort((a, b) => a.label.localeCompare(b.label));
        
        this.filterOptionsCache.set(filter.key, options);
      }
    });
  }

  /**
   * Récupère les options pour un filtre select depuis le cache
   */
  getFilterOptions(key: string): Array<{ label: string; value: any }> {
    return this.filterOptionsCache.get(key) || [];
  }

  private updateDataSource(rows: any[]): void {
    const data = Array.isArray(rows) ? [...rows] : [];
    this.selection.clear();
    this.selectionChange.emit(this.selection.selected);
    this.dataSource.data = data;
    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort) this.dataSource.sort = this.sort;
    this.buildFilterOptionsCache();
    this.applyFilter();
    this.cdr.markForCheck();
  }

  private getSearchableValue(row: any, column: GenericTableColumn): string {
    const raw = column.searchPath ? this.getNestedValue(row, column.searchPath) : row?.[column.key];
    return this.stringifyValue(raw);
  }

  private stringifyValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) {
      return value.map(v => this.stringifyValue(v)).filter(Boolean).join(' ');
    }
    if (typeof value === 'object') {
      const hasNom = Object.prototype.hasOwnProperty.call(value, 'nom');
      const hasName = Object.prototype.hasOwnProperty.call(value, 'name');
      const hasLabel = Object.prototype.hasOwnProperty.call(value, 'label');
      if (hasNom) return this.stringifyValue((value as any).nom);
      if (hasName) return this.stringifyValue((value as any).name);
      if (hasLabel) return this.stringifyValue((value as any).label);
      return Object.values(value)
        .map(v => this.stringifyValue(v))
        .filter(Boolean)
        .join(' ');
    }
    return String(value);
  }

  /**
   * Prépare les colonnes pour l'export
   */
  private prepareExportColumns(): ExportColumn[] {
    return this.columns
      .filter(col => this.isColumnVisible(col.key))
      .map(col => ({
        key: col.key,
        label: col.label,
        format: (value: any, row: any) => {
          // Utiliser searchPath si disponible pour extraire la bonne valeur
          const extractedValue = col.searchPath ? this.getNestedValue(row, col.searchPath) : value;
          
          if (col.type === 'date' && extractedValue) {
            const date = new Date(extractedValue);
            return date.toLocaleDateString('fr-FR');
          }
          return this.stringifyValue(extractedValue);
        }
      }));
  }

  /**
   * Exporte les données filtrées actuellement visibles
   */
  async exportFiltered(format: 'pdf' | 'excel' | 'csv'): Promise<void> {
    const filteredData = this.dataSource.filteredData || this.dataSource.data;
    
    if (!filteredData || filteredData.length === 0) {
      alert('Aucune donnée à exporter !');
      return;
    }

    // Demander le nom du fichier
    const customFilename = await this.promptForFilename(this.exportFilename, format);
    if (!customFilename) return; // Annulé par l'utilisateur

    const exportColumns = this.prepareExportColumns();
    const options = {
      filename: customFilename,
      columns: exportColumns,
      data: filteredData,
      title: this.exportTitle || this.title
    };

    switch (format) {
      case 'pdf':
        this.exportService.exportToPDF(options);
        break;
      case 'excel':
        this.exportService.exportToExcel(options);
        break;
      case 'csv':
        this.exportService.exportToCSV(options);
        break;
    }
  }

  /**
   * Exporte uniquement les lignes sélectionnées
   */
  async exportSelected(format: 'pdf' | 'excel' | 'csv'): Promise<void> {
    const selectedData = this.selection.selected;
    
    if (!selectedData || selectedData.length === 0) {
      alert('Aucune ligne sélectionnée !');
      return;
    }

    // Demander le nom du fichier
    const customFilename = await this.promptForFilename(`${this.exportFilename}_selection`, format);
    if (!customFilename) return; // Annulé par l'utilisateur

    const exportColumns = this.prepareExportColumns();
    const options = {
      filename: customFilename,
      columns: exportColumns,
      data: selectedData,
      title: `${this.exportTitle || this.title} (${selectedData.length} ligne${selectedData.length > 1 ? 's' : ''} sélectionnée${selectedData.length > 1 ? 's' : ''})`
    };

    switch (format) {
      case 'pdf':
        this.exportService.exportToPDF(options);
        break;
      case 'excel':
        this.exportService.exportToExcel(options);
        break;
      case 'csv':
        this.exportService.exportToCSV(options);
        break;
    }
  }

  /**
   * Affiche un dialog élégant pour personnaliser le nom du fichier
   */
  private async promptForFilename(defaultName: string, format: string): Promise<string | null> {
    const formatIcons: Record<string, string> = {
      pdf: '📄',
      excel: '📊',
      csv: '📋'
    };

    const formatLabels: Record<string, string> = {
      pdf: 'PDF',
      excel: 'Excel',
      csv: 'CSV'
    };

    const result = await Swal.fire({
      title: `${formatIcons[format]} Exporter en ${formatLabels[format]}`,
      html: `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px; color: #666; font-size: 0.95rem;">
            Personnalisez le nom du fichier avant l'export
          </p>
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
              Nom du fichier:
            </label>
            <input 
              id="filename-input" 
              type="text" 
              class="swal2-input" 
              value="${defaultName}"
              placeholder="Nom du fichier"
              style="width: 100%; margin: 0; padding: 12px; font-size: 1rem;"
            />
          </div>
          <div style="margin-top: 10px; padding: 10px; background: #f0f9ff; border-left: 3px solid #3b82f6; border-radius: 4px;">
            <p style="margin: 0; font-size: 0.85rem; color: #1e40af;">
              💡 <strong>Astuce:</strong> L'extension <code>.${format}</code> sera ajoutée automatiquement
            </p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `<i class="fas fa-download"></i> Télécharger`,
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      width: '500px',
      customClass: {
        confirmButton: 'swal2-confirm-elegant',
        cancelButton: 'swal2-cancel-elegant'
      },
      focusConfirm: false,
      didOpen: () => {
        const input = document.getElementById('filename-input') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      },
      preConfirm: () => {
        const input = document.getElementById('filename-input') as HTMLInputElement;
        const value = input?.value?.trim();
        
        if (!value) {
          Swal.showValidationMessage('Le nom du fichier ne peut pas être vide');
          return null;
        }
        
        // Nettoyer le nom de fichier (supprimer les caractères invalides)
        const cleanFilename = value.replace(/[<>:"\/\\|?*]/g, '_');
        
        if (cleanFilename !== value) {
          Swal.showValidationMessage('Certains caractères ont été remplacés pour la compatibilité');
        }
        
        return cleanFilename;
      }
    });

    return result.isConfirmed ? result.value : null;
  }
}
