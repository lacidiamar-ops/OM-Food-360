import type { LucideIcon } from "lucide-react";
import {
  Home,
  UtensilsCrossed,
  ShoppingBag,
  Clock,
  User,
  ClipboardList,
  Users,
  BarChart2,
  ChefHat,
  LayoutDashboard,
  Building2,
  Plane,
  Settings,
  FileText,
  Key,
} from "lucide-react";
import type { UserRole } from "@/lib/rbac/types";

export interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
}

export const navItemsByRole: Record<UserRole, NavItem[]> = {
  joueur: [
    { key: "home", href: "/", icon: Home },
    { key: "menu", href: "/menu", icon: UtensilsCrossed },
    { key: "commander", href: "/commander", icon: ShoppingBag },
    { key: "orders", href: "/orders", icon: Clock },
    { key: "profile", href: "/profile", icon: User },
  ],
  admin_nutri: [
    { key: "queue", href: "/queue", icon: ClipboardList },
    { key: "players", href: "/players", icon: Users },
    { key: "validation", href: "/validation", icon: FileText },
    { key: "menu", href: "/menu", icon: UtensilsCrossed },
    { key: "profile", href: "/profile", icon: User },
  ],
  admin_resto: [
    { key: "dashboard", href: "/", icon: BarChart2 },
    { key: "orders", href: "/orders", icon: ShoppingBag },
    { key: "menu", href: "/menu", icon: UtensilsCrossed },
    { key: "players", href: "/players", icon: Users },
    { key: "profile", href: "/profile", icon: User },
  ],
  cuisine: [
    { key: "kanban", href: "/", icon: LayoutDashboard },
    { key: "production", href: "/production", icon: ChefHat },
    { key: "profile", href: "/profile", icon: User },
  ],
  hotel: [
    { key: "orders", href: "/", icon: ShoppingBag },
    { key: "confirmations", href: "/confirmations", icon: Building2 },
    { key: "profile", href: "/profile", icon: User },
  ],
  admin_team_manager: [
    { key: "trips", href: "/", icon: Plane },
    { key: "rooming", href: "/rooming", icon: Users },
    { key: "access", href: "/access", icon: Key },
    { key: "profile", href: "/profile", icon: User },
  ],
  super_admin: [
    { key: "dashboard", href: "/", icon: BarChart2 },
    { key: "players", href: "/players", icon: Users },
    { key: "settings", href: "/settings", icon: Settings },
    { key: "profile", href: "/profile", icon: User },
  ],
  direction: [
    { key: "dashboard", href: "/", icon: BarChart2 },
    { key: "players", href: "/players", icon: Users },
    { key: "profile", href: "/profile", icon: User },
  ],
};
