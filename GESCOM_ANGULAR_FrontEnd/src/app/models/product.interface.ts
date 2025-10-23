export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  seller_id: number;
  category_id: number;
  supplier_id: number;
  photo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductCategory {
  id?: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id?: number;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id?: number;
  name: string;
  username?: string;
  email: string;
  role_id?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  quantity: number;
  seller_id: number;
  category_id: number;
  supplier_id: number;
  photo?: File;
}
