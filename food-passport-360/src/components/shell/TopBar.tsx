"use client";

import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TopBarProps {
  title: string;
  className?: string;
}

export default function TopBar({ title, className }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isRoot = pathname === "/";

  return (
    <motion.header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-3 px-4",
        "lg:h-16 lg:px-6",
        className
      )}
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "rgba(7,8,15,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "0.5px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Left — back or OM logo */}
      <div className="w-10 lg:w-auto flex items-center">
        {!isRoot ? (
          <motion.button
            onClick={() => router.back()}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md",
              "text-[color:var(--muted-foreground)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            style={{ background: "transparent" }}
            whileHover={{ scale: 1.08, background: "rgba(255,255,255,0.05)" }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            aria-label="Retour"
          >
            <ChevronLeft size={20} />
          </motion.button>
        ) : (
          <motion.div
            initial={{ rotate: -10, opacity: 0 }}
            animate={{ rotate: 0, opacity: 0.9 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Image
              src="/logo-om-white.svg"
              alt="Olympique de Marseille"
              width={32}
              height={32}
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </motion.div>
        )}
      </div>

      {/* Centre — titre avec animation de changement */}
      <motion.h1
        key={title}
        className="flex-1 truncate text-center text-base font-semibold tracking-tight lg:text-left lg:text-lg"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {title}
      </motion.h1>

      {/* Droite — langue + avatar */}
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <motion.div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            "text-xs font-semibold select-none cursor-pointer"
          )}
          style={{
            background: "rgba(77,255,180,0.12)",
            color: "var(--color-active)",
            border: "0.5px solid rgba(77,255,180,0.25)",
          }}
          whileHover={{ scale: 1.1, background: "rgba(77,255,180,0.2)" }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          aria-label="Menu utilisateur"
        >
          J
        </motion.div>
      </div>
    </motion.header>
  );
}
