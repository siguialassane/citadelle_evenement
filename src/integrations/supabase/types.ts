export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      check_ins: {
        Row: {
          check_in_time: string
          checked_by: string | null
          id: string
          notes: string | null
          participant_id: string
        }
        Insert: {
          check_in_time?: string
          checked_by?: string | null
          id?: string
          notes?: string | null
          participant_id: string
        }
        Update: {
          check_in_time?: string
          checked_by?: string | null
          id?: string
          notes?: string | null
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_payments: {
        Row: {
          admin_notes: string | null
          amount: number
          comments: string | null
          created_at: string
          id: string
          participant_id: string
          payment_method: string
          phone_number: string
          screenshot_url: string | null
          status: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          comments?: string | null
          created_at?: string
          id?: string
          participant_id: string
          payment_method: string
          phone_number: string
          screenshot_url?: string | null
          status?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          comments?: string | null
          created_at?: string
          id?: string
          participant_id?: string
          payment_method?: string
          phone_number?: string
          screenshot_url?: string | null
          status?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_payments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          check_in_status: boolean | null
          check_in_timestamp: string | null
          contact_number: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_member: boolean | null
          last_name: string
          qr_code_id: string | null
        }
        Insert: {
          check_in_status?: boolean | null
          check_in_timestamp?: string | null
          contact_number: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_member?: boolean | null
          last_name: string
          qr_code_id?: string | null
        }
        Update: {
          check_in_status?: boolean | null
          check_in_timestamp?: string | null
          contact_number?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_member?: boolean | null
          last_name?: string
          qr_code_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          cinetpay_api_response_id: string | null
          cinetpay_operator_id: string | null
          cinetpay_payment_url: string | null
          cinetpay_token: string | null
          currency: string
          id: string
          participant_id: string
          payment_date: string
          payment_method: string
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          cinetpay_api_response_id?: string | null
          cinetpay_operator_id?: string | null
          cinetpay_payment_url?: string | null
          cinetpay_token?: string | null
          currency?: string
          id?: string
          participant_id: string
          payment_date?: string
          payment_method: string
          status: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          cinetpay_api_response_id?: string | null
          cinetpay_operator_id?: string | null
          cinetpay_payment_url?: string | null
          cinetpay_token?: string | null
          currency?: string
          id?: string
          participant_id?: string
          payment_date?: string
          payment_method?: string
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          password: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          password: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          password?: string
        }
        Relationships: []
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
