import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { NotifyService } from '../../../services/notify.service';
import { ThemeService } from '../../../services/theme.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [RouterModule, CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class AppLoginComponent {
  loading = false;
  error?: string;
  // Observable to determine current theme
  isDark$!: Observable<boolean>;

  // Controls the visibility of the password field
  hidePassword = true;

  constructor(private router: Router, private auth: AuthService, private notify: NotifyService, private theme: ThemeService) {
    // assign after DI has completed
    this.isDark$ = this.theme.isDark$;
  };

  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.minLength(4)]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = undefined;
    const username = (this.form.value as any).username || (this.form.value as any).uname;
    const password = (this.form.value as any).password;
    this.auth.login({ username, password }).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('Connexion réussie');
        this.router.navigate(['']);
      },
      error: (e) => {
        this.loading = false;
        this.error = 'Identifiants invalides ou erreur serveur.';
        this.notify.error(this.error, 'Échec de connexion');
        console.error(e);
      },
    });
  }
}
