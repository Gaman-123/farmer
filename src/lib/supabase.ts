import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// RLS-enforced browser client — never uses service_role key
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      farmers: {
        Row: {
          farmer_id: string;
          phone_number: string;
          full_name: string;
          district: string;
          village: string | null;
          latitude: number | null;
          longitude: number | null;
          preferred_language: "kn" | "en" | "hi" | "te";
          is_active: boolean;
        };
      };
      marketplace_listings: {
        Row: {
          listing_id: string;
          farmer_id: string;
          commodity_name: string;
          hsn_code: string | null;
          quantity_kg: number;
          quantity_remaining_kg: number;
          minimum_price_per_kg: number;
          grade: "A" | "B" | "C" | "ungraded";
          delivery_terms: "farm_pickup" | "nearest_mandi" | "buyer_logistics";
          status: "active" | "sold" | "expired" | "flagged" | "held" | "cancelled";
          expires_at: string;
          location_district: string | null;
          location_lat: number | null;
          location_lon: number | null;
          fair_price_estimate: number | null;
          msp_at_listing: number | null;
        };
      };
    };
  };
};
