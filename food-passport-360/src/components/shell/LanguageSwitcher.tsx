"use client";

import { useParams } from "next/navigation";
import { useTransition, useRef, useEffect, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "fr", flag: "🇫🇷", label: "FR" },
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "it", flag: "🇮🇹", label: "IT" },
  { code: "pt", flag: "🇵🇹", label: "PT" },
  { code: "ar", flag: "🇸🇦", label: "AR" },
] as const;

export default function LanguageSwitcher() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const currentLocale = (params.locale as string) ?? "fr";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchLocale(locale: string) {
    setOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale });
    });
  }

  const current = LOCALES.find((l) => l.code === currentLocale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm",
          "text-muted-foreground transition-colors duration-100",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isPending && "opacity-60"
        )}
        aria-label="Changer de langue"
        aria-expanded={open}
      >
        <Globe size={15} />
        <span className="font-medium">{current.label}</span>
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden",
            "rounded-lg border border-border bg-card shadow-lg",
            "animate-in fade-in slide-in-from-top-1 duration-100"
          )}
          role="menu"
        >
          {LOCALES.map((locale) => (
            <button
              key={locale.code}
              role="menuitem"
              onClick={() => switchLocale(locale.code)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-sm",
                "transition-colors duration-100",
                locale.code === currentLocale
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span>{locale.flag}</span>
              <span>{locale.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
