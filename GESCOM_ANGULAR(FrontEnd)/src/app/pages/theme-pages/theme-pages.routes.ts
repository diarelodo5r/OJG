import { Routes } from '@angular/router';
import { AccountSettingComponent } from './account-setting/account-setting.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';

export const ThemePagesRoutes: Routes = [
  {
    path: 'account-setting',
    component: AccountSettingComponent,
  },
  {
    path: 'company-settings',
    component: CompanySettingsComponent,
  },
  { path: '', pathMatch: 'full', redirectTo: 'account-setting' },
];
