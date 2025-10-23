import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CompanySettingsService } from '../../services/company-settings.service';
import { CompanySettings } from '../../interfaces/company-settings.model';
import { NotifyService } from '../../services/notify.service';

@Component({
  selector: 'app-company-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './company-settings-dialog.component.html',
  styleUrls: ['./company-settings-dialog.component.scss']
})
export class CompanySettingsDialogComponent implements OnInit {
  settingsForm!: FormGroup;
  logoPreview: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CompanySettingsDialogComponent>,
    private companySettingsService: CompanySettingsService,
    private notify: NotifyService
  ) {}

  ngOnInit(): void {
    const currentSettings = this.companySettingsService.getSettings();
    this.logoPreview = currentSettings.logo || null;

    this.settingsForm = this.fb.group({
      name: [currentSettings.name, [Validators.required, Validators.minLength(2)]],
      description: [currentSettings.description || ''],
      address: [currentSettings.address || ''],
      phone: [currentSettings.phone || ''],
      email: [currentSettings.email || '', [Validators.email]],
      website: [currentSettings.website || '']
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      // Vérifier le type de fichier
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!allowedTypes.includes(this.selectedFile.type)) {
        this.notify.error('Format d\'image non supporté. Utilisez PNG, JPG ou GIF.');
        this.selectedFile = null;
        return;
      }

      // Vérifier la taille (max 2MB)
      if (this.selectedFile.size > 2 * 1024 * 1024) {
        this.notify.error('L\'image est trop volumineuse. Taille maximale: 2MB');
        this.selectedFile = null;
        return;
      }

      // Prévisualiser l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeLogo(): void {
    this.logoPreview = null;
    this.selectedFile = null;
    const fileInput = document.getElementById('logo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async onSave(): Promise<void> {
    if (this.settingsForm.invalid) {
      this.notify.error('Veuillez remplir tous les champs requis correctement');
      return;
    }

    try {
      let logoBase64 = this.logoPreview || '';
      
      // Si un nouveau fichier a été sélectionné, le convertir en base64
      if (this.selectedFile) {
        logoBase64 = await this.companySettingsService.uploadLogo(this.selectedFile);
      }

      const settings: CompanySettings = {
        ...this.settingsForm.value,
        logo: logoBase64
      };

      this.companySettingsService.updateSettings(settings);
      this.notify.success('Paramètres de l\'entreprise sauvegardés');
      this.dialogRef.close(settings);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      this.notify.error('Erreur lors de la sauvegarde des paramètres');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onReset(): void {
    this.companySettingsService.resetSettings();
    const defaultSettings = this.companySettingsService.getSettings();
    this.settingsForm.patchValue(defaultSettings);
    this.logoPreview = defaultSettings.logo || null;
    this.selectedFile = null;
    this.notify.successToast('Paramètres réinitialisés');
  }
}
