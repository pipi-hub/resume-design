export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      resumes: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          file_url: string | null;
          file_path: string | null;
          extracted_text: string | null;
          file_type: string | null;
          file_size: string | null;
          latest_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          file_url?: string | null;
          file_path?: string | null;
          extracted_text?: string | null;
          file_type?: string | null;
          file_size?: string | null;
          latest_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string | null;
          file_url?: string | null;
          file_path?: string | null;
          extracted_text?: string | null;
          file_type?: string | null;
          file_size?: string | null;
          latest_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      resumes_builder: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          template: string | null;
          resume_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          template?: string | null;
          resume_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          template?: string | null;
          resume_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      resume_analyses: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          resume_name: string | null;
          ats_score: number | null;
          match_score: number | null;
          quality_score: number | null;
          breakdown: Json | null;
          summary: string | null;
          strengths: Json | null;
          weaknesses: Json | null;
          missing_skills: Json | null;
          keywords: Json | null;
          section_analysis: Json | null;
          suggestions: Json | null;
          raw_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          resume_name?: string | null;
          ats_score?: number | null;
          match_score?: number | null;
          quality_score?: number | null;
          breakdown?: Json | null;
          summary?: string | null;
          strengths?: Json | null;
          weaknesses?: Json | null;
          missing_skills?: Json | null;
          keywords?: Json | null;
          section_analysis?: Json | null;
          suggestions?: Json | null;
          raw_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string | null;
          resume_name?: string | null;
          ats_score?: number | null;
          match_score?: number | null;
          quality_score?: number | null;
          breakdown?: Json | null;
          summary?: string | null;
          strengths?: Json | null;
          weaknesses?: Json | null;
          missing_skills?: Json | null;
          keywords?: Json | null;
          section_analysis?: Json | null;
          suggestions?: Json | null;
          raw_text?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      cover_letters: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          company_name: string | null;
          job_title: string | null;
          tone: string | null;
          content: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          company_name?: string | null;
          job_title?: string | null;
          tone?: string | null;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string | null;
          company_name?: string | null;
          job_title?: string | null;
          tone?: string | null;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          email: string | null;
          career_level: string | null;
          experience_level: string | null;
          target_role: string | null;
          career_goal: string | null;
          location: string | null;
          linkedin: string | null;
          github: string | null;
          skills: string[] | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          email?: string | null;
          career_level?: string | null;
          experience_level?: string | null;
          target_role?: string | null;
          career_goal?: string | null;
          location?: string | null;
          linkedin?: string | null;
          github?: string | null;
          skills?: string[] | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          email?: string | null;
          career_level?: string | null;
          experience_level?: string | null;
          target_role?: string | null;
          career_goal?: string | null;
          location?: string | null;
          linkedin?: string | null;
          github?: string | null;
          skills?: string[] | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      skill_gap_analyses: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          resume_name: string | null;
          target_role: string | null;
          matching_skills: Json | null;
          missing_skills: Json | null;
          overall_readiness: number | null;
          action_plan: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          resume_name?: string | null;
          target_role?: string | null;
          matching_skills?: Json | null;
          missing_skills?: Json | null;
          overall_readiness?: number | null;
          action_plan?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string | null;
          resume_name?: string | null;
          target_role?: string | null;
          matching_skills?: Json | null;
          missing_skills?: Json | null;
          overall_readiness?: number | null;
          action_plan?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      job_descriptions: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          company: string | null;
          description: string | null;
          match_score: number | null;
          matching_skills: Json | null;
          missing_skills: Json | null;
          relevant_keywords: Json | null;
          match_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          company?: string | null;
          description?: string | null;
          match_score?: number | null;
          matching_skills?: Json | null;
          missing_skills?: Json | null;
          relevant_keywords?: Json | null;
          match_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          company?: string | null;
          description?: string | null;
          match_score?: number | null;
          matching_skills?: Json | null;
          missing_skills?: Json | null;
          relevant_keywords?: Json | null;
          match_data?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      interview_sessions: {
        Row: {
          id: string;
          user_id: string;
          role: string | null;
          experience_level: string | null;
          job_description: string | null;
          resume_name: string | null;
          questions: Json | null;
          average_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: string | null;
          experience_level?: string | null;
          job_description?: string | null;
          resume_name?: string | null;
          questions?: Json | null;
          average_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string | null;
          experience_level?: string | null;
          job_description?: string | null;
          resume_name?: string | null;
          questions?: Json | null;
          average_score?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
