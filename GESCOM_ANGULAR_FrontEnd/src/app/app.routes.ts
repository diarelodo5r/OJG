import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { ProfileContentComponent } from './pages/profile/profile-content.component';
import { BlogsComponent } from './pages/blogs/blogs.component';
import { BlogDetailComponent } from './pages/blogs/blog-detail.component';
import { LandingpageComponent } from './pages/landingpage/landingpage.component';
import { AppShopComponent } from './pages/shop/shop';
import { AppShopViewComponent } from './pages/ui-components/shop-view/shop-view';
import { AppShopPaymentComponent } from './pages/ui-components/shop-payment/shop-payment';

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('./pages/ui-components/ui-components.routes').then(
            (m) => m.UiComponentsRoutes
          ),
      },
      {
        path: 'extra',
        loadChildren: () =>
          import('./pages/extra/extra.routes').then((m) => m.ExtraRoutes),
      },
      {
        path: 'theme-pages',
        loadChildren: () =>
          import('./pages/theme-pages/theme-pages.routes').then(
            (m) => m.ThemePagesRoutes
          ),
      },
      {
        path: 'library',
        loadComponent: () =>
          import('./pages/library/library.component').then(
            (m) => m.LibraryComponent
          ),
      },
      {
        path: 'gescom',
        loadChildren: () =>
          import('./pages/gescom/gescom.routes').then((m) => m.GescomRoutes),
      },
      {
        path: 'profile',
        component: ProfileContentComponent,
      },
      {
        path: 'blogs',
        component: BlogsComponent,
      },
      {
        path: 'blogs/all',
        component: BlogsComponent,
      },
      {
        path: 'blogs/:id',
        component: BlogDetailComponent,
      },
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'landingpage',
        component: LandingpageComponent,
      },
      {
        path: 'shop',
        component: AppShopComponent,
      },
      {
        path: 'shop-payment',
        component: AppShopPaymentComponent,
      },
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];
