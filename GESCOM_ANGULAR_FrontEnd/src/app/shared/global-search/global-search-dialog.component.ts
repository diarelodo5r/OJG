import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Observable, of, forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap, catchError } from 'rxjs/operators';
import { navItems } from '../../layouts/full/sidebar/sidebar-data';
import { ProductService } from '../../services/product.service';

export interface GlobalSearchResult {
  label: string;
  route: string;
  group: 'Navigation' | 'Produits' | 'Utilisateurs' | 'Catégories';
  icon?: string;
  queryParams?: Record<string, any>;
}

interface SearchProvider {
  name: GlobalSearchResult['group'];
  search(query: string): Observable<GlobalSearchResult[]>;
}

@Component({
  selector: 'app-global-search-dialog',
  standalone: true,
  templateUrl: './global-search-dialog.component.html',
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
})
export class GlobalSearchDialogComponent {
  query = new FormControl('', { nonNullable: true });
  private query$ = new Subject<string>();
  loading = false;
  groupedResults$: Observable<{ group: GlobalSearchResult['group']; items: GlobalSearchResult[] }[]>;
  private providers: SearchProvider[];

  constructor(
    private router: Router,
    private dialogRef: MatDialogRef<GlobalSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private products: ProductService,
  ) {
    // Define providers
    this.providers = [
      this.navProvider(),
      this.productsProvider(),
      this.usersProvider(),
      this.categoriesProvider(),
    ];

    // Setup reactive pipeline
    this.groupedResults$ = this.query.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((q) => this.performSearch(q || '').pipe(startWith([])))
    );
  }

  private performSearch(q: string): Observable<{ group: GlobalSearchResult['group']; items: GlobalSearchResult[] }[]> {
    const query = q.trim();
    this.loading = true;
    const searches = this.providers.map((p) =>
      p.search(query).pipe(catchError(() => of([] as GlobalSearchResult[])))
    );
    return forkJoin(searches).pipe(
      map((resultsByProvider) => {
        this.loading = false;
        return resultsByProvider
          .map((items, idx) => ({ 
            group: this.providers[idx].name as GlobalSearchResult['group'], 
            items 
          }))
          .filter((g) => g.items.length > 0);
      })
    );
  }

  private navProvider(): SearchProvider {
    // Flatten nav items
    const flat: GlobalSearchResult[] = [];
    for (const item of navItems) {
      const displayName = (item as any).displayName as string | undefined;
      const route = (item as any).route as string | undefined;
      if (displayName && route) flat.push({ label: displayName, route, group: 'Navigation', icon: 'menu' });
      if ((item as any).children?.length) {
        for (const c of (item as any).children) {
          if (c.displayName && c.route) flat.push({ label: c.displayName, route: c.route, group: 'Navigation', icon: 'chevron_right' });
        }
      }
    }
    return {
      name: 'Navigation',
      search: (q: string): Observable<GlobalSearchResult[]> => {
        const query = q.toLowerCase();
        if (!query) return of(flat.slice(0, 10) as GlobalSearchResult[]);
        return of(
          flat.filter((r) => r.label.toLowerCase().includes(query) || r.route.toLowerCase().includes(query)).slice(0, 20)
        );
      },
    };
  }

  private productsProvider(): SearchProvider {
    return {
      name: 'Produits',
      search: (q: string) => {
        if (!q) return of([]);
        // Prefer dedicated search endpoint if available
        return this.products.searchProducts(q).pipe(
          map((items: any[]) =>
            (items || []).slice(0, 10).map((p: any) => ({
              label: `${p.name}${p.sku ? ' (' + p.sku + ')' : ''}`,
              route: '/ui-components/tables',
              queryParams: { q },
              group: 'Produits' as const,  // Add 'as const' to ensure type safety
              icon: 'shopping_bag',
            }))
          ),
          catchError(() => of([]))
        );
      }
    };
  }

  private usersProvider(): SearchProvider {
    return {
      name: 'Utilisateurs',
      search: (q: string) => {
        if (!q) return of([]);
        return this.products.getUsers({ q, per_page: 50 } as any).pipe(
          map((users: any[]) =>
            (users || [])
              .filter((u) => `${u.name || u.username || ''} ${u.email || ''}`.toLowerCase().includes(q.toLowerCase()))
              .slice(0, 10)
              .map((u) => ({
                label: `${u.name || u.username} ${u.email ? '<' + u.email + '>' : ''}`,
                route: '/ui-components/users',
                queryParams: { q },
                group: 'Utilisateurs' as const,
                icon: 'person',
              }))
          ),
          catchError(() => of([]))
        );
      },
    };
  }

  private categoriesProvider(): SearchProvider {
    return {
      name: 'Catégories',
      search: (q: string) => {
        if (!q) return of([]);
        return this.products.getCategories().pipe(
          map((cats: any[]) =>
            (cats || [])
              .filter((c) => (c.name || '').toLowerCase().includes(q.toLowerCase()))
              .slice(0, 10)
              .map((c) => ({
                label: c.name,
                route: '/ui-components/categories',
                queryParams: { q },
                group: 'Catégories' as const,
                icon: 'category',
              }))
          ),
          catchError(() => of([]))
        );
      },
    };
  }

  go(r: GlobalSearchResult) {
    this.dialogRef.close();
    if (r.route) {
      if (r.queryParams) {
        this.router.navigate([r.route], { queryParams: r.queryParams });
      } else {
        this.router.navigate([r.route]);
      }
    }
  }
}
