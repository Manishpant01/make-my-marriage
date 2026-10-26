import type { Metadata } from "next";
import { Outfit, Fraunces } from "next/font/google";
import { AnimationScope } from "@/components/entrance";
import { ToastProvider } from "@/components/toast";
import { NavigationHistory } from "@/components/navigation-history";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MakeMyMarriage",
  icons: {
    icon: { url: "/logo.png", type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${fraunces.variable} bg-ivory font-sans font-normal text-ink antialiased`}
      >
        <NavigationHistory />
        <AnimationScope><ToastProvider>{children}</ToastProvider></AnimationScope>
      </body>
    </html>
  );
}
