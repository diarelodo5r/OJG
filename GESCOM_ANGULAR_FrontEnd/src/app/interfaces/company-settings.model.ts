export interface CompanySettings {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string; // Base64 encoded image or URL
}



export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'GESCOM',
  description: 'Gestion Commerciale',
  address: '',
  phone: '',
  email: '',
  website: '',
  logo: ''
};
