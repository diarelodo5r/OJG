export interface LaravelPaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface LaravelPaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface LaravelPaginatedResponse<T> {
  data: T[];
  meta?: LaravelPaginationMeta; // some setups use meta/links
  links?: LaravelPaginationLinks;
  // or Laravel default paginator shape
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}
