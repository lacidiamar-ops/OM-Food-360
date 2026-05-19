"use client";

import { useEffect, useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/rbac/types";
import PhotoUploader from "./PhotoUploader";

interface ProfileData {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
}

interface Props {
  name?: string;
  role?: UserRole;
  avatarUrl?: string | null;
  onEditPhoto?: () => void;
}

export default function ProfileHero({ name, role, avatarUrl, onEditPhoto }: Props) {
  const t = useTranslations("roles");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(avatarUrl ?? null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(!name || !role);

  useEffect(() => {
    if (name && role) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase
        .schema("food_passport" as never)
        .from("profiles")
        .select("id, full_name, role, avatar_url")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data as ProfileData);
            if (!avatarUrl) setCurrentAvatarUrl((data as ProfileData).avatar_url);
          }
          setLoading(false);
        });
    });
  }, [name, role, avatarUrl]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const displayName = name ?? profile?.full_name ?? "—";
  const displayRole = (role ?? profile?.role) as UserRole | undefined;
  const userId = profile?.id ?? "";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: 220,
        background: "linear-gradient(160deg, #07080f 0%, #0d0f1e 60%, #07080f 100%)",
        borderRadius: "0 0 24px 24px",
      }}
    >
      {/* OM logo watermark top-right */}
      <div
        className="absolute top-4 right-4 pointer-events-none select-none"
        style={{ opacity: 0.08 }}
      >
        <Image
          src="/logo-om-white.svg"
          alt=""
          width={80}
          height={80}
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center px-6 gap-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          {loading ? (
            <div
              className="flex items-center justify-center"
              style={{
                width: 96, height: 96, borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                border: "2px solid var(--color-active)",
              }}
            >
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            </div>
          ) : currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt={displayName}
              style={{
                width: 96, height: 96, borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--color-active)",
                boxShadow: "0 0 16px rgba(77,255,180,0.30)",
              }}
            />
          ) : (
            <div
              className="flex items-center justify-center select-none"
              style={{
                width: 96, height: 96, borderRadius: "50%",
                background: "rgba(77,255,180,0.08)",
                border: "2px solid var(--color-active)",
                boxShadow: "0 0 16px rgba(77,255,180,0.25)",
                fontSize: 28,
                fontWeight: 700,
                color: "var(--color-active)",
              }}
            >
              {initials || "?"}
            </div>
          )}

          {/* Pencil edit button */}
          {!loading && userId && (
            <PhotoUploader
              userId={userId}
              onSuccess={(url) => {
                setCurrentAvatarUrl(url);
                showToast("Photo mise à jour ✓");
                onEditPhoto?.();
              }}
              onError={showToast}
            >
              {({ open, loading: uploading }) => (
                <button
                  type="button"
                  onClick={open}
                  disabled={uploading}
                  aria-label="Modifier la photo"
                  className="absolute bottom-0 right-0 flex items-center justify-center disabled:opacity-60"
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "var(--color-active)",
                    border: "2px solid #07080f",
                  }}
                >
                  {uploading
                    ? <Loader2 size={13} style={{ color: "#07080f", animation: "spin 1s linear infinite" }} />
                    : <Pencil size={13} style={{ color: "#07080f" }} />
                  }
                </button>
              )}
            </PhotoUploader>
          )}
        </div>

        {/* Name + role */}
        <div className="min-w-0 space-y-1.5">
          <h2
            className="truncate font-bold"
            style={{ fontSize: 22, lineHeight: 1.2, fontFamily: "var(--font-heading)" }}
          >
            {loading ? (
              <span
                className="inline-block rounded"
                style={{ width: 140, height: 20, background: "rgba(255,255,255,0.08)", verticalAlign: "middle" }}
              />
            ) : displayName}
          </h2>
          {displayRole && (
            <span
              className="inline-block"
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.5px",
                color: "var(--color-active)",
                background: "rgba(77,255,180,0.10)",
                border: "0.5px solid rgba(77,255,180,0.25)",
                borderRadius: 999,
                padding: "2px 10px",
              }}
            >
              {t(displayRole as Parameters<typeof t>[0])}
            </span>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 pointer-events-none"
          style={{
            background: "var(--foreground)",
            color: "var(--background)",
            borderRadius: 10,
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
