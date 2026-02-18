import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import { SideNav, BottomNav } from "@/components/dashboard/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Factor Lens — Indian Equity Dashboard",
  description: "View and compare factor scores for all listed Indian stocks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <div className="flex min-h-screen">
          <SideNav />
          <main className="flex-1 min-w-0 pb-16 md:pb-0">
            {children}
          </main>
        </div>
        <BottomNav />
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
