import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../../services/cart.service';
import { environment } from '../../../environment';
import { map, take } from 'rxjs/operators';
import { Observable, Subscription, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArticlesService } from '../../../services/gescom/articles.service';
import { VentesService } from '../../../services/gescom/ventes.service';
import { NotifyService } from '../../../services/notify.service';
import { ClientsService } from '../../../services/gescom/clients.service';
import { StoreVenteDto } from '../../../interfaces/gescom/vente.model';
import { ImageCacheService } from '../../../services/image-cache.service';
import Swal from 'sweetalert2';
import { ExportService } from '../../../services/export.service';
import { GenericTableComponent, GenericTableColumn, ColumnTemplateDirective } from '../../ui-components/tables/generic-table.component';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatInputModule, FormsModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, GenericTableComponent, ColumnTemplateDirective, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class AppCartComponent implements OnDestroy {
  @ViewChild('cartTable') table?: GenericTableComponent;
  
  cartItems: CartItem[] = [];
  items$!: Observable<CartItem[]>;
  total$!: Observable<number>;
  defaultImage = 'assets/images/products/Product.png';
  apiUrl = environment.apiBaseUrl;
  apiHostBase = this.apiUrl.replace(/\/?api\/?$/, '');
  private photoUrlCache = new Map<number, string>();
  
  // Colonnes du tableau
  cartColumns: GenericTableColumn[] = [
    { key: 'produit', label: 'Produit', type: 'custom' },
    { key: 'price', label: 'Prix unitaire', type: 'custom', align: 'end' },
    { key: 'quantity', label: 'Quantité', type: 'custom', align: 'center' },
    { key: 'discount', label: 'Remise', type: 'custom', align: 'center' },
    { key: 'total', label: 'Total', type: 'custom', align: 'end' },
  ];
  
  // DataLoader pour le GenericTable
  dataLoader = () => of([...this.cartItems]);
  // Client selection
  clientForm!: FormGroup;
  clients: Array<{ id: number; nom: string }> = [];
  loading = false;
  clientMode: 'existing' | 'new' = 'existing';
  
  // Remises
  globalDiscount$!: Observable<{ value: number; type: 'percent' | 'fixed' }>;
  subtotalBeforeDiscount$!: Observable<number>;
  totalAfterDiscount$!: Observable<number>;
  globalDiscountType: 'percent' | 'fixed' = 'percent';
  globalDiscountValue: number = 0;

  private itemsSub?: Subscription;

  constructor(
    public cart: CartService,
    private imageCache: ImageCacheService,
    private ventesService: VentesService,
    private notify: NotifyService,
    private clientsService: ClientsService,
    private articlesService: ArticlesService,
    private fb: FormBuilder,
    private exportService: ExportService
  ) {}
  ngOnInit(): void {
    this.items$ = this.cart.items$;
    this.globalDiscount$ = this.cart.globalDiscount$;
    
    // Calcul du sous-total avant remise globale
    this.subtotalBeforeDiscount$ = this.items$.pipe(
      map((items) => items.reduce((acc, it) => acc + this.getLineTotalAfterDiscount(it), 0))
    );
    
    // Calcul du total final après remise globale
    this.total$ = this.subtotalBeforeDiscount$.pipe(
      map((subtotal) => {
        const globalDiscount = this.cart.getGlobalDiscount();
        if (globalDiscount.type === 'percent') {
          return subtotal * (1 - globalDiscount.value / 100);
        } else {
          return Math.max(0, subtotal - globalDiscount.value);
        }
      })
    );

    this.itemsSub = this.items$.subscribe((items) => {
      this.cartItems = items;
      this.preloadCartPhotos(items);
      this.scheduleTableReload();
    });

    // Initialize client form
    this.clientForm = this.fb.group({
      selectedClient: [null],
      newClientName: ['', [Validators.required, Validators.minLength(2)]]
    });

    // Load clients
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.itemsSub?.unsubscribe();
    for (const url of this.photoUrlCache.values()) {
      try { URL.revokeObjectURL(url); } catch {}
    }
    this.photoUrlCache.clear();
  }

  inc(item: CartItem) {
    this.cart.changeQty(item.id, 1);
    this.cart.setLineTotalOverride(item.id, null);
  }

  async dec(item: CartItem) {
    if (item.quantity <= 1) {
      const result = await Swal.fire({
        title: 'Retirer l\'article ?',
        text: 'La quantité va passer à zéro et l\'article sera retiré du panier.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, retirer',
        cancelButtonText: 'Annuler',
      });
      if (!result.isConfirmed) {
        this.scheduleTableReload();
        return;
      }
      this.cart.removeItem(item.id);
      return;
    }
    this.cart.changeQty(item.id, -1);
    this.cart.setLineTotalOverride(item.id, null);
  }

  async onQtyInput(item: CartItem, value: string) {
    const n = Number(value);
    if (isNaN(n)) {
      this.scheduleTableReload();
      return;
    }
    if (n <= 0) {
      const result = await Swal.fire({
        title: 'Quantité invalide',
        text: 'Mettre 0 retirera l\'article du panier. Confirmez-vous ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, retirer',
        cancelButtonText: 'Annuler',
      });
      if (result.isConfirmed) {
        this.cart.removeItem(item.id);
      } else {
        this.scheduleTableReload();
      }
      return;
    }
    this.cart.setQty(item.id, n);
    this.cart.setLineTotalOverride(item.id, null);
  }

  onUnitPriceInput(item: CartItem, value: string) {
    const n = Number(value);
    if (isNaN(n)) return;
    this.cart.setUnitPrice(item.id, n);
    // Reset custom total when unit price changes so it reflects qty × new price unless user overrides again
    this.cart.setLineTotalOverride(item.id, null);
  }

  onLineTotalInput(item: CartItem, value: string) {
    if (value === '') {
      this.cart.setLineTotalOverride(item.id, null);
      return;
    }
    const n = Number(value);
    if (isNaN(n)) return;
    this.cart.setLineTotalOverride(item.id, n);
  }

  remove(item: CartItem) {
    this.cart.removeItem(item.id);
  }

  private scheduleTableReload(): void {
    if (!this.table) {
      return;
    }
    Promise.resolve().then(() => this.table?.reload());
  }

  clear() { 
    this.cart.clear();
    this.cart.clearAllDiscounts();
  }

  // Client methods
  loadClients() {
    this.clientsService.all().subscribe({
      next: (clients) => {
        this.clients = clients.map(c => ({ id: c.id!, nom: c.nom }));
      },
      error: (error) => {
        console.error('Failed to load clients:', error);
        // Fallback to empty array
        this.clients = [];
      }
    });
  }

  createClient() {
    const newClientName = this.clientForm.value.newClientName?.trim();
    if (!newClientName) return;

    this.clientsService.create({ nom: newClientName }).subscribe({
      next: (newClient) => {
        this.clients.push({ id: newClient.id!, nom: newClient.nom });
        // Switch to existing client mode and select the newly created client
        this.clientMode = 'existing';
        this.clientForm.patchValue({
          selectedClient: newClient.id,
          newClientName: ''
        });
        this.notify.success('Client créé avec succès');
      },
      error: (error) => {
        console.error('Failed to create client:', error);
        this.notify.error('Erreur lors de la création du client');
      }
    });
  }

  setClientMode(mode: 'existing' | 'new') {
    this.clientMode = mode;
    if (mode === 'existing') {
      this.clientForm.patchValue({ selectedClient: null, newClientName: '' });
    } else {
      this.clientForm.patchValue({ selectedClient: null, newClientName: '' });
    }
  }

  validateSale() {
    this.items$.pipe(take(1)).subscribe((items) => {
      if (!items.length) {
        this.notify.error('Le panier est vide');
        return;
      }
      const selectedClient = this.clientForm.value.selectedClient;

      if (this.clientMode !== 'existing') {
        this.notify.error('Veuillez sélectionner un client existant pour enregistrer la vente.');
        return;
      }

      if (!selectedClient) {
        this.notify.error('Veuillez sélectionner un client.');
        return;
      }

      // Vérifier que tous les items ont des IDs valides
      const invalidItems = items.filter(item => !item.id || item.id <= 0);
      if (invalidItems.length > 0) {
        console.error('[Cart] Invalid items without proper stock ID:', invalidItems);
        this.notify.error(`${invalidItems.length} article(s) du panier ont des IDs invalides. Veuillez les retirer.`);
        return;
      }

      // Le backend crée automatiquement tous les snapshots
      const payloads: StoreVenteDto[] = items.map((item) => {
        const montant = this.getLineTotal(item);
        return {
          stock_id: item.id,
          client_id: selectedClient,
          quantite: item.quantity,
          montant: montant,
          description: null
        };
      });

      // Validation avant envoi
      const invalidPayloads = payloads.filter(p => 
        !p.stock_id || !p.client_id || !p.quantite || p.quantite < 1 || !Number.isFinite(p.montant) || p.montant < 0
      );
      
      if (invalidPayloads.length > 0) {
        console.error('[Cart] Invalid payloads detected:', invalidPayloads);
        this.notify.error('Certains articles du panier ont des données invalides');
        return;
      }

      console.log('[Cart] Sending ventes batch:', payloads);
      this.loading = true;
      
      // Utiliser createBatch pour de meilleures performances (1 seule requête)
      this.ventesService.createBatch(payloads).subscribe({
        next: (response) => {
          this.loading = false;
          const count = response?.data?.length ?? payloads.length;
          
          // Générer le PDF de vente avant de vider le panier
          this.generateSalePDF(items, selectedClient);
          
          // Vider le panier et les remises
          this.cart.clear();
          this.cart.clearAllDiscounts();
          
          // Mettre à jour le tableau
          this.cartItems = [];
          
          this.notify.success(`${count} vente(s) enregistrée(s) avec succès`);
        },
        error: (error) => {
          this.loading = false;
          console.error('[Cart] Sale validation error:', error);
          console.error('[Cart] Error details:', {
            status: error?.status,
            statusText: error?.statusText,
            message: error?.error?.message,
            errors: error?.error?.errors,
            fullError: error
          });
          
          if (error?.status === 422) {
            const messages = this.extractValidationMessages(error);
            this.notify.error(messages || 'Données invalides pour la vente');
          } else if (error?.status === 400) {
            const message = error?.error?.message || 'Requête invalide';
            // Détecter les stocks inexistants
            if (message.includes('No query results for model') && message.includes('Stock')) {
              const match = message.match(/Stock.*?(\d+)/);
              const stockId = match ? match[1] : null;
              if (stockId) {
                this.notify.error(`Le stock #${stockId} n'existe plus. Article retiré du panier.`);
                // Retirer automatiquement l'article du panier
                this.cart.removeItem(parseInt(stockId));
              } else {
                this.notify.error('Un ou plusieurs articles du panier n\'existent plus.');
              }
            } else {
              this.notify.error(`Erreur 400: ${message}`);
            }
          } else {
            this.notify.error('Erreur lors de l\'enregistrement de la vente');
          }
        }
      });
    });
  }

  private extractValidationMessages(error: any): string | null {
    const errors = error?.error?.errors;
    if (!errors || typeof errors !== 'object') return null;
    const msgs = Object.values(errors).flat().filter(Boolean);
    return msgs.length ? msgs.join('\n') : null;
  }

  getLineTotal(item: CartItem): number {
    const override = item.lineTotalOverride;
    if (override != null && !isNaN(override)) {
      return override;
    }
    const price = Number.isFinite(item.price) ? item.price : 0;
    const qty = Number.isFinite(item.quantity) ? item.quantity : 0;
    return price * qty;
  }

  getLineBaseTotal(item: CartItem): number {
    const price = Number.isFinite(item.price) ? item.price : 0;
    const qty = Number.isFinite(item.quantity) ? item.quantity : 0;
    const override = item.lineTotalOverride;
    return override != null && !isNaN(override) ? override : price * qty;
  }

  /**
   * Calcule le total de ligne après remise
   */
  getLineTotalAfterDiscount(item: CartItem): number {
    const baseTotal = this.getLineTotal(item);
    if (!item.discount || item.discount <= 0) return baseTotal;
    
    if (item.discountType === 'percent') {
      return baseTotal * (1 - item.discount / 100);
    } else {
      return Math.max(0, baseTotal - item.discount);
    }
  }

  getLineDiscountAmount(item: CartItem): number {
    const baseTotal = this.getLineTotal(item);
    const netTotal = this.getLineTotalAfterDiscount(item);
    return Math.max(0, baseTotal - netTotal);
  }

  /**
   * Gère le changement de remise par ligne
   */
  onLineDiscountChange(item: CartItem, value: string, type: 'percent' | 'fixed') {
    const numValue = Number(value) || 0;
    this.cart.setLineDiscount(item.id, numValue, type);
  }

  /**
   * Ouvre un dialog pour saisir une remise personnalisée
   */
  async setCustomLineDiscount(item: CartItem) {
    const currentType = item.discountType ?? 'percent';
    const currentValue = item.discount ?? 0;
    const baseTotal = this.getLineBaseTotal(item);
    const currentNet = this.getLineTotalAfterDiscount(item);

    const { value: formValues } = await Swal.fire({
      title: 'Remise personnalisée',
      html: `
        <div class="swal-discount-dialog" style="text-align: left;">
          <div class="swal-discount-header">
            <div class="swal-discount-article">
              <span class="label">Article</span>
              <span class="value">${item.articleName || item.uname}</span>
            </div>
            <div class="swal-discount-summary">
              <span class="label">Total actuel</span>
              <span class="value">${this.formatPriceShort(currentNet)}</span>
              <small class="baseline">Avant remise: ${this.formatPriceShort(baseTotal)}</small>
              <span class="label">Projection</span>
              <span class="value value-preview">${this.formatPriceShort(currentNet)}</span>
            </div>
          </div>
          <div class="swal-discount-body">
            <div class="swal-field-group">
              <label>Type de remise</label>
              <select id="discount-type" class="swal2-input swal2-input-select">
                <option value="percent" ${currentType === 'percent' ? 'selected' : ''}>Pourcentage (%)</option>
                <option value="fixed" ${currentType === 'fixed' ? 'selected' : ''}>Montant fixe (XOF)</option>
              </select>
            </div>
            <div class="swal-field-group">
              <label>Valeur</label>
              <input
                id="discount-value"
                type="number"
                min="0"
                step="0.01"
                class="swal2-input"
                value="${currentValue || ''}"
                placeholder="Entrez la valeur"
              />
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Appliquer',
      cancelButtonText: 'Annuler',
      customClass: {
        popup: 'swal2-discount-popup',
        confirmButton: 'swal2-confirm-elevated',
        cancelButton: 'swal2-cancel-elevated',
      },
      didOpen: () => {
        const typeEl = document.getElementById('discount-type') as HTMLSelectElement | null;
        const valueEl = document.getElementById('discount-value') as HTMLInputElement | null;
        const updatePreview = () => {
          if (!typeEl || !valueEl) {
            return;
          }
          const type = typeEl.value as 'percent' | 'fixed';
          const rawValue = parseFloat(valueEl.value || '0');
          const discount = !isNaN(rawValue) ? Math.max(0, rawValue) : 0;
          const cappedDiscount = type === 'percent' ? Math.min(discount, 100) : Math.min(discount, baseTotal);
          const previewAmount = type === 'percent'
            ? baseTotal * (1 - cappedDiscount / 100)
            : Math.max(0, baseTotal - cappedDiscount);
          const previewEl = document.querySelector('.swal-discount-summary .value-preview');
          if (previewEl) {
            previewEl.textContent = this.formatPriceShort(previewAmount);
          }
        };
        typeEl?.addEventListener('change', updatePreview);
        valueEl?.addEventListener('input', updatePreview);
        updatePreview();
      },
      preConfirm: () => {
        const type = (document.getElementById('discount-type') as HTMLSelectElement).value as 'percent' | 'fixed';
        const rawValue = (document.getElementById('discount-value') as HTMLInputElement).value;
        const value = parseFloat(rawValue);
        if (isNaN(value) || value < 0) {
          Swal.showValidationMessage('Veuillez entrer une valeur valide');
          return null;
        }
        if (type === 'percent' && value > 100) {
          Swal.showValidationMessage('La remise en pourcentage ne peut pas dépasser 100%.');
          return null;
        }
        if (type === 'fixed' && value > baseTotal) {
          Swal.showValidationMessage('La remise fixe dépasse le total de la ligne.');
          return null;
        }
        return { type, value };
      }
    });

    if (formValues) {
      this.cart.setLineDiscount(item.id, formValues.value, formValues.type);
      this.notify.successToast('Remise appliquée');
    }
  }

  /**
   * Applique une remise globale sur l'ensemble du panier
   */
  async setGlobalDiscount() {
    const { value: formValues } = await Swal.fire({
      title: 'Remise globale',
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 20px; color: #666;">Cette remise s'applique au sous-total du panier</p>
          <div style="margin: 20px 0;">
            <label style="display: block; margin-bottom: 5px;">Type de remise:</label>
            <select id="global-discount-type" class="swal2-input" style="width: 100%;">
              <option value="percent">Pourcentage (%)</option>
              <option value="fixed">Montant fixe (XOF)</option>
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px;">Valeur:</label>
            <input id="global-discount-value" type="number" min="0" step="0.01" class="swal2-input" placeholder="Entrez la valeur" style="width: 100%;">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Appliquer',
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const type = (document.getElementById('global-discount-type') as HTMLSelectElement).value as 'percent' | 'fixed';
        const value = parseFloat((document.getElementById('global-discount-value') as HTMLInputElement).value);
        if (isNaN(value) || value < 0) {
          Swal.showValidationMessage('Veuillez entrer une valeur valide');
          return null;
        }
        return { type, value };
      }
    });

    if (formValues) {
      this.cart.setGlobalDiscount(formValues.value, formValues.type);
      this.notify.successToast('Remise globale appliquée');
    }
  }

  /**
   * Réinitialise toutes les remises
   */
  clearAllDiscounts() {
    this.cart.clearAllDiscounts();
    this.notify.successToast('Remises supprimées');
  }

  /**
   * Génère un PDF de la vente avec logo entreprise et toutes les informations
   */
  generateSalePDF(items: CartItem[], clientId: number): void {
    const client = this.clients.find(c => c.id === clientId);
    const clientName = client ? client.nom : 'Client inconnu';
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const timeStr = now.toLocaleTimeString('fr-FR');
    
    // Calcul des totaux
    const globalDiscount = this.cart.getGlobalDiscount();
    let subtotal = 0;
    
    // Préparer les colonnes
    const columns = [
      { key: 'article', label: 'Article', format: (val: any) => String(val || '') },
      { key: 'prix_unitaire', label: 'Prix Unit.', format: (val: any) => String(val || '') },
      { key: 'quantite', label: 'Qtt', format: (val: any) => String(val || '') },
      { key: 'remise', label: 'Remise', format: (val: any) => String(val || '') },
      { key: 'total_ht', label: 'Total HT', format: (val: any) => String(val || '') },
      { key: 'total_remise', label: 'Total', format: (val: any) => String(val || '') }
    ];

    // Préparer les données
    const data = items.map(item => {
      const baseTotal = this.getLineTotal(item);
      const totalAfterDiscount = this.getLineTotalAfterDiscount(item);
      subtotal += totalAfterDiscount;
      
      let remiseStr = '-';
      if (item.discount && item.discount > 0) {
        if (item.discountType === 'percent') {
          remiseStr = `${item.discount}%`;
        } else {
          remiseStr = this.formatPriceShort(item.discount);
        }
      }
      
      // Construire le nom complet avec article + famille
      let articleComplet = item.articleName || item.uname;
      if (item.familleName) {
        articleComplet += ` (${item.familleName})`;
      }
      
      return {
        article: articleComplet,
        prix_unitaire: this.formatPriceShort(item.price),
        quantite: item.quantity.toString(),
        remise: remiseStr,
        total_ht: this.formatPriceShort(baseTotal),
        total_remise: this.formatPriceShort(totalAfterDiscount)
      };
    });

    // Calcul de la remise globale
    let globalDiscountAmount = 0;
    if (globalDiscount.value > 0) {
      if (globalDiscount.type === 'percent') {
        globalDiscountAmount = subtotal * (globalDiscount.value / 100);
      } else {
        globalDiscountAmount = globalDiscount.value;
      }
    }
    
    const totalFinal = Math.max(0, subtotal - globalDiscountAmount);

    // Ajouter les lignes de totaux
    data.push(
      { article: '', prix_unitaire: '', quantite: '', remise: '', total_ht: 'Sous-total:', total_remise: this.formatPriceShort(subtotal) }
    );
    
    if (globalDiscountAmount > 0) {
      const globalDiscountLabel = globalDiscount.type === 'percent' 
        ? `Remise globale (${globalDiscount.value}%):` 
        : 'Remise globale:';
      data.push(
        { article: '', prix_unitaire: '', quantite: '', remise: '', total_ht: globalDiscountLabel, total_remise: `-${this.formatPriceShort(globalDiscountAmount)}` }
      );
    }
    
    data.push(
      { article: '', prix_unitaire: '', quantite: '', remise: '', total_ht: 'TOTAL FINAL:', total_remise: this.formatPriceShort(totalFinal) }
    );

    // Utiliser le service d'export avec en-tête générique entreprise
    const title = `REÇU DE VENTE\n\nClient: ${clientName}\nDate: ${dateStr} à ${timeStr}`;
    
    this.exportService.exportToPDF({
      filename: `GESCOM_Vente_${clientName.replace(/\s+/g, '_')}_${now.getTime()}`,
      columns: columns,
      data: data,
      title: title
    });
  }

  /**
   * Précharge les photos des articles du panier
   */
  private preloadCartPhotos(items: CartItem[]): void {
    const idsToFetch = items
      .map(it => (typeof it.id === 'number' ? it.id : null))
      .filter((id): id is number => typeof id === 'number' && !this.photoUrlCache.has(id));
    if (!idsToFetch.length) return;
    console.debug('[Cart] Preloading photos for article IDs:', idsToFetch);
    idsToFetch.forEach(id => {
      const imageUrl = `${this.apiUrl}/articles/${id}/photo`;
      this.imageCache.getImage(imageUrl, this.defaultImage).subscribe({
        next: (objectUrl) => {
          const prev = this.photoUrlCache.get(id);
          if (prev && prev.startsWith('blob:')) { 
            try { URL.revokeObjectURL(prev); } catch {} 
          }
          this.photoUrlCache.set(id, objectUrl);
          console.debug(`[Cart] Photo preloaded for article ${id}`);
        },
        error: (err) => {
          console.debug(`[Cart] No photo for article ${id} or fetch failed`, err);
        }
      });
    });
  }

  // Résout l'URL d'image pour un item du panier
  getCartItemImageUrl(it: CartItem): string {
    try {
      if (it.id != null && this.photoUrlCache.has(it.id)) {
        const cached = this.photoUrlCache.get(it.id)!;
        console.debug('[Cart] Image URL (cached blob):', cached);
        return cached;
      }
      const path = it.imagePath;
      if (!path) return this.defaultImage;
      if (path.startsWith('http') || path.startsWith('assets/') || path.startsWith('blob:')) {
        console.debug('[Cart] Image URL (absolute/assets/blob):', path);
        return path;
      }
      const clean = path.startsWith('/') ? path : `/${path}`;
      if (clean.startsWith('/storage/')) {
        const url = `${this.apiHostBase}${clean}`;
        console.debug('[Cart] Image URL (storage):', url);
        return url;
      }
      const url = `${this.apiUrl}${clean}`;
      console.debug('[Cart] Image URL (api-rel):', url);
      return url;
    } catch (e) {
      console.warn('[Cart] Image URL error, fallback to default:', e);
      return this.defaultImage;
    }
  }

  /**
   * Formate le prix en CFA (complet) - même logique que le tableau des articles
   */
  formatPrice(price: number | string | null | undefined): string {
    return this.articlesService.formatPrice(price);
  }

  /**
   * Formate le prix de façon simplifiée - même logique que le tableau des articles
   */
  formatPriceShort(price: number | string | null | undefined): string {
    return this.articlesService.formatPriceShort(price);
  }
}
