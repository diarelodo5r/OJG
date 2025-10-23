import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GoogleAuthService } from '../../services/gescom/google-auth.service';
import { LibraryService } from '../../services/gescom/library.service';
import { MediaFilter, MediaItem, MediaType } from '../../interfaces/gescom/library.models';

type ViewMode = 'grid' | 'list';
type ListSortKey = 'name' | 'modified' | 'type' | 'size';

type SortKey = 'recent' | 'oldest' | 'az' | 'za';

interface MediaTab {
  type: MediaFilter;
  label: string;
  icon: string;
}

interface SortOption {
  key: SortKey;
  label: string;
  icon: string;
}

interface DriveListOptions {
  folderKey?: string;
  search?: string;
  pageToken?: string;
  pageSize?: number;
  orderBy?: string;
}

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTabsModule, MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatPaginatorModule],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss'],
})
export class LibraryComponent implements OnInit, OnDestroy {
  mediaTabs: MediaTab[] = [
    { type: 'all', label: 'Tous les fichiers', icon: 'solar:library-line-duotone' },
    { type: 'images', label: 'Images', icon: 'solar:gallery-wide-line-duotone' },
    { type: 'videos', label: 'Vidéos', icon: 'solar:clapperboard-play-line-duotone' },
    { type: 'audio', label: 'Audios', icon: 'solar:music-note-3-line-duotone' },
    { type: 'documents', label: 'Documents', icon: 'solar:document-add-line-duotone' },
  ];

  mediaItems: MediaItem[] = [];
  viewMode: ViewMode = 'grid';
  searchTerm = '';
  pageSize = 9;
  listSortKey: ListSortKey = 'name';
  listSortDirection: 'asc' | 'desc' = 'asc';
  pageSizeOptions: number[] = [6, 9, 12, 24];
  pageIndexMap: Record<MediaFilter, number> = {
    all: 0,
    images: 0,
    videos: 0,
    audio: 0,
    documents: 0,
  };

  sortOptions: SortOption[] = [
    { key: 'recent', label: 'Plus récents', icon: 'solar:clock-circle-line-duotone' },
    { key: 'oldest', label: 'Plus anciens', icon: 'solar:history-line-duotone' },
    { key: 'az', label: 'A → Z', icon: 'solar:sort-by-alphabet-line-duotone' },
    { key: 'za', label: 'Z → A', icon: 'solar:sort-by-alphabet-inverse-line-duotone' },
  ];

  currentSort: SortKey = 'recent';
  isLoading = false;
  activeTab: MediaFilter = 'all';
  nextPageToken: string | null = null;
  authSub?: Subscription;
  private readonly previewUrlCache = new Map<string, SafeResourceUrl>();

  constructor(
    private readonly paginatorIntl: MatPaginatorIntl,
    private readonly libraryService: LibraryService,
    public readonly googleAuthService: GoogleAuthService,
    private readonly sanitizer: DomSanitizer,
  ) {
    this.configurePaginatorLabels();
  }

  async ngOnInit(): Promise<void> {
    this.authSub = this.googleAuthService.isSignedIn$.subscribe((isSignedIn) => {
      if (isSignedIn && this.mediaItems.length === 0) {
        void this.checkAndInitializeLibrary();
      }
    });
    // Do not auto-trigger Google consent here to avoid popup blocking by the browser.
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  async connectGoogle(): Promise<void> {
    // Check if Google client is ready FIRST, before any state changes
    if (!this.googleAuthService.isClientReady()) {
      alert('Google client is still initializing. Please wait a moment and try again.');
      return;
    }
    
    // Call signIn() IMMEDIATELY to preserve user gesture chain
    // Do NOT set any state or await anything before this call
    const signInPromise = this.googleAuthService.signIn();
    
    // Now we can set loading state and await the result
    try {
      this.isLoading = true;
      await signInPromise;
      await this.checkAndInitializeLibrary();
    } catch (error: any) {
      console.error('Error connecting to Google:', error);
      alert(error?.message || 'Failed to connect to Google. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Charger la bibliothèque depuis l'API publique (sans OAuth)
   * Utilisé comme solution de contournement si le popup Google est bloqué
   */
  async loadFromPublicApi(): Promise<void> {
    try {
      this.isLoading = true;
      console.log('🔄 Chargement depuis l\'API publique...');
      
      // Récupérer les contenus depuis l'API publique
      const contenus = await this.libraryService.getContenus(this.activeTab === 'all' ? undefined : this.activeTab as MediaType);
      console.log('✅ Contenus récupérés:', contenus.length, 'éléments');
      console.log('📊 Données:', contenus);
      
      // Convertir en MediaItems
      this.mediaItems = contenus.map(c => this.libraryService.contenuToMediaItem(c));
      console.log('✅ MediaItems convertis:', this.mediaItems.length);
      console.log('📊 MediaItems:', this.mediaItems);
      
      this.nextPageToken = null;
      this.pageIndexMap[this.activeTab] = 0;
      
      console.log('✅ Chargement terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du chargement depuis l\'API publique:', error);
      this.mediaItems = [];
      this.nextPageToken = null;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Vérifier si la bibliothèque est initialisée et la charger
   * Sinon, proposer l'initialisation
   */
  async checkAndInitializeLibrary(): Promise<void> {
    try {
      const isInitialized = await this.libraryService.isLibraryInitialized();
      if (isInitialized) {
        await this.loadLibrary();
      } else {
        console.log('Bibliothèque non initialisée. Initialisation en cours...');
        // Vous pouvez afficher un message à l'utilisateur ici
        // Pour l'instant, on initialise automatiquement
        await this.initializeLibrary();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la bibliothèque:', error);
      // En cas d'erreur, essayer de charger normalement
      await this.loadLibrary();
    }
  }

  /**
   * Initialiser complètement la bibliothèque
   * 1. Créer la structure des dossiers dans Firestore
   * 2. Synchroniser tous les fichiers Drive
   */
  async initializeLibrary(): Promise<void> {
    try {
      this.isLoading = true;
      console.log('Étape 1: Initialisation de la structure des dossiers...');
      const result = await this.libraryService.initializeLibrary();
      
      console.log('✓ Dossiers initialisés:', result.dossiers.length);
      console.log('✓ Contenus synchronisés:', result.contenus);
      
      // Charger la bibliothèque après initialisation
      await this.loadLibrary();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la bibliothèque:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Synchroniser manuellement tous les contenus
   */
  async syncAllMedia(): Promise<void> {
    try {
      this.isLoading = true;
      console.log('Synchronisation de tous les médias...');
      const result = await this.libraryService.syncAllContenus();
      
      console.log('✓ Synchronisation terminée:', result);
      
      // Recharger la bibliothèque
      await this.loadLibrary();
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Synchroniser un type spécifique de média
   */
  async syncMediaType(type: MediaFilter): Promise<void> {
    if (type === 'all') {
      await this.syncAllMedia();
      return;
    }

    try {
      this.isLoading = true;
      console.log(`Synchronisation de ${type}...`);
      const contenus = await this.libraryService.syncContenus(type as MediaType);
      
      console.log(`✓ ${contenus.length} éléments synchronisés pour ${type}`);
      
      // Recharger la bibliothèque
      await this.loadLibrary(type);
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${type}:`, error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async loadLibrary(tab: MediaFilter = this.activeTab, search: string = this.searchTerm, pageToken?: string | null): Promise<void> {
    this.isLoading = true;
    this.activeTab = tab;
    
    try {
      console.log('🔄 Chargement de la bibliothèque...');
      console.log('📋 Paramètres:', { tab, search, pageToken });
      
      // Essayer de charger depuis l'API publique d'abord (sans OAuth)
      const contenus = await this.libraryService.getContenus(tab === 'all' ? undefined : tab as MediaType);
      console.log('✅ Contenus récupérés depuis l\'API:', contenus.length, 'éléments');
      
      // Filtrer par recherche si nécessaire
      let filteredContenus = contenus;
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        filteredContenus = contenus.filter(c => 
          c.nom.toLowerCase().includes(searchLower)
        );
        console.log('🔍 Filtrage par recherche:', filteredContenus.length, 'résultats');
      }
      
      // Convertir en MediaItems
      this.mediaItems = filteredContenus.map(c => this.libraryService.contenuToMediaItem(c));
      console.log('✅ MediaItems convertis:', this.mediaItems.length);
      console.log('📊 Données complètes:', this.mediaItems);
      
      this.nextPageToken = null;
      this.pageIndexMap[tab] = 0;
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la médiathèque:', error);
      console.error('📋 Détails de l\'erreur:', error);
      this.mediaItems = [];
      this.nextPageToken = null;
    } finally {
      this.isLoading = false;
    }
  }

  async loadMore(): Promise<void> {
    if (!this.nextPageToken || this.isLoading) {
      return;
    }
    await this.loadLibrary(this.activeTab, this.searchTerm, this.nextPageToken);
  }

  private buildDriveOptions(tab: MediaFilter, search: string, pageToken?: string | null): DriveListOptions {
    const trimmedSearch = search.trim();
    const options: DriveListOptions = {
      folderKey: this.mapTabToFolder(tab),
      orderBy: this.getDriveOrderBy(),
    };

    if (trimmedSearch) {
      options.search = trimmedSearch;
    }

    if (pageToken ?? undefined) {
      options.pageToken = pageToken ?? undefined;
    }

    return options;
  }

  private getDriveOrderBy(): string {
    switch (this.currentSort) {
      case 'oldest':
        return 'modifiedTime';
      case 'az':
        return 'name';
      case 'za':
        return 'name desc';
      default:
        return 'modifiedTime desc';
    }
  }

  private mapTabToFolder(tab: MediaFilter): string | undefined {
    const mapping: Record<MediaFilter, string | undefined> = {
      all: undefined,
      images: 'images',
      videos: 'videos',
      audio: 'audio',
      documents: 'documents',
    };

    return mapping[tab];
  }

  async onTabChange(event: MatTabChangeEvent): Promise<void> {
    const tab = this.mediaTabs[event.index]?.type ?? 'all';
    await this.loadLibrary(tab, this.searchTerm);
  }

  async onSearchChange(value: string): Promise<void> {
    this.searchTerm = value;
    await this.loadLibrary(this.activeTab, this.searchTerm);
  }

  clearSearch(): void {
    if (!this.searchTerm) {
      return;
    }
    this.searchTerm = '';
    void this.loadLibrary(this.activeTab, this.searchTerm);
  }

  async onRename(item: MediaItem): Promise<void> {
    const newName = prompt('Renommer le fichier', item.title)?.trim();
    if (!newName || newName === item.title) {
      return;
    }
    try {
      this.isLoading = true;
      const updated = await this.libraryService.renameContenu(item.id, newName);
      const updatedItem = this.libraryService.contenuToMediaItem(updated);
      this.mediaItems = this.mediaItems.map((media) => (media.id === item.id ? updatedItem : media));
    } catch (error) {
      console.error('Erreur lors du renommage :', error);
      alert('Impossible de renommer ce fichier pour le moment.');
    } finally {
      this.isLoading = false;
    }
  }

  async onDelete(item: MediaItem): Promise<void> {
    if (!confirm(`Supprimer définitivement "${item.title}" ?`)) {
      return;
    }
    try {
      this.isLoading = true;
      await this.libraryService.deleteContenu(item.id);
      this.mediaItems = this.mediaItems.filter(media => media.id !== item.id);
    } catch (error) {
      console.error('Erreur lors de la suppression :', error);
      alert('La suppression a échoué.');
    } finally {
      this.isLoading = false;
    }
  }

  async onFilesSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement | null;
    if (!target?.files?.length) {
      return;
    }
    await this.handleUpload(Array.from(target.files));
    target.value = '';
  }

  async handleUpload(files: File[]): Promise<void> {
    if (!files.length) {
      return;
    }
    try {
      this.isLoading = true;
      for (const file of files) {
        await this.libraryService.uploadFile(file, { folderKey: this.mapTabToFolder(this.activeTab) });
      }
      await this.loadLibrary(this.activeTab, this.searchTerm);
    } catch (error) {
      console.error('Erreur lors du téléversement :', error);
    } finally {
      this.isLoading = false;
    }
  }

  getFilteredItems(filter: MediaFilter): MediaItem[] {
    const items = filter === 'all' ? [...this.mediaItems] : this.mediaItems.filter((item) => item.type === filter);
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = term
      ? items.filter((item) =>
          item.title.toLowerCase().includes(term) || item.description.toLowerCase().includes(term),
        )
      : items;
    return this.sortItems(filtered);
  }

  private sortItems(items: MediaItem[]): MediaItem[] {
    const sorted = [...items].sort((a, b) => {
      switch (this.currentSort) {
        case 'oldest':
          return a.uploadedAt.getTime() - b.uploadedAt.getTime();
        case 'az':
          return a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
        case 'za':
          return b.title.localeCompare(a.title, 'fr', { sensitivity: 'base' });
        default:
          return b.uploadedAt.getTime() - a.uploadedAt.getTime();
      }
    });

    if (this.viewMode === 'list') {
      return this.sortListItems(sorted);
    }

    return sorted;
  }

  getPagedItems(filter: MediaFilter, items?: MediaItem[]): MediaItem[] {
    const source = items ?? this.getFilteredItems(filter);
    const pageIndex = this.getPageIndex(filter);
    const start = pageIndex * this.pageSize;
    return source.slice(start, start + this.pageSize);
  }

  getTypeLabel(type: MediaType): string {
    switch (type) {
      case 'images':
        return 'Image';
      case 'videos':
        return 'Vidéo';
      case 'audio':
        return 'Audio';
      case 'documents':
        return 'Document';
      default:
        return 'Fichier';
    }
  }

  getTypeIcon(type: MediaType): string {
    switch (type) {
      case 'images':
        return 'solar:gallery-wide-line-duotone';
      case 'videos':
        return 'solar:clapperboard-play-line-duotone';
      case 'audio':
        return 'solar:music-note-3-line-duotone';
      case 'documents':
        return 'solar:document-line-duotone';
      default:
        return 'solar:folder-line-duotone';
    }
  }

  getPreviewLink(item: MediaItem): string | undefined {
    return item.previewUrl ?? item.viewUrl ?? item.downloadUrl;
  }

  getDownloadLink(item: MediaItem): string | undefined {
    return item.downloadUrl ?? item.previewUrl ?? item.viewUrl;
  }

  getEmbeddedPreview(item: MediaItem): SafeResourceUrl | undefined {
    const url = this.getPreviewLink(item);
    if (!url) {
      return undefined;
    }
    if (!this.previewUrlCache.has(url)) {
      this.previewUrlCache.set(url, this.sanitizer.bypassSecurityTrustResourceUrl(url));
    }
    return this.previewUrlCache.get(url);
  }

  getAudioSource(item: MediaItem): string | undefined {
    return item.previewUrl ?? item.downloadUrl ?? item.viewUrl;
  }

  getFilteredCount(filter: MediaFilter): number {
    return this.getFilteredItems(filter).length;
  }

  getCount(filter: MediaFilter): number {
    if (this.searchTerm.trim()) {
      return this.getFilteredCount(filter);
    }
    if (filter === 'all') {
      return this.mediaItems.length;
    }
    return this.mediaItems.filter((item) => item.type === filter).length;
  }

  getPageIndex(filter: MediaFilter): number {
    return this.pageIndexMap[filter];
  }

  setSort(sortKey: SortKey): void {
    this.currentSort = sortKey;
    this.resetPagination();
  }

  setViewMode(mode: ViewMode): void {
    if (this.viewMode === mode) {
      return;
    }
    this.viewMode = mode;
    this.resetPagination();
  }

  onPageChange(event: PageEvent, filter: MediaFilter): void {
    if (this.pageSize !== event.pageSize) {
      this.pageSize = event.pageSize;
      this.resetPagination();
      return;
    }
    this.pageIndexMap[filter] = event.pageIndex;
  }

  triggerFileSelection(input: HTMLInputElement): void {
    input.click();
  }

  onListHeaderClick(column: ListSortKey): void {
    if (this.listSortKey === column) {
      this.listSortDirection = this.listSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.listSortKey = column;
      this.listSortDirection = 'asc';
    }
    this.resetPagination();
  }

  isListSortActive(column: ListSortKey): boolean {
    return this.listSortKey === column;
  }

  getListSortIndicator(column: ListSortKey): string {
    if (this.listSortKey !== column) {
      return '';
    }
    return this.listSortDirection === 'asc' ? '▲' : '▼';
  }

  private resetPagination(): void {
    (Object.keys(this.pageIndexMap) as MediaFilter[]).forEach((key) => {
      this.pageIndexMap[key] = 0;
    });
  }

  private sortListItems(items: MediaItem[]): MediaItem[] {
    const multiplier = this.listSortDirection === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      switch (this.listSortKey) {
        case 'name':
          return multiplier * a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
        case 'modified':
          return multiplier * (a.modifiedAt.getTime() - b.modifiedAt.getTime());
        case 'type':
          return multiplier * a.fileType.localeCompare(b.fileType, 'fr', { sensitivity: 'base' });
        case 'size':
          const sizeA = this.parseSizeToBytes(a.size);
          const sizeB = this.parseSizeToBytes(b.size);
          return multiplier * (sizeA - sizeB);
        default:
          return 0;
      }
    });
  }

  private parseSizeToBytes(size?: string): number {
    if (!size) {
      return 0;
    }
    const normalized = size.replace(',', '.').trim();
    const match = normalized.match(/([0-9.]+)\s*(ko|mo|go|to)/i);
    if (!match) {
      return Number.parseFloat(normalized) || 0;
    }
    const value = Number.parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const factorMap: Record<string, number> = {
      ko: 1024,
      mo: 1024 ** 2,
      go: 1024 ** 3,
      to: 1024 ** 4,
    };
    return value * (factorMap[unit] ?? 1);
  }

  getFileExtension(item: MediaItem): string {
    switch (item.type) {
      case 'images':
        return 'image';
      case 'videos':
        return 'vid';
      case 'audio':
        return 'audio';
      default:
        return 'doc';
    }
  }

  formatListLabel(item: MediaItem): string {
    return `${item.title} · ${this.getFileExtension(item)} · ${item.uploadedAt.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  }

  getCurrentPage(filter: MediaFilter): number {
    return this.getPageIndex(filter) + 1;
  }

  getTotalPages(totalItems: number): number {
    if (totalItems === 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(totalItems / this.pageSize));
  }

  getPaginatorRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0 || pageSize === 0) {
      return '0 sur 0';
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} – ${endIndex} sur ${length}`;
  }

  private configurePaginatorLabels(): void {
    this.paginatorIntl.itemsPerPageLabel = 'Éléments par page';
    this.paginatorIntl.nextPageLabel = 'Page suivante';
    this.paginatorIntl.previousPageLabel = 'Page précédente';
    this.paginatorIntl.firstPageLabel = 'Première page';
    this.paginatorIntl.lastPageLabel = 'Dernière page';
    this.paginatorIntl.getRangeLabel = this.getPaginatorRangeLabel;
  }

  /**
   * Obtenir le statut de synchronisation de la bibliothèque
   */
  async getSyncStatus(): Promise<void> {
    try {
      const status = await this.libraryService.getSyncStatus();
      console.log('Statut de la bibliothèque:', status);
      console.log(`- Initialisée: ${status.isInitialized}`);
      console.log(`- Nombre de dossiers: ${status.dossierCount}`);
      console.log('- Nombre de contenus par type:', status.contenuCount);
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
    }
  }
}