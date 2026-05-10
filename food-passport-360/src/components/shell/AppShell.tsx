import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
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
      <Sidebar role={role} />

      <div className="flex flex-1 flex-col lg:pl-60">
        <TopBar title={title} />

        <main
          className="flex-1 overflow-y-auto pb-20 lg:pb-6"
          id="main-content"
        >
          {children}
        </main>

        <BottomNav role={role} />
      </div>
    </div>
  );
}
