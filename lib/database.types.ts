export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ProfileRow = {
  id: string;
  full_name: string;
  department: string | null;
  student_type: string | null;
  is_admin: boolean;
  points_balance: number;
  free_fee_credits: number;
  streak_weeks: number;
  last_join_week: string | null;
  created_at: string;
};

type DealRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  retail_price: number;
  tiers: Json;
  max_qty_per_user: number;
  deadline: string;
  pickup_point_id: string | null;
  pickup_time: string | null;
  status: string;
  joiner_count: number;
  final_tier: string | null;
  final_price: number | null;
  sponsor_name: string | null;
  created_at: string;
};

type DealJoinRow = {
  id: string;
  deal_id: string;
  user_id: string;
  qty: number;
  points_redeemed: number;
  service_fee: number;
  payment_method: string;
  wallet_reference: string | null;
  payment_status: string;
  status: string;
  referred_by: string | null;
  amount_due: number | null;
  collected_at: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          full_name?: string;
          department?: string | null;
          student_type?: string | null;
          is_admin?: boolean;
          points_balance?: number;
          free_fee_credits?: number;
          streak_weeks?: number;
          last_join_week?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      pickup_points: {
        Row: { id: string; name: string; description: string | null; active: boolean };
        Insert: { id?: string; name: string; description?: string | null; active?: boolean };
        Update: Partial<Database["public"]["Tables"]["pickup_points"]["Insert"]>;
        Relationships: [];
      };
      deals: {
        Row: DealRow;
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          image_url?: string | null;
          category?: string | null;
          retail_price: number;
          tiers: Json;
          max_qty_per_user?: number;
          deadline: string;
          pickup_point_id?: string | null;
          pickup_time?: string | null;
          status?: string;
          joiner_count?: number;
          final_tier?: string | null;
          final_price?: number | null;
          sponsor_name?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
        Relationships: [];
      };
      deal_costs: {
        Row: { deal_id: string; wholesale_cost: number };
        Insert: { deal_id: string; wholesale_cost: number };
        Update: Partial<Database["public"]["Tables"]["deal_costs"]["Insert"]>;
        Relationships: [];
      };
      deal_joins: {
        Row: DealJoinRow;
        Insert: {
          id?: string;
          deal_id: string;
          user_id: string;
          qty: number;
          points_redeemed?: number;
          service_fee?: number;
          payment_method: string;
          wallet_reference?: string | null;
          payment_status?: string;
          status?: string;
          referred_by?: string | null;
          amount_due?: number | null;
          collected_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deal_joins"]["Insert"]>;
        Relationships: [];
      };
      points_ledger: {
        Row: { id: string; user_id: string; delta: number; reason: string; join_id: string | null; created_at: string };
        Insert: { id?: string; user_id: string; delta: number; reason: string; join_id?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["points_ledger"]["Insert"]>;
        Relationships: [];
      };
      deal_requests: {
        Row: { id: string; user_id: string; title: string; note: string | null; created_at: string };
        Insert: { id?: string; user_id: string; title: string; note?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["deal_requests"]["Insert"]>;
        Relationships: [];
      };
      request_votes: {
        Row: { request_id: string; user_id: string };
        Insert: { request_id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["request_votes"]["Insert"]>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: { id: string; user_id: string | null; endpoint: string; p256dh: string; auth: string; created_at: string };
        Insert: { id?: string; user_id?: string | null; endpoint: string; p256dh: string; auth: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      join_deal: {
        Args: { p_deal: string; p_qty: number; p_points: number; p_method: string; p_wallet_ref: string | null; p_referrer: string | null };
        Returns: DealJoinRow;
      };
      cancel_join: { Args: { p_join: string }; Returns: DealJoinRow };
      close_expired_deals: { Args: Record<PropertyKey, never>; Returns: number };
      mark_delivered: { Args: { p_deal: string }; Returns: DealRow };
      collect_join: { Args: { p_join: string }; Returns: DealJoinRow };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
