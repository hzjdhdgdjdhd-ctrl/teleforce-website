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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          at: string
          detail: Json
          id: number
          target: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          at?: string
          detail?: Json
          id?: number
          target: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          at?: string
          detail?: Json
          id?: number
          target?: string
        }
        Relationships: []
      }
      calls: {
        Row: {
          agent_id: string
          answers: Json
          campaign_id: string
          checkpoints_reached: string[]
          contact_id: string
          created_at: string
          created_by: string | null
          disposition: Database["public"]["Enums"]["call_disposition"] | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          notes: string | null
          rebuttals_used: string[]
          script_id: string
          script_version: number
          started_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          agent_id: string
          answers?: Json
          campaign_id: string
          checkpoints_reached?: string[]
          contact_id: string
          created_at?: string
          created_by?: string | null
          disposition?: Database["public"]["Enums"]["call_disposition"] | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          rebuttals_used?: string[]
          script_id: string
          script_version: number
          started_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          agent_id?: string
          answers?: Json
          campaign_id?: string
          checkpoints_reached?: string[]
          contact_id?: string
          created_at?: string
          created_by?: string | null
          disposition?: Database["public"]["Enums"]["call_disposition"] | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          rebuttals_used?: string[]
          script_id?: string
          script_version?: number
          started_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_members: {
        Row: {
          campaign_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          name: string
          script_id: string
          script_version: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id: string
          name: string
          script_id: string
          script_version?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          script_id?: string
          script_version?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      contact_batches: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string | null
          filename: string
          id: string
          imported: number
          issues: Json
          rejected: number
          skipped_duplicates: number
          total_rows: number
          updated_at: string
          updated_by: string | null
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by?: string | null
          filename: string
          id?: string
          imported?: number
          issues?: Json
          rejected?: number
          skipped_duplicates?: number
          total_rows?: number
          updated_at?: string
          updated_by?: string | null
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string | null
          filename?: string
          id?: string
          imported?: number
          issues?: Json
          rejected?: number
          skipped_duplicates?: number
          total_rows?: number
          updated_at?: string
          updated_by?: string | null
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_batches_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          alternative_phone: string | null
          assigned_at: string | null
          assigned_to: string | null
          attempts: number
          batch_id: string
          callback_at: string | null
          campaign_id: string
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          extra: Json
          first_name: string
          id: string
          last_attempt_at: string | null
          last_name: string
          notes: string | null
          phone: string
          postcode: string | null
          status: Database["public"]["Enums"]["contact_status"]
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          alternative_phone?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          attempts?: number
          batch_id: string
          callback_at?: string | null
          campaign_id: string
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          extra?: Json
          first_name: string
          id?: string
          last_attempt_at?: string | null
          last_name?: string
          notes?: string | null
          phone: string
          postcode?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          alternative_phone?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          attempts?: number
          batch_id?: string
          callback_at?: string | null
          campaign_id?: string
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          extra?: Json
          first_name?: string
          id?: string
          last_attempt_at?: string | null
          last_name?: string
          notes?: string | null
          phone?: string
          postcode?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "contact_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address_line1: string | null
          agent_id: string
          alternative_phone: string | null
          appointment_at: string | null
          best_time_to_call: string | null
          billable: boolean
          call_id: string
          campaign_id: string
          city: string | null
          compliance_score: number
          contact_id: string
          created_at: string
          created_by: string | null
          eligibility_path: string[]
          first_name: string
          id: string
          last_name: string
          lead_type: Database["public"]["Enums"]["lead_product"]
          notes: string | null
          password: string | null
          phone: string
          postcode: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_line1?: string | null
          agent_id: string
          alternative_phone?: string | null
          appointment_at?: string | null
          best_time_to_call?: string | null
          billable?: boolean
          call_id: string
          campaign_id: string
          city?: string | null
          compliance_score?: number
          contact_id: string
          created_at?: string
          created_by?: string | null
          eligibility_path?: string[]
          first_name: string
          id?: string
          last_name?: string
          lead_type?: Database["public"]["Enums"]["lead_product"]
          notes?: string | null
          password?: string | null
          phone: string
          postcode?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_line1?: string | null
          agent_id?: string
          alternative_phone?: string | null
          appointment_at?: string | null
          best_time_to_call?: string | null
          billable?: boolean
          call_id?: string
          campaign_id?: string
          city?: string | null
          compliance_score?: number
          contact_id?: string
          created_at?: string
          created_by?: string | null
          eligibility_path?: string[]
          first_name?: string
          id?: string
          last_name?: string
          lead_type?: Database["public"]["Enums"]["lead_product"]
          notes?: string | null
          password?: string | null
          phone?: string
          postcode?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          email: string
          id: string
          last_seen_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name?: string
          email: string
          id: string
          last_seen_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          last_seen_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      qa_reviews: {
        Row: {
          call_id: string
          coaching_notes: string
          compliance_score: number
          created_at: string
          created_by: string | null
          id: string
          lead_id: string | null
          overridden_failures: string[]
          passed: boolean
          reviewed_at: string
          reviewer_id: string
          supervisor_comments: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          call_id: string
          coaching_notes?: string
          compliance_score: number
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          overridden_failures?: string[]
          passed: boolean
          reviewed_at?: string
          reviewer_id: string
          supervisor_comments?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          call_id?: string
          coaching_notes?: string
          compliance_score?: number
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          overridden_failures?: string[]
          passed?: boolean
          reviewed_at?: string
          reviewer_id?: string
          supervisor_comments?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_reviews_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_reviews_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      rebuttals: {
        Row: {
          active: boolean
          campaign_id: string
          created_at: string
          created_by: string | null
          id: string
          label: string
          say: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          campaign_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          say: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          campaign_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          say?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rebuttals_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_review: { Args: never; Returns: boolean }
      claim_next_contact: {
        Args: { target_campaign: string }
        Returns: {
          address_line1: string | null
          address_line2: string | null
          alternative_phone: string | null
          assigned_at: string | null
          assigned_to: string | null
          attempts: number
          batch_id: string
          callback_at: string | null
          campaign_id: string
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          extra: Json
          first_name: string
          id: string
          last_attempt_at: string | null
          last_name: string
          notes: string | null
          phone: string
          postcode: string | null
          status: Database["public"]["Enums"]["contact_status"]
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "contacts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_role_name: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      in_campaign: { Args: { target: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      release_stale_assignments: {
        Args: { older_than?: string }
        Returns: number
      }
    }
    Enums: {
      call_disposition:
        | "no_answer"
        | "engaged"
        | "wrong_number"
        | "not_interested"
        | "callback"
        | "do_not_call"
        | "terminated_ineligible"
        | "terminated_property"
        | "qualified"
      contact_status:
        | "available"
        | "assigned"
        | "in_call"
        | "completed"
        | "callback"
        | "dnc"
        | "invalid"
      lead_product: "loft" | "cavity" | "both" | "none"
      lead_status:
        | "new"
        | "qa_pending"
        | "qa_passed"
        | "qa_failed"
        | "submitted"
        | "rejected"
      user_role: "admin" | "supervisor" | "qa" | "agent"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      call_disposition: [
        "no_answer",
        "engaged",
        "wrong_number",
        "not_interested",
        "callback",
        "do_not_call",
        "terminated_ineligible",
        "terminated_property",
        "qualified",
      ],
      contact_status: [
        "available",
        "assigned",
        "in_call",
        "completed",
        "callback",
        "dnc",
        "invalid",
      ],
      lead_product: ["loft", "cavity", "both", "none"],
      lead_status: [
        "new",
        "qa_pending",
        "qa_passed",
        "qa_failed",
        "submitted",
        "rejected",
      ],
      user_role: ["admin", "supervisor", "qa", "agent"],
    },
  },
} as const
