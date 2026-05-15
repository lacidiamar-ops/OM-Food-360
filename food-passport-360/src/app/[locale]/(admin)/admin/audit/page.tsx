import { createClient } from "@/lib/supabase/server";
import { listAuditLogs } from "@/lib/supabase/queries";
import AuditLogTable from "@/components/domain/AuditLogTable";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function AuditPage() {
  const supabase = await createClient();
  const logs = await listAuditLogs(supabase, { limit: 200 });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold">Audit logs</h1>
          <p className="text-sm text-muted-foreground">
            200 dernières actions — qui a fait quoi, quand
          </p>
        </div>
      </div>
      <AuditLogTable logs={logs} />
    </div>
  );
}
