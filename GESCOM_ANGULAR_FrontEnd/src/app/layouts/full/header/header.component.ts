import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { ThemeService } from '../../../services/theme.service';
import { NgIcon } from '@ng-icons/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { NotifyService } from '../../../services/notify.service';
import { UserService, UserDto } from '../../../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { GlobalSearchDialogComponent } from '../../../shared/global-search/global-search-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { LoadingService } from '../../../shared/services/loading.service';

@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    CommonModule,
    NgScrollbarModule,
    NgIcon,
    MatBadgeModule,
    MatToolbarModule,
    MatMenuModule,
    MatTooltipModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './header.component.html',
  styles: [
    `
      .header-burger-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .header-burger-wrapper .burger-loader {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 1;
      }
      .header-burger-wrapper .burger-loader-ring {
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: 2px solid rgba(0, 0, 0, 0.15);
        border-top-color: var(--mat-sys-primary, #1976d2);
        animation: burger-spin 0.9s linear infinite;
        box-sizing: border-box;
      }
      :host-context(.dark-theme) .header-burger-wrapper .burger-loader-ring {
        border-color: rgba(255, 255, 255, 0.2);
        border-top-color: var(--mat-sys-primary, #90caf9);
      }
      @keyframes burger-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Input() isOver = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  headerPhotoUrl?: string;
  private _objectUrl?: string;
  currentUser?: UserDto;
  currentLang: 'fr' | 'en' = 'fr';

  get loadingState$() {
    return this.loading.state$;
  }

  constructor(
    public theme: ThemeService,
    private auth: AuthService,
    private router: Router,
    private notify: NotifyService,
    private userService: UserService,
    private dialog: MatDialog,
    private loading: LoadingService,
  ) {}

  ngOnInit(): void {
    // Load once at start
    this.loadHeaderPhoto();
    // Initialize language from localStorage and apply to Google Translate when ready
    const saved = (localStorage.getItem('app_lang') as 'fr' | 'en') || 'fr';
    this.currentLang = saved;
    this.applyLanguageWhenReady(saved);
    // Reload when current user changes (e.g., photo updated) and store user
    this.auth.currentUser$.subscribe((u) => {
      if (u) {
        this.currentUser = u;
        // Charger la photo avec un petit délai pour s'assurer que le backend a terminé le traitement
        setTimeout(() => {
          this.loadHeaderPhoto();
        }, 300);
      } else {
        this.currentUser = undefined;
        this.headerPhotoUrl = undefined;
      }
    });
  }

  private applyLanguageWhenReady(lang: 'fr' | 'en') {
    const tryApply = () => {
      const combo: HTMLSelectElement | null = document.querySelector('select.goog-te-combo');
      if (combo) {
        if (combo.value !== lang) {
          combo.value = lang;
          combo.dispatchEvent(new Event('change'));
        }
        document.documentElement.lang = lang;
        return true;
      }
      return false;
    };
    // Attempt immediately and then retry a few times if widget not ready yet
    if (tryApply()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (tryApply() || attempts > 50) {
        clearInterval(timer);
      }
    }, 200);
  }

  switchLanguage(lang: 'fr' | 'en') {
    this.currentLang = lang;
    localStorage.setItem('app_lang', lang);
    this.applyLanguageWhenReady(lang);
  }

  openGlobalSearch() {
    this.dialog.open(GlobalSearchDialogComponent, {
      autoFocus: true,
      panelClass: 'global-search-dialog',
    });
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(ev: KeyboardEvent) {
    // Ctrl+K or Ctrl+Shift+F
    const ctrl = ev.ctrlKey || ev.metaKey; // meta for Mac
    if ((ctrl && (ev.key.toLowerCase() === 'k')) || (ctrl && ev.shiftKey && ev.key.toLowerCase() === 'f')) {
      ev.preventDefault();
      this.openGlobalSearch();
    }
  }

  get roleLabel(): string {
    const roles = this.currentUser?.roles;
    return roles && roles.length ? roles[0].name : 'Utilisateur';
  }

  ngOnDestroy(): void {
    if (this._objectUrl) URL.revokeObjectURL(this._objectUrl);
  }

  private loadHeaderPhoto() {
    const id = this.auth.getCurrentUserId();
    if (!id) {
      this.headerPhotoUrl = undefined;
      return;
    }
    // If we know there is no photo, avoid calling the backend to prevent a 404
    if (!this.currentUser?.photo) {
      this.headerPhotoUrl = undefined; // fallback handled in template
      return;
    }

    this.userService.getUserPhotoBlob(id).subscribe({
      next: (blob) => {
        if (this._objectUrl) {
          URL.revokeObjectURL(this._objectUrl);
        }
        this._objectUrl = URL.createObjectURL(blob);
        this.headerPhotoUrl = this._objectUrl;
      },
      error: () => {
        this.headerPhotoUrl = undefined; // fallback handled in template
      },
    });
  }

  onHamburgerClick() {
    if (this.isOver) {
      console.log('[Header] Hamburger click: mobile mode (isOver=true) -> emit toggleMobileNav');
      this.toggleMobileNav.emit();
    } else {
      console.log('[Header] Hamburger click: desktop mode (isOver=false) -> emit toggleCollapsed AND toggleMobileNav');
      // Emit collapse for desktop layout styling, and also toggle sidenav open state for immediate visual feedback
      this.toggleCollapsed.emit();
      this.toggleMobileNav.emit();
    }
  }

  toggleTheme() {
    this.theme.toggle();
  }

  openCompanySettings() {
    this.router.navigate(['/theme-pages/company-settings']);
  }

  onLogout() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/authentication/login']);
      return;
    }
    this.notify
      .confirm({
        title: 'Se déconnecter ?',
        text: 'Vous allez être redirigé vers la page de connexion.',
        confirmText: 'Se déconnecter',
        cancelText: 'Annuler',
        icon: 'warning',
      })
      .then((res) => {
        if (res.isConfirmed) {
          this.auth.logout().subscribe({
            next: () => {
              this.router.navigate(['/authentication/login']);
            },
            error: (e) => {
              console.error('Logout failed, clearing session locally.', e);
              this.router.navigate(['/authentication/login']);
            },
          });
        }
      });
  }
}