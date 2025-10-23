import { NgModule } from '@angular/core';
// TEMPORAIREMENT DÉSACTIVÉ - Incompatibilité avec Angular 20
// import { TablerIconsModule } from 'angular-tabler-icons';
// import { IconBrandFacebook, IconBrandGoogle, IconSearch, IconDotsVertical, IconSend } from 'angular-tabler-icons/icons';

@NgModule({
  imports: [
    // Configure only the icons we need
    // TablerIconsModule.pick({
    //   IconBrandFacebook,
    //   IconBrandGoogle,
    //   IconSearch,
    //   IconDotsVertical,
    //   IconSend,
    // }),
  ],
  // DEPRECATED: This module is no longer used. Icons are now provided via @ng-icons/core with <ng-icon> components.
  exports: [],
})
export class AppTablerIconsModule {}
