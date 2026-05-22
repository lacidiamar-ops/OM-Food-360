import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import PageTransition from "@/components/motion/PageTransition";
import type { UserRole } from "@/lib/rbac/types";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  role?: UserRole;
}

export default function AppShell({
  children,
  title,
  role = "joueur",
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar role={role} className="print:hidden" />

      <div className="flex flex-1 flex-col lg:pl-60">
        <TopBar title={title} className="print:hidden" />

        <main
          className="flex-1 overflow-y-auto pb-20 lg:pb-6 print:overflow-visible print:pb-0"
          id="main-content"
        >
          <PageTransition>
            {children}
          </PageTransition>
        </main>

        <BottomNav role={role} className="print:hidden" />
      </div>
    </div>
  );
}
