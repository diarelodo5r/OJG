import { Component, OnInit } from '@angular/core';
import { CoreService } from '../../../services/core.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { AuthService } from '../../../services/auth.service';
import { NotifyService } from '../../../services/notify.service';
import { ThemeService } from '../../../services/theme.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-register',
  imports: [RouterModule, CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
})
export class AppRegisterComponent implements OnInit {
  options!: any;

  loading = false;
  error?: string;

  // Observable for current theme
  isDark$!: Observable<boolean>;

  // Controls the visibility of password fields
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(private settings: CoreService, private router: Router, private auth: AuthService, private notify: NotifyService, private theme: ThemeService) {
    this.isDark$ = this.theme.isDark$;
  };
  
  ngOnInit() {
    this.options = this.settings.getOptions();
  }
  
  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    password_confirmation: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  get f() {
    return this.form.controls;
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  submit() {
    if (this.form.invalid) return;
    if ((this.form.value as any).password !== (this.form.value as any).password_confirmation) {
      this.error = 'Les mots de passe ne correspondent pas.';
      return;
    }
    this.loading = true;
    this.error = undefined;
    const username = (this.form.value as any).uname;
    const email = (this.form.value as any).email;
    const password = (this.form.value as any).password;
    const password_confirmation = (this.form.value as any).password_confirmation;
    this.auth.register({ username, email, password, password_confirmation }).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('Compte créé', 'Succès');
        this.router.navigate(['/']);
      },
      error: (e) => {
        this.loading = false;
        this.error = "Impossible de créer le compte.";
        this.notify.error(this.error, "Échec de l'inscription");
        console.error(e);
      },
    });
  }
}
