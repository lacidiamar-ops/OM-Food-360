import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getOrderWithItems, getPlayerByProfileId, listMyActionPhotos } from "@/lib/supabase/queries";
import ActionPhotoUpload from "@/components/domain/ActionPhotoUpload";
import type { SupportedLang } from "@/lib/supabase/food-passport.types";
import { ImageOff, ShieldCheck } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlayerOrderPhotoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations("photo");
  const locale = (await getLocale()) as SupportedLang;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const player = await getPlayerByProfileId(supabase, user.id);
  if (!player) notFound();

  const data = await getOrderWithItems(supabase, id, locale);
  if (!data || data.order.player_id !== player.id) notFound();

  const order = data.order;
  const rawPhotos = await listMyActionPhotos(supabase, id);

  // Bucket privé → URLs signées (1 h) générées côté serveur
  const photos = await Promise.all(
    rawPhotos.map(async (p) => {
      const { data: signed } = await supabase.storage
        .from("action-photos")
        .createSignedUrl(p.storage_path, 3600);
      return { ...p, signedUrl: signed?.signedUrl ?? null };
    })
  );

  const canUpload = order.status === "livree";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-12">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground font-mono">{order.reference}</p>
      </header>

      {!canUpload && (
        <div className="rounded-2xl border border-border bg-muted/30 p-4 flex gap-3 items-start">
          <ImageOff className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{t("notDeliveredYet")}</p>
        </div>
      )}

      {canUpload && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <p className="text-sm text-muted-foreground">{t("uploadDesc")}</p>
          <ActionPhotoUpload
            orderId={id}
            userId={user.id}
            tripId={order.trip_id}
          />
        </div>
      )}

      {photos.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm">{t("myPhotos")}</h2>
          <ul className="space-y-3">
            {photos.map((photo) => {
              const statusColor =
                photo.status === "validee"
                  ? "text-emerald-600"
                  : photo.status === "refusee" || photo.status === "non_conforme"
                  ? "text-destructive"
                  : "text-amber-600";
              return (
                <li
                  key={photo.id}
                  className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3"
                >
                  {photo.signedUrl ? (
                    <img
                      src={photo.signedUrl}
                      alt=""
                      className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <ShieldCheck className={`h-5 w-5 shrink-0 ${statusColor}`} />
                  )}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    {photo.caption && (
                      <p className="text-sm font-medium truncate">{photo.caption}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t(`status.${photo.status}` as Parameters<typeof t>[0])}
                      {" · "}
                      {new Date(photo.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
