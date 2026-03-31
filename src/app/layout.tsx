import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/state/cart";

const inter = Inter({ variable: "--font-body", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  variable: "--font-headline",
  subsets: ["latin"],
});
 
export const metadata: Metadata = {
  title: "Stitch screens",
  description: "Imported screens as a Next.js app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
