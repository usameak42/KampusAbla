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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          id: string
          metadata: Json | null
          reason: string | null
          requested_at: string | null
          scheduled_deletion_date: string
          status: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          requested_at?: string | null
          scheduled_deletion_date: string
          status?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          requested_at?: string | null
          scheduled_deletion_date?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_history: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string
          external_transaction_id: string | null
          id: string
          invoice_url: string | null
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description: string
          external_transaction_id?: string | null
          id?: string
          invoice_url?: string | null
          status?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string
          external_transaction_id?: string | null
          id?: string
          invoice_url?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_children: {
        Row: {
          booking_id: string
          child_id: string
          created_at: string
          id: string
        }
        Insert: {
          booking_id: string
          child_id: string
          created_at?: string
          id?: string
        }
        Update: {
          booking_id?: string
          child_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_children_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_children_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          duration_hours: number
          id: string
          meeting_address: string | null
          notes: string | null
          parent_id: string
          pickup_location_id: string | null
          pickup_needed: boolean | null
          sitter_id: string
          start_time: string
          status: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          booking_date: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          duration_hours?: number
          id?: string
          meeting_address?: string | null
          notes?: string | null
          parent_id: string
          pickup_location_id?: string | null
          pickup_needed?: boolean | null
          sitter_id: string
          start_time: string
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          booking_date?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          duration_hours?: number
          id?: string
          meeting_address?: string | null
          notes?: string | null
          parent_id?: string
          pickup_location_id?: string | null
          pickup_needed?: boolean | null
          sitter_id?: string
          start_time?: string
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "pickup_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      child_reviews: {
        Row: {
          child_id: string
          created_at: string
          id: string
          review_id: string
          tip_for_next_sitter: string | null
          visible_to_family: boolean
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          review_id: string
          tip_for_next_sitter?: string | null
          visible_to_family?: boolean
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          review_id?: string
          tip_for_next_sitter?: string | null
          visible_to_family?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "child_reviews_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_reviews_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          allergies: string | null
          birth_date: string | null
          created_at: string
          gender: string | null
          id: string
          name: string
          notes: string | null
          parent_id: string
          special_needs: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          birth_date?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          name: string
          notes?: string | null
          parent_id: string
          special_needs?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          birth_date?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          name?: string
          notes?: string | null
          parent_id?: string
          special_needs?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          last_message_at: string | null
          parent_id: string
          sitter_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          parent_id: string
          sitter_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          parent_id?: string
          sitter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      data_access_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          parent_id: string
          sitter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id: string
          sitter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string
          sitter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      kvkk_consents: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          granted_at: string | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          blocked_reason: string | null
          content: string
          conversation_id: string
          id: string
          is_blocked: boolean | null
          read_at: string | null
          sender_id: string
          sent_at: string
        }
        Insert: {
          blocked_reason?: string | null
          content: string
          conversation_id: string
          id?: string
          is_blocked?: boolean | null
          read_at?: string | null
          sender_id: string
          sent_at?: string
        }
        Update: {
          blocked_reason?: string | null
          content?: string
          conversation_id?: string
          id?: string
          is_blocked?: boolean | null
          read_at?: string | null
          sender_id?: string
          sent_at?: string
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
      moderation_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          notes: string | null
          report_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          notes?: string | null
          report_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      need_applications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          need_post_id: string
          proposed_rate: number | null
          sitter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          need_post_id: string
          proposed_rate?: number | null
          sitter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          need_post_id?: string
          proposed_rate?: number | null
          sitter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "need_applications_need_post_id_fkey"
            columns: ["need_post_id"]
            isOneToOne: false
            referencedRelation: "need_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_applications_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      need_post_children: {
        Row: {
          child_id: string
          created_at: string
          id: string
          need_post_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          need_post_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          need_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "need_post_children_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_post_children_need_post_id_fkey"
            columns: ["need_post_id"]
            isOneToOne: false
            referencedRelation: "need_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      need_posts: {
        Row: {
          created_at: string
          description: string | null
          duration_hours: number
          homework_help: boolean | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          language_goal: string | null
          meeting_address: string | null
          needed_date: string
          parent_id: string
          pickup_address: string | null
          pickup_needed: boolean | null
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_hours?: number
          homework_help?: boolean | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          language_goal?: string | null
          meeting_address?: string | null
          needed_date: string
          parent_id: string
          pickup_address?: string | null
          pickup_needed?: boolean | null
          start_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_hours?: number
          homework_help?: boolean | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          language_goal?: string | null
          meeting_address?: string | null
          needed_date?: string
          parent_id?: string
          pickup_address?: string | null
          pickup_needed?: boolean | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "need_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      parents: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          district: string | null
          full_name: string
          id: string
          phone: string | null
          profile_photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          full_name: string
          id?: string
          phone?: string | null
          profile_photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          profile_photo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          bank_account_info: Json | null
          created_at: string
          id: string
          payment_method: string | null
          processed_at: string | null
          sitter_id: string
          status: string
        }
        Insert: {
          amount: number
          bank_account_info?: Json | null
          created_at?: string
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          sitter_id: string
          status?: string
        }
        Update: {
          amount?: number
          bank_account_info?: Json | null
          created_at?: string
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          sitter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_locations: {
        Row: {
          address: string
          child_id: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          parent_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          school_id: string | null
          updated_at: string
        }
        Insert: {
          address: string
          child_id?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          parent_id: string
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          child_id?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          parent_id?: string
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_locations_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_locations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number
          recorded_at: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value: number
          recorded_at?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number
          recorded_at?: string
        }
        Relationships: []
      }
      rate_limit_tracking: {
        Row: {
          action: string
          created_at: string
          id: string
          identifier: string
          request_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          identifier: string
          request_count?: number
          updated_at?: string
          window_start: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          identifier?: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          reason: string | null
          status: string
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          booking_id: string | null
          created_at: string
          description: string | null
          evidence_urls: Json | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          session_id: string | null
          status: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: Json | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          status?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: Json | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_flags: {
        Row: {
          created_at: string
          flag_key: string
          id: string
          review_id: string
          triggers_report: boolean
          value: boolean
        }
        Insert: {
          created_at?: string
          flag_key: string
          id?: string
          review_id: string
          triggers_report?: boolean
          value?: boolean
        }
        Update: {
          created_at?: string
          flag_key?: string
          id?: string
          review_id?: string
          triggers_report?: boolean
          value?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "review_flags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_ratings: {
        Row: {
          created_at: string
          id: string
          question_key: string
          rating: number
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_key: string
          rating: number
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_key?: string
          rating?: number
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_ratings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          created_at: string | null
          deadline: string
          id: string
          parent_id: string
          parent_submitted: boolean | null
          session_id: string
          sitter_id: string
          sitter_submitted: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deadline: string
          id?: string
          parent_id: string
          parent_submitted?: boolean | null
          session_id: string
          sitter_id: string
          sitter_submitted?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deadline?: string
          id?: string
          parent_id?: string
          parent_submitted?: boolean | null
          session_id?: string
          sitter_id?: string
          sitter_submitted?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      review_tags: {
        Row: {
          created_at: string
          id: string
          is_positive: boolean
          review_id: string
          tag_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_positive: boolean
          review_id: string
          tag_key: string
        }
        Update: {
          created_at?: string
          id?: string
          is_positive?: boolean
          review_id?: string
          tag_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_tags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          free_comment: string | null
          id: string
          is_trusted: boolean | null
          rating: number
          review_type: string | null
          reviewee_id: string
          reviewer_id: string
          reviewer_role: string
          session_id: string
          tip_for_next_sitter: string | null
          weight_factor: number | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          free_comment?: string | null
          id?: string
          is_trusted?: boolean | null
          rating: number
          review_type?: string | null
          reviewee_id: string
          reviewer_id: string
          reviewer_role: string
          session_id: string
          tip_for_next_sitter?: string | null
          weight_factor?: number | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          free_comment?: string | null
          id?: string
          is_trusted?: boolean | null
          rating?: number
          review_type?: string | null
          reviewee_id?: string
          reviewer_id?: string
          reviewer_role?: string
          session_id?: string
          tip_for_next_sitter?: string | null
          weight_factor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          district: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          school_type: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          school_type?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          school_type?: string | null
        }
        Relationships: []
      }
      session_locations: {
        Row: {
          accuracy: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          session_id: string
        }
        Insert: {
          accuracy?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          session_id: string
        }
        Update: {
          accuracy?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_locations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          actual_duration_minutes: number | null
          arrived_at: string | null
          booking_id: string
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          parent_confirmed_at: string | null
          picked_up_at: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          arrived_at?: string | null
          booking_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          parent_confirmed_at?: string | null
          picked_up_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_duration_minutes?: number | null
          arrived_at?: string | null
          booking_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          parent_confirmed_at?: string | null
          picked_up_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      sitter_areas: {
        Row: {
          created_at: string
          district: string | null
          id: string
          latitude: number
          longitude: number
          radius_km: number | null
          sitter_id: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          id?: string
          latitude: number
          longitude: number
          radius_km?: number | null
          sitter_id: string
        }
        Update: {
          created_at?: string
          district?: string | null
          id?: string
          latitude?: number
          longitude?: number
          radius_km?: number | null
          sitter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sitter_areas_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      sitter_posts: {
        Row: {
          available_date: string
          created_at: string
          description: string | null
          duration_hours: number
          hourly_rate: number
          id: string
          sitter_id: string
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          available_date: string
          created_at?: string
          description?: string | null
          duration_hours?: number
          hourly_rate?: number
          id?: string
          sitter_id: string
          start_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          available_date?: string
          created_at?: string
          description?: string | null
          duration_hours?: number
          hourly_rate?: number
          id?: string
          sitter_id?: string
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sitter_posts_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      sitter_verifications: {
        Row: {
          background_check_url: string | null
          created_at: string
          government_id_url: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          sitter_id: string
          student_id_url: string | null
          submitted_at: string | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          background_check_url?: string | null
          created_at?: string
          government_id_url?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          sitter_id: string
          student_id_url?: string | null
          submitted_at?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          background_check_url?: string | null
          created_at?: string
          government_id_url?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          sitter_id?: string
          student_id_url?: string | null
          submitted_at?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sitter_verifications_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      sitters: {
        Row: {
          badge_level: string | null
          bio: string | null
          city: string | null
          created_at: string
          department: string | null
          district: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          profile_photo_url: string | null
          rating: number | null
          review_count: number | null
          student_year: number | null
          university: string | null
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          badge_level?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          department?: string | null
          district?: string | null
          full_name: string
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          review_count?: number | null
          student_year?: number | null
          university?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          badge_level?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          department?: string | null
          district?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          review_count?: number | null
          student_year?: number | null
          university?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          external_plan_id: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          plan_type: string
          price_monthly: number
          price_yearly: number | null
          tier: string
        }
        Insert: {
          created_at?: string
          external_plan_id?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          plan_type: string
          price_monthly?: number
          price_yearly?: number | null
          tier: string
        }
        Update: {
          created_at?: string
          external_plan_id?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          plan_type?: string
          price_monthly?: number
          price_yearly?: number | null
          tier?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          expires_at: string | null
          external_id: string | null
          id: string
          plan_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          closed_at: string | null
          created_at: string | null
          id: string
          message: string
          priority: string | null
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ticket_responses: {
        Row: {
          created_at: string | null
          id: string
          is_staff: boolean | null
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_staff?: boolean | null
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_staff?: boolean | null
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          paid_at: string | null
          parent_id: string
          payment_gateway_id: string | null
          payment_method: string | null
          platform_fee: number
          sitter_amount: number
          sitter_id: string
          status: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          parent_id: string
          payment_gateway_id?: string | null
          payment_method?: string | null
          platform_fee?: number
          sitter_amount: number
          sitter_id: string
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          parent_id?: string
          payment_gateway_id?: string | null
          payment_method?: string | null
          platform_fee?: number
          sitter_amount?: number
          sitter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_fcm_tokens: {
        Row: {
          created_at: string
          device_info: Json | null
          id: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          id?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          id?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_metrics: {
        Row: {
          acceptance_rate: number | null
          completion_rate: number | null
          id: string
          profile_views: number | null
          response_time_avg: number | null
          saves_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acceptance_rate?: number | null
          completion_rate?: number | null
          id?: string
          profile_views?: number | null
          response_time_avg?: number | null
          saves_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acceptance_rate?: number | null
          completion_rate?: number | null
          id?: string
          profile_views?: number | null
          response_time_avg?: number | null
          saves_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          language: string | null
          notification_preferences: Json | null
          privacy_settings: Json | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          language?: string | null
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string | null
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_suspensions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_permanent: boolean | null
          lifted_at: string | null
          lifted_by: string | null
          reason: string
          suspended_at: string
          suspended_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_permanent?: boolean | null
          lifted_at?: string | null
          lifted_by?: string | null
          reason: string
          suspended_at?: string
          suspended_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_permanent?: boolean | null
          lifted_at?: string | null
          lifted_by?: string | null
          reason?: string
          suspended_at?: string
          suspended_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_logs: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          sitter_id: string
          status: string
          verification_type: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          sitter_id: string
          status?: string
          verification_type: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          sitter_id?: string
          status?: string
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_logs_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      analytics_completion_rate: {
        Row: {
          completed_count: number | null
          completion_percentage: number | null
          total_count: number | null
          week_start: string | null
        }
        Relationships: []
      }
      analytics_financial_weekly: {
        Row: {
          total_platform_revenue: number | null
          total_sitter_earnings: number | null
          total_volume: number | null
          transaction_count: number | null
          week_start: string | null
        }
        Relationships: []
      }
      analytics_safety_stats: {
        Row: {
          incident_rate_per_1000: number | null
          month_start: string | null
          total_reports: number | null
          total_sessions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      cleanup_old_notifications: { Args: never; Returns: undefined }
      cleanup_rate_limit_data: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_rate_limit: {
        Args: {
          p_action: string
          p_identifier: string
          p_max_requests: number
          p_window_start: string
        }
        Returns: {
          request_count: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
