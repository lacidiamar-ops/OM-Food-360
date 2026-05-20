"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, KeyRound, Copy, Check, Loader2, X, Sparkles } from "lucide-react";

interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userName: string;
}

const schema = {
  validate(pwd: string, confirm: string) {
    if (pwd.length < 8) return "short";
    if (!/[A-Z]/.test(pwd)) return "uppercase";
    if (!/[0-9]/.test(pwd)) return "digit";
    if (pwd !== confirm) return "mismatch";
    return null;
  },
};

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

export default function PasswordModal({ open, onClose, onSuccess, userId, userName }: PasswordModalProps) {
  const t = useTranslations("admin");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleGenerate() {
    const p = generatePassword();
    setPwd(p);
    setConfirm(p);
    setError(null);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(pwd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = schema.validate(pwd, confirm);
    if (err === "short" || err === "uppercase" || err === "digit") {
      setError(t("passwordTooShort"));
      return;
    }
    if (err === "mismatch") {
      setError(t("passwordMismatch"));
      return;
    }
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newPassword: pwd }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Error");
      return;
    }
    setSuccess(true);
    setTimeout(() => { onSuccess(); onClose(); setSuccess(false); setPwd(""); setConfirm(""); }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ background: "rgba(18,18,28,0.97)", border: "0.5px solid rgba(255,255,255,0.10)", backdropFilter: "blur(20px)" }}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(77,255,180,0.10)" }}>
              <KeyRound size={18} style={{ color: "var(--color-active)" }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{t("changePassword")}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{userName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg transition-opacity hover:opacity-60">
            <X size={18} style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Generate button */}
          <button type="button" onClick={handleGenerate}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "rgba(77,255,180,0.08)", border: "0.5px solid rgba(77,255,180,0.20)", color: "var(--color-active)" }}>
            <Sparkles size={15} />
            {t("generatePassword")}
          </button>

          {/* New password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{t("newPassword")}</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={e => { setPwd(e.target.value); setError(null); }}
                className="h-11 w-full rounded-xl px-3 pr-20 text-sm focus:outline-none focus:ring-2"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "var(--foreground)", "--tw-ring-color": "var(--color-active)" } as React.CSSProperties}
                required
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                {pwd && (
                  <button type="button" onClick={handleCopy} className="p-1.5 rounded-lg transition-opacity hover:opacity-70">
                    {copied ? <Check size={14} style={{ color: "var(--color-active)" }} /> : <Copy size={14} style={{ color: "var(--muted-foreground)" }} />}
                  </button>
                )}
                <button type="button" onClick={() => setShowPwd(v => !v)} className="p-1.5 rounded-lg transition-opacity hover:opacity-70">
                  {showPwd ? <EyeOff size={14} style={{ color: "var(--muted-foreground)" }} /> : <Eye size={14} style={{ color: "var(--muted-foreground)" }} />}
                </button>
              </div>
            </div>
          </div>

          {/* Confirm */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{t("confirmPassword")}</label>
            <input
              type={showPwd ? "text" : "password"}
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(null); }}
              className="h-11 w-full rounded-xl px-3 text-sm focus:outline-none focus:ring-2"
              style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "var(--foreground)", "--tw-ring-color": "var(--color-active)" } as React.CSSProperties}
              required
            />
          </div>

          {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(255,77,106,0.10)", color: "var(--danger)" }}>{error}</p>}

          {success && <p className="text-xs px-3 py-2 rounded-lg text-center" style={{ background: "rgba(77,255,180,0.10)", color: "var(--color-active)" }}>✓ {t("passwordChanged")}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-xl text-sm transition-opacity hover:opacity-70"
              style={{ background: "rgba(255,255,255,0.05)", color: "var(--muted-foreground)" }}>
              {t("cancel") ?? "Annuler"}
            </button>
            <button type="submit" disabled={loading || success}
              className="flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
              style={{ background: "var(--color-active)", color: "#000" }}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : t("changePassword")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
