/**
 * Auto-generated TypeScript types for Supabase database schema
 * Generated from Supabase project: ajgtdraknmayclhawwlq
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          coordinates: Json | null
          data: Json | null
          event_type: string
          id: string
          page_number: number | null
          session_id: string
          timestamp: string | null
        }
        Insert: {
          coordinates?: Json | null
          data?: Json | null
          event_type: string
          id?: string
          page_number?: number | null
          session_id: string
          timestamp?: string | null
        }
        Update: {
          coordinates?: Json | null
          data?: Json | null
          event_type?: string
          id?: string
          page_number?: number | null
          session_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sessions: {
        Row: {
          created_at: string | null
          document_id: string | null
          end_time: string | null
          id: string
          pages_viewed: number[] | null
          session_token: string | null
          share_token: string | null
          start_time: string | null
          total_duration: number | null
          unique_pages_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          end_time?: string | null
          id?: string
          pages_viewed?: number[] | null
          session_token?: string | null
          share_token?: string | null
          start_time?: string | null
          total_duration?: number | null
          unique_pages_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          end_time?: string | null
          id?: string
          pages_viewed?: number[] | null
          session_token?: string | null
          share_token?: string | null
          start_time?: string | null
          total_duration?: number | null
          unique_pages_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_sessions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_sessions_share_token_fkey"
            columns: ["share_token"]
            isOneToOne: false
            referencedRelation: "document_shares"
            referencedColumns: ["token"]
          },
          {
            foreignKeyName: "analytics_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_shares: {
        Row: {
          access_count: number | null
          created_at: string | null
          created_by: string
          document_id: string
          expires_at: string | null
          is_active: boolean | null
          last_accessed_at: string | null
          metadata: Json | null
          token: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string | null
          created_by: string
          document_id: string
          expires_at?: string | null
          is_active?: boolean | null
          last_accessed_at?: string | null
          metadata?: Json | null
          token: string
        }
        Update: {
          access_count?: number | null
          created_at?: string | null
          created_by?: string
          document_id?: string
          expires_at?: string | null
          is_active?: boolean | null
          last_accessed_at?: string | null
          metadata?: Json | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          mime_type: string | null
          name: string
          original_name: string
          page_count: number | null
          size_bytes: number
          storage_bucket: string | null
          storage_path: string | null
          thumbnail_data: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name: string
          original_name: string
          page_count?: number | null
          size_bytes: number
          storage_bucket?: string | null
          storage_path?: string | null
          thumbnail_data?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          original_name?: string
          page_count?: number | null
          size_bytes?: number
          storage_bucket?: string | null
          storage_path?: string | null
          thumbnail_data?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_shares: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      end_analytics_session: {
        Args: { session_uuid: string }
        Returns: undefined
      }
      get_document_with_shares: {
        Args: { doc_id: string }
        Returns: {
          id: string
          name: string
          original_name: string
          size_bytes: number
          page_count: number
          created_at: string
          share_count: number
          total_views: number
        }[]
      }
      get_public_document: {
        Args: { share_token: string }
        Returns: {
          document_id: string
          document_name: string
          document_size: number
          page_count: number
          storage_path: string
          created_at: string
        }[]
      }
      get_user_analytics_summary: {
        Args: { user_uuid?: string }
        Returns: {
          total_documents: number
          total_shares: number
          total_sessions: number
          total_views: number
        }[]
      }
      increment_share_access: {
        Args: { share_token: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

// Convenience types for common operations
export type Profile = Tables<'profiles'>;
export type Document = Tables<'documents'>;
export type DocumentShare = Tables<'document_shares'>;
export type AnalyticsSession = Tables<'analytics_sessions'>;
export type AnalyticsEvent = Tables<'analytics_events'>;

export type ProfileInsert = TablesInsert<'profiles'>;
export type DocumentInsert = TablesInsert<'documents'>;
export type DocumentShareInsert = TablesInsert<'document_shares'>;
export type AnalyticsSessionInsert = TablesInsert<'analytics_sessions'>;
export type AnalyticsEventInsert = TablesInsert<'analytics_events'>;

export type ProfileUpdate = TablesUpdate<'profiles'>;
export type DocumentUpdate = TablesUpdate<'documents'>;
export type DocumentShareUpdate = TablesUpdate<'document_shares'>;
export type AnalyticsSessionUpdate = TablesUpdate<'analytics_sessions'>;
export type AnalyticsEventUpdate = TablesUpdate<'analytics_events'>;
