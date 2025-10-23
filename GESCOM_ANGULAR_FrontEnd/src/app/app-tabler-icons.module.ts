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
  // Export the component module so consumers can use <i-tabler> in their templates
  exports: [/* TablerIconsModule */],
})
export class AppTablerIconsModule {}
