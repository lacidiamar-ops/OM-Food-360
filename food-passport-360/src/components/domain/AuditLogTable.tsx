"use client";

import { useState } from "react";
import type { AuditLogEntry } from "@/lib/supabase/queries";

const TABLE_LABELS: Record<string, string> = {
  orders: "Commandes",
  order_items: "Articles commande",
  order_validation_logs: "Validations",
  players: "Joueurs",
  player_onboarding_forms: "Fiches",
  articles: "Articles",
  menus: "Menus",
  hotel_access: "Accès hôtel",
  action_photos: "Photos",
  feedbacks: "Feedbacks",
  audit_logs: "Audit",
};

const ROLE_COLORS: Record<string, string> = {
  admin_nutri: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  admin_resto: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  joueur: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  cuisine: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  hotel: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  admin_team_manager: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  super_admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

interface Props {
  logs: AuditLogEntry[];
}

export default function AuditLogTable({ logs }: Props) {
  const [tableFilter, setTableFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");

  const tables = Array.from(new Set(logs.map((l) => l.table_name).filter(Boolean)));
  const roles = Array.from(new Set(logs.map((l) => l.actor_role).filter(Boolean)));

  const filtered = logs.filter((l) => {
    if (tableFilter && l.table_name !== tableFilter) return false;
    if (roleFilter && l.actor_role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        (l.actor_name ?? "").toLowerCase().includes(q) ||
        (l.table_name ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="rounded-xl border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className="rounded-xl border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Toutes les tables</option>
          {tables.map((t) => (
            <option key={t} value={t!}>{TABLE_LABELS[t!] ?? t}</option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Tous les rôles</option>
          {roles.map((r) => (
            <option key={r} value={r!}>{r}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground self-center">
          {filtered.length} entrée{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Aucune entrée trouvée</p>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Acteur</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">Table</th>
                  <th className="px-4 py-3 text-left font-medium">ID enregistrement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="font-medium text-xs">{log.actor_name ?? "Système"}</p>
                        {log.actor_role && (
                          <span
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              ROLE_COLORS[log.actor_role] ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {log.actor_role}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3 text-xs">
                      {log.table_name ? (TABLE_LABELS[log.table_name] ?? log.table_name) : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground max-w-[120px] truncate">
                      {log.record_id ? log.record_id.slice(0, 8) + "…" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
