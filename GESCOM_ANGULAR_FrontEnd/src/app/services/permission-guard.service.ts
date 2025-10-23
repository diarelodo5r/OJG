import { Injectable } from '@angular/core';
import { PermissionsService } from './permissions.service';
import { PermissionBindingService } from './permission-binding.service';

@Injectable({ providedIn: 'root' })
export class PermissionGuardService {
  constructor(private perms: PermissionsService, private bindings: PermissionBindingService) {}

  /**
   * Check if the current user can access a resource given one or many permission names.
   * If bindings exist for the resource, we ensure the provided permission(s) are present.
   * If no bindings exist for the resource, default to allow to avoid blocking UIs before setup.
   */
  can(resource: string, required: string | string[], roleId?: number): boolean {
    const req = Array.isArray(required) ? required : [required];
    // If a roleId is provided, read its bindings; otherwise assume bindings not enforced.
    const bound = roleId != null ? this.bindings.getBindings(roleId) : [];
    const resourceBinding = bound.find(b => b.resource === resource);
    // Default allow if no explicit binding for the resource
    const permissionsToCheck = resourceBinding ? req : [];
    if (!resourceBinding) return true;
    // All required must be present in current loaded permissions
    return permissionsToCheck.every(name => this.perms.has(name));
  }
}
