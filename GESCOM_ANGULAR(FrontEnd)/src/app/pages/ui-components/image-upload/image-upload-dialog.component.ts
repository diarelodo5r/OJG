import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUploadComponent } from './image-upload.component';
import { NotifyService } from '../../../services/notify.service';
import { Observable, of } from 'rxjs';

export interface ImageUploadDialogData {
  title?: string;
  currentImageUrl?: string | null;
  entityId: number;
  entityType: 'article' | 'utilisateur';
  uploadFunction: (entityId: number, filePath: string) => Observable<any>;
  deleteFunction?: (entityId: number) => Observable<any>;
}

@Component({
  selector: 'app-image-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ImageUploadComponent,
  ],
  template: `
    <div class="image-upload-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>add_photo_alternate</mat-icon>
          {{ data.title || 'Gérer l\'image' }}
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <app-image-upload
          [currentImageUrl]="data.currentImageUrl"
          [entityId]="data.entityId"
          [imageAlt]="data.entityType === 'article' ? 'Image article' : 'Photo utilisateur'"
          [showUploadButton]="false"
          (pathChange)="onPathChange($event)"
          (imageRemoved)="onImageRemoved()"
        ></app-image-upload>

        <div class="upload-info mt-3">
          <mat-icon class="info-icon">info</mat-icon>
          <p class="mb-0">
            Veuillez saisir le chemin complet du fichier image sur votre disque.
            <br />
            <small class="text-muted">
              Exemple: C:\\Images\\mon-image.jpg
            </small>
          </p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Annuler</button>
        <button 
          mat-flat-button 
          color="warn" 
          (click)="onDelete()"
          [disabled]="loading || !data.currentImageUrl"
          *ngIf="data.deleteFunction"
        >
          <mat-icon>delete</mat-icon>
          Supprimer
        </button>
        <button 
          mat-flat-button 
          color="primary" 
          (click)="onUpload()"
          [disabled]="!filePath || loading"
        >
          <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
          <mat-icon *ngIf="!loading">cloud_upload</mat-icon>
          {{ loading ? 'Envoi...' : 'Enregistrer' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .image-upload-dialog {
      min-width: 500px;
      max-width: 600px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 0;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 1.25rem;
    }

    mat-dialog-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }

    .upload-info {
      display: flex;
      gap: 12px;
      padding: 16px;
      background-color: rgba(33, 150, 243, 0.1);
      border-radius: 8px;
      border-left: 4px solid #2196F3;
    }

    .info-icon {
      color: #2196F3;
      flex-shrink: 0;
    }

    .upload-info p {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    @media (max-width: 600px) {
      .image-upload-dialog {
        min-width: unset;
        width: 100%;
      }
    }
  `],
})
export class ImageUploadDialogComponent {
  filePath: string = '';
  loading: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ImageUploadDialogData,
    private dialogRef: MatDialogRef<ImageUploadDialogComponent>,
    private notify: NotifyService
  ) {}

  onPathChange(path: string): void {
    this.filePath = path;
  }

  onUpload(): void {
    if (!this.filePath) {
      this.notify.error('Veuillez saisir un chemin de fichier');
      return;
    }

    this.loading = true;
    this.data.uploadFunction(this.data.entityId, this.filePath).subscribe({
      next: (response) => {
        this.loading = false;
        this.notify.success(response.message || 'Image enregistrée avec succès');
        this.dialogRef.close({ success: true, path: response.path });
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.message || 'Erreur lors de l\'upload';
        this.notify.error(message);
      }
    });
  }

  onDelete(): void {
    if (!this.data.deleteFunction) return;

    this.notify.confirm({
      title: 'Confirmer la suppression',
      text: 'Voulez-vous vraiment supprimer cette image ?'
    }).then(result => {
      if (result.isConfirmed) {
        this.loading = true;
        this.data.deleteFunction!(this.data.entityId).subscribe({
          next: (response) => {
            this.loading = false;
            this.notify.success(response.message || 'Image supprimée avec succès');
            this.dialogRef.close({ success: true, deleted: true });
          },
          error: (error) => {
            this.loading = false;
            const message = error.error?.message || 'Erreur lors de la suppression';
            this.notify.error(message);
          }
        });
      }
    });
  }

  onImageRemoved(): void {
    this.filePath = '';
  }
}
