import { Injectable } from '@angular/core';

export interface ResourceBinding {
  resource: string;           // e.g. 'sidebar.products', 'page.users', 'table.orders'
  permissions: string[];      // e.g. ['products.read', 'products.create']
}
export interface RoleBinding {
  roleId: number;
  bindings: ResourceBinding[];
}

@Injectable({ providedIn: 'root' })
export class PermissionBindingService {
  private storageKey = 'app_permission_bindings';

  private readAll(): RoleBinding[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as RoleBinding[]) : [];
    } catch { return []; }
  }

  private writeAll(all: RoleBinding[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(all));
  }

  getBindings(roleId: number): ResourceBinding[] {
    const all = this.readAll();
    return all.find(x => x.roleId === roleId)?.bindings ?? [];
  }

  saveBindings(roleId: number, bindings: ResourceBinding[]) {
    const all = this.readAll();
    const idx = all.findIndex(x => x.roleId === roleId);
    if (idx === -1) all.push({ roleId, bindings });
    else all[idx] = { roleId, bindings };
    this.writeAll(all);
  }
}
