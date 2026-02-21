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
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          bike_model: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          bike_model?: string | null
          created_at?: string
        }
        Update: {
          username?: string
          avatar_url?: string | null
          bike_model?: string | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          created_at?: string
        }
        Update: {
          name?: string
          invite_code?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          role: "admin" | "member"
          joined_at: string
        }
        Insert: {
          group_id: string
          user_id: string
          role?: "admin" | "member"
          joined_at?: string
        }
        Update: {
          role?: "admin" | "member"
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      rides: {
        Row: {
          id: string
          group_id: string
          created_by: string
          title: string
          description: string | null
          date_time: string
          start_lat: number
          start_lon: number
          meeting_point_name: string | null
          gpx_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          created_by: string
          title: string
          description?: string | null
          date_time: string
          start_lat: number
          start_lon: number
          meeting_point_name?: string | null
          gpx_url?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          date_time?: string
          start_lat?: number
          start_lon?: number
          meeting_point_name?: string | null
          gpx_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      participants: {
        Row: {
          ride_id: string
          user_id: string
          status: "attending" | "maybe" | "declined"
          updated_at: string
        }
        Insert: {
          ride_id: string
          user_id: string
          status?: "attending" | "maybe" | "declined"
          updated_at?: string
        }
        Update: {
          status?: "attending" | "maybe" | "declined"
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
