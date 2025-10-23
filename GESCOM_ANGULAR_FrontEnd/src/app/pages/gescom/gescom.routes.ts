import { Routes } from '@angular/router';
import { authGuard } from '../../guards/auth.guard';

export const GescomRoutes: Routes = [
  {
    path: 'ventes',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./ventes/ventes-list.component').then(m => m.VentesListComponent) },
      { path: 'create', loadComponent: () => import('./ventes/ventes-create.component').then(m => m.VentesCreateComponent) },
      { path: 'admin', loadComponent: () => import('./ventes/ventes-admin.component').then(m => m.VentesAdminComponent) },
    ],
  },
  {
    path: 'stock',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./stock/stock-list.component').then(m => m.StockListComponent) },
      { path: 'create', loadComponent: () => import('./stock/stock-create.component').then(m => m.StockCreateComponent) },
      { path: 'admin', loadComponent: () => import('./stock/stock-admin.component').then(m => m.StockAdminComponent) },
    ],
  },
  {
    path: 'articles',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./articles/articles-list.component').then(m => m.ArticlesListComponent) },
      { path: 'admin', loadComponent: () => import('./articles/articles-admin.component').then(m => m.ArticlesAdminComponent) },
    ],
  },
  {
    path: 'familles',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./familles/familles-list.component').then(m => m.FamillesListComponent) },
      { path: 'admin', loadComponent: () => import('./familles/familles-admin.component').then(m => m.FamillesAdminComponent) },
    ],
  },
  {
    path: 'fournisseurs',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./fournisseurs/fournisseurs-list.component').then(m => m.FournisseursListComponent) },
      { path: 'admin', loadComponent: () => import('./fournisseurs/fournisseurs-admin.component').then(m => m.FournisseursAdminComponent) },
    ],
  },
  {
    path: 'clients',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./clients/clients-list.component').then(m => m.ClientsListComponent) },
      { path: 'admin', loadComponent: () => import('./clients/clients-admin.component').then(m => m.ClientsAdminComponent) },
    ],
  },
  {
    path: 'utilisateurs',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./utilisateurs/utilisateurs-list.component').then(m => m.UtilisateursListComponent) },
    ],
  },
  { path: 'commandes', canActivate: [authGuard], loadComponent: () => import('./commandes/commandes.component').then(m => m.CommandesComponent) },
  { path: 'historiques/ventes', canActivate: [authGuard], loadComponent: () => import('./historiques/hist-ventes.component').then(m => m.HistVentesComponent) },
  { path: 'historiques/achats', canActivate: [authGuard], loadComponent: () => import('./historiques/hist-achats.component').then(m => m.HistAchatsComponent) },
  { path: 'historiques/utilisateurs', canActivate: [authGuard], loadComponent: () => import('./historiques/hist-users.component').then(m => m.HistUsersComponent) },
  { path: 'archives/articles', canActivate: [authGuard], loadComponent: () => import('./archives/archives-articles.component').then(m => m.ArchivesArticlesComponent) },
];
