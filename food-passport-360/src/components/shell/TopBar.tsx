"use client";

import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isRoot = pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-3 px-4",
        "border-b border-border bg-card",
        "lg:h-16 lg:px-6"
      )}
    >
      {/* Left — back ou logo */}
      <div className="w-10 lg:w-auto">
        {!isRoot ? (
          <button
            onClick={() => router.back()}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md",
              "text-muted-foreground transition-colors duration-100",
              "hover:bg-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label="Retour"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <span className="hidden text-xs font-bold tracking-widest text-muted-foreground lg:block">
            FP360
          </span>
        )}
      </div>

      {/* Centre — titre */}
      <h1 className="flex-1 truncate text-center text-base font-semibold tracking-tight lg:text-left lg:text-lg">
        {title}
      </h1>

      {/* Droite — langue + avatar */}
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            "bg-primary text-primary-foreground",
            "text-xs font-semibold select-none"
          )}
          aria-label="Menu utilisateur"
        >
          {/* placeholder avatar — remplacé par l'initiale du joueur connecté */}
          J
        </div>
      </div>
    </header>
  );
}
