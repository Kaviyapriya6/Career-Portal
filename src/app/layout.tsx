import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/components/providers/auth-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "JobPortal - Find Your Dream Job at Top Global Companies",
  description: "Discover opportunities at 500+ leading MNCs worldwide. Real-time job listings from Google, Microsoft, Amazon, and more. Apply directly to original job postings.",
  keywords: ["jobs", "careers", "employment", "MNC", "global companies", "job search", "remote work"],
  authors: [{ name: "JobPortal Team" }],
  creator: "JobPortal",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jobportal.com",
    title: "JobPortal - Find Your Dream Job at Top Global Companies",
    description: "Discover opportunities at 500+ leading MNCs worldwide. Real-time job listings from top companies.",
    siteName: "JobPortal",
  },
  twitter: {
    card: "summary_large_image",
    title: "JobPortal - Find Your Dream Job",
    description: "Discover opportunities at 500+ leading MNCs worldwide.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable
      )}>
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
