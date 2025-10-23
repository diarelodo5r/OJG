import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const THEME_STORAGE_KEY = 'app.theme.pref';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private isDarkSubject = new BehaviorSubject<boolean>(false);
  isDark$ = this.isDarkSubject.asObservable();

  constructor() {
    // Initialize from storage on service creation
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const isDark = stored === 'dark';
    this.isDarkSubject.next(isDark);
    this.applyThemeClass(isDark);
  }

  toggle(): void {
    const next = !this.isDarkSubject.value;
    this.setDarkTheme(next);
  }

  setDarkTheme(isDark: boolean): void {
    this.isDarkSubject.next(isDark);
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    this.applyThemeClass(isDark);
  }

  private applyThemeClass(isDark: boolean): void {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark-theme');
      html.classList.remove('light-theme');
    } else {
      html.classList.add('light-theme');
      html.classList.remove('dark-theme');
    }
  }
}
