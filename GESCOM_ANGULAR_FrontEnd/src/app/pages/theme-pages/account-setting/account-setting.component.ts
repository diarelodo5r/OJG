import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { NgIcon } from '@ng-icons/core';
import { UserService, UserDto } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { NotifyService } from '../../../services/notify.service';
import { UtilisateursService, Utilisateur } from '../../../services/gescom/utilisateurs.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-account-setting',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, NgIcon],
  templateUrl: './account-setting.component.html',
  styleUrl: './account-setting.component.scss'
})
export class AccountSettingComponent implements OnInit, OnDestroy {
  form: FormGroup;
  passwordForm: FormGroup;
  loading = false;
  saving = false;
  uploading = false;
  error?: string;
  success?: string;

  currentUserId: number | null = null;

  user?: UserDto;
  utilisateur?: Utilisateur;
  previewPhotoUrl?: string | null;
  private _photoObjectUrl?: string;
  selectedPhotoFile?: File;

  constructor(
    private fb: FormBuilder, 
    private userService: UserService, 
    private utilisateursService: UtilisateursService,
    private auth: AuthService, 
    private notify: NotifyService
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      balance: [{ value: '', disabled: true }],
    });

    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.currentUserId = this.auth.getCurrentUserId();
  }

  ngOnInit(): void {
    if (this.currentUserId) {
      this.loadUser();
    } else {
      this.error = 'Vous devez être connecté pour voir cette page.';
    }
  }

  ngOnDestroy(): void {
    if (this._photoObjectUrl) {
      URL.revokeObjectURL(this._photoObjectUrl);
    }
  }

  loadUser() {
    this.loading = true;
    this.error = undefined;
    if (!this.currentUserId) {
      this.loading = false;
      return;
    }
    
    // Charger à la fois depuis UserService et UtilisateursService pour avoir toutes les infos
    forkJoin({
      user: this.userService.getUser(this.currentUserId),
      utilisateur: this.utilisateursService.find(this.currentUserId)
    }).subscribe({
      next: ({ user, utilisateur }) => {
        this.user = user;
        this.utilisateur = utilisateur;
        
        this.form.patchValue({
          username: user.username || utilisateur.nom,
          email: user.email || utilisateur.email,
          balance: user.balance,
        });
        
        // Charger la photo
        this.loadUserPhoto();
        this.loading = false;
      },
      error: (e) => {
        // Fallback: essayer juste UserService
        this.userService.getUser(this.currentUserId!).subscribe({
          next: (u) => {
            this.user = u;
            this.form.patchValue({
              username: u.username,
              email: u.email,
              balance: u.balance,
            });
            this.loadUserPhoto();
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Impossible de charger le profil utilisateur.';
            this.loading = false;
            console.error(err);
            this.notify.error(this.error, 'Erreur');
          }
        });
      },
    });
  }

  onSave() {
    if (this.form.invalid || !this.user) return;
    this.saving = true;
    this.error = undefined;
    this.success = undefined;
    const payload = {
      username: this.form.value.username,
      email: this.form.value.email,
    } as Partial<UserDto>;
    this.userService.updateUser(this.user.id, payload).subscribe({
      next: (u) => {
        this.user = u;
        // Sync auth stored user for header/menu
        this.auth.updateStoredUser(u);
        this.success = 'Profil mis à jour avec succès.';
        this.saving = false;
        this.notify.success('Profil mis à jour');
      },
      error: (e) => {
        this.error = "Échec de la mise à jour du profil.";
        this.saving = false;
        console.error(e);
        this.notify.error(this.error, 'Erreur');
      },
    });
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.selectedPhotoFile = file;
    // Local preview
    const reader = new FileReader();
    reader.onload = () => (this.previewPhotoUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  uploadPhoto() {
    if (!this.user || !this.selectedPhotoFile) return;
    this.uploading = true;
    this.error = undefined;
    this.success = undefined;
    this.userService.uploadUserPhoto(this.user.id, this.selectedPhotoFile).subscribe({
      next: (u) => {
        this.user = u;
        // Sync auth stored user as photo might be used globally
        this.auth.updateStoredUser(u);
        // Reload fresh photo from backend - force le rafraîchissement
        setTimeout(() => {
          this.loadUserPhoto();
        }, 500);
        this.selectedPhotoFile = undefined;
        this.uploading = false;
        this.success = 'Photo mise à jour.';
        this.notify.success('Photo mise à jour');
      },
      error: (e) => {
        this.uploading = false;
        this.error = "Échec de l'upload de la photo.";
        console.error(e);
        this.notify.error(this.error, 'Erreur');
      },
    });
  }

  resetPhotoPreview() {
    this.selectedPhotoFile = undefined;
    this.loadUserPhoto();
  }

  private loadUserPhoto() {
    const id = this.user?.id || this.currentUserId;
    if (!id) {
      this.previewPhotoUrl = null;
      return;
    }
    this.userService.getUserPhotoBlob(id).subscribe({
      next: (blob) => {
        if (this._photoObjectUrl) URL.revokeObjectURL(this._photoObjectUrl);
        this._photoObjectUrl = URL.createObjectURL(blob);
        this.previewPhotoUrl = this._photoObjectUrl;
      },
      error: () => {
        this.previewPhotoUrl = '/assets/images/profile/user-1.jpg';
      },
    });
  }

  onChangePassword() {
    if (!this.user) return;
    if (this.passwordForm.invalid) {
      this.notify.error('Veuillez remplir correctement les champs.');
      return;
    }
    const { current_password, password, password_confirmation } = this.passwordForm.value as any;
    if (password !== password_confirmation) {
      this.notify.error('Les mots de passe ne correspondent pas.');
      return;
    }
    this.saving = true;
    // Use global endpoint with Bearer token: POST /change-password
    this.userService.changePasswordGlobal({ current_password, new_password: password, new_password_confirmation: password_confirmation }).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Mot de passe changé avec succès');
        this.passwordForm.reset();
      },
      error: (e) => {
        this.saving = false;
        // Try to extract Laravel validation errors (422)
        const backendMsg = e?.error?.message || e?.message;
        const errors = e?.error?.errors as Record<string, string[] | string> | undefined;
        if (errors) {
          // Mark controls and show first error line
          const firstKey = Object.keys(errors)[0];
          const firstVal = Array.isArray(errors[firstKey]) ? (errors[firstKey] as string[])[0] : (errors[firstKey] as string);
          // Set control errors if control exists
          Object.entries(errors).forEach(([key, val]) => {
            const ctrl = this.passwordForm.get(key);
            if (ctrl) {
              ctrl.setErrors({ server: true });
            }
          });
          this.notify.error(firstVal || 'Validation échouée', 'Erreur');
        } else if (backendMsg) {
          this.notify.error(backendMsg, 'Erreur');
        } else {
          this.notify.error("Échec du changement de mot de passe", 'Erreur');
        }
        console.error('Change password error:', e?.error || e);
      },
    });
  }
}
