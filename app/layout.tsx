// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DevToolsWrapper } from "@/components/DevToolsWrapper";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ERP Corporativo",
  description: "Sistema ERP Multiactivo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <DevToolsWrapper>
          <SessionProvider>
            {children}
          </SessionProvider>
        </DevToolsWrapper>
      </body>
    </html>
  );
}