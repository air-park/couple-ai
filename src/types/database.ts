export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          tier: "free" | "paid";
          created_at: string;
          last_active_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          tier?: "free" | "paid";
          created_at?: string;
          last_active_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      relationships: {
        Row: {
          id: string;
          owner_user_id: string;
          relationship_type: "dating" | "married" | "cohabiting" | "other";
          nickname: string | null;
          partner_name: string | null;
          status: "active" | "paused" | "ended";
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          relationship_type: "dating" | "married" | "cohabiting" | "other";
          nickname?: string | null;
          partner_name?: string | null;
          status?: "active" | "paused" | "ended";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["relationships"]["Insert"]>;
        Relationships: [];
      };
      conversation_sessions: {
        Row: {
          id: string;
          relationship_id: string | null;
          user_id: string | null;
          input_type: "text" | "image";
          raw_input: string | null;
          status: "draft" | "uploaded" | "extracted" | "confirmed" | "analyzing" | "analyzed" | "closed";
          created_at: string;
          analyzed_at: string | null;
        };
        Insert: {
          id?: string;
          relationship_id?: string | null;
          user_id?: string | null;
          input_type: "text" | "image";
          raw_input?: string | null;
          status?: "draft" | "uploaded" | "extracted" | "confirmed" | "analyzing" | "analyzed" | "closed";
          created_at?: string;
          analyzed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["conversation_sessions"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          speaker_label: string;
          original_text: string;
          source_type: "typed" | "extracted";
          message_order: number;
          ocr_confidence: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          speaker_label: string;
          original_text: string;
          source_type: "typed" | "extracted";
          message_order: number;
          ocr_confidence?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      extracted_contents: {
        Row: {
          id: string;
          session_id: string;
          ocr_raw: string;
          user_edited: string;
          extraction_model: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          ocr_raw: string;
          user_edited: string;
          extraction_model: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["extracted_contents"]["Insert"]>;
        Relationships: [];
      };
      analysis_results: {
        Row: {
          id: string;
          session_id: string;
          tier: "free" | "paid";
          model_used: string;
          persona_results: Json;
          misunderstanding: string | null;
          final_mediator_comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          tier: "free" | "paid";
          model_used: string;
          persona_results: Json;
          misunderstanding?: string | null;
          final_mediator_comment?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["analysis_results"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          toss_payment_key: string | null;
          toss_order_id: string;
          amount: number;
          status: "pending" | "paid" | "failed" | "cancelled";
          payment_method: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          toss_payment_key?: string | null;
          toss_order_id: string;
          amount: number;
          status?: "pending" | "paid" | "failed" | "cancelled";
          payment_method?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      followups: {
        Row: {
          id: string;
          session_id: string;
          outcome: "resolved" | "ongoing" | "worsened" | "unknown" | null;
          user_action_taken: string | null;
          current_emotional_state: string | null;
          ai_response: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          outcome?: "resolved" | "ongoing" | "worsened" | "unknown" | null;
          user_action_taken?: string | null;
          current_emotional_state?: string | null;
          ai_response?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["followups"]["Insert"]>;
        Relationships: [];
      };
      memory_summaries: {
        Row: {
          id: string;
          relationship_id: string;
          recurring_topics: string[];
          a_patterns: string | null;
          b_patterns: string | null;
          frequent_triggers: string[];
          session_count: number;
          resolution_rate: number | null;
          summary_text: string | null;
          last_updated: string;
        };
        Insert: {
          id?: string;
          relationship_id: string;
          recurring_topics?: string[];
          a_patterns?: string | null;
          b_patterns?: string | null;
          frequent_triggers?: string[];
          session_count?: number;
          resolution_rate?: number | null;
          summary_text?: string | null;
          last_updated?: string;
        };
        Update: Partial<Database["public"]["Tables"]["memory_summaries"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
