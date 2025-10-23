export type MediaType = 'images' | 'videos' | 'audio' | 'documents';

export type MediaFilter = 'all' | 'images' | 'videos' | 'audio' | 'documents';

export interface MediaItem {
  id: string;
  title: string;
  description: string;
  type: MediaType;
  size?: string;
  uploadedAt: Date;
  previewUrl?: string;
  viewUrl?: string;
  downloadUrl?: string;
  modifiedAt: Date;
  fileType: string;
  extension: string;
  thumbnailUrl?: string;
  duration?: string;
}

// Interfaces pour l'API Laravel
export interface SerializedDate {
  date: string;
  timezone_type: number;
  timezone: string;
}

export interface Dossier {
  id: string;
  type: MediaType;
  nom: string;
  description?: string;
  drive_folder_id: string;
  created_at?: string;
  updated_at?: string;
  contenus?: Contenu[];
}

export interface Contenu {
  id: string;
  nom: string;
  type: MediaType;
  mime_type: string;
  drive_file_id: string;
  web_view_link: string;
  preview_url?: string;
  embed_url?: string;
  thumbnail_link?: string;
  taille?: number | string;
  dossier_type: MediaType;
  created_at?: string;
  updated_at?: string;
  dateAjout?: string | SerializedDate;
  dateModification?: string | SerializedDate;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface DossierFilesResponse {
  dossier: Dossier;
  files: any[];
}

export interface UploadRequest {
  file: File;
  type: MediaType;
  access_token?: string;
}
