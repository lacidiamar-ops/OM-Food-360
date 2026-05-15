"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { sendMagicLink } from "./actions";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
});
type Schema = z.infer<typeof schema>;

export default function LoginForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const reduce = useReducedMotion();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Schema>({ resolver: zodResolver(schema) });

  async function onSubmit({ email }: Schema) {
    setState("loading");
    setServerError("");
    const result = await sendMagicLink(email);
    if (result.error) {
      setState("error");
      setServerError(result.error);
    } else {
      setState("success");
    }
  }

  return (
    <AnimatePresence mode="wait">
      {state === "success" ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
            <CheckCircle size={28} className="text-success" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold">{t("magicLinkSent")}</p>
            <p className="text-sm text-muted-foreground">{getValues("email")}</p>
          </div>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4"
        >
          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              {t("email")}
              <span className="ml-1 text-danger" aria-hidden>*</span>
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="joueur@om.fr"
                {...register("email")}
                className={cn(
                  "h-11 w-full rounded-lg border bg-background pl-9 pr-4",
                  "text-base text-foreground placeholder:text-muted-foreground",
                  "transition-colors duration-100",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  errors.email
                    ? "border-danger focus:ring-danger/50"
                    : "border-input"
                )}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="flex items-center gap-1.5 text-xs text-danger" role="alert">
                <AlertCircle size={12} />
                {tCommon("required")}
              </p>
            )}
          </div>

          {/* Server error */}
          {state === "error" && serverError && (
            <p className="flex items-center gap-1.5 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
              <AlertCircle size={14} />
              {serverError}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={state === "loading"}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-lg",
              "bg-primary text-primary-foreground",
              "text-sm font-medium",
              "transition-all duration-100",
              "hover:opacity-90 active:scale-[0.97]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {state === "loading" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {t("magicLink")}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
