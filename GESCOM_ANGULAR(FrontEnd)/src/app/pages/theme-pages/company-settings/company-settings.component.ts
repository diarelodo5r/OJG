import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CompanySettingsService } from '../../../services/company-settings.service';
import { NotifyService } from '../../../services/notify.service';
import { CompanySettings } from '../../../interfaces/company-settings.model';

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './company-settings.component.html',
  styleUrls: ['./company-settings.component.scss']
})
export class CompanySettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  logoPreview: string | null = null;
  selectedFile: File | null = null;
  loading = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private companySettingsService: CompanySettingsService,
    private notify: NotifyService
  ) {}

  ngOnInit(): void {
    const currentSettings = this.companySettingsService.getSettings();
    
    this.settingsForm = this.fb.group({
      name: [currentSettings.name, [Validators.required, Validators.minLength(2)]],
      description: [currentSettings.description],
      address: [currentSettings.address],
      phone: [currentSettings.phone],
      email: [currentSettings.email, [Validators.email]],
      website: [currentSettings.website]
    });

    this.logoPreview = currentSettings.logo || null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      this.notify.error('Format invalide. Utilisez PNG, JPG ou GIF.');
      return;
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      this.notify.error('Le fichier est trop volumineux. Taille maximale : 2 MB.');
      return;
    }

    this.selectedFile = file;

    // Preview image
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.logoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.logoPreview = null;
    this.selectedFile = null;
  }

  async saveSettings(): Promise<void> {
    if (this.settingsForm.invalid) {
      this.notify.error('Veuillez remplir tous les champs requis correctement.');
      return;
    }

    this.saving = true;
    const formValues = this.settingsForm.value;
    let logoBase64 = this.logoPreview;

    // Convert logo to base64 if a new file was selected
    if (this.selectedFile) {
      try {
        logoBase64 = await this.companySettingsService.uploadLogo(this.selectedFile);
      } catch (error) {
        console.error('Error converting logo:', error);
        this.notify.error('Erreur lors du traitement du logo.');
        this.saving = false;
        return;
      }
    }

    const settings: CompanySettings = {
      name: formValues.name,
      description: formValues.description || '',
      address: formValues.address || '',
      phone: formValues.phone || '',
      email: formValues.email || '',
      website: formValues.website || '',
      logo: logoBase64 || ''
    };

    this.companySettingsService.updateSettings(settings).subscribe({
      next: (updatedSettings) => {
        this.saving = false;
        this.selectedFile = null; // Reset file after successful save
        this.notify.success('Paramètres enregistrés avec succès');
      },
      error: (error) => {
        this.saving = false;
        console.error('Erreur lors de la sauvegarde:', error);
        
        if (error?.status === 422) {
          const messages = this.extractValidationErrors(error);
          this.notify.error(messages || 'Erreur de validation');
        } else {
          this.notify.error('Erreur lors de la sauvegarde des paramètres');
        }
      }
    });
  }

  resetSettings(): void {
    this.notify.confirm({
      title: 'Réinitialiser les paramètres ?',
      text: 'Cette action restaurera les paramètres par défaut.',
      confirmText: 'Réinitialiser',
      cancelText: 'Annuler',
      icon: 'warning'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.companySettingsService.resetSettings().subscribe({
          next: () => {
            this.loading = false;
            this.ngOnInit(); // Reload form
            this.notify.success('Paramètres réinitialisés');
          },
          error: (error) => {
            this.loading = false;
            console.error('Erreur lors de la réinitialisation:', error);
            this.notify.error('Erreur lors de la réinitialisation');
          }
        });
      }
    });
  }

  /**
   * Extrait les messages d'erreur de validation depuis la réponse API
   */
  private extractValidationErrors(error: any): string | null {
    const errors = error?.error?.errors;
    if (!errors || typeof errors !== 'object') return null;
    const messages = Object.values(errors).flat().filter(Boolean) as string[];
    return messages.length ? messages.join('\n') : null;
  }
}
