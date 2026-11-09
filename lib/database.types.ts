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

export type AuctionRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  starting_price: number;
  min_bid_increment: number;
  starts_at: string;
  ends_at: string;
  status: string;
  top_bid_points: number;
  top_bidder_id: string | null;
  bid_count: number;
  winner_id: string | null;
  final_price: number | null;
  created_by: string;
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
        Relationships: [{
          foreignKeyName: "deals_pickup_point_id_fkey";
          columns: ["pickup_point_id"];
          isOneToOne: false;
          referencedRelation: "pickup_points";
          referencedColumns: ["id"];
        }];
      };
      deal_costs: {
        Row: { deal_id: string; wholesale_cost: number };
        Insert: { deal_id: string; wholesale_cost: number };
        Update: Partial<Database["public"]["Tables"]["deal_costs"]["Insert"]>;
        Relationships: [{ foreignKeyName: "deal_costs_deal_id_fkey"; columns: ["deal_id"]; isOneToOne: true; referencedRelation: "deals"; referencedColumns: ["id"] }];
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
        Relationships: [
          { foreignKeyName: "deal_joins_deal_id_fkey"; columns: ["deal_id"]; isOneToOne: false; referencedRelation: "deals"; referencedColumns: ["id"] },
          { foreignKeyName: "deal_joins_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "deal_joins_referred_by_fkey"; columns: ["referred_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      points_ledger: {
        Row: { id: string; user_id: string; delta: number; reason: string; join_id: string | null; auction_id: string | null; created_at: string };
        Insert: { id?: string; user_id: string; delta: number; reason: string; join_id?: string | null; auction_id?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["points_ledger"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "points_ledger_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "points_ledger_join_id_fkey"; columns: ["join_id"]; isOneToOne: false; referencedRelation: "deal_joins"; referencedColumns: ["id"] },
          { foreignKeyName: "points_ledger_auction_id_fkey"; columns: ["auction_id"]; isOneToOne: false; referencedRelation: "auctions"; referencedColumns: ["id"] },
        ];
      };
      auctions: {
        Row: AuctionRow;
        Insert: { id?: string; title: string; description?: string | null; image_url?: string | null; starting_price: number; min_bid_increment?: number; starts_at?: string; ends_at: string; status?: string; top_bid_points?: number; top_bidder_id?: string | null; bid_count?: number; winner_id?: string | null; final_price?: number | null; created_by: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["auctions"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "auctions_top_bidder_id_fkey"; columns: ["top_bidder_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "auctions_winner_id_fkey"; columns: ["winner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "auctions_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      auction_bids: {
        Row: { id: string; auction_id: string; user_id: string; points: number; status: string; created_at: string };
        Insert: { id?: string; auction_id: string; user_id: string; points: number; status?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["auction_bids"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "auction_bids_auction_id_fkey"; columns: ["auction_id"]; isOneToOne: false; referencedRelation: "auctions"; referencedColumns: ["id"] },
          { foreignKeyName: "auction_bids_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
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
      kpi_manual: {
        Row: { id: number; instagram_engagement: number; sponsor_leads: number; updated_at: string };
        Insert: { id?: number; instagram_engagement?: number; sponsor_leads?: number; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["kpi_manual"]["Insert"]>;
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
      create_auction: { Args: { p_title: string; p_description: string | null; p_image_url: string | null; p_starting_price: number; p_min_bid_increment: number; p_ends_at: string }; Returns: AuctionRow };
      bid_on_auction: { Args: { p_auction: string; p_points: number }; Returns: AuctionRow };
      settle_expired_auctions: { Args: Record<PropertyKey, never>; Returns: number };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
