import * as XLSX from "xlsx";
import type { OrderExportRow } from "@/lib/supabase/queries";

const STATUS_FR: Record<string, string> = {
  brouillon: "Brouillon",
  envoyee_joueur: "Envoyée",
  en_attente_nutri: "Attente nutri",
  ajustee_nutri: "Ajustée nutri",
  refusee_nutri: "Refusée nutri",
  precision_demandee: "Précision demandée",
  validee_nutri: "Validée nutri",
  transmise_resto: "Transmise resto",
  validee_resto: "Validée resto",
  transmise_cuisine: "En cuisine",
  en_preparation: "En préparation",
  prete: "Prête",
  transmise_hotel: "À l'hôtel",
  livree: "Livrée",
  annulee: "Annulée",
};

const SERVICE_FR: Record<string, string> = {
  petit_dejeuner: "Petit-déjeuner",
  dejeuner: "Déjeuner",
  diner: "Dîner",
  collation: "Collation",
  room_service: "Room service",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function generateOrdersExcel(rows: OrderExportRow[], fromDate: string, toDate: string): Uint8Array {
  const sheetData = [
    ["FOOD PASSPORT 360 — Export commandes", `Du ${fromDate} au ${toDate}`],
    [],
    ["Référence", "Joueur", "Service", "Statut", "Heure prévue", "Validée nutri", "Livrée", "Nb articles"],
    ...rows.map((r) => [
      r.reference,
      r.player,
      SERVICE_FR[r.service] ?? r.service,
      STATUS_FR[r.status] ?? r.status,
      fmtDate(r.scheduled_at),
      fmtDate(r.validated_by_nutri_at),
      fmtDate(r.delivered_at),
      r.items_count,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Largeurs de colonnes
  ws["!cols"] = [
    { wch: 14 }, // ref
    { wch: 22 }, // joueur
    { wch: 16 }, // service
    { wch: 18 }, // statut
    { wch: 18 }, // heure prévue
    { wch: 18 }, // validée nutri
    { wch: 18 }, // livrée
    { wch: 10 }, // articles
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Commandes");

  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}
