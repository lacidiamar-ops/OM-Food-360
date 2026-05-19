"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import type { AuditLogEntry } from "@/lib/supabase/queries";
import { ShieldAlert } from "lucide-react";

const PAGE_SIZE = 50;

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

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin_nutri:       { bg: "rgba(77,255,180,0.10)",  color: "var(--color-active)" },
  admin_resto:       { bg: "rgba(0,91,172,0.15)",    color: "var(--color-om)" },
  joueur:            { bg: "rgba(139,127,245,0.10)", color: "var(--color-energy)" },
  cuisine:           { bg: "rgba(255,215,0,0.10)",   color: "var(--warning)" },
  hotel:             { bg: "rgba(255,215,0,0.08)",   color: "var(--color-gold)" },
  admin_team_manager:{ bg: "rgba(0,91,172,0.10)",    color: "var(--color-om)" },
  super_admin:       { bg: "rgba(255,77,106,0.10)",  color: "var(--danger)" },
  direction:         { bg: "rgba(139,127,245,0.10)", color: "var(--color-energy)" },
};

function actionToStatusBadge(action: string): "validated" | "processing" | "refused" | "info" | "pending" {
  const a = action.toLowerCase();
  if (a.includes("insert") || a.includes("create")) return "validated";
  if (a.includes("update") || a.includes("edit"))   return "processing";
  if (a.includes("delete") || a.includes("remove")) return "refused";
  if (a.includes("login") || a.includes("auth"))    return "info";
  return "pending";
}

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.10)",
  borderRadius: "10px",
  color: "var(--foreground)",
  padding: "6px 12px",
  fontSize: "13px",
  outline: "none",
};

interface Props {
  logs: AuditLogEntry[];
}

export default function AuditLogTable({ logs }: Props) {
  const locale = useLocale();
  const [tableFilter, setTableFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

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

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="px-4 py-4 lg:px-6 space-y-5">
      <PageHeader label="Administration" title="Journal d'audit" />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Rechercher…"
          style={INPUT_STYLE}
        />
        <select
          value={tableFilter}
          onChange={(e) => { setTableFilter(e.target.value); setPage(0); }}
          style={INPUT_STYLE}
        >
          <option value="">Toutes les tables</option>
          {tables.map((t) => (
            <option key={t} value={t!}>{TABLE_LABELS[t!] ?? t}</option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
          style={INPUT_STYLE}
        >
          <option value="">Tous les rôles</option>
          {roles.map((r) => (
            <option key={r} value={r!}>{r}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} entrée{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6" />}
          title="Aucune entrée trouvée"
        />
      ) : (
        <>
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                    {["Horodatage", "Acteur", "Rôle", "Action", "Table", "ID"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((log, i) => (
                    <tr
                      key={log.id}
                      style={{
                        background: i % 2 === 0
                          ? "rgba(255,255,255,0.015)"
                          : "transparent",
                        borderBottom: "0.5px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted-foreground)" }}>
                        {new Date(log.created_at).toLocaleString(locale, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium whitespace-nowrap">
                        {log.actor_name ?? "Système"}
                      </td>
                      <td className="px-4 py-2.5">
                        {log.actor_role ? (
                          <span
                            style={{
                              background: ROLE_COLORS[log.actor_role]?.bg ?? "var(--muted)",
                              color: ROLE_COLORS[log.actor_role]?.color ?? "var(--muted-foreground)",
                              borderRadius: "999px",
                              padding: "1px 7px",
                              fontSize: "10px",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {log.actor_role}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={actionToStatusBadge(log.action)} />
                        <span
                          className="block mt-0.5"
                          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted-foreground)" }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {log.table_name ? (TABLE_LABELS[log.table_name] ?? log.table_name) : "—"}
                      </td>
                      <td
                        className="px-4 py-2.5 max-w-[100px] truncate"
                        style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted-foreground)" }}
                        title={log.record_id ?? ""}
                      >
                        {log.record_id ? log.record_id.slice(0, 8) + "…" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground text-xs">
                Page {page + 1} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "0.5px solid rgba(255,255,255,0.10)",
                  }}
                >
                  ← Précédente
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "0.5px solid rgba(255,255,255,0.10)",
                  }}
                >
                  Suivante →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
