"use client";

import { Printer } from "lucide-react";

interface Props {
  label: string;
}

export default function PrintButton({ label }: Props) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
    >
      <Printer size={16} />
      {label}
    </button>
  );
}
