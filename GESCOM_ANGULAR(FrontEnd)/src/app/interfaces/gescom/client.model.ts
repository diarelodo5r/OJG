export interface Client {
  id: number;
  nom: string;
  telephone?: string | null;
  adresse?: string | null;
  created_at?: string;
  updated_at?: string;
}
