import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexflow",
  description: "Dynamic workflow engine with rules and approvals",
  icons: {
    icon: [
      { url: "/Nexflowlogo.png", type: "image/png" }
    ],
    shortcut: ["/Nexflowlogo.png"],
    apple: ["/Nexflowlogo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 min-h-screen`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}