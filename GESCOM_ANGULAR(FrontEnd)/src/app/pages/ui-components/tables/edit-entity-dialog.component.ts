import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subscription, isObservable, of } from 'rxjs';
import { NotifyService } from '../../../services/notify.service';

export type EditFieldType = 'text' | 'textarea' | 'number' | 'select' | 'select-create' | 'date' | 'image' | 'range';

export interface EditFieldOption {
  label: string;
  value: any;
}

export interface EditFieldConfig {
  key: string;
  label: string;
  type: EditFieldType;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: EditFieldOption[];
  asyncOptions$?: ReturnType<typeof of>;
  disabled?: boolean;
  validators?: ValidatorFn[];
  placeholder?: string;
  value?: any; // Valeur surchargée pour l'affichage (notamment en mode consultation)
  hint?: string; // Message d'aide/information affiché sous le champ
  // Pour range
  suffix?: string; // ex: '%', ' CFA'
  displayValue?: (val: any) => string; // fonction pour afficher la valeur
  // Pour select-create
  allowCreate?: boolean;
  createPrompt?: string; // ex: 'Créer une nouvelle famille'
  onCreate?: (value: string) => any; // callback pour créer une nouvelle option
  // Pour champs calculés
  calculated?: boolean; // champ en lecture seule calculé automatiquement
  calculate?: (formValue: any) => any; // fonction de calcul
}

export interface EditEntityDialogData<T = any> {
  title?: string;
  subtitle?: string;
  entity: string; // e.g. 'Article', 'Stock', 'Famille', 'Vente', 'Fournisseur', 'Client'
  value: T; // current row value
  fields: EditFieldConfig[];
  getImageUrl?: (value: T) => string | null;
  // Save handler: can return Promise or Observable
  onSave: (changes: Partial<T>, selectedFile?: File | null) => any; // Observable<any> | Promise<any>
  readOnly?: boolean; // when true, acts as a view-only details dialog
  // Custom form change handler for complex field interactions
  onFormChange?: (form: FormGroup) => void;
}

@Component({
  selector: 'app-edit-entity-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSliderModule,
    MatAutocompleteModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="modal-dialog modal-dialog-centered modal-md">
      <div class="modal-content app-dialog">
        <div class="app-dialog-body">
          <div class="app-dialog-header">
            <div class="title">
              <mat-icon>{{ data.readOnly ? 'visibility' : 'edit' }}</mat-icon>
              <div class="text">
                <h3 class="m-0">{{ data.title || (data.readOnly ? ('Détails ' + data.entity) : ('Modifier ' + data.entity)) }}</h3>
                <small class="muted">{{ data.subtitle || (data.readOnly ? 'Consultation' : 'Mettez à jour les informations') }}</small>
              </div>
            </div>
            <button mat-icon-button aria-label="Close" (click)="onCancel()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Mode Consultation (ReadOnly) -->
          <div class="app-detail-layout" *ngIf="data.readOnly">
            <div class="app-detail-left" *ngIf="currentImageUrl">
              <div class="app-image-holder">
                <img [src]="currentImageUrl" [alt]="data.entity" (error)="onImgError($event)" style="cursor: pointer;" />
              </div>
            </div>
            <div class="app-detail-right">
              <div class="app-surface-card">
                <div class="content">
                  <div class="detail-grid">
                    <ng-container *ngFor="let f of runtimeFields">
                      <div class="detail-item" *ngIf="getFieldValue(f.key) != null && getFieldValue(f.key) !== ''">
                        <div class="detail-label">{{ f.label }}</div>
                        <div class="detail-value">
                          <ng-container [ngSwitch]="f.type">
                            <span *ngSwitchCase="'date'">{{ getFieldValue(f.key) | date:'dd/MM/yyyy' }}</span>
                            <span *ngSwitchCase="'number'">{{ getFieldValue(f.key) | number }}</span>
                            <span *ngSwitchCase="'select'">{{ getSelectLabel(f, getFieldValue(f.key)) }}</span>
                            <span *ngSwitchDefault>{{ getFieldValue(f.key) }}</span>
                          </ng-container>
                        </div>
                      </div>
                    </ng-container>
                  </div>

                  <div class="actions mt-3 d-flex gap-2 justify-content-end">
                    <button mat-button (click)="onCancel()">Fermer</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mode Édition -->
          <div class="app-detail-layout" [formGroup]="form" *ngIf="!data.readOnly">
            <div class="app-detail-left" *ngIf="hasImageField">
              <div class="app-image-holder">
                <img [src]="previewUrl || currentImageUrl" [alt]="data.entity" (error)="onImgError($event)" (click)="onOpenImagePreview()" style="cursor: pointer;" />
                <button class="image-action" mat-mini-fab color="primary" (click)="fileInput.click()" [disabled]="loading" aria-label="Changer la photo">
                  <mat-icon>photo_camera</mat-icon>
                </button>
                <input #fileInput type="file" accept="image/*" hidden (change)="onFileSelected($event)" />
              </div>
              <div class="image-info" *ngIf="currentImageUrl && !previewUrl">
                <mat-icon class="info-icon">check_circle</mat-icon>
                <span class="info-text">Image de l'article existe déjà</span>
              </div>
              <div class="image-info warning" *ngIf="previewUrl">
                <mat-icon class="info-icon">info</mat-icon>
                <span class="info-text">Nouvelle image sélectionnée</span>
              </div>
            </div>
            <div class="app-detail-right">
              <div class="app-surface-card">
                <div class="content">
                  <div class="form-grid">
                    <ng-container *ngFor="let f of runtimeFields">
                      <ng-container [ngSwitch]="f.type">
                        <!-- text -->
                        <mat-form-field *ngSwitchCase="'text'" appearance="outline" class="w-100">
                          <mat-label>{{ f.label }}</mat-label>
                          <input matInput [formControlName]="f.key" [placeholder]="f.placeholder || ''" />
                          <mat-hint *ngIf="f.hint">{{ f.hint }}</mat-hint>
                        </mat-form-field>
                        <!-- textarea -->
                        <mat-form-field *ngSwitchCase="'textarea'" appearance="outline" class="w-100">
                          <mat-label>{{ f.label }}</mat-label>
                          <textarea matInput rows="3" [formControlName]="f.key" [placeholder]="f.placeholder || ''"></textarea>
                          <mat-hint *ngIf="f.hint">{{ f.hint }}</mat-hint>
                        </mat-form-field>
                        <!-- number -->
                        <mat-form-field *ngSwitchCase="'number'" appearance="outline" class="w-100">
                          <mat-label>{{ f.label }}</mat-label>
                          <input type="number" matInput [formControlName]="f.key" [attr.min]="f.min ?? null" [attr.max]="f.max ?? null" [attr.step]="f.step ?? 'any'" [placeholder]="f.placeholder || ''" />
                          <mat-hint *ngIf="f.hint">{{ f.hint }}</mat-hint>
                        </mat-form-field>
                        <!-- select -->
                        <mat-form-field *ngSwitchCase="'select'" appearance="outline" class="w-100">
                          <mat-label>{{ f.label }}</mat-label>
                          <mat-select [formControlName]="f.key">
                            <mat-option [value]="null">Aucun</mat-option>
                            <mat-option *ngFor="let o of (f.options || [])" [value]="o.value">{{ o.label }}</mat-option>
                          </mat-select>
                          <mat-hint *ngIf="f.hint">{{ f.hint }}</mat-hint>
                        </mat-form-field>
                        <!-- date -->
                        <mat-form-field *ngSwitchCase="'date'" appearance="outline" class="w-100">
                          <mat-label>{{ f.label }}</mat-label>
                          <input matInput [matDatepicker]="picker" [formControlName]="f.key" />
                          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                          <mat-datepicker #picker startView="month"></mat-datepicker>
                          <mat-hint *ngIf="f.hint">{{ f.hint }}</mat-hint>
                        </mat-form-field>
                        <!-- select-create -->
                        <mat-form-field *ngSwitchCase="'select-create'" appearance="outline" class="w-100">
                          <mat-label>{{ f.label }}</mat-label>
                          <mat-select [formControlName]="f.key">
                            <mat-option [value]="null">Aucun</mat-option>
                            <mat-option *ngIf="f.allowCreate && f.createPrompt" [value]="'__CREATE_NEW__'" class="create-new-option">
                              <mat-icon>add</mat-icon> {{ f.createPrompt }}
                            </mat-option>
                            <mat-option *ngFor="let o of (f.options || [])" [value]="o.value">{{ o.label }}</mat-option>
                          </mat-select>
                          <mat-hint *ngIf="f.hint">{{ f.hint }}</mat-hint>
                        </mat-form-field>
                        <!-- range -->
                        <div *ngSwitchCase="'range'" class="range-field w-100">
                          <div class="d-flex align-items-center justify-content-between mb-2">
                            <label class="range-label m-0">{{ f.label }}</label>
                            <span class="range-chip" [class.chip-low]="form.get(f.key)?.value < 30" [class.chip-mid]="form.get(f.key)?.value >= 30 && form.get(f.key)?.value < 70" [class.chip-high]="form.get(f.key)?.value >= 70">
                              {{ formatRangeValue(f, form.get(f.key)?.value) }}
                            </span>
                          </div>
                          <div class="d-flex align-items-center gap-3">
                            <mat-icon class="range-icon" [class.icon-low]="form.get(f.key)?.value < 30" [class.icon-medium]="form.get(f.key)?.value >= 30 && form.get(f.key)?.value < 70" [class.icon-high]="form.get(f.key)?.value >= 70">
                              {{ form.get(f.key)?.value < 30 ? 'trending_down' : form.get(f.key)?.value < 70 ? 'trending_flat' : 'trending_up' }}
                            </mat-icon>
                            <mat-slider [min]="f.min ?? 0" [max]="f.max ?? 100" [step]="f.step ?? 1" [discrete]="true" [showTickMarks]="false" class="flex-grow-1">
                              <input matSliderThumb [formControlName]="f.key">
                            </mat-slider>
                          </div>
                          <small class="range-hint d-block mt-2" [class.hint-low]="form.get(f.key)?.value < 30" [class.hint-medium]="form.get(f.key)?.value >= 30 && form.get(f.key)?.value < 70" [class.hint-high]="form.get(f.key)?.value >= 70">
                            {{ form.get(f.key)?.value < 30 ? 'Niveau faible' : form.get(f.key)?.value < 70 ? 'Niveau moyen' : 'Niveau optimal' }}
                          </small>
                        </div>
                      </ng-container>
                    </ng-container>
                  </div>

                  <div class="actions mt-3 d-flex gap-2 justify-content-end">
                    <button mat-button (click)="onCancel()">Annuler</button>
                    <button mat-flat-button color="primary" [disabled]="form.invalid || loading" (click)="onSave()">
                      <mat-icon *ngIf="!loading">save</mat-icon>
                      <span *ngIf="!loading">Enregistrer</span>
                      <span *ngIf="loading"><mat-spinner diameter="20"></mat-spinner></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .modal-content { border-radius: 16px; padding: 0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.25); background: var(--app-surface, #fff); max-height: 90vh; display: flex; flex-direction: column; }
    .app-dialog-body { padding: 16px 20px; overflow-y: auto; flex: 1; max-height: calc(90vh - 32px); }
    .app-dialog-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-shrink: 0; }
    .app-dialog-header .title { display: flex; align-items: center; gap: 12px; }
    .app-detail-layout { display: flex; gap: 24px; align-items: flex-start; }
    .app-detail-left { flex: 1 1 40%; }
    .app-detail-right { flex: 1 1 60%; }
    .app-image-holder { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--app-border, #e5e7eb); background: var(--app-surface-2, #fafafa); }
    .app-image-holder img { width: 100%; height: auto; max-height: 320px; object-fit: cover; display: block; }
    .app-image-holder .image-action { position: absolute; right: 12px; bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
    .image-info { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 10px 14px; border-radius: 8px; background: rgba(32, 201, 151, 0.1); border: 1px solid rgba(32, 201, 151, 0.3); }
    .image-info.warning { background: rgba(245, 159, 0, 0.1); border-color: rgba(245, 159, 0, 0.3); }
    .image-info .info-icon { font-size: 20px; width: 20px; height: 20px; color: #20c997; }
    .image-info.warning .info-icon { color: #f59f00; }
    .image-info .info-text { font-size: 0.875rem; font-weight: 500; color: rgba(0,0,0,0.75); }
    .form-grid { display: flex; flex-direction: column; gap: 14px; }
    .detail-grid { display: flex; flex-direction: column; gap: 16px; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; padding-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,0.08); }
    .detail-item:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; font-size: 0.875rem; color: rgba(0,0,0,0.7); text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { font-size: 1rem; color: rgba(0,0,0,0.87); line-height: 1.5; word-break: break-word; }
    .row-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .actions { margin-top: 8px; }
    .range-field { margin-bottom: 20px; padding: 16px; border-radius: 12px; background: rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.08); transition: all 0.3s ease; }
    .range-field:hover { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.15); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .range-label { font-size: 0.875rem; font-weight: 600; color: rgba(0,0,0,0.7); }
    .range-icon { font-size: 24px; width: 24px; height: 24px; transition: all 0.3s ease; }
    .range-icon.icon-low { color: #ff6b6b; }
    .range-icon.icon-medium { color: #f59f00; }
    .range-icon.icon-high { color: #20c997; }
    .range-chip { display: inline-flex; align-items: center; justify-content: center; min-width: 52px; height: 28px; padding: 0 10px; border-radius: 999px; font-weight: 600; font-size: 0.85rem; color: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.15); transition: all 0.3s ease; }
    .range-chip.chip-low { background: linear-gradient(135deg, #ff6b6b, #f06595); }
    .range-chip.chip-mid { background: linear-gradient(135deg, #f59f00, #f76707); }
    .range-chip.chip-high { background: linear-gradient(135deg, #20c997, #40c057); }
    ::ng-deep .range-field .mdc-slider { --mdc-slider-handle-width: 18px; --mdc-slider-handle-height: 18px; --mdc-slider-active-track-height: 4px; --mdc-slider-inactive-track-height: 4px; }
    ::ng-deep .range-field .mdc-slider__thumb { background: transparent !important; border: none !important; }
    ::ng-deep .range-field .mdc-slider__thumb-knob { width: 1px; height: 5px; border: none; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.2); background: white; }
    ::ng-deep .range-field .mdc-slider:hover .mdc-slider__thumb-knob { box-shadow: 0 3px 8px rgba(0,0,0,0.25); transform: scale(1.15); }
    ::ng-deep .range-field .mdc-slider__track { border-radius: 2px; }
    ::ng-deep .range-field .mdc-slider__track--active, ::ng-deep .range-field .mdc-slider__track--inactive { border-radius: 2px; }
    ::ng-deep .range-field .mdc-slider__value-indicator-container { display: none !important; }
    ::ng-deep .range-field .mdc-slider__value-indicator { display: none !important; }
    .range-hint { font-size: 0.75rem; color: rgba(0,0,0,0.6); font-weight: 500; }
    .range-hint.hint-low { color: #ff6b6b; }
    .range-hint.hint-medium { color: #f59f00; }
    .range-hint.hint-high { color: #20c997; }
    .create-new-option { color: var(--primary-color, #1976d2); font-weight: 500; }
    .create-new-option mat-icon { vertical-align: middle; margin-right: 4px; font-size: 18px; }
    @media (max-width: 900px) {
      .app-detail-layout { flex-direction: column; }
      .app-detail-left, .app-detail-right { flex: 1 1 100%; }
      .app-image-holder img { max-height: 260px; }
    }
  `]
})
export class EditEntityDialogComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  loading = false;
  currentImageUrl: string | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  hasImageField = false;

  private subs: Subscription[] = [];
  private initialValues: Record<string, any> = {};

  get runtimeFields() { return this.data.fields || []; }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditEntityDialogData,
    private dialogRef: MatDialogRef<EditEntityDialogComponent>,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private notify: NotifyService,
  ) {}

  ngOnInit(): void {
    this.hasImageField = this.runtimeFields.some(f => f.type === 'image');

    const group: Record<string, FormControl> = {};
    this.runtimeFields.forEach(f => {
      const initial = (this.data.value as any)?.[f.key] ?? null;
      const validators: ValidatorFn[] = [];
      if (f.required) validators.push(Validators.required);
      if (f.type === 'number') {
        if (typeof f.min === 'number') validators.push(Validators.min(f.min));
        if (typeof f.max === 'number') validators.push(Validators.max(f.max));
      }
      if (f.validators?.length) validators.push(...f.validators);
      group[f.key] = new FormControl({ value: initial, disabled: !!f.disabled }, validators);
      this.initialValues[f.key] = initial;
    });

    this.form = this.fb.group(group);

    // Load options if any async
    this.runtimeFields.forEach(f => {
      if (f.asyncOptions$ && isObservable(f.asyncOptions$)) {
        const sub = (f.asyncOptions$ as any).subscribe((opts: EditFieldOption[]) => {
          f.options = opts || [];
        });
        this.subs.push(sub);
      }
    });

    // Initial image - always load if getImageUrl is provided
    if (typeof this.data.getImageUrl === 'function') {
      try { this.currentImageUrl = this.data.getImageUrl(this.data.value); } catch {}
    }

    // Configurer les calculs automatiques et les select-create
    this.setupFormCalculations();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s?.unsubscribe());
  }

  onCancel(): void { this.dialogRef.close(); }

  onSave(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const changes: Record<string, any> = {};
    Object.keys(value).forEach(k => {
      const oldVal = this.initialValues[k];
      const newVal = value[k];
      if (newVal !== oldVal) changes[k] = newVal;
    });

    if (!this.selectedFile && Object.keys(changes).length === 0) {
      this.snackBar.open('Aucune modification détectée', undefined, { duration: 2000 });
      this.dialogRef.close();
      return;
    }

    this.loading = true;
    const result = this.data.onSave(changes, this.selectedFile);

    const finalize = () => { this.loading = false; };
    const success = (res: any) => { finalize(); this.notify.success('Enregistré avec succès');; this.dialogRef.close({ updated: res }); };
    const error = (err: any) => { finalize(); console.error('[EditEntity] Save failed', err); this.snackBar.open('Erreur lors de la sauvegarde', undefined, { duration: 3000 }); };

    if (result && typeof result.subscribe === 'function') {
      (result as any).subscribe({ next: success, error });
    } else if (result && typeof result.then === 'function') {
      (result as Promise<any>).then(success).catch(error);
    } else {
      // fallback immediate
      success(result);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    if (!allowed.includes(file.type)) { this.snackBar.open('Format image invalide (JPG, PNG, WEBP)', undefined, { duration: 2500 }); input.value = ''; return; }
    if (file.size > maxSize) { this.snackBar.open('Image trop lourde (max 5MB)', undefined, { duration: 2500 }); input.value = ''; return; }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => { this.previewUrl = reader.result as string; };
    reader.readAsDataURL(file);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/products/Product.png';
  }

  onOpenImagePreview(): void {
    // placeholder – consumer can provide its own preview dialog. Here we simply noop.
  }

  /**
   * Récupère la valeur d'un champ pour l'affichage en mode consultation
   */
  getFieldValue(key: string): any {
    // Utiliser la valeur surchargée si elle existe
    const field = this.runtimeFields.find(f => f.key === key);
    if (field?.value !== undefined) {
      return field.value;
    }
    return (this.data.value as any)?.[key] ?? null;
  }

  /**
   * Récupère le label d'une option select
   */
  getSelectLabel(field: EditFieldConfig, value: any): string {
    if (!field.options || !value) return value || '-';
    const option = field.options.find(o => o.value === value);
    return option ? option.label : value;
  }

  /**
   * Formate la valeur d'un champ range pour l'affichage
   */
  formatRangeValue(field: EditFieldConfig, value: any): string {
    if (value == null) return '0';
    if (field.displayValue) return field.displayValue(value);
    const suffix = field.suffix || '';
    return `${value}${suffix}`;
  }

  /**
   * Configure les calculs automatiques entre champs
   */
  private setupFormCalculations(): void {
    // Custom form change handler (pour logique personnalisée)
    if (this.data.onFormChange) {
      const sub = this.form.valueChanges.subscribe(() => {
        this.data.onFormChange!(this.form);
      });
      this.subs.push(sub);
    }

    // Calculs automatiques standards
    this.runtimeFields.forEach(field => {
      if (field.calculated && field.calculate) {
        // Écouter les changements du formulaire
        const sub = this.form.valueChanges.subscribe(formValue => {
          const calculatedValue = field.calculate!(formValue);
          const control = this.form.get(field.key);
          if (control && control.value !== calculatedValue) {
            control.setValue(calculatedValue, { emitEvent: false });
          }
        });
        this.subs.push(sub);
      }
    });

    // Gérer les select-create
    this.runtimeFields.forEach(field => {
      if (field.type === 'select-create' && field.allowCreate) {
        const control = this.form.get(field.key);
        if (control) {
          const sub = control.valueChanges.subscribe(value => {
            if (value === '__CREATE_NEW__') {
              this.handleSelectCreate(field);
            }
          });
          this.subs.push(sub);
        }
      }
    });
  }

  /**
   * Gère la création d'une nouvelle option pour un select-create
   */
  private handleSelectCreate(field: EditFieldConfig): void {
    const promptText = field.createPrompt || 'Entrez le nom';
    const newValue = prompt(promptText);
    
    if (newValue && newValue.trim() && field.onCreate) {
      const result = field.onCreate(newValue.trim());
      
      // Si c'est un Observable ou Promise
      if (result && typeof result.subscribe === 'function') {
        this.loading = true;
        result.subscribe({
          next: (created: any) => {
            this.loading = false;
            // Ajouter la nouvelle option
            if (!field.options) field.options = [];
            field.options.push({ label: created.nom_famille || created.nom || newValue, value: created.id });
            // Sélectionner la nouvelle option
            this.form.get(field.key)?.setValue(created.id);
            this.snackBar.open('Créé avec succès', undefined, { duration: 2000 });
          },
          error: (err: any) => {
            this.loading = false;
            console.error('[SelectCreate] Failed', err);
            this.snackBar.open('Erreur lors de la création', undefined, { duration: 3000 });
            this.form.get(field.key)?.setValue(null);
          }
        });
      } else if (result && typeof result.then === 'function') {
        this.loading = true;
        result.then((created: any) => {
          this.loading = false;
          if (!field.options) field.options = [];
          field.options.push({ label: created.nom_famille || created.nom || newValue, value: created.id });
          this.form.get(field.key)?.setValue(created.id);
          this.snackBar.open('Créé avec succès', undefined, { duration: 2000 });
        }).catch((err: any) => {
          this.loading = false;
          console.error('[SelectCreate] Failed', err);
          this.snackBar.open('Erreur lors de la création', undefined, { duration: 3000 });
          this.form.get(field.key)?.setValue(null);
        });
      } else {
        // Résultat synchrone
        if (!field.options) field.options = [];
        field.options.push({ label: newValue, value: result });
        this.form.get(field.key)?.setValue(result);
      }
    } else {
      // Annulation - réinitialiser la valeur
      this.form.get(field.key)?.setValue(null);
    }
  }
}
