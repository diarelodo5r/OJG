import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product, ProductCategory, Supplier, User, ProductFormData } from '../models/product.interface';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  [key: string]: any;
}
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiBaseUrl; // Centralized API base URL

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('access_token');
    let headers = new HttpHeaders({ 'Accept': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  // Product CRUD operations
  getProducts(params?: PaginationParams): Observable<PaginatedResponse<Product>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    
    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/products`, { params: httpParams });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`, { headers: this.getAuthHeaders() });
  }

  createProduct(product: ProductFormData): Observable<Product> {
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('description', product.description);
    formData.append('price', product.price.toString());
    formData.append('quantity', product.quantity.toString());
    formData.append('seller_id', product.seller_id.toString());
    formData.append('category_id', product.category_id.toString());
    formData.append('supplier_id', product.supplier_id.toString());
    
    if (product.photo) {
      formData.append('photo', product.photo);
      // Compatibilité potentielle avec des API qui attendent 'image'
      formData.append('image', product.photo);
    }

    return this.http.post<Product>(`${this.apiUrl}/products`, formData);
  }

  updateProduct(id: number, product: ProductFormData): Observable<Product> {
    // Legacy full update with multipart (kept for compatibility)
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('description', product.description);
    formData.append('price', product.price.toString());
    formData.append('quantity', product.quantity.toString());
    formData.append('seller_id', product.seller_id.toString());
    formData.append('category_id', product.category_id.toString());
    formData.append('supplier_id', product.supplier_id.toString());
    formData.append('_method', 'PUT'); // Laravel
    if (product.photo) formData.append('photo', product.photo);
    const headers = this.getAuthHeaders();
    return this.http.post<Product>(`${this.apiUrl}/products/${id}`, formData, { headers });
  }

  updateProductPartial(id: number, changes: Partial<Product>): Observable<Product> {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, changes, { headers });
  }

  deleteProduct(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`, { headers });
  }

  // Product photo operations
  uploadProductPhoto(productId: number, photo: File): Observable<any> {
    const formData = new FormData();
    formData.append('photo', photo);
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/products/${productId}/photo`, formData, { headers });
  }

  getProductPhoto(productId: number): Observable<Blob> {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('access_token');
    const headers = token ? { Authorization: `Bearer ${token}` } as any : {};
    const ts = Date.now(); // cache-busting
    return this.http.get(`${this.apiUrl}/products/${productId}/photo?t=${ts}`, { responseType: 'blob', headers }) as Observable<Blob>;
  }

  // Category operations
  getCategories(): Observable<ProductCategory[]> {
    return this.http
      .get<{ data: ProductCategory[] } | ProductCategory[]>(`${this.apiUrl}/categories`, { params: { per_page: 1000 } as any })
      .pipe(map((res: any) => (Array.isArray(res) ? res : (res?.data ?? []))));
  }

  getCategory(id: number): Observable<ProductCategory> {
    return this.http.get<ProductCategory>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(category: Partial<ProductCategory>): Observable<ProductCategory> {
    return this.http.post<ProductCategory>(`${this.apiUrl}/categories`, category);
  }

  updateCategory(id: number, category: Partial<ProductCategory>): Observable<ProductCategory> {
    return this.http.put<ProductCategory>(`${this.apiUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }

  // Supplier operations
  getSuppliers(): Observable<Supplier[]> {
    return this.http
      .get<{ data: Supplier[] } | Supplier[]>(`${this.apiUrl}/suppliers`, { params: { per_page: 1000 } as any })
      .pipe(map((res: any) => (Array.isArray(res) ? res : (res?.data ?? []))));
  }

  getSupplier(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/suppliers/${id}`);
  }

  createSupplier(supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.apiUrl}/suppliers`, supplier);
  }

  updateSupplier(id: number, supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/suppliers/${id}`, supplier);
  }

  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/suppliers/${id}`);
  }

  // User operations (limited)
  // Note: Backend exposes users: index, show, update, destroy. Creation is via /register.
  getUsers(params?: PaginationParams): Observable<User[]> {
    const httpParams = new HttpParams({ fromObject: { per_page: 100, ...(params || {}) } as any });
    return this.http
      .get<User[] | { data: User[] } | PaginatedResponse<User>>(`${this.apiUrl}/users`, { params: httpParams })
      .pipe(map((res: any) => (Array.isArray(res) ? res : (res?.data ?? []))));
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  // Create user via auth register endpoint
  createUser(user: any): Observable<User> {
    const payload = { ...user };
    if (!payload.name && payload.username) {
      payload.name = payload.username; // fallback name for backend compatibility
    }
    return this.http
      .post<{ user?: User; data?: User } | User>(`${this.apiUrl}/register`, payload)
      .pipe(map((res: any) => res?.user ?? res?.data ?? res));
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  // User photo operations
  getUserPhoto(userId: number): Observable<Blob> {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('access_token');
    const headers = token ? { Authorization: `Bearer ${token}` } as any : {};
    const ts = Date.now(); // cache-busting
    return this.http.get(`${this.apiUrl}/users/${userId}/photo?t=${ts}`, { responseType: 'blob', headers }) as Observable<Blob>;
  }

  uploadUserPhoto(userId: number, photo: File): Observable<any> {
    const formData = new FormData();
    formData.append('photo', photo);
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/users/${userId}/photo`, formData, { headers });
  }

  // User-Role management
  getUserRoles(userId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/users/${userId}/roles`, { headers });
  }

  attachUserRoles(userId: number, roleIds: number[]): Observable<any[]> {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    return this.http.post<any[]>(`${this.apiUrl}/users/${userId}/roles/attach`, { role_ids: roleIds }, { headers });
  }

  syncUserRoles(userId: number, roleIds: number[]): Observable<any[]> {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    return this.http.put<any[]>(`${this.apiUrl}/users/${userId}/roles/sync`, { role_ids: roleIds }, { headers });
  }

  detachUserRole(userId: number, roleId: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}/roles/${roleId}`, { headers });
  }

  // Search and filter operations
  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/search/${query}`);
  }

  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/categories/${categoryId}/products`);
  }

  getProductsBySeller(sellerId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/users/${sellerId}/products`);
  }

  getProductsInStock(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/in-stock`);
  }

  getProductsOutOfStock(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/out-of-stock`);
  }

  getProductsByPriceRange(minPrice: number, maxPrice: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/price-range/${minPrice}/${maxPrice}`);
  }
}
