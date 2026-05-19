"use client";

import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  className?: string;
}

export default function TopBar({ title, className }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isRoot = pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-3 px-4",
        "lg:h-16 lg:px-6",
        className
      )}
      style={{
        background: "rgba(7,8,15,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "0.5px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Left — back or OM logo */}
      <div className="w-10 lg:w-auto flex items-center">
        {!isRoot ? (
          <button
            onClick={() => router.back()}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md",
              "text-muted-foreground transition-colors duration-100",
              "hover:bg-white/5 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label="Retour"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <Image
            src="/logo-om-white.svg"
            alt="Olympique de Marseille"
            width={32}
            height={32}
            style={{ opacity: 0.9, filter: "brightness(0) invert(1)" }}
          />
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
            "text-xs font-semibold select-none"
          )}
          style={{
            background: "rgba(77,255,180,0.12)",
            color: "var(--color-active)",
            border: "0.5px solid rgba(77,255,180,0.25)",
          }}
          aria-label="Menu utilisateur"
        >
          J
        </div>
      </div>
    </header>
  );
}
