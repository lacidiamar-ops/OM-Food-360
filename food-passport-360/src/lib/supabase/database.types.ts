// Auto-generated from Supabase project vjulagaprzbnquynwjmt
// ENUMs are in the public schema (shared with HR app)
// FP360 tables live in the food_passport schema — see food-passport.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      article_category:
        | "feculent"
        | "proteine_animale"
        | "proteine_vegetale"
        | "legume"
        | "fruit"
        | "produit_laitier"
        | "sauce"
        | "boisson"
        | "epicerie"
        | "collation"
        | "dessert"
        | "autre"
      feedback_topic:
        | "qualite"
        | "quantite"
        | "temperature"
        | "gout"
        | "delai"
        | "presentation"
      form_status:
        | "brouillon"
        | "incomplete"
        | "a_mettre_a_jour"
        | "complete"
        | "validee"
      order_priority: "normal" | "important" | "urgent" | "critique"
      order_status:
        | "brouillon"
        | "envoyee_joueur"
        | "en_attente_nutri"
        | "validee_nutri"
        | "ajustee_nutri"
        | "refusee_nutri"
        | "precision_demandee"
        | "transmise_resto"
        | "validee_resto"
        | "transmise_cuisine"
        | "transmise_hotel"
        | "en_preparation"
        | "prete"
        | "livree"
        | "annulee"
        | "probleme_signale"
      photo_status:
        | "demandee"
        | "en_attente"
        | "validee"
        | "refusee"
        | "non_conforme"
      player_status:
        | "actif"
        | "en_test"
        | "blesse"
        | "retour_blessure"
        | "inactif"
      position_terrain: "gardien" | "defenseur" | "milieu" | "attaquant"
      service_type:
        | "petit_dejeuner"
        | "dejeuner"
        | "collation_pre"
        | "collation_post"
        | "collation_recup"
        | "diner"
        | "room_service"
        | "after_match"
        | "pre_match"
      supported_lang: "fr" | "en" | "es" | "it" | "pt" | "ar"
      user_role:
        | "super_admin"
        | "admin_resto"
        | "admin_nutri"
        | "admin_team_manager"
        | "cuisine"
        | "hotel"
        | "joueur"
        | "direction"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

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

export const Constants = {
  public: {
    Enums: {
      article_category: [
        "feculent",
        "proteine_animale",
        "proteine_vegetale",
        "legume",
        "fruit",
        "produit_laitier",
        "sauce",
        "boisson",
        "epicerie",
        "collation",
        "dessert",
        "autre",
      ],
      feedback_topic: [
        "qualite",
        "quantite",
        "temperature",
        "gout",
        "delai",
        "presentation",
      ],
      form_status: [
        "brouillon",
        "incomplete",
        "a_mettre_a_jour",
        "complete",
        "validee",
      ],
      order_priority: ["normal", "important", "urgent", "critique"],
      order_status: [
        "brouillon",
        "envoyee_joueur",
        "en_attente_nutri",
        "validee_nutri",
        "ajustee_nutri",
        "refusee_nutri",
        "precision_demandee",
        "transmise_resto",
        "validee_resto",
        "transmise_cuisine",
        "transmise_hotel",
        "en_preparation",
        "prete",
        "livree",
        "annulee",
        "probleme_signale",
      ],
      photo_status: [
        "demandee",
        "en_attente",
        "validee",
        "refusee",
        "non_conforme",
      ],
      player_status: ["actif", "en_test", "blesse", "retour_blessure", "inactif"],
      position_terrain: ["gardien", "defenseur", "milieu", "attaquant"],
      service_type: [
        "petit_dejeuner",
        "dejeuner",
        "collation_pre",
        "collation_post",
        "collation_recup",
        "diner",
        "room_service",
        "after_match",
        "pre_match",
      ],
      supported_lang: ["fr", "en", "es", "it", "pt", "ar"],
      user_role: [
        "super_admin",
        "admin_resto",
        "admin_nutri",
        "admin_team_manager",
        "cuisine",
        "hotel",
        "joueur",
        "direction",
      ],
    },
  },
} as const
