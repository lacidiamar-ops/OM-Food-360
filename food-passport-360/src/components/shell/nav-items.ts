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
  MessageCircle,
  Calendar,
  Activity,
} from "lucide-react";
import type { UserRole } from "@/lib/rbac/types";

export interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
}

export const navItemsByRole: Record<UserRole, NavItem[]> = {
  joueur: [
    { key: "home", href: "/joueur", icon: Home },
    { key: "menu", href: "/joueur/menu", icon: UtensilsCrossed },
    { key: "commander", href: "/joueur/commander", icon: ShoppingBag },
    { key: "orders", href: "/joueur/orders", icon: Clock },
    { key: "messages", href: "/joueur/messages", icon: MessageCircle },
    { key: "nutrition", href: "/joueur/nutrition", icon: Activity },
    { key: "profile", href: "/joueur/profile", icon: User },
  ],
  admin_nutri: [
    { key: "queue", href: "/nutri", icon: ClipboardList },
    { key: "players", href: "/nutri/players", icon: Users },
    { key: "validation", href: "/nutri/articles", icon: FileText },
    { key: "messages", href: "/nutri/messages", icon: MessageCircle },
    { key: "planning", href: "/nutri/planning", icon: Calendar },
    { key: "programs", href: "/nutri/programs", icon: ClipboardList },
    { key: "profile", href: "/nutri/profile", icon: User },
  ],
  admin_resto: [
    { key: "dashboard", href: "/resto", icon: BarChart2 },
    { key: "orders", href: "/resto/orders", icon: ShoppingBag },
    { key: "menu", href: "/resto/menus", icon: UtensilsCrossed },
    { key: "players", href: "/resto/articles", icon: FileText },
    { key: "profile", href: "/resto/profile", icon: User },
  ],
  cuisine: [
    { key: "kanban", href: "/cuisine", icon: LayoutDashboard },
    { key: "production", href: "/cuisine/production", icon: ChefHat },
    { key: "messages", href: "/cuisine/messages", icon: MessageCircle },
    { key: "profile", href: "/cuisine/profile", icon: User },
  ],
  hotel: [
    { key: "orders", href: "/hotel", icon: ShoppingBag },
    { key: "confirmations", href: "/hotel/confirmations", icon: Building2 },
    { key: "messages", href: "/hotel/messages", icon: MessageCircle },
    { key: "profile", href: "/hotel/profile", icon: User },
  ],
  admin_team_manager: [
    { key: "trips", href: "/team-manager", icon: Plane },
    { key: "rooming", href: "/team-manager/rooming", icon: Users },
    { key: "access", href: "/team-manager/access", icon: Key },
    { key: "messages", href: "/team-manager/messages", icon: MessageCircle },
    { key: "planning", href: "/team-manager/planning", icon: Calendar },
    { key: "profile", href: "/team-manager/profile", icon: User },
  ],
  super_admin: [
    { key: "dashboard", href: "/admin", icon: BarChart2 },
    { key: "players", href: "/admin/players", icon: Users },
    { key: "settings", href: "/admin/settings", icon: Settings },
    { key: "profile", href: "/admin/profile", icon: User },
  ],
  direction: [
    { key: "dashboard", href: "/admin", icon: BarChart2 },
    { key: "players", href: "/admin/players", icon: Users },
    { key: "profile", href: "/admin/profile", icon: User },
  ],
};
