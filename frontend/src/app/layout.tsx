import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layouts/Header";
import AuthProvider from "@/components/providers/AuthProvider";

import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

// Carregando a fonte Inter
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Focuslist - Organize suas Tarefas",
  description: "Organizador de Tarefas e Produtividade",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-br">
      <body className={`${inter.variable} antialiased p-8 flex flex-col gap-8`} id="root">
        {session && <Header session={session} />}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
