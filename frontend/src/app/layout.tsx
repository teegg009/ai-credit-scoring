import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavBar from "@/components/nav-bar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "CreditRisk AI",
  description: "แพลตฟอร์มประเมินความเสี่ยงสินเชื่อด้วย AI (XGBoost + SHAP)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={cn("font-sans", inter.variable)}>
      <body>
        <TooltipProvider>
          <NavBar />
          <main className="mx-auto max-w-5xl p-6">{children}</main>
        </TooltipProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
