"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, Copy, Check, Loader2, User } from "lucide-react";

const ROLES = ["joueur","admin_nutri","admin_resto","admin_team_manager","cuisine","hotel","direction","super_admin"] as const;
const LANGS = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "pt", flag: "🇵🇹", label: "Português" },
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "ar", flag: "🇸🇦", label: "العربية" },
] as const;

function generatePassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;
  const pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  for (let i = 4; i < 12; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
  return pwd.sort(() => Math.random() - 0.5).join("");
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  preferred_lang: string;
  active: boolean;
}

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profile?: Profile | null;
}

export default function UserModal({ open, onClose, onSuccess, profile }: UserModalProps) {
  const t = useTranslations("admin");
  const isEdit = !!profile;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("joueur");
  const [lang, setLang] = useState("fr");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setEmail(profile.email);
      setRole(profile.role);
      setLang(profile.preferred_lang);
      setActive(profile.active);
    } else {
      setFullName(""); setEmail(""); setRole("joueur"); setLang("fr"); setActive(true);
    }
    setError(null); setTempPassword(null); setCopied(false);
  }, [profile, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isEdit) {
      const res = await fetch("/api/admin/update-user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile!.id, fullName, role, preferredLang: lang, active }),
      });
      setLoading(false);
      if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Error"); return; }
      onSuccess(); onClose();
    } else {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, role, preferredLang: lang }),
      });
      setLoading(false);
      if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Error"); return; }
      const d = await res.json() as { tempPassword: string };
      setTempPassword(d.tempPassword);
      onSuccess();
    }
  }

  async function handleCopy() {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        style={{ background: "rgba(18,18,28,0.97)", border: "0.5px solid rgba(255,255,255,0.10)", backdropFilter: "blur(20px)" }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(77,255,180,0.10)" }}>
              <User size={18} style={{ color: "var(--color-active)" }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              {isEdit ? t("editUser") : t("newUser")}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg transition-opacity hover:opacity-60">
            <X size={18} style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>

        {/* Temp password reveal (création) */}
        {tempPassword && (
          <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(77,255,180,0.06)", border: "0.5px solid rgba(77,255,180,0.20)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--color-active)" }}>🔑 {t("tempPasswordLabel")}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono px-3 py-2 rounded-lg" style={{ background: "rgba(0,0,0,0.30)", color: "var(--foreground)" }}>
                {tempPassword}
              </code>
              <button onClick={handleCopy} className="p-2 rounded-lg transition-opacity hover:opacity-70"
                style={{ background: "rgba(77,255,180,0.10)" }}>
                {copied ? <Check size={16} style={{ color: "var(--color-active)" }} /> : <Copy size={16} style={{ color: "var(--color-active)" }} />}
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t("tempPasswordNote")}</p>
            <button onClick={onClose} className="w-full h-9 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
              style={{ background: "var(--color-active)", color: "#000" }}>
              {t("copied")} — Fermer
            </button>
          </div>
        )}

        {!tempPassword && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{t("fullName")}</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)}
                className="h-10 w-full rounded-xl px-3 text-sm focus:outline-none focus:ring-2"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "var(--foreground)", "--tw-ring-color": "var(--color-active)" } as React.CSSProperties} />
            </div>

            {/* Email (création uniquement) */}
            {!isEdit && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="h-10 w-full rounded-xl px-3 text-sm focus:outline-none focus:ring-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "var(--foreground)", "--tw-ring-color": "var(--color-active)" } as React.CSSProperties} />
              </div>
            )}

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{t("roleLabel")}</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="h-10 w-full rounded-xl px-3 text-sm focus:outline-none focus:ring-2"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "var(--foreground)", "--tw-ring-color": "var(--color-active)" } as React.CSSProperties}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Lang pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{t("preferredLang")}</label>
              <div className="flex flex-wrap gap-2">
                {LANGS.map(l => (
                  <button key={l.code} type="button" onClick={() => setLang(l.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      background: lang === l.code ? "rgba(77,255,180,0.12)" : "rgba(255,255,255,0.04)",
                      border: lang === l.code ? "0.5px solid rgba(77,255,180,0.40)" : "0.5px solid rgba(255,255,255,0.08)",
                      color: lang === l.code ? "var(--color-active)" : "var(--muted-foreground)",
                    }}>
                    {l.flag} {l.code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Active toggle (édition) */}
            {isEdit && (
              <div className="flex items-center justify-between py-1">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{t("activeLabel")}</label>
                <button type="button" onClick={() => setActive(v => !v)}
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ background: active ? "var(--color-active)" : "rgba(255,255,255,0.12)" }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: active ? "translateX(22px)" : "translateX(2px)" }} />
                </button>
              </div>
            )}

            {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(255,77,106,0.10)", color: "var(--danger)" }}>{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 h-10 rounded-xl text-sm transition-opacity hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.05)", color: "var(--muted-foreground)" }}>
                Annuler
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "var(--color-active)", color: "#000" }}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : (isEdit ? t("editUser") : t("newUser"))}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
