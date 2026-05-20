"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { MessageCircle, ShieldCheck, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProfileHero } from "@/components/ui";

interface Contact {
  id: string;
  full_name: string | null;
  role: string;
}

interface Props {
  currentUserId: string;
  basePath: string;
}

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string; convType: string }> = {
  admin_nutri: {
    label: "Nutritionniste",
    icon: ShieldCheck,
    color: "var(--color-active)",
    convType: "joueur_nutri",
  },
  admin_team_manager: {
    label: "Team Manager",
    icon: Briefcase,
    color: "var(--warning)",
    convType: "joueur_manager",
  },
};

export default function JoueurContactPicker({ currentUserId, basePath }: Props) {
  const t = useTranslations("chat");
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .schema("food_passport" as never)
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["admin_nutri", "admin_team_manager"])
      .then(({ data }) => {
        setContacts((data as Contact[]) ?? []);
        setLoading(false);
      });
  }, []);

  async function openConversation(contact: Contact) {
    if (opening) return;
    setOpening(contact.id);
    const meta = ROLE_META[contact.role];
    if (!meta) { setOpening(null); return; }

    const supabase = createClient();
    const { data: existing } = await supabase
      .schema("food_passport" as never)
      .from("conversations")
      .select("id")
      .eq("type", meta.convType)
      .filter("participant_ids", "cs", `{${currentUserId}}`)
      .filter("participant_ids", "cs", `{${contact.id}}`)
      .limit(1);

    let convId: string;

    if (existing && existing.length > 0) {
      convId = (existing[0] as { id: string }).id;
    } else {
      const { data: newConv } = await supabase
        .schema("food_passport" as never)
        .from("conversations")
        .insert({ type: meta.convType, participant_ids: [currentUserId, contact.id] })
        .select("id")
        .single();
      if (!newConv) { setOpening(null); return; }
      convId = (newConv as { id: string }).id;
    }

    router.push(`${basePath}/${convId}`);
  }

  return (
    <div className="mx-auto max-w-2xl pb-6">
      <ProfileHero />
      <div className="px-4 space-y-4 py-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{t("conversations")}</h1>
          <p className="text-sm text-muted-foreground">{t("joueurContactsDesc")}</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => {
              const meta = ROLE_META[contact.role];
              if (!meta) return null;
              const Icon = meta.icon;
              const isOpening = opening === contact.id;

              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => openConversation(contact)}
                  disabled={!!opening}
                  className="w-full flex items-center gap-4 p-4 text-left transition-all disabled:opacity-60"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "0.5px solid rgba(255,255,255,0.07)",
                    borderRadius: "20px",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: `color-mix(in srgb, ${meta.color} 12%, transparent)` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: meta.color }} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground">
                      {contact.full_name ?? meta.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{meta.label}</p>
                  </div>

                  {/* CTA */}
                  <div
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
                    style={{
                      borderRadius: "999px",
                      background: isOpening ? "rgba(255,255,255,0.06)" : `color-mix(in srgb, ${meta.color} 10%, transparent)`,
                      color: isOpening ? "var(--muted-foreground)" : meta.color,
                      border: `0.5px solid color-mix(in srgb, ${meta.color} 25%, transparent)`,
                    }}
                  >
                    <MessageCircle size={12} />
                    {isOpening ? "…" : t("openChat")}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
