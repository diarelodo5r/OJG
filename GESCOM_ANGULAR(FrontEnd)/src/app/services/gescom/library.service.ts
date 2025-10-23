import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environment';
import { GoogleAuthService } from './google-auth.service';
import { 
  MediaItem, 
  MediaType, 
  Dossier, 
  Contenu, 
  ApiResponse, 
  DossierFilesResponse, 
  UploadRequest, 
  SerializedDate 
} from '../../interfaces/gescom/library.models';

interface DriveFileResult {
  files: MediaItem[];
  nextPageToken: string | null;
}

interface ListOptions {
  folderKey?: string;
  folderId?: string;
  search?: string;
  pageToken?: string;
  pageSize?: number;
  orderBy?: string;
}

interface UploadOptions {
  folderKey?: string;
  folderId?: string;
  description?: string;
}

interface FolderMap {
  [key: string]: string;
}

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private folderOverrides: FolderMap = {};
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private readonly googleAuthService: GoogleAuthService, private readonly http: HttpClient) {}

  async chargerContenuDossierOAuth(options: ListOptions = {}): Promise<DriveFileResult> {
    await this.googleAuthService.ensureSignedIn();
    const token = await this.googleAuthService.getAccessToken();
    if (!token) {
      throw new Error('Jeton Google invalide.');
    }

    const folderId = this.resolveFolderId(options.folderKey, options.folderId);
    const queryParts = [`'${folderId}' in parents`, 'trashed = false'];
    if (options.search) {
      const sanitized = options.search.replace(/'/g, "\'");
      queryParts.push(`name contains '${sanitized}'`);
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let params = new HttpParams()
      .set('q', queryParts.join(' and '))
      .set('fields', 'files(id,name,mimeType,modifiedTime,createdTime,size,iconLink,thumbnailLink,webViewLink,webContentLink,parents),nextPageToken')
      .set('orderBy', options.orderBy ?? 'modifiedTime desc')
      .set('pageSize', String(options.pageSize ?? 50))
      .set('spaces', 'drive');
    if (options.pageToken) {
      params = params.set('pageToken', options.pageToken);
    }

    const baseUrl = environment.google?.driveApiUrl || 'https://www.googleapis.com/drive/v3/files';
    const res = await firstValueFrom(this.http.get<any>(baseUrl, { headers, params }));
    const files = res?.files ?? [];
    return {
      files: files.map((file: any) => this.mapDriveFileToMediaItem(file)),
      nextPageToken: res?.nextPageToken ?? null,
    };
  }

  async afficherFichiers(options: ListOptions = {}): Promise<MediaItem[]> {
    const result = await this.chargerContenuDossierOAuth(options);
    return result.files;
  }

  async uploadFile(file: File, options: UploadOptions = {}): Promise<MediaItem> {
    await this.googleAuthService.ensureSignedIn();
    const token = await this.googleAuthService.getAccessToken();
    if (!token) {
      throw new Error('Jeton Google invalide.');
    }
    const folderId = this.resolveFolderId(options.folderKey, options.folderId);

    const metadata = {
      name: file.name,
      parents: [folderId],
      description: options.description,
    };

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = this.arrayBufferToBase64(arrayBuffer);
    const boundary = 'boundary' + Math.random().toString(36).substring(2);
    const delimiter = `--${boundary}\r\n`;
    const closeDelimiter = `--${boundary}--`;
    const payload = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n${delimiter}Content-Type: ${file.type || 'application/octet-stream'}\r\nContent-Transfer-Encoding: base64\r\n\r\n${base64Data}\r\n${closeDelimiter}`;

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', `multipart/related; boundary=${boundary}`);
    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await firstValueFrom(this.http.post<any>(uploadUrl, payload, { headers }));
    return this.mapDriveFileToMediaItem(res);
  }

  registerFolderOverrides(overrides: FolderMap): void {
    this.folderOverrides = { ...this.folderOverrides, ...overrides };
  }

  getAvailableFolders(): FolderMap {
    return {
      ...this.folderOverrides,
      ...this.getExternalFolderMap(),
      ...(environment.google?.folders ?? {}),
    };
  }

  private resolveFolderId(folderKey?: string, folderId?: string): string {
    if (folderId) {
      return folderId;
    }

    if (!folderKey) {
      const folders = environment.google?.folders ?? {};
      const keys = Object.keys(folders) as Array<keyof typeof folders>;
      if (keys.length === 0) {
        throw new Error('Aucun dossier configuré pour Google Drive.');
      }
      return folders[keys[0]] ?? '';
    }

    const available = this.getAvailableFolders();
    const resolved = available[folderKey];
    if (!resolved) {
      throw new Error(`Aucun dossier Drive trouvé pour la clé ${folderKey}.`);
    }
    return resolved;
  }

  private mapDriveFileToMediaItem(file: any): MediaItem {
    const mimeType = file.mimeType as string | undefined;
    const meta = this.resolveMediaMeta(mimeType, file.name);
    const modified = file.modifiedTime ?? file.createdTime ?? new Date().toISOString();

    return {
      id: file.id,
      title: file.name,
      description: '',
      type: meta.type,
      size: this.formatSize(file.size),
      uploadedAt: new Date(file.createdTime ?? modified),
      previewUrl: file.webViewLink ?? file.webContentLink ?? '',
      modifiedAt: new Date(modified),
      fileType: meta.fileType,
      extension: meta.extension,
      thumbnailUrl: file.thumbnailLink ?? file.iconLink ?? undefined,
      duration: undefined,
    };
  }

  private resolveMediaMeta(mimeType: string | undefined, name: string): { type: MediaType; extension: string; fileType: string } {
    const extension = this.extractExtension(name);

    if (mimeType?.startsWith('image/')) {
      return { type: 'images', extension, fileType: 'Image' };
    }
    if (mimeType?.startsWith('video/')) {
      return { type: 'videos', extension, fileType: 'Vidéo' };
    }
    if (mimeType?.startsWith('audio/')) {
      return { type: 'audio', extension, fileType: 'Audio' };
    }

    if (extension === 'pdf') {
      return { type: 'documents', extension, fileType: 'Document PDF' };
    }
    if (['doc', 'docx'].includes(extension)) {
      return { type: 'documents', extension, fileType: 'Document Word' };
    }
    if (['xls', 'xlsx'].includes(extension)) {
      return { type: 'documents', extension, fileType: 'Document Excel' };
    }
    if (['ppt', 'pptx'].includes(extension)) {
      return { type: 'documents', extension, fileType: 'Présentation PowerPoint' };
    }

    return { type: 'documents', extension, fileType: 'Document' };
  }

  private extractExtension(name: string): string {
    const parts = name.split('.');
    if (parts.length < 2) {
      return '';
    }
    return parts.pop()?.toLowerCase() ?? '';
  }

  private parseSerializedDate(value?: string | SerializedDate): string | undefined {
    if (!value) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    return value.date;
  }

  private extractDuration(_contenu: Contenu): string | undefined {
    return undefined;
  }

  private formatSize(size: string | number | undefined): string | undefined {
    if (size === undefined || size === null) {
      return undefined;
    }
    const value = typeof size === 'string' ? Number.parseFloat(size) : size;
    if (!Number.isFinite(value)) {
      return undefined;
    }

    const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
    let unitIndex = 0;
    let current = value;
    while (current >= 1024 && unitIndex < units.length - 1) {
      current /= 1024;
      unitIndex += 1;
    }
    return `${current.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  private buildDownloadUrl(contenu: Contenu): string | undefined {
    if (contenu.drive_file_id) {
      return `https://drive.google.com/uc?export=download&id=${contenu.drive_file_id}`;
    }
    return contenu.web_view_link;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private getDriveClient(): any {
    throw new Error('Client Google Drive non initialisé.');
  }

  private getGapi(): any {
    throw new Error('Non pris en charge.');
  }

  private getExternalFolderMap(): FolderMap {
    const globalScope = window as unknown as { FIRESTORE_STRUCTURE?: Record<string, any>; firestoreStructure?: Record<string, any> };
    const structured = globalScope.firestoreStructure as Record<string, any> | undefined;
    const legacy = globalScope.FIRESTORE_STRUCTURE as Record<string, any> | undefined;
    const fromFirebase = structured?.['drive']?.folders ?? legacy?.['drive']?.folders;
    if (fromFirebase && typeof fromFirebase === 'object') {
      return fromFirebase as FolderMap;
    }
    return {};
  }

  // ==================== API Laravel - Dossiers ====================

  /**
   * Récupérer tous les dossiers depuis l'API Laravel
   * GET /api/public/dossiers (route publique pour tests)
   */
  async getDossiers(): Promise<Dossier[]> {
    console.log('🔄 Appel API: GET', `${this.apiUrl}/public/dossiers`);
    const response = await firstValueFrom(
      this.http.get<ApiResponse<Dossier[]>>(`${this.apiUrl}/public/dossiers`)
    );
    console.log('📥 Réponse API dossiers:', response);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des dossiers');
    }
    return response.data;
  }

  /**
   * Récupérer un dossier spécifique par type
   * GET /api/public/dossiers/{type} (route publique pour tests)
   */
  async getDossier(type: MediaType): Promise<Dossier> {
    console.log('🔄 Appel API: GET', `${this.apiUrl}/public/dossiers/${type}`);
    const response = await firstValueFrom(
      this.http.get<ApiResponse<Dossier>>(`${this.apiUrl}/public/dossiers/${type}`)
    );
    console.log('📥 Réponse API dossier:', response);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Dossier non trouvé');
    }
    return response.data;
  }

  /**
   * Récupérer les fichiers d'un dossier depuis Google Drive via l'API
   * GET /api/dossiers/{type}/files
   */
  async getDossierFiles(type: MediaType): Promise<DossierFilesResponse> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<DossierFilesResponse>>(`${this.apiUrl}/dossiers/${type}/files`)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des fichiers');
    }
    return response.data;
  }

  /**
   * Synchroniser les dossiers depuis Firestore
   * POST /api/public/dossiers/sync (route publique pour tests)
   */
  async syncDossiers(): Promise<Dossier[]> {
    console.log('🔄 Appel API: POST', `${this.apiUrl}/public/dossiers/sync`);
    const response = await firstValueFrom(
      this.http.post<ApiResponse<Dossier[]>>(`${this.apiUrl}/public/dossiers/sync`, {})
    );
    console.log('📥 Réponse API sync dossiers:', response);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la synchronisation');
    }
    return response.data;
  }

  // ==================== API Laravel - Contenus ====================

  /**
   * Récupérer tous les contenus ou filtrer par type
   * GET /api/public/contenus?type={type} (route publique pour tests)
   */
  async getContenus(type?: MediaType): Promise<Contenu[]> {
    let url = `${this.apiUrl}/public/contenus`;
    if (type) {
      url += `?type=${type}`;
    }
    console.log('🔄 Appel API: GET', url);
    const response = await firstValueFrom(
      this.http.get<ApiResponse<Contenu[]>>(url)
    );
    console.log('📥 Réponse API contenus:', response);
    console.log('📊 Nombre de contenus:', response.data?.length || 0);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des contenus');
    }
    return response.data;
  }

  /**
   * Récupérer les contenus par type
   * GET /api/contenus/type/{type}
   */
  async getContenusByType(type: MediaType): Promise<Contenu[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<Contenu[]>>(`${this.apiUrl}/contenus/type/${type}`)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des contenus');
    }
    return response.data;
  }

  /**
   * Récupérer un contenu spécifique
   * GET /api/contenus/{id}
   */
  async getContenu(id: string): Promise<Contenu> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<Contenu>>(`${this.apiUrl}/contenus/${id}`)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Contenu non trouvé');
    }
    return response.data;
  }

  /**
   * Uploader un fichier via l'API Laravel
   * POST /api/contenus/upload
   */
  async uploadFileViaApi(request: UploadRequest): Promise<Contenu> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('type', request.type);

    if (request.access_token) {
      formData.append('access_token', request.access_token);
    } else {
      const token = await this.googleAuthService.getAccessToken();
      if (token) {
        formData.append('access_token', token);
      }
    }

    const response = await firstValueFrom(
      this.http.post<ApiResponse<Contenu>>(`${this.apiUrl}/contenus/upload`, formData)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors du téléversement');
    }
    return response.data;
  }

  /**
   * Supprimer un contenu
   * DELETE /api/contenus/{id}
   */
  async deleteContenu(id: string): Promise<void> {
    const token = await this.googleAuthService.getAccessToken();
    const body = token ? { access_token: token } : {};

    const response = await firstValueFrom(
      this.http.delete<ApiResponse<void>>(`${this.apiUrl}/contenus/${id}`, { body })
    );
    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la suppression');
    }
  }

  /**
   * Renommer un contenu existant
   * PUT /api/contenus/{id}
   */
  async renameContenu(id: string, nouveauNom: string): Promise<Contenu> {
    const token = await this.googleAuthService.getAccessToken();
    const payload: Record<string, unknown> = { nom: nouveauNom };
    if (token) {
      payload['access_token'] = token;
    }

    const response = await firstValueFrom(
      this.http.put<ApiResponse<Contenu>>(`${this.apiUrl}/contenus/${id}`, payload)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors du renommage');
    }
    return response.data;
  }

  /**
   * Synchroniser les contenus d'un type depuis Drive et Firestore
   * POST /api/contenus/sync/{type}
   */
  async syncContenus(type: MediaType): Promise<Contenu[]> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<Contenu[]>>(`${this.apiUrl}/contenus/sync/${type}`, {})
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la synchronisation');
    }
    return response.data;
  }

  /**
   * Synchroniser tous les types de contenus depuis Drive et Firestore
   * Appelle POST /api/contenus/sync/{type} pour chaque type
   */
  async syncAllContenus(): Promise<Record<MediaType, Contenu[]>> {
    const types: MediaType[] = ['images', 'videos', 'audio', 'documents'];
    const results: Record<string, Contenu[]> = {};

    for (const type of types) {
      try {
        results[type] = await this.syncContenus(type);
      } catch (error) {
        console.error(`Erreur lors de la synchronisation de ${type}:`, error);
        results[type] = [];
      }
    }

    return results as Record<MediaType, Contenu[]>;
  }

  /**
   * Initialiser complètement la bibliothèque:
   * 1. Initialiser la structure des dossiers dans Firestore
   * 2. Synchroniser tous les fichiers Drive vers Firestore
   */
  async initializeLibrary(): Promise<{
    dossiers: Dossier[];
    contenus: Record<MediaType, Contenu[]>;
  }> {
    const dossiers = await this.getDossiers();
    const contenus = await this.syncAllContenus();
    return { dossiers, contenus };
  }

  /**
   * Vérifier si la bibliothèque est initialisée
   * en vérifiant si des dossiers existent dans Firestore
   */
  async isLibraryInitialized(): Promise<boolean> {
    try {
      const dossiers = await this.getDossiers();
      return dossiers.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Convertir un Contenu en MediaItem pour compatibilité avec l'interface existante
   */
  contenuToMediaItem(contenu: Contenu): MediaItem {
    const createdAt = this.parseSerializedDate(contenu.dateAjout) ?? contenu.created_at;
    const updatedAt = this.parseSerializedDate(contenu.dateModification) ?? contenu.updated_at;
    const tailleText = this.formatSize(contenu.taille);

    return {
      id: contenu.id,
      title: contenu.nom,
      description: '',
      type: contenu.type,
      size: tailleText,
      uploadedAt: createdAt ? new Date(createdAt) : new Date(),
      previewUrl: contenu.preview_url ?? contenu.embed_url ?? contenu.web_view_link,
      viewUrl: contenu.web_view_link,
      downloadUrl: this.buildDownloadUrl(contenu),
      modifiedAt: updatedAt ? new Date(updatedAt) : new Date(),
      fileType: this.getFileTypeFromMimeType(contenu.mime_type),
      extension: this.extractExtension(contenu.nom),
      thumbnailUrl: contenu.thumbnail_link ?? contenu.preview_url ?? contenu.web_view_link,
      duration: this.extractDuration(contenu),
    };
  }

  /**
   * Récupérer les contenus sous forme de MediaItem
   */
  async getMediaItems(type?: MediaType): Promise<MediaItem[]> {
    const contenus = await this.getContenus(type);
    return contenus.map(c => this.contenuToMediaItem(c));
  }

  private getFileTypeFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Vidéo';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.includes('pdf')) return 'Document PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Document Word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Document Excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'Présentation PowerPoint';
    return 'Document';
  }

  // ==================== Utilitaires de synchronisation ====================

  /**
   * Obtenir le statut de synchronisation de la bibliothèque
   */
  async getSyncStatus(): Promise<{
    isInitialized: boolean;
    dossierCount: number;
    contenuCount: Record<MediaType, number>;
  }> {
    try {
      const dossiers = await this.getDossiers();
      const types: MediaType[] = ['images', 'videos', 'audio', 'documents'];
      const contenuCount: Record<string, number> = {};

      for (const type of types) {
        try {
          const contenus = await this.getContenus(type);
          contenuCount[type] = contenus.length;
        } catch {
          contenuCount[type] = 0;
        }
      }

      return {
        isInitialized: dossiers.length > 0,
        dossierCount: dossiers.length,
        contenuCount: contenuCount as Record<MediaType, number>,
      };
    } catch (error) {
      return {
        isInitialized: false,
        dossierCount: 0,
        contenuCount: { images: 0, videos: 0, audio: 0, documents: 0 },
      };
    }
  }
}
