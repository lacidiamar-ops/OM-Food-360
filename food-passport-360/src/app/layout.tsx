import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "FOOD PASSPORT 360",
  description: "Application nutrition 360° pour l'équipe professionnelle",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FP360",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0B0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
