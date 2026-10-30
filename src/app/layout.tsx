import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Recall Research — Research that remembers. Evidence that evolves.",
  description:
    "An AI research analyst powered by NVIDIA Nemotron on Nebius Token Factory and Tavily web research. Features persistent local memory and longitudinal Research Delta comparison.",
  keywords: [
    "Recall Research",
    "Nebius",
    "Nebius Token Factory",
    "NVIDIA Nemotron",
    "Tavily",
    "AI Research Analyst",
    "Research Delta",
    "Persistent Memory",
    "IndexedDB",
  ],
  authors: [{ name: "Recall Research Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface-950 text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
