"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Edit, KeyRound } from "lucide-react";
import UserModal from "@/components/admin/UserModal";
import PasswordModal from "@/components/admin/PasswordModal";
import UserStatusToggle from "@/components/admin/UserStatusToggle";

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  preferred_lang: string;
  active: boolean;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: "var(--warning)",
  admin_nutri: "var(--color-active)",
  admin_resto: "var(--color-om)",
  admin_team_manager: "var(--color-energy)",
  cuisine: "var(--warning)",
  hotel: "var(--color-om)",
  joueur: "var(--foreground)",
  direction: "var(--color-active)",
};

function Initials({ name, email }: { name: string | null; email: string }) {
  const raw = name ?? email;
  const parts = raw.trim().split(" ");
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : raw.slice(0, 2).toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{ background: "rgba(0,91,172,0.20)", color: "var(--color-om)" }}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: `color-mix(in srgb, ${ROLE_COLORS[role] ?? "var(--foreground)"} 12%, transparent)`, color: ROLE_COLORS[role] ?? "var(--foreground)", border: `0.5px solid color-mix(in srgb, ${ROLE_COLORS[role] ?? "var(--foreground)"} 25%, transparent)` }}>
      {role}
    </span>
  );
}

export default function UsersPageClient({ profiles: initial }: { profiles: Profile[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [profiles, setProfiles] = useState(initial);
  const [userModal, setUserModal] = useState<{ open: boolean; profile?: Profile | null }>({ open: false });
  const [pwdModal, setPwdModal] = useState<{ open: boolean; userId: string; userName: string } | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div className="min-h-screen px-4 py-6 space-y-6 pb-safe" style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)" }}>
            {t("administration")}
          </p>
          <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>{t("usersTitle")}</h1>
        </div>
        <button onClick={() => setUserModal({ open: true, profile: null })}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "var(--color-active)", color: "#000" }}>
          + {t("newUser")}
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-2xl overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
              {["Utilisateur", t("roleLabel"), "Statut", t("createdAt"), "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < profiles.length - 1 ? "0.5px solid rgba(255,255,255,0.04)" : "none", background: "rgba(255,255,255,0.015)" }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Initials name={p.full_name} email={p.email} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{p.full_name ?? "—"}</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><RoleBadge role={p.role} /></td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      background: p.active ? "rgba(77,255,180,0.10)" : "rgba(255,77,106,0.10)",
                      color: p.active ? "var(--color-active)" : "var(--danger)",
                    }}>
                    {p.active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {new Date(p.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setUserModal({ open: true, profile: p })}
                      className="p-2 rounded-lg transition-opacity hover:opacity-70"
                      style={{ color: "var(--muted-foreground)" }} title={t("editUser")}>
                      <Edit size={15} />
                    </button>
                    <button onClick={() => setPwdModal({ open: true, userId: p.id, userName: p.full_name ?? p.email })}
                      className="p-2 rounded-lg transition-opacity hover:opacity-70"
                      style={{ color: "var(--muted-foreground)" }} title={t("changePassword")}>
                      <KeyRound size={15} />
                    </button>
                    <UserStatusToggle userId={p.id} userName={p.full_name ?? p.email} active={p.active} onSuccess={refresh} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {profiles.map(p => (
          <div key={p.id} className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <Initials name={p.full_name} email={p.email} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: "var(--foreground)" }}>{p.full_name ?? "—"}</p>
                <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{p.email}</p>
              </div>
              <RoleBadge role={p.role} />
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: p.active ? "rgba(77,255,180,0.10)" : "rgba(255,77,106,0.10)", color: p.active ? "var(--color-active)" : "var(--danger)" }}>
                {p.active ? "Actif" : "Inactif"}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setUserModal({ open: true, profile: p })}
                  className="p-2 rounded-lg" style={{ color: "var(--muted-foreground)" }}>
                  <Edit size={15} />
                </button>
                <button onClick={() => setPwdModal({ open: true, userId: p.id, userName: p.full_name ?? p.email })}
                  className="p-2 rounded-lg" style={{ color: "var(--muted-foreground)" }}>
                  <KeyRound size={15} />
                </button>
                <UserStatusToggle userId={p.id} userName={p.full_name ?? p.email} active={p.active} onSuccess={refresh} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <UserModal
        open={userModal.open}
        profile={userModal.profile}
        onClose={() => setUserModal({ open: false })}
        onSuccess={refresh}
      />
      {pwdModal && (
        <PasswordModal
          open={pwdModal.open}
          userId={pwdModal.userId}
          userName={pwdModal.userName}
          onClose={() => setPwdModal(null)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
