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
          status: string | null
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
          status?: string | null
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
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      booking_children: {
        Row: {
          booking_id: string
          child_id: string
          id: string
        }
        Insert: {
          booking_id: string
          child_id: string
          id?: string
        }
        Update: {
          booking_id?: string
          child_id?: string
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
          confirmed_at: string | null
          created_at: string
          duration_hours: number
          id: string
          meeting_address: string | null
          notes: string | null
          parent_id: string
          payment_status: string | null
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
          confirmed_at?: string | null
          created_at?: string
          duration_hours?: number
          id?: string
          meeting_address?: string | null
          notes?: string | null
          parent_id: string
          payment_status?: string | null
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
          confirmed_at?: string | null
          created_at?: string
          duration_hours?: number
          id?: string
          meeting_address?: string | null
          notes?: string | null
          parent_id?: string
          payment_status?: string | null
          pickup_needed?: boolean | null
          sitter_id?: string
          start_time?: string
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bookings_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_bookings_sitter"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["user_id"]
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
          visible_to_family: boolean | null
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          review_id: string
          tip_for_next_sitter?: string | null
          visible_to_family?: boolean | null
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          review_id?: string
          tip_for_next_sitter?: string | null
          visible_to_family?: boolean | null
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
          allergies: Json | null
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
          allergies?: Json | null
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
          allergies?: Json | null
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
        Relationships: []
      }
      conversations: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      data_access_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
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
        Relationships: []
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
      need_applications: {
        Row: {
          created_at: string
          hourly_rate: number | null
          id: string
          message: string | null
          need_post_id: string
          proposed_rate: number | null
          sitter_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hourly_rate?: number | null
          id?: string
          message?: string | null
          need_post_id: string
          proposed_rate?: number | null
          sitter_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hourly_rate?: number | null
          id?: string
          message?: string | null
          need_post_id?: string
          proposed_rate?: number | null
          sitter_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_need_applications_sitter"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "need_applications_need_post_id_fkey"
            columns: ["need_post_id"]
            isOneToOne: false
            referencedRelation: "need_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      need_post_children: {
        Row: {
          child_id: string
          id: string
          need_post_id: string
        }
        Insert: {
          child_id: string
          id?: string
          need_post_id: string
        }
        Update: {
          child_id?: string
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
          pickup_needed: boolean | null
          start_time: string
          status: string | null
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
          pickup_needed?: boolean | null
          start_time: string
          status?: string | null
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
          pickup_needed?: boolean | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_need_posts_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          booking_cancellations: boolean | null
          booking_confirmations: boolean | null
          booking_requests: boolean | null
          created_at: string | null
          id: string
          marketing: boolean | null
          messages: boolean | null
          reviews: boolean | null
          session_updates: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_cancellations?: boolean | null
          booking_confirmations?: boolean | null
          booking_requests?: boolean | null
          created_at?: string | null
          id?: string
          marketing?: boolean | null
          messages?: boolean | null
          reviews?: boolean | null
          session_updates?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_cancellations?: boolean | null
          booking_confirmations?: boolean | null
          booking_requests?: boolean | null
          created_at?: string | null
          id?: string
          marketing?: boolean | null
          messages?: boolean | null
          reviews?: boolean | null
          session_updates?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          message: string | null
          read_at: string | null
          related_id: string | null
          related_type: string | null
          sender_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          sender_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          sender_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      parents: {
        Row: {
          address: string | null
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
          metadata: Json | null
          payment_method: string | null
          processed_at: string | null
          sitter_id: string
          status: string | null
        }
        Insert: {
          amount: number
          bank_account_info?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          sitter_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          bank_account_info?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          sitter_id?: string
          status?: string | null
        }
        Relationships: []
      }
      pickup_locations: {
        Row: {
          address: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          parent_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          parent_id: string
          pickup_window_end?: string | null
          pickup_window_start?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          parent_id?: string
          pickup_window_end?: string | null
          pickup_window_start?: string | null
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
      reports: {
        Row: {
          booking_id: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      review_flags: {
        Row: {
          flag_key: string
          id: string
          review_id: string
          triggers_report: boolean | null
          value: boolean | null
        }
        Insert: {
          flag_key: string
          id?: string
          review_id: string
          triggers_report?: boolean | null
          value?: boolean | null
        }
        Update: {
          flag_key?: string
          id?: string
          review_id?: string
          triggers_report?: boolean | null
          value?: boolean | null
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
          id: string
          question_key: string
          rating: number
          review_id: string
        }
        Insert: {
          id?: string
          question_key: string
          rating: number
          review_id: string
        }
        Update: {
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
            foreignKeyName: "review_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_tags: {
        Row: {
          id: string
          is_positive: boolean | null
          review_id: string
          tag_key: string
        }
        Insert: {
          id?: string
          is_positive?: boolean | null
          review_id: string
          tag_key: string
        }
        Update: {
          id?: string
          is_positive?: boolean | null
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
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          review_type: string | null
          reviewee_id: string
          reviewer_id: string
          reviewer_role: string | null
          session_id: string | null
          status: string | null
          tip_for_next_sitter: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          review_type?: string | null
          reviewee_id: string
          reviewer_id: string
          reviewer_role?: string | null
          session_id?: string | null
          status?: string | null
          tip_for_next_sitter?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          review_type?: string | null
          reviewee_id?: string
          reviewer_id?: string
          reviewer_role?: string | null
          session_id?: string | null
          status?: string | null
          tip_for_next_sitter?: string | null
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
      session_status_history: {
        Row: {
          created_at: string
          id: string
          location_lat: number | null
          location_lng: number | null
          note: string | null
          session_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          note?: string | null
          session_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          note?: string | null
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_status_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          booking_id: string
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
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
      sitter_posts: {
        Row: {
          available_date: string | null
          created_at: string
          description: string | null
          duration_hours: number | null
          hourly_rate: number | null
          id: string
          sitter_id: string
          start_time: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          available_date?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          hourly_rate?: number | null
          id?: string
          sitter_id: string
          start_time?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          available_date?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          hourly_rate?: number | null
          id?: string
          sitter_id?: string
          start_time?: string | null
          status?: string | null
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
          background_check_status: string | null
          background_check_url: string | null
          created_at: string
          government_id_url: string | null
          id: string
          selfie_url: string | null
          sitter_id: string
          student_certificate_url: string | null
          student_id_url: string | null
          transcript_url: string | null
          university_email: string | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          background_check_status?: string | null
          background_check_url?: string | null
          created_at?: string
          government_id_url?: string | null
          id?: string
          selfie_url?: string | null
          sitter_id: string
          student_certificate_url?: string | null
          student_id_url?: string | null
          transcript_url?: string | null
          university_email?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          background_check_status?: string | null
          background_check_url?: string | null
          created_at?: string
          government_id_url?: string | null
          id?: string
          selfie_url?: string | null
          sitter_id?: string
          student_certificate_url?: string | null
          student_id_url?: string | null
          transcript_url?: string | null
          university_email?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sitter_verifications_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: true
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      sitters: {
        Row: {
          age: number | null
          badge_level: string | null
          bio: string | null
          created_at: string
          department: string | null
          district: string | null
          full_name: string
          gender: string | null
          hourly_rate: number | null
          id: string
          intro_video_url: string | null
          is_available: boolean | null
          is_featured: boolean | null
          languages: string[] | null
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
          year: number | null
        }
        Insert: {
          age?: number | null
          badge_level?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          district?: string | null
          full_name: string
          gender?: string | null
          hourly_rate?: number | null
          id?: string
          intro_video_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          languages?: string[] | null
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
          year?: number | null
        }
        Update: {
          age?: number | null
          badge_level?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          district?: string | null
          full_name?: string
          gender?: string | null
          hourly_rate?: number | null
          id?: string
          intro_video_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          languages?: string[] | null
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
          year?: number | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          name: string
          price: number | null
          tier: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          name: string
          price?: number | null
          tier: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          name?: string
          price?: number | null
          tier?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string | null
          closed_at: string | null
          created_at: string
          id: string
          message: string | null
          status: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          message?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          message?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_responses: {
        Row: {
          created_at: string
          id: string
          is_staff: boolean | null
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_staff?: boolean | null
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_staff?: boolean | null
          message?: string
          ticket_id?: string
          user_id?: string | null
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
          booking_id: string | null
          created_at: string
          id: string
          paid_at: string | null
          platform_fee: number
          sitter_amount: number
          sitter_id: string
          status: string | null
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          platform_fee?: number
          sitter_amount?: number
          sitter_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          platform_fee?: number
          sitter_amount?: number
          sitter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_fcm_tokens: {
        Row: {
          created_at: string
          device_info: Json | null
          id: string
          last_used_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          id?: string
          last_used_at?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          id?: string
          last_used_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          language: string | null
          notification_preferences: Json | null
          privacy_settings: Json | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_suspensions: {
        Row: {
          created_at: string
          id: string
          lifted_at: string | null
          reason: string | null
          suspended_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifted_at?: string | null
          reason?: string | null
          suspended_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lifted_at?: string | null
          reason?: string | null
          suspended_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      analytics_completion_rate: {
        Row: {
          accepted_count: number | null
          completed_count: number | null
          completion_percentage: number | null
          week_start: string | null
        }
        Relationships: []
      }
      analytics_time_to_match: {
        Row: {
          avg_hours_to_match: number | null
          booking_date: string | null
          total_matched_bookings: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_notification_preferences: {
        Args: { p_notification_type: string; p_user_id: string }
        Returns: boolean
      }
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      cleanup_old_notifications: { Args: never; Returns: undefined }
      cleanup_rate_limit_data: { Args: never; Returns: undefined }
      confirm_booking_payment: {
        Args: {
          p_payment_gateway_id: string
          p_payment_method?: string
          p_transaction_id: string
        }
        Returns: boolean
      }
      create_booking_with_transaction: {
        Args: {
          p_child_id: string
          p_end_time: string
          p_hourly_rate: number
          p_notes?: string
          p_parent_id: string
          p_sitter_id: string
          p_start_time: string
          p_total_amount: number
        }
        Returns: Json
      }
      detect_contact_info: { Args: { content: string }; Returns: string }
      get_admin_analytics_summary: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          active_users: number
          avg_match_hours: number
          bookings_count: number
          completion_rate: number
          repeat_booking_rate: number
          total_revenue: number
        }[]
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
      rollback_booking_payment: {
        Args: {
          p_booking_id: string
          p_reason?: string
          p_transaction_id: string
        }
        Returns: boolean
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
