import { Injectable } from '@angular/core';

declare global {
  interface Window { ngxPermissions?: { loadPermissions: (perms: string[]) => void; flushPermissions: () => void }; }
}

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private current = new Set<string>();
  load(perms: string[]) {
    try { window.ngxPermissions?.loadPermissions(perms || []); } catch {}
    this.current = new Set((perms || []).map(p => p.toString()));
  }
  flush() {
    try { window.ngxPermissions?.flushPermissions(); } catch {}
    this.current.clear();
  }
  has(name: string): boolean { return this.current.has(name); }
}
