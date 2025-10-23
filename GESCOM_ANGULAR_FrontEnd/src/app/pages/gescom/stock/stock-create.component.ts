import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl, FormArray, ValidationErrors, ValidatorFn, AbstractControl } from '@angular/forms';
import { StockService } from '../../../services/gescom/stock.service';
import { Router, RouterModule } from '@angular/router';
import { ArticlesService } from '../../../services/gescom/articles.service';
import { FournisseursService } from '../../../services/gescom/fournisseurs.service';
import { FamillesService } from '../../../services/gescom/familles.service';
import { NotifyService } from '../../../services/notify.service';
import { Article } from '../../../interfaces/gescom/article.model';
import { Fournisseur } from '../../../interfaces/gescom/fournisseur.model';
import { Famille } from '../../../interfaces/gescom/famille.model';
import { FxRateService } from '../../../services/fx-rate.service';
import { StockOrchestratorService } from '../../../services/gescom/stock-orchestrator.service';
import { Subject, combineLatest, of, forkJoin } from 'rxjs';
import { catchError, debounceTime, map, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { environment } from '../../../environment';

@Component({
  standalone: true,
  selector: 'app-stock-create',
  templateUrl: './stock-create.component.html',
  styleUrls: ['./stock-create.component.scss'],
  imports: [CommonModule, FormsModule, MaterialModule, MatDatepickerModule, MatSliderModule, MatProgressBarModule, ReactiveFormsModule, RouterModule],
  providers: [provideNativeDateAdapter()],
})
export class StockCreateComponent implements OnInit, OnDestroy {
  loading = false;
  isSubmitting = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  articleImageUrl: string | null = null; // URL de l'image de l'article sélectionné
  apiUrl = environment.apiBaseUrl;
  etatLive: number | null = null; // percentage 1..100

  // Capped value for progress bar visualization only
  get etatCapped(): number {
    const v = this.etatLive;
    if (v == null || Number.isNaN(v as any)) return 0;
    return Math.max(0, Math.min(100, Number(v)));
  }
  
  /**
   * Obtient le prix d'un fournisseur pour un article spécifique
   * Retourne le prix uniquement si le fournisseur a déjà vendu cet article
   */
  getFournisseurPriceForArticle(fournisseurId: number, articleId: number | null): number | null {
    if (!articleId) return null;
    const fournisseur = this.fournisseurs.find(f => f.id === fournisseurId && f.article_id === articleId);
    return fournisseur?.prixArticle || null;
  }

  articles: Article[] = [];
  articlesFiltered: Article[] = []; // Articles filtrés par famille (mode simple)
  fournisseurs: Fournisseur[] = [];
  fournisseursFiltered: Fournisseur[] = []; // Fournisseurs liés à l'article sélectionné (mode simple)
  familles: Famille[] = [];
  
  // Map pour stocker les articles filtrés par ligne en mode bulk
  bulkArticlesFilteredMap: Map<number, Article[]> = new Map();

  creatingSupplier = false;
  newSupplierForm!: FormGroup<{ nom: FormControl<string | null>; telephone: FormControl<string | null>; adresse: FormControl<string | null> }>;

  // Toggles for using new vs existing
  useNewFamily = false;
  useNewArticle = false;

  // FX converter state
  fxFrom: string = 'EUR';
  fxTo: string = 'XOF';
  fxRate: number | null = null;
  fxLoading = false;
  fxError: string | null = null;
  showConverter = false;
  bulkMode = false;
  useManualRate = false;
  lastUpdated: Date | null = null;
  manualRateControl = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(0.000001),
  ]);
  currencyCodes: string[] = [];

  // Bulk mode form
  bulkForm!: FormGroup<{ products: FormArray<FormGroup<{
    famille_id: FormControl<number | null>;
    article_id: FormControl<number | null>;
    fournisseur_id: FormControl<number | null>;
    quantite: FormControl<number | null>;
    prix_origine: FormControl<number | null>;
    prix_unitaire: FormControl<number | null>;
    lot: FormControl<string | null>;
    reference: FormControl<string | null>;
    date_fabrication: FormControl<string | null>;
    date_peremption: FormControl<string | null>;
  }>> }>;

  // Bulk helpers
  private buildBulkForm() {
    this.bulkForm = this.fb.group({
      products: this.fb.array([
        this.newBulkRow(0) // Premier élément, index 0
      ])
    }) as any;
  }

  // Validator: peremption >= fabrication when both provided
  private dateRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const fab = group.get('date_fabrication')?.value as Date | null;
      const per = group.get('date_peremption')?.value as Date | null;
      if (!fab || !per) return null; // optional dates
      const fabTime = new Date(fab).setHours(0,0,0,0);
      const perTime = new Date(per).setHours(0,0,0,0);
      return perTime >= fabTime ? null : { dateRange: true };
    };
  }

  private formatDateForApi(d: Date | null | undefined): string | undefined {
    if (!d) return undefined;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private attachBulkRowReactivity(row: FormGroup, rowIndex: number) {
    row.get('prix_origine')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      const amount = Number(val || 0);
      // Use header rate logic: manual if set, else fallback rate
      let rate: number | null = null;
      if (this.useManualRate && this.manualRateControl.value) {
        rate = Number(this.manualRateControl.value);
      } else {
        const from = this.form.get('devise_origine')?.value || 'EUR';
        const to = this.form.get('devise_arrivee')?.value || 'XOF';
        rate = this.getFallbackRate(from, to);
      }
      const converted = amount > 0 && rate ? Number((amount * rate).toFixed(2)) : 0;
      row.get('prix_unitaire')?.setValue(converted, { emitEvent: false });
    });

    // Filtrer les articles par famille
    row.get('famille_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((familleId) => {
      if (!familleId) {
        this.bulkArticlesFilteredMap.set(rowIndex, [...this.articles]);
      } else {
        const filtered = this.articles.filter(a => a.famille_id === familleId);
        this.bulkArticlesFilteredMap.set(rowIndex, filtered);
      }
      
      // Réinitialiser l'article si celui-ci n'est plus dans la famille
      const currentArticleId = row.get('article_id')?.value;
      const articlesForRow = this.bulkArticlesFilteredMap.get(rowIndex) || [];
      if (currentArticleId && !articlesForRow.find(a => a.id === currentArticleId)) {
        row.patchValue({ article_id: null }, { emitEvent: false });
      }
    });
    
    // Charger automatiquement les données de l'article sélectionné
    row.get('article_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((articleId) => {
      if (!articleId) return;
      
      const article = this.articles.find(a => a.id === articleId);
      if (article) {
        // Charger la famille de l'article si non définie
        if (article.famille_id && !row.get('famille_id')?.value) {
          row.patchValue({ famille_id: article.famille_id }, { emitEvent: false });
        }
      }
    });
    
    // Charger le prix du fournisseur sélectionné
    row.get('fournisseur_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((fournisseurId) => {
      if (!fournisseurId) return;
      
      const fournisseur = this.fournisseurs.find(f => f.id === fournisseurId);
      if (fournisseur && fournisseur.prixArticle && !row.get('prix_unitaire')?.dirty) {
        row.patchValue({ prix_unitaire: fournisseur.prixArticle }, { emitEvent: false });
      }
    });
  }

  private newBulkRow(rowIndex?: number): FormGroup<{ famille_id: FormControl<number | null>; article_id: FormControl<number | null>; fournisseur_id: FormControl<number | null>; quantite: FormControl<number | null>; prix_origine: FormControl<number | null>; prix_unitaire: FormControl<number | null>; lot: FormControl<string | null>; reference: FormControl<string | null>; date_fabrication: FormControl<Date | null>; date_peremption: FormControl<Date | null>; }> {
    const index = rowIndex !== undefined ? rowIndex : (this.productsArray ? this.productsArray.length : 0);
    
    const group = this.fb.group({
      famille_id: this.fb.control<number | null>(null),
      article_id: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
      fournisseur_id: this.fb.control<number | null>(null),
      quantite: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
      prix_origine: this.fb.control<number | null>(null),
      prix_unitaire: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
      lot: this.fb.control<string | null>(null),
      reference: this.fb.control<string | null>(null),
      date_fabrication: this.fb.control<Date | null>(null),
      date_peremption: this.fb.control<Date | null>(null),
    }, { validators: this.dateRangeValidator() }) as any;

    // Initialiser la liste des articles filtrés pour cette ligne
    this.bulkArticlesFilteredMap.set(index, [...this.articles]);

    this.attachBulkRowReactivity(group, index);
    return group;
  }

  get productsArray(): FormArray<FormGroup> {
    return this.bulkForm.get('products') as FormArray<FormGroup>;
  }

  addBulkRow() {
    this.productsArray.push(this.newBulkRow() as any);
  }

  removeBulkRowRef(ctrl: FormGroup) {
    const idx = this.productsArray.controls.indexOf(ctrl as any);
    if (idx > -1 && this.productsArray.length > 1) {
      this.productsArray.removeAt(idx);
    }
  }

  duplicateBulkRowRef(ctrl: FormGroup) {
    const val = ctrl.getRawValue();
    const newIndex = this.productsArray.length;
    const group = this.newBulkRow(newIndex);
    group.patchValue(val);
    this.productsArray.push(group as any);
  }

  onBulkSubmit() {
    if (this.bulkForm.invalid) return;
    this.isSubmitting = true;
    const reqs = this.productsArray.controls.map((g) => {
      const v = g.getRawValue() as any;
      // Note: famille_id est exclu car c'est un champ de filtrage côté client uniquement
      // Il n'est pas envoyé au backend
      return this.stock.create({
        article_id: Number(v.article_id),
        fournisseur_id: v.fournisseur_id != null ? Number(v.fournisseur_id) : undefined,
        lot: v.lot || undefined,
        reference: v.reference || undefined,
        quantite: Number(v.quantite),
        prix_unitaire: Number(v.prix_unitaire),
        date_fabrication: this.formatDateForApi(v.date_fabrication as any),
        date_peremption: this.formatDateForApi(v.date_peremption as any),
      });
    });
    forkJoin(reqs).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notify.success('Stocks enregistrés avec succès');
        this.router.navigate(['/gescom/stock']);
      },
      error: () => {
        this.isSubmitting = false;
        this.notify.error("Erreur lors de l'enregistrement en lot");
      }
    });
  }

  // Default fallback rates (currency -> XOF): value means 1 UNIT of the currency equals this amount in XOF
  // Example: EUR->XOF ≈ 655.957; then EUR->USD rate fallback is (EUR->XOF) / (USD->XOF)
  defaultRates: Record<string, number> = {
    'XOF': 1,
    'EUR': 655.957,
    'USD': 600,
    'GBP': 750,
    'JPY': 4.4,
    'CHF': 660,
    'CAD': 470,
    'AUD': 400,
    'CNY': 90,
    'INR': 8,
    'BRL': 120,
    'RUB': 7,
    'MXN': 35,
    'ZAR': 32,
    'KRW': 0.45,
    'TRY': 17,
    'SGD': 430,
    'HKD': 77,
    'SEK': 58,
    'NOK': 56,
    'DKK': 88,
    'PLN': 155,
    'THB': 17.5,
    'NZD': 380,
  };

  private getFallbackRate(from: string, to: string): number | null {
    const f = (from || '').toUpperCase();
    const t = (to || '').toUpperCase();
    if (!this.defaultRates[f] || !this.defaultRates[t]) return null;
    // With currency->XOF mapping: rate(from->to) = (from->XOF) / (to->XOF)
    const rate = this.defaultRates[f] / this.defaultRates[t];
    return rate > 0 ? rate : null;
  }

  private migrateRatesIfNeeded() {
    // Detect old orientation (XOF->currency) if many majors are < 1 and XOF == 1, then invert them
    const majors = ['EUR','USD','GBP','CHF'];
    const looksLikeOld = majors.every(c => this.defaultRates[c] != null && this.defaultRates[c] > 0 && this.defaultRates[c] < 1) && this.defaultRates['XOF'] === 1;
    if (looksLikeOld) {
      const inverted: Record<string, number> = {};
      Object.keys(this.defaultRates).forEach(code => {
        const v = Number(this.defaultRates[code]);
        inverted[code] = v > 0 ? Number((1 / v).toFixed(6)) : v;
      });
      // XOF should remain 1 XOF = 1 XOF
      inverted['XOF'] = 1;
      this.defaultRates = inverted;
      this.saveDefaultRatesToStorage();
      this.currencyCodes = Object.keys(this.defaultRates);
    }
  }

  // Editable default rates UI state
  showEditRates = false;
  defaultRatesForm!: FormGroup;
  private readonly DEFAULT_RATES_STORAGE_KEY = 'gescom_fx_default_rates_v1';

  private loadDefaultRatesFromStorage() {
    try {
      const raw = localStorage.getItem(this.DEFAULT_RATES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.keys(parsed).forEach((code) => {
          const v = Number(parsed[code]);
          if (!isNaN(v) && v >= 0) {
            this.defaultRates[code] = v;
          }
        });
      }
      this.currencyCodes = Object.keys(this.defaultRates);
    } catch {
      // ignore storage errors
    }
  }

  private saveDefaultRatesToStorage() {
    try {
      localStorage.setItem(this.DEFAULT_RATES_STORAGE_KEY, JSON.stringify(this.defaultRates));
    } catch {
      // ignore storage errors
    }
  }

  private buildDefaultRatesForm() {
    const group: Record<string, FormControl<number | null>> = {};
    Object.keys(this.defaultRates).forEach((code) => {
      group[code] = this.fb.control<number | null>(this.defaultRates[code], {
        validators: [Validators.required, Validators.min(0)],
      });
    });
    this.defaultRatesForm = this.fb.group(group);
    this.currencyCodes = Object.keys(this.defaultRates);
  }

  toggleEditRates() {
    this.showEditRates = !this.showEditRates;
    if (this.showEditRates) {
      if (!this.defaultRatesForm) {
        this.buildDefaultRatesForm();
      } else {
        // sync form with latest defaultRates values
        Object.keys(this.defaultRates).forEach((code) => {
          const ctrl = this.defaultRatesForm.get(code);
          if (ctrl) ctrl.setValue(this.defaultRates[code]);
        });
      }
    }
  }

  saveDefaultRates() {
    if (!this.defaultRatesForm?.valid) return;
    const vals = this.defaultRatesForm.getRawValue();
    Object.keys(vals).forEach((code) => {
      const v = Number(vals[code] ?? 0);
      if (!isNaN(v) && v >= 0) this.defaultRates[code] = v;
    });
    this.currencyCodes = Object.keys(this.defaultRates);
    this.saveDefaultRatesToStorage();
    this.showEditRates = false;
    this.lastUpdated = new Date();
    // Re-appliquer la conversion si on a un prix d'origine
    const amount = Number(this.form.get('prix_origine')?.value || 0);
    const from = this.form.get('devise_origine')?.value || 'EUR';
    const to = this.form.get('devise_arrivee')?.value || 'XOF';
    if (amount > 0 && from && to) {
      if (this.useManualRate && this.manualRateControl.value) this.applyManualRate();
      else this.applyAutoRate(amount, from, to);
    }
  }

  // Set a specific default rate entry from the currently selected currency by fetching 1 <currency> -> XOF
  applyPredefinedTauxChange() {
    // Provided map is XOF -> currency (1 XOF equals this amount in currency)
    const tauxChange: Record<string, number> = {
      'XOF': 1,
      'EUR': 0.00152,
      'USD': 0.00166,
      'GBP': 0.00131,
      'JPY': 0.25,
      'CHF': 0.00147,
      'CAD': 0.0021,
      'AUD': 0.0020,
      'CNY': 0.011,
      'INR': 0.14,
      'BRL': 0.0083,
      'RUB': 0.15,
      'MXN': 0.029,
      'ZAR': 0.031,
      'KRW': 2.23,
      'TRY': 0.054,
      'SGD': 0.0022,
      'HKD': 0.013,
      'SEK': 0.016,
      'NOK': 0.016,
      'DKK': 0.011,
      'PLN': 0.0065,
      'THB': 0.057,
      'NZD': 0.0019,
    };

    // Convert to currency -> XOF (1 currency equals this amount in XOF)
    const converted: Record<string, number> = {};
    Object.keys(tauxChange).forEach((code) => {
      const v = Number(tauxChange[code]);
      if (code.toUpperCase() === 'XOF') {
        converted['XOF'] = 1;
      } else if (v > 0) {
        converted[code.toUpperCase()] = Number((1 / v).toFixed(6));
      }
    });

    // Apply to defaultRates
    this.defaultRates = { ...this.defaultRates, ...converted };
    this.currencyCodes = Object.keys(this.defaultRates);

    // Ensure form reflects values
    if (!this.defaultRatesForm) this.buildDefaultRatesForm();
    Object.keys(this.defaultRates).forEach((code) => {
      const ctrl = this.defaultRatesForm.get(code);
      if (ctrl) ctrl.setValue(this.defaultRates[code]);
    });

    // Persist and update timestamp
    this.saveDefaultRatesToStorage();
    this.lastUpdated = new Date();

    // Re-apply conversion if amount is provided
    const amount = Number(this.form.get('prix_origine')?.value || 0);
    const from = this.form.get('devise_origine')?.value || 'EUR';
    const to = this.form.get('devise_arrivee')?.value || 'XOF';
    if (amount > 0 && from && to) {
      if (this.useManualRate && this.manualRateControl.value) this.applyManualRate();
      else this.applyAutoRate(amount, from, to);
    }
  }

  cancelEditRates() {
    this.showEditRates = false;
  }

  // teardown
  private destroy$ = new Subject<void>();

  form!: FormGroup<{
    // Selection
    famille_id: FormControl<number | null>;
    article_id: FormControl<number | null>;
    fournisseur_id: FormControl<number | null>;
    // New inputs (used when toggles are active)
    nouv_famille: FormControl<string | null>;
    nouv_article: FormControl<string | null>;
    quantite_standard: FormControl<number | null>;
    conditionnement: FormControl<string | null>;
    nouv_fournisseur: FormControl<string | null>;
    // Stock info
    lot: FormControl<string | null>;
    reference: FormControl<string | null>;
    quantite: FormControl<number>;
    prix_unitaire: FormControl<number>;
    // Currency UI helpers
    prix_origine: FormControl<number | null>;
    devise_origine: FormControl<string | null>;
    devise_arrivee: FormControl<string | null>;
    montant: FormControl<number | null>;
    date_fabrication: FormControl<Date | null>;
    date_peremption: FormControl<Date | null>;
    description: FormControl<string | null>;
  }>;

  constructor(
    private fb: FormBuilder,
    private stock: StockService,
    private articlesService: ArticlesService,
    private fournisseursService: FournisseursService,
    private famillesService: FamillesService,
    private fx: FxRateService,
    private notify: NotifyService,
    private router: Router,
    private orchestrator: StockOrchestratorService,
  ) {
    this.form = this.fb.group({
      famille_id: this.fb.control<number | null>(null),
      article_id: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
      fournisseur_id: this.fb.control<number | null>(null),
      // New entries
      nouv_famille: this.fb.control<string | null>(null),
      nouv_article: this.fb.control<string | null>(null),
      quantite_standard: this.fb.control<number | null>(10),
      conditionnement: this.fb.control<string | null>(null),
      nouv_fournisseur: this.fb.control<string | null>(null),
      lot: this.fb.control<string | null>(null),
      reference: this.fb.control<string | null>(null),
      quantite: this.fb.control<number>(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
      prix_unitaire: this.fb.control<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      prix_origine: this.fb.control<number | null>(null),
      devise_origine: this.fb.control<string | null>('EUR'),
      devise_arrivee: this.fb.control<string | null>('XOF'),
      montant: this.fb.control<number | null>({ value: null, disabled: true }),
      date_fabrication: this.fb.control<Date | null>(null),
      date_peremption: this.fb.control<Date | null>(null),
      description: this.fb.control<string | null>(null),
    }, { validators: [this.dateRangeValidator()] });
  }

  toggleConverter() {
    this.showConverter = !this.showConverter;
    this.fxError = null;
  }

  toggleBulkMode() {
    this.bulkMode = !this.bulkMode;
  }

  // Toggle between existing/new entries with validator adjustments
  toggleUseNewFamily() {
    this.useNewFamily = !this.useNewFamily;
    if (this.useNewFamily) {
      // famille_id optional when creating new family
      this.form.get('famille_id')?.clearValidators();
      this.form.get('famille_id')?.updateValueAndValidity();
    } else {
      // require famille if later used by new article
      this.form.get('famille_id')?.setValidators([]);
      this.form.get('famille_id')?.updateValueAndValidity();
    }
  }

  toggleUseNewArticle() {
    this.useNewArticle = !this.useNewArticle;
    if (this.useNewArticle) {
      // article_id not required when creating new article
      this.form.get('article_id')?.clearValidators();
      this.form.get('article_id')?.updateValueAndValidity();
    } else {
      this.form.get('article_id')?.setValidators([Validators.required, Validators.min(1)]);
      this.form.get('article_id')?.updateValueAndValidity();
    }
  }


  ngOnInit(): void {
    // Création fournisseur sans validation côté client
    this.newSupplierForm = this.fb.group({
      nom: this.fb.control<string | null>(null),
      telephone: this.fb.control<string | null>(null),
      adresse: this.fb.control<string | null>(null),
    });
    // Load persisted default FX rates (if any)
    this.loadDefaultRatesFromStorage();
    this.migrateRatesIfNeeded();
    if (!this.currencyCodes || this.currencyCodes.length === 0) {
      this.currencyCodes = Object.keys(this.defaultRates);
    }
    this.loadDropdowns();
    this.setupReactivity();
    this.setupFxConversion();
    // Initialize bulk form
    this.buildBulkForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDropdowns() {
    this.articlesService.all().subscribe({
      next: (data) => {
        this.articles = data || [];
        this.articlesFiltered = [...this.articles]; // Initialiser la liste filtrée
      },
      error: () => console.error('Erreur de chargement des articles'),
    });
    this.fournisseursService.all().subscribe({
      next: (data) => {
        this.fournisseurs = data || [];
        this.fournisseursFiltered = [...this.fournisseurs]; // Initialiser la liste filtrée
      },
      error: () => console.error('Erreur de chargement des fournisseurs'),
    });
    this.famillesService.all().subscribe({
      next: (data) => (this.familles = data || []),
      error: () => console.error('Erreur de chargement des familles'),
    });
  }

  private setupReactivity() {
    // compute montant = quantite * prix_unitaire
    this.form
      .get('quantite')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.computeMontant(); this.recomputeEtatLive(); });
    this.form
      .get('prix_unitaire')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.computeMontant());

    // When famille changes, filter articles list by famille
    this.form.get('famille_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((familleId) => {
      if (!familleId) {
        this.articlesFiltered = [...this.articles];
      } else {
        this.articlesFiltered = this.articles.filter(a => a.famille_id === familleId);
      }
      
      // Réinitialiser l'article sélectionné si celui-ci n'est plus dans la famille
      const currentArticleId = this.form.get('article_id')?.value;
      if (currentArticleId && !this.articlesFiltered.find(a => a.id === currentArticleId)) {
        this.form.patchValue({ article_id: null });
      }
    });

    // When article changes, load article data (conditionnement, image) and filter fournisseurs
    this.form.get('article_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((articleId) => {
      this.recomputeEtatLive();
      
      if (!articleId) {
        this.fournisseursFiltered = [...this.fournisseurs];
        this.articleImageUrl = null; // Réinitialiser l'URL de l'image
        return;
      }
      
      const article = this.articles.find(a => a.id === articleId);
      if (article) {
        // Charger automatiquement le conditionnement et la quantité standard
        if (article.conditionnement && !this.form.get('conditionnement')?.value) {
          this.form.patchValue({ conditionnement: article.conditionnement }, { emitEvent: false });
        }
        if (article.quantite_standard && !this.form.get('quantite_standard')?.value) {
          this.form.patchValue({ quantite_standard: article.quantite_standard }, { emitEvent: false });
        }
        
        // Charger la famille de l'article si non définie
        if (article.famille_id && !this.form.get('famille_id')?.value) {
          this.form.patchValue({ famille_id: article.famille_id }, { emitEvent: false });
        }
        
        // Charger l'URL de l'image de l'article si elle existe
        if (article.image_article) {
          this.articleImageUrl = `${this.apiUrl}/articles/${article.id}/photo`;
        } else {
          this.articleImageUrl = null;
        }
      }
      
      // Filtrer les fournisseurs liés à cet article
      this.fournisseursFiltered = this.fournisseurs.filter(f => f.article_id === articleId);
      
      // Si un seul fournisseur, le présélectionner
      if (this.fournisseursFiltered.length === 1 && !this.form.get('fournisseur_id')?.value) {
        const fournisseur = this.fournisseursFiltered[0];
        this.form.patchValue({ fournisseur_id: fournisseur.id }, { emitEvent: false });
        
        // Charger le prix du fournisseur si disponible
        if (fournisseur.prixArticle && !this.form.get('prix_unitaire')?.value) {
          this.form.patchValue({ prix_unitaire: fournisseur.prixArticle }, { emitEvent: false });
        }
      }
    });
    
    // When fournisseur changes, load prixArticle if available
    this.form.get('fournisseur_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((fournisseurId) => {
      if (!fournisseurId) return;
      
      const fournisseur = this.fournisseurs.find(f => f.id === fournisseurId);
      if (fournisseur && fournisseur.prixArticle) {
        // Charger le prix du fournisseur
        this.form.patchValue({ prix_unitaire: fournisseur.prixArticle }, { emitEvent: false });
      }
    });

    // Recompute etat when standard qty changes
    this.form.get('quantite_standard')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.recomputeEtatLive());
  }

  private recomputeEtatLive() {
    const qRaw = this.form.get('quantite')?.value as number | null;
    const q = Number(qRaw || 0);
    let qs: number | null = null;
    if (this.useNewArticle) {
      const qsRaw = this.form.get('quantite_standard')?.value as number | null;
      qs = qsRaw != null ? Number(qsRaw) : null;
    } else {
      const artId = this.form.get('article_id')?.value as number | null;
      if (artId) {
        const art = this.articles.find(a => Number(a.id) === Number(artId));
        qs = art?.quantite_standard != null ? Number(art.quantite_standard) : null;
      }
    }
    if (!qs || qs <= 0 || !q || q <= 0) { this.etatLive = null; return; }
    const etat = (q / qs) * 100;
    // Keep exact value with two decimals; allow values above 100%
    this.etatLive = Number(etat.toFixed(2));
  }

  toggleManualRate() {
    this.useManualRate = !this.useManualRate;
    if (this.useManualRate && this.fxRate) {
      this.manualRateControl.setValue(Number(this.fxRate.toFixed(6)));
    } else if (!this.useManualRate) {
      const amount = Number(this.form.get('prix_origine')?.value || 0);
      const from = this.form.get('devise_origine')?.value || 'EUR';
      const to = this.form.get('devise_arrivee')?.value || 'XOF';
      this.applyAutoRate(amount, from, to);
    }
  }

  applyManualRate() {
    if (this.manualRateControl.valid && this.manualRateControl.value) {
      const rate = Number(this.manualRateControl.value);
      const amount = Number(this.form.get('prix_origine')?.value || 0);
      if (amount > 0) {
        this.fxRate = rate;
        const converted = Number((amount * rate).toFixed(2));
        this.form.patchValue({ prix_unitaire: converted });
        this.computeMontant();
        this.lastUpdated = new Date();
      }
    }
  }

  private applyAutoRate(amount: number, from: string, to: string) {
    this.fxLoading = true;
    this.fx.convert(from, to, amount).subscribe({
      next: (res) => {
        this.fxRate = res.rate;
        const converted = Number(res.amount.toFixed(2));
        this.form.patchValue({ prix_unitaire: converted });
        this.computeMontant();
        this.lastUpdated = new Date();
        this.fxLoading = false;
      },
      error: () => {
        // Fallback to local default rates when API fails
        const fallback = this.getFallbackRate(from, to);
        if (fallback && amount > 0) {
          this.fxRate = Number(fallback.toFixed(6));
          const converted = Number((amount * fallback).toFixed(2));
          this.form.patchValue({ prix_unitaire: converted });
          this.computeMontant();
          this.lastUpdated = new Date();
          this.fxError = 'Taux par défaut utilisé (API indisponible)';
        } else {
          this.fxError = 'Conversion indisponible pour le moment';
          this.fxRate = null;
        }
      }
    });

  }

  private setupFxConversion() {
    const prixOrigine$ = this.form
      .get('prix_origine')!
      .valueChanges.pipe(
        startWith(this.form.get('prix_origine')!.value),
        map((v) => Number(v || 0)),
        takeUntil(this.destroy$)
      );

    const from$ = this.form
      .get('devise_origine')!
      .valueChanges.pipe(
        startWith(this.form.get('devise_origine')!.value),
        map((v) => (v || 'EUR').toString()),
        takeUntil(this.destroy$)
      );

    const to$ = this.form
      .get('devise_arrivee')!
      .valueChanges.pipe(
        startWith(this.form.get('devise_arrivee')!.value),
        map((v) => (v || 'XOF').toString()),
        takeUntil(this.destroy$)
      );

    combineLatest([prixOrigine$, from$, to$])
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(([amount, from, to]) => {
        this.fxError = null;

        if (this.useManualRate && this.manualRateControl.value) {
          this.applyManualRate();
          return;
        }

        if (!amount || amount <= 0) {
          this.fxRate = null;
          this.form.patchValue({ prix_unitaire: 0 });
          this.computeMontant();
          return;
        }

        if (from === to) {
          this.fxRate = 1;
          this.form.patchValue({ prix_unitaire: Number(amount.toFixed(2)) });
          this.computeMontant();
          this.lastUpdated = new Date();
          return;
        }

        this.applyAutoRate(amount, from, to);
      });
  }

  computeMontant() {
    const q = Number(this.form.get('quantite')?.value || 0);
    const p = Number(this.form.get('prix_unitaire')?.value || 0);
    const m = q > 0 && p >= 0 ? Number((q * p).toFixed(2)) : null;
    this.form.get('montant')?.setValue(m);
  }

  toggleCreateSupplier() {
    this.creatingSupplier = !this.creatingSupplier;
    if (!this.creatingSupplier) {
      this.newSupplierForm.reset({ nom: null, telephone: null, adresse: null });
    }
  }

  private normalizeSupplierName(value: string | null | undefined): string {
    return (value ?? '').trim();
  }

  private normalizeOptionalText(value: string | null | undefined): string | null {
    const cleaned = (value ?? '').trim();
    return cleaned.length ? cleaned : null;
  }

  private findSupplierByName(name: string): Fournisseur | undefined {
    if (!name) return undefined;
    const target = name.trim().toLowerCase();
    return this.fournisseurs.find((f) => (f.nom ?? '').trim().toLowerCase() === target);
  }

  // FX methods
  changerDeviseOrigine(code: string) {
    this.form.patchValue({ devise_origine: code });
  }
  changerDeviseArrivee(code: string) {
    this.form.patchValue({ devise_arrivee: code });
  }
  inverserDevises() {
    const from = this.form.get('devise_origine')?.value;
    const to = this.form.get('devise_arrivee')?.value;
    this.form.patchValue({ devise_origine: to, devise_arrivee: from });
  }
  convertirAvecAPI() {
    this.fxError = null;
    const amount = Number(this.form.get('prix_origine')?.value || 0);
    const from = this.form.get('devise_origine')?.value || 'EUR';
    const to = this.form.get('devise_arrivee')?.value || 'XOF';
    if (!amount || amount <= 0) {
      this.fxError = 'Montant invalide';
      return;
    }
    this.fxLoading = true;
    this.fx.convert(from, to, amount).subscribe({
      next: (res) => {
        this.fxRate = res.rate;
        const converted = Number(res.amount.toFixed(2));
        this.form.patchValue({ prix_unitaire: converted });
        this.computeMontant();
        this.fxLoading = false;
      },
      error: () => {
        this.fxError = 'Conversion indisponible pour le moment';
        this.fxLoading = false;
      },
    });
  }

  createSupplier() {
    const nom = this.normalizeSupplierName(this.newSupplierForm.value.nom);

    if (!nom) {
      this.notify.error('Le nom du fournisseur est requis');
      return;
    }

    const existant = this.findSupplierByName(nom);
    if (existant) {
      this.notify.error(`Le fournisseur "${nom}" existe déjà`);
      return;
    }

    const payload = {
      nom: nom,
      telephone: this.normalizeOptionalText(this.newSupplierForm.value.telephone),
      adresse: this.normalizeOptionalText(this.newSupplierForm.value.adresse),
    } as Partial<Fournisseur>;

    this.notify
      .confirm({ title: 'Confirmer', text: 'Créer ce fournisseur ?' })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.fournisseursService.create(payload).subscribe({
          next: (f) => {
            this.fournisseurs = [f, ...this.fournisseurs];
            this.fournisseursFiltered = [f, ...this.fournisseursFiltered];
            this.form.patchValue({ fournisseur_id: f.id as unknown as number });
            this.creatingSupplier = false;
            this.newSupplierForm.reset({ nom: null, telephone: null, adresse: null });
            this.notify.success('Fournisseur créé');
          },
          error: () => this.notify.error('Impossible de créer le fournisseur'),
        });
      });
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    if (file) {
      if (!allowed.includes(file.type)) {
        this.notify.error("Format d'image invalide. Formats autorisés: JPG, PNG, WEBP");
        input.value = '';
        this.selectedFile = null;
        this.previewUrl = null;
        return;
      }
      if (file.size > maxSize) {
        this.notify.error('Image trop lourde (max 5MB)');
        input.value = '';
        this.selectedFile = null;
        this.previewUrl = null;
        return;
      }
    }
    this.selectedFile = file;
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => (this.previewUrl = reader.result as string);
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.previewUrl = null;
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.notify
      .confirm({ title: "Confirmer l'enregistrement", text: 'Voulez-vous enregistrer ce stock maintenant ?' })
      .then((res) => {
        if (!res.isConfirmed) return;

        this.isSubmitting = true;
        const v = this.form.getRawValue();

        const trimmedSupplierName = this.normalizeSupplierName(this.newSupplierForm.value.nom);
        const existingSupplier = trimmedSupplierName ? this.findSupplierByName(trimmedSupplierName) : undefined;
        const initialSupplierId = v.fournisseur_id != null ? Number(v.fournisseur_id) : null;

        let resolvedSupplierId = initialSupplierId;
        let shouldCreateSupplier = false;

        if (existingSupplier) {
          resolvedSupplierId = Number(existingSupplier.id);
          if (!initialSupplierId || Number(initialSupplierId) !== resolvedSupplierId) {
            this.form.patchValue({ fournisseur_id: resolvedSupplierId }, { emitEvent: false });
          }
        } else if (!resolvedSupplierId && trimmedSupplierName) {
          shouldCreateSupplier = true;
        }

        const supplierArticleId = !this.useNewArticle && v.article_id != null ? Number(v.article_id) : null;
        const prixArticleValue = Number(v.prix_unitaire);
        const newSupplierPayload = shouldCreateSupplier
          ? {
              nom: trimmedSupplierName,
              telephone: this.normalizeOptionalText(this.newSupplierForm.value.telephone),
              adresse: this.normalizeOptionalText(this.newSupplierForm.value.adresse),
            }
          : undefined;
        const canCreateSupplierNow = shouldCreateSupplier && supplierArticleId != null;
        const mustDeferSupplierCreation = shouldCreateSupplier && !canCreateSupplierNow;

        const montantToSend = (() => {
          const mCtl = this.form.get('montant')?.value as number | null;
          if (mCtl != null) return Number(mCtl);
          const q = Number(v.quantite);
          const p = Number(v.prix_unitaire);
          return Number((q * p).toFixed(2));
        })();

        const computeEtat = (articleId: number | null): number | null => {
          const q = Number(v.quantite || 0);
          let qs: number | null = null;
          if (this.useNewArticle) {
            qs = v.quantite_standard != null ? Number(v.quantite_standard) : null;
          } else if (articleId) {
            const art = this.articles.find(a => Number(a.id) === Number(articleId));
            qs = art?.quantite_standard != null ? Number(art.quantite_standard) : null;
          }
          if (!qs || qs <= 0) return null;
          const etat = (q / qs) * 100;
          return Number(etat.toFixed(2));
        };

        const etat = computeEtat(this.useNewArticle ? null : v.article_id);

        const proceedWithStockCreation = (
          supplierId: number | null,
          creatingSupplier: boolean,
          supplierData?: { nom?: string | null; telephone?: string | null; adresse?: string | null }
        ) => {
          this.orchestrator
            .createFullStock({
              useNewFamily: this.useNewFamily,
              useNewArticle: this.useNewArticle,
              creatingSupplier,
              famille_id: v.famille_id,
              nouv_famille: v.nouv_famille,
              article_id: v.article_id,
              nouv_article: v.nouv_article,
              quantite_standard: v.quantite_standard,
              conditionnement: v.conditionnement,
              description: v.description,
              fournisseur_id: supplierId,
              new_fournisseur: creatingSupplier ? supplierData : undefined,
              lot: v.lot,
              reference: v.reference,
              quantite: Number(v.quantite),
              prix_unitaire: Number(v.prix_unitaire),
              date_fabrication: this.formatDateForApi(v.date_fabrication as any),
              date_peremption: this.formatDateForApi(v.date_peremption as any),
              montant: montantToSend,
              etat: etat,
              image_file: this.selectedFile,
            })
            .subscribe({
              next: () => {
                this.isSubmitting = false;
                this.notify.success('Stock enregistré avec succès');
                this.router.navigate(['/gescom/stock']);
              },
              error: (error) => {
                this.isSubmitting = false;
                console.error('Stock creation failed', error, error?.error);
                const messages: string[] = [];
                const apiMessage = error?.error?.message;
                if (apiMessage) messages.push(String(apiMessage));
                const backendErrors = error?.error?.errors || (apiMessage ? null : error?.error);
                if (backendErrors) {
                  if (typeof backendErrors === 'object') {
                    Object.values(backendErrors).forEach((val: any) => {
                      if (Array.isArray(val) && val.length) messages.push(String(val[0]));
                      else if (val != null) messages.push(String(val));
                    });
                  } else if (typeof backendErrors === 'string') {
                    messages.push(backendErrors);
                  }
                }
                if (!messages.length && error?.message) messages.push(String(error.message));
                if (messages.length) this.notify.error(messages.join('\n'));
                else this.notify.error("Erreur lors de l'enregistrement");
              },
            });
        };

        if (canCreateSupplierNow && newSupplierPayload) {
          const payload: Partial<Fournisseur> = {
            nom: newSupplierPayload.nom ?? undefined,
            telephone: newSupplierPayload.telephone ?? undefined,
            adresse: newSupplierPayload.adresse ?? undefined,
            article_id: supplierArticleId ?? undefined,
            prixArticle: !isNaN(prixArticleValue) ? prixArticleValue : undefined,
          };

          this.fournisseursService.create(payload).subscribe({
            next: (supplier) => {
              const newId = Number(supplier.id);
              resolvedSupplierId = newId;
              const hydratedSupplier: Fournisseur = {
                ...supplier,
                article_id: supplierArticleId ?? supplier.article_id,
                prixArticle: !isNaN(prixArticleValue) ? prixArticleValue : supplier.prixArticle,
              } as Fournisseur;
              this.fournisseurs = [hydratedSupplier, ...this.fournisseurs];
              this.fournisseursFiltered = [hydratedSupplier, ...this.fournisseursFiltered];
              this.form.patchValue({ fournisseur_id: newId }, { emitEvent: false });
              this.creatingSupplier = false;
              this.newSupplierForm.reset({ nom: null, telephone: null, adresse: null });
              proceedWithStockCreation(newId, false);
            },
            error: (error) => {
              this.isSubmitting = false;
              console.error('Supplier creation failed', error, error?.error);
              const messages: string[] = [];
              const apiMessage = error?.error?.message;
              if (apiMessage) messages.push(String(apiMessage));
              const backendErrors = error?.error?.errors || (apiMessage ? null : error?.error);
              if (backendErrors) {
                if (typeof backendErrors === 'object') {
                  Object.values(backendErrors).forEach((val: any) => {
                    if (Array.isArray(val) && val.length) messages.push(String(val[0]));
                    else if (val != null) messages.push(String(val));
                  });
                } else if (typeof backendErrors === 'string') {
                  messages.push(backendErrors);
                }
              }
              if (!messages.length && error?.message) messages.push(String(error.message));
              if (messages.length) this.notify.error(messages.join('\n'));
              else this.notify.error('Erreur lors de la création du fournisseur');
            },
          });
        } else {
          proceedWithStockCreation(resolvedSupplierId, mustDeferSupplierCreation, newSupplierPayload);
        }
      });
  }

  // Helpers
  get article_id() { return this.form.get('article_id'); }
  get fournisseur_id() { return this.form.get('fournisseur_id'); }
  get quantite() { return this.form.get('quantite'); }
  get prix_unitaire() { return this.form.get('prix_unitaire'); }
}
