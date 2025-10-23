import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotifyService } from '../../../services/notify.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="image-upload-container">
      <!-- Aperçu de l'image actuelle -->
      <div class="image-preview-wrapper" *ngIf="previewUrl || currentImageUrl">
        <img
          [src]="previewUrl || currentImageUrl"
          [alt]="imageAlt"
          class="image-preview"
          (error)="onImageError($event)"
        />
        <button
          mat-icon-button
          color="warn"
          class="delete-image-btn"
          (click)="removeImage()"
          matTooltip="Supprimer l'image"
          *ngIf="!readonly"
        >
          <mat-icon>delete</mat-icon>
        </button>
      </div>

      <!-- Zone de sélection de fichier -->
      <div class="upload-controls" *ngIf="!readonly">
        <!-- Input pour le chemin de fichier -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Chemin du fichier image</mat-label>
          <input
            matInput
            [(ngModel)]="filePath"
            (ngModelChange)="onPathChange($event)"
            placeholder="Ex: C:\images\photo.jpg"
            [disabled]="readonly"
          />
          <mat-icon matSuffix>folder</mat-icon>
        </mat-form-field>

        <!-- Boutons d'action -->
        <div class="action-buttons">
          <button
            mat-raised-button
            color="primary"
            (click)="fileInput.click()"
            [disabled]="readonly"
          >
            <mat-icon>upload_file</mat-icon>
            Parcourir
          </button>

          <button
            mat-raised-button
            color="accent"
            (click)="uploadImage()"
            [disabled]="!filePath || uploading || readonly"
            *ngIf="showUploadButton"
          >
            <mat-icon>cloud_upload</mat-icon>
            {{ uploading ? 'Envoi...' : 'Envoyer' }}
          </button>
        </div>

        <!-- Input file caché -->
        <input
          #fileInput
          type="file"
          accept="image/*"
          (change)="onFileSelected($event)"
          style="display: none"
        />
      </div>

      <!-- Informations sur le fichier -->
      <div class="file-info" *ngIf="fileName">
        <mat-icon>info</mat-icon>
        <span>{{ fileName }}</span>
      </div>
    </div>
  `,
  styles: [`
    .image-upload-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
    }

    .image-preview-wrapper {
      position: relative;
      width: 100%;
      max-width: 300px;
      margin: 0 auto;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .image-preview {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
      max-height: 300px;
    }

    .delete-image-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background-color: rgba(255, 255, 255, 0.9);
    }

    .delete-image-btn:hover {
      background-color: rgba(255, 255, 255, 1);
    }

    .upload-controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .full-width {
      width: 100%;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      justify-content: flex-start;
      flex-wrap: wrap;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .file-info mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `],
})
export class ImageUploadComponent implements OnInit {
  @Input() currentImageUrl?: string | null;
  @Input() imageAlt: string = 'Image';
  @Input() entityId?: number;
  @Input() readonly: boolean = false;
  @Input() showUploadButton: boolean = true; // Si false, émet juste le path via pathChange
  @Input() defaultImage?: string;

  @Output() pathChange = new EventEmitter<string>();
  @Output() uploadComplete = new EventEmitter<{ path: string; message: string }>();
  @Output() imageRemoved = new EventEmitter<void>();

  filePath: string = '';
  previewUrl: string | null = null;
  fileName: string = '';
  uploading: boolean = false;

  constructor(private notify: NotifyService) {}

  ngOnInit(): void {
    if (this.currentImageUrl) {
      this.previewUrl = this.currentImageUrl;
    }
  }

  /**
   * Gestion de la sélection de fichier via le file picker
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    
    // Valider le type de fichier
    if (!file.type.startsWith('image/')) {
      this.notify.error('Veuillez sélectionner un fichier image valide');
      return;
    }

    // Obtenir le chemin complet (note: pour des raisons de sécurité, les navigateurs ne donnent pas le vrai chemin)
    // L'utilisateur devra saisir le chemin manuellement ou nous utilisons une solution de contournement
    this.fileName = file.name;
    
    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
    };
    reader.readAsDataURL(file);

    // Simuler un chemin (l'utilisateur devra le modifier)
    this.filePath = `C:\\temp\\${file.name}`;
    this.pathChange.emit(this.filePath);
    
    this.notify.info('Fichier sélectionné. Veuillez vérifier/modifier le chemin avant d\'envoyer.');
  }

  /**
   * Gestion du changement de chemin manuel
   */
  onPathChange(path: string): void {
    this.filePath = path;
    this.pathChange.emit(path);
  }

  /**
   * Upload de l'image (utilisé quand showUploadButton = true)
   */
  uploadImage(): void {
    if (!this.filePath) {
      this.notify.error('Veuillez saisir un chemin de fichier');
      return;
    }

    if (!this.entityId) {
      this.notify.error('ID de l\'entité manquant');
      return;
    }

    this.uploading = true;
    
    // Émettre l'événement pour que le parent gère l'upload
    this.uploadComplete.emit({
      path: this.filePath,
      message: 'Upload initié'
    });

    this.uploading = false;
  }

  /**
   * Suppression de l'image
   */
  removeImage(): void {
    this.notify.confirm({
      title: 'Confirmer',
      text: 'Supprimer cette image ?'
    }).then(result => {
      if (result.isConfirmed) {
        this.filePath = '';
        this.previewUrl = null;
        this.fileName = '';
        this.pathChange.emit('');
        this.imageRemoved.emit();
      }
    });
  }

  /**
   * Gestion des erreurs de chargement d'image
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (this.defaultImage) {
      img.src = this.defaultImage;
    } else {
      img.src = 'assets/images/products/Product.png';
    }
  }
}
