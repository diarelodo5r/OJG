import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Gestion Commerciale',
    divider: true,  
  },
  {
    displayName: 'Vente',
    iconName: 'solar:cart-line-duotone',
    route: '/gescom/ventes',
    children: [
      {
        displayName: 'Enregistrer Vente',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/ventes/create',
      },
      {
        displayName: 'Table Ventes',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/ventes',
      },
      {
        displayName: 'Modifier Ventes',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/ventes/admin',
      },
      {
        displayName: 'Table Client',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/clients',
      },
      {
        displayName: 'Modifier Client',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/clients/admin',
      },
    ],
  },
  {
    displayName: 'Commandes',
    iconName: 'solar:home-add-angle-linear',
    route: '/gescom/commandes',
  },
  {
    displayName: 'Bibliothèque',
    iconName: 'solar:folder-with-files-line-duotone',
    route: '/library',
  },
  {
    displayName: 'Stock',
    iconName: 'solar:box-linear',
    route: '/gescom/stock',
    children: [
      {
        displayName: 'Table Stock',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/stock',
      },
      {
        displayName: 'Modifier Stock',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/stock/admin',
      },
      {
        displayName: 'Ajouter Stock',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/stock/create',
      },
    ],
  },
  {
    displayName: 'Articles',
    iconName: 'solar:box-minimalistic-line-duotone',
    route: '/gescom/articles',
    children: [
      {
        displayName: 'Table Articles',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/articles',
      },
      {
        displayName: 'Modifier Articles',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/articles/admin',
      },
    ],
  },
  {
    displayName: 'Familles',
    iconName: 'solar:widget-2-line-duotone',
    route: '/gescom/familles',
    children: [
      {
        displayName: 'Table Familles',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/familles',
      },
      {
        displayName: 'Modifier Familles',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/familles/admin',
      },
    ],
  },
  {
    displayName: 'Fournisseurs',
    iconName: 'solar:users-group-rounded-line-duotone',
    route: '/gescom/fournisseurs',
    children: [
      {
        displayName: 'Table Fournisseur',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/fournisseurs',
      },
      {
        displayName: 'Modifier Fournisseur',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/fournisseurs/admin',
      },
    ],
  },
  {
    displayName: 'Historiques',
    iconName: 'solar:history-2-line-duotone',
    route: '/gescom/historiques',
    children: [
      {
        displayName: "Prix de ventes",
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/historiques/ventes',
      },
      {
        displayName: "Prix d'achats",
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/historiques/achats',
      },
      {
        displayName: 'Activités Utilisateurs',
        subItemIcon: true,
        iconName: 'solar:round-alt-arrow-right-line-duotone',
        route: '/gescom/historiques/utilisateurs',
      },
    ],
  },
  {
    displayName: 'Articles Archivés',
    iconName: 'solar:archive-down-minimlistic-line-duotone',
    route: '/gescom/archives/articles',
  },
  {
    navCap: 'Compte',
    divider: true,
  },
  {
    displayName: 'Utilisateurs',
    iconName: 'solar:users-group-rounded-line-duotone',
    route: '/gescom/utilisateurs',
  },
  {
    displayName: 'Mon Profil',
    iconName: 'solar:user-circle-line-duotone',
    route: '/profile',
  },
  {
    displayName: 'Se déconnecter',
    iconName: 'solar:logout-2-line-duotone',
    route: '/authentication/logout',
  },
  // {
  //   divider: true,
  //   navCap: 'Auth',
  // },
  // {
  //   displayName: 'Login',
  //   iconName: 'solar:lock-keyhole-minimalistic-line-duotone',
  //   route: '/authentication',
  //   children: [
  //     {
  //       displayName: 'Login',
  //        subItemIcon: true,
  //       iconName: 'solar:round-alt-arrow-right-line-duotone',
  //       route: '/authentication/login',
  //     },
  //     {
  //       displayName: 'Side Login',
  //        subItemIcon: true,
  //       iconName: 'solar:round-alt-arrow-right-line-duotone',
  //       route: '/authentication/side-login',
  //     },
  //   ],
  // },
  // {
  //   displayName: 'Register',
  //   iconName: 'solar:user-plus-rounded-line-duotone',
  //   route: '/authentication',
  //   children: [
  //     {
  //       displayName: 'Register',
  //        subItemIcon: true,
  //       iconName: 'solar:round-alt-arrow-right-line-duotone',
  //       route: '/authentication/register',
  //     },
  //     {
  //       displayName: 'Side Register',
  //        subItemIcon: true,
  //       iconName: 'solar:round-alt-arrow-right-line-duotone',
  //       route: '/authentication/side-register',
  //     },
  //   ],
  // },
  // {
  //   displayName: 'Error',
  //   iconName: 'solar:bug-minimalistic-line-duotone',
  //   route: '/authentication/error',
  // },
];
