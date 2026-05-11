"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  X,
  Plus,
  MinusCircle,
  PlusCircle,
  RotateCcw,
} from "lucide-react";
import type {
  FPArticle,
  FPOrder,
  FPOrderItem,
  FPOrderItemInput,
} from "@/lib/supabase/food-passport.types";
import ArticlePicker from "./ArticlePicker";
import {
  validateOrderNutriAction,
  adjustOrderNutriAction,
  refuseOrderNutriAction,
  askPrecisionNutriAction,
} from "@/app/[locale]/(nutri)/nutri/orders/[id]/actions";

export type ValidationMode = "validate" | "adjust" | "refuse" | "precision" | null;

type ItemWithArticle = FPOrderItem & {
  article: Pick<FPArticle, "id" | "name" | "category" | "photo_url">;
};

interface Props {
  mode: ValidationMode;
  onClose: () => void;
  order: FPOrder;
  items: ItemWithArticle[];
  catalog: FPArticle[];
}

export default function ValidationModal({
  mode,
  onClose,
  order,
  items,
  catalog,
}: Props) {
  const t = useTranslations("nutriQueue");
  const tm = useTranslations("nutriQueue.modal");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // adjust state
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Array<{ article: FPArticle; quantity: number }>>([]);
  const [adjustNotes, setAdjustNotes] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  // refuse / precision state
  const [textInput, setTextInput] = useState("");

  if (!mode) return null;

  function close() {
    setError(null);
    setRemoved(new Set());
    setAdded([]);
    setAdjustNotes("");
    setTextInput("");
    setPickerOpen(false);
    onClose();
  }

  function handleValidate() {
    setError(null);
    startTransition(async () => {
      const r = await validateOrderNutriAction(order.id);
      if (r.error) {
        setError(r.error);
        return;
      }
      router.refresh();
      close();
    });
  }

  function handleAdjust() {
    if (!adjustNotes.trim()) {
      setError(tm("adjustNotesRequired"));
      return;
    }
    setError(null);
    const addedItems: FPOrderItemInput[] = added.map((a) => ({
      article_id: a.article.id,
      quantity: a.quantity,
    }));
    startTransition(async () => {
      const r = await adjustOrderNutriAction(order.id, {
        notes: adjustNotes,
        addedItems: addedItems.length ? addedItems : undefined,
        removedItemIds: removed.size ? Array.from(removed) : undefined,
      });
      if (r.error) {
        setError(r.error);
        return;
      }
      router.refresh();
      close();
    });
  }

  function handleRefuse() {
    if (!textInput.trim()) {
      setError(tm("refuseReasonRequired"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await refuseOrderNutriAction(order.id, textInput);
      if (r.error) {
        setError(r.error);
        return;
      }
      router.refresh();
      close();
    });
  }

  function handlePrecision() {
    if (!textInput.trim()) {
      setError(tm("precisionMessageRequired"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await askPrecisionNutriAction(order.id, textInput);
      if (r.error) {
        setError(r.error);
        return;
      }
      router.refresh();
      close();
    });
  }

  const title =
    mode === "validate"
      ? tm("validateTitle")
      : mode === "adjust"
      ? tm("adjustTitle")
      : mode === "refuse"
      ? tm("refuseTitle")
      : tm("precisionTitle");

  const submitLabel =
    mode === "validate"
      ? pending ? t("validating") : t("validate")
      : mode === "adjust"
      ? pending ? t("adjusting") : t("adjust")
      : mode === "refuse"
      ? pending ? t("refusing") : t("refuse")
      : pending ? t("asking") : t("askPrecision");

  const onSubmit =
    mode === "validate"
      ? handleValidate
      : mode === "adjust"
      ? handleAdjust
      : mode === "refuse"
      ? handleRefuse
      : handlePrecision;

  const submitVariant =
    mode === "refuse"
      ? "bg-destructive text-destructive-foreground"
      : "bg-primary text-primary-foreground";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={close}
          aria-hidden
        />
        <div className="relative w-full max-w-xl bg-background rounded-t-3xl lg:rounded-3xl shadow-xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-bold text-base">{title}</h2>
            <button
              type="button"
              onClick={close}
              aria-label="close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mode === "validate" && (
              <p className="text-sm text-muted-foreground">{tm("validateDesc")}</p>
            )}

            {mode === "adjust" && (
              <>
                {/* Existing items with remove toggle */}
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                    {tm("removedItems")} ({removed.size})
                  </h3>
                  <ul className="space-y-1.5">
                    {items.map((it) => {
                      const isRemoved = removed.has(it.id);
                      return (
                        <li
                          key={it.id}
                          className={`flex items-center gap-2 rounded-xl border p-2 ${
                            isRemoved
                              ? "border-red-500/30 bg-red-500/5"
                              : "border-border bg-card"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm ${
                                isRemoved ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {it.article.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              ×{it.quantity}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setRemoved((prev) => {
                                const n = new Set(prev);
                                if (n.has(it.id)) n.delete(it.id);
                                else n.add(it.id);
                                return n;
                              })
                            }
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-muted"
                          >
                            {isRemoved ? (
                              <>
                                <RotateCcw className="h-3 w-3" />
                                {tm("restoreItem")}
                              </>
                            ) : (
                              <>
                                <MinusCircle className="h-3 w-3 text-destructive" />
                                {tm("removeItem")}
                              </>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                {/* Added items */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                      {tm("addedItems")} ({added.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary text-primary-foreground"
                    >
                      <Plus className="h-3 w-3" />
                      {tm("addItem")}
                    </button>
                  </div>
                  {added.length > 0 && (
                    <ul className="space-y-1.5">
                      {added.map((a, idx) => (
                        <li
                          key={`${a.article.id}-${idx}`}
                          className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/5 p-2"
                        >
                          <PlusCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">{a.article.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              ×{a.quantity}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setAdded((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-xs px-2 py-1 rounded-lg hover:bg-muted"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Adjustment notes */}
                <div>
                  <label
                    htmlFor="adjust-notes"
                    className="text-sm font-medium block mb-1.5"
                  >
                    {tm("adjustNotes")}
                  </label>
                  <textarea
                    id="adjust-notes"
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    placeholder={tm("adjustNotesPlaceholder")}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </>
            )}

            {mode === "refuse" && (
              <div>
                <label htmlFor="refuse-reason" className="text-sm font-medium block mb-1.5">
                  {tm("refuseReason")}
                </label>
                <textarea
                  id="refuse-reason"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={tm("refuseReasonPlaceholder")}
                  rows={4}
                  autoFocus
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/30"
                />
              </div>
            )}

            {mode === "precision" && (
              <div>
                <label htmlFor="precision-msg" className="text-sm font-medium block mb-1.5">
                  {tm("precisionMessage")}
                </label>
                <textarea
                  id="precision-msg"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={tm("precisionMessagePlaceholder")}
                  rows={4}
                  autoFocus
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-destructive/10 text-destructive text-sm px-3 py-2">
                {error}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <button
              type="button"
              onClick={onSubmit}
              disabled={pending}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold disabled:opacity-60 active:scale-[0.99] transition-transform ${submitVariant}`}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>

      {mode === "adjust" && (
        <ArticlePicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          articles={catalog}
          excludeIds={
            new Set([
              ...items.map((i) => i.article.id),
              ...added.map((a) => a.article.id),
            ])
          }
          validatedOnly
          onPick={(article) => {
            setAdded((prev) => [...prev, { article, quantity: 1 }]);
            setPickerOpen(false);
          }}
        />
      )}
    </>
  );
}
