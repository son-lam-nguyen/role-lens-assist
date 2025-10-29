export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      calendar_events: {
        Row: {
          case_id: string | null
          client: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          risk: string
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          client: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          risk: string
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          client?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          risk?: string
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          age: number
          analysis_notes: Json | null
          assigned_worker: string
          contact: string
          created_at: string
          gender: string
          id: string
          name: string
          notes: string | null
          risk_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age: number
          analysis_notes?: Json | null
          assigned_worker: string
          contact: string
          created_at?: string
          gender: string
          id?: string
          name: string
          notes?: string | null
          risk_level: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number
          analysis_notes?: Json | null
          assigned_worker?: string
          contact?: string
          created_at?: string
          gender?: string
          id?: string
          name?: string
          notes?: string | null
          risk_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string
          id: string
          status: string
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          client_id: string
          client_secret?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recordings: {
        Row: {
          client_id: string | null
          created_at: string
          duration: number
          file_extension: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          storage_path: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          duration: number
          file_extension?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          storage_path: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          duration?: number
          file_extension?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      soap_notes: {
        Row: {
          assessment: string | null
          client_id: string | null
          created_at: string
          id: string
          note_references: string[] | null
          objective: string | null
          plan: string | null
          subjective: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          note_references?: string[] | null
          objective?: string | null
          plan?: string | null
          subjective?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          note_references?: string[] | null
          objective?: string | null
          plan?: string | null
          subjective?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "soap_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          key_phrases: string[] | null
          key_points: string[] | null
          pii_masked: boolean | null
          recording_id: string | null
          risk_flags: Json | null
          summary: string | null
          transcript_text: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          key_phrases?: string[] | null
          key_points?: string[] | null
          pii_masked?: boolean | null
          recording_id?: string | null
          risk_flags?: Json | null
          summary?: string | null
          transcript_text: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          key_phrases?: string[] | null
          key_points?: string[] | null
          pii_masked?: boolean | null
          recording_id?: string | null
          risk_flags?: Json | null
          summary?: string | null
          transcript_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
