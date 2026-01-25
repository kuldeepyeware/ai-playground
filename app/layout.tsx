import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Playground - Compare AI Models Side-by-Side",
  description:
    "Compare responses from GPT-4o, Claude 3.5 Sonnet, and Grok 3 side-by-side. Evaluate response quality, latency, token usage, and cost.",
  keywords: [
    "AI",
    "ChatGPT",
    "Claude",
    "Grok",
    "comparison",
    "playground",
    "LLM",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#6366F1",
          colorBackground: "#111827",
          colorInputBackground: "#0B0E14",
          colorInputText: "#F9FAFB",
        },
      }}>
      <QueryProvider>
        <html lang='en' className='dark' suppressHydrationWarning>
          <body
            className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
            suppressHydrationWarning>
            {children}
            <Toaster />
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  );
}
