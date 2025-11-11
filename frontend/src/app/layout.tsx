import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layouts/Header";
import AuthProvider from "@/components/providers/AuthProvider";
import { MessageProvider } from "./context/MessageContext";
import Chatbot from "@/components/layouts/Chatbot";

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
  manifest: "/manifest.json",
  themeColor: "#1A1A2E",
  appleWebApp: {
    capable: true,
    title: "Focuslist",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/icons/icon-72x72.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-br">
      <body
        className={`${inter.variable} antialiased p-8 flex flex-col gap-8`}
        id="root"
      >
        {session && <Header session={session} />}
        <AuthProvider>
          <MessageProvider session={session}>{children}
            <Chatbot />
          </MessageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
