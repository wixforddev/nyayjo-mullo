export interface Product {
  id: string;
  name: string;
  defaultPrice: number;
  unit: string;
  value: string;
  icon: string;
  imageUrl: string;
}

export interface Area {
  id: string;
  name: string;
}

export interface PriceRaw {
  id?: number;
  product_id: string;
  bazar_id: string;
  user_id?: string;
  price: number;
  photo_url?: string;
  created_at?: string;
  ip_address?: string;
}

export interface PriceVerified {
  id?: number;
  product_id: string;
  bazar_id: string;
  median_price: number;
  confidence_score: number;
  verified_at?: string;
}

export interface MarketBasketTotal {
  id?: number;
  bazar_id: string;
  area_id: string;
  weekly_total_default_family: number;
  calculated_at?: string;
}
