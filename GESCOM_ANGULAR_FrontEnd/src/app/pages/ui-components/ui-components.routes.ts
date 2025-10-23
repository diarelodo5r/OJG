import { Routes } from '@angular/router';

// ui
import { AppBadgeComponent } from './badge/badge.component';
import { AppChipsComponent } from './chips/chips.component';
import { AppChatComponent } from './chat/chat.component';
import { AppListsComponent } from './lists/lists.component';
import { AppMenuComponent } from './menu/menu.component';
import { AppTooltipsComponent } from './tooltips/tooltips.component';
import { AppFormsComponent } from './forms/forms.component';
import { AppTablesComponent } from './tables/tables.component';
import { AppSideRegisterComponent } from '../authentication/side-register/side-register.component';
import { AppCalendarComponent } from './calendar/calendar.component';
import { AppSideLoginComponent } from '../authentication/side-login/side-login.component';
import { AppPermissionComponent } from './permission/permission.component';
import { AppPaymentComponent } from './payment/payment.component';
import { AppPricingComponent } from './pricing/pricing.component';
import { AppCartComponent } from './cart/cart.component';
import { SuppliersComponent } from './suppliers/suppliers.component';
import { CategoriesComponent } from './categories/categories.component';
import { UsersComponent } from './users/users.component';
import { AppShopViewComponent } from './shop-view/shop-view';

export const UiComponentsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'badge',
        component: AppBadgeComponent,
      },
      {
        path: 'chips',
        component: AppChipsComponent,
      },
      {
        path: 'lists',
        component: AppListsComponent,
      },
      {
        path: 'chat',
        component: AppChatComponent,
      },
      {
        path: 'menu',
        component: AppMenuComponent,
      },
      {
        path: 'tooltips',
        component: AppTooltipsComponent,
      },
      {
        path: 'forms',
        component: AppFormsComponent,
      },
      {
        path: 'suppliers',
        component: SuppliersComponent,
      },
      {
        path: 'categories',
        component: CategoriesComponent,
      },
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'permission',
        component: AppPermissionComponent,
      },
      {
        path: 'payment',
        component: AppPaymentComponent,
      },
      {
        path: 'pricing',
        component: AppPricingComponent,
      },
      {
        path: 'cart',
        component: AppCartComponent,
      },
      {
        path: 'tables',
        component: AppTablesComponent,
      },
      {
        path: 'calendar',
        component: AppCalendarComponent,
      },
      {
        path: 'shop-view',
        component: AppShopViewComponent,
      },
    ],
  },
];
