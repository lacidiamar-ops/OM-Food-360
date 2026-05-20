"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserX, UserCheck, Loader2, AlertTriangle } from "lucide-react";

interface UserStatusToggleProps {
  userId: string;
  userName: string;
  active: boolean;
  onSuccess: () => void;
}

export default function UserStatusToggle({ userId, userName, active, onSuccess }: UserStatusToggleProps) {
  const t = useTranslations("admin");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await fetch("/api/admin/toggle-user-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, active: !active }),
    });
    setLoading(false);
    setConfirm(false);
    onSuccess();
  }

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        title={active ? t("deactivateUser") : t("reactivateUser")}
        className="p-2 rounded-lg transition-opacity hover:opacity-70"
        style={{ color: active ? "var(--danger)" : "var(--color-active)" }}
      >
        {active ? <UserX size={16} /> : <UserCheck size={16} />}
      </button>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: "rgba(18,18,28,0.97)", border: "0.5px solid rgba(255,255,255,0.10)" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: active ? "rgba(255,77,106,0.10)" : "rgba(77,255,180,0.10)" }}>
                <AlertTriangle size={18} style={{ color: active ? "var(--danger)" : "var(--color-active)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                  {active ? t("deactivateConfirm") : t("reactivateUser")}
                </p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{userName}</p>
              </div>
            </div>
            {active && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(255,77,106,0.08)", color: "var(--danger)" }}>
                {t("deactivateNote")}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setConfirm(false)}
                className="flex-1 h-10 rounded-xl text-sm transition-opacity hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.05)", color: "var(--muted-foreground)" }}>
                Annuler
              </button>
              <button onClick={handleConfirm} disabled={loading}
                className="flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                style={{ background: active ? "var(--danger)" : "var(--color-active)", color: active ? "#fff" : "#000" }}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : (active ? t("deactivateUser") : t("reactivateUser"))}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
