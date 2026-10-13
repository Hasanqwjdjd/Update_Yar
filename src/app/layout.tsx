import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/app/error-boundary";

export const metadata: Metadata = {
  title: "آپدیت‌یار | مدیریت هوشمند آپدیت برنامه‌ها",
  description:
    "آپدیت‌یار: همه به‌روزرسانی‌های گوشی شما از بازار، مایکت، گوگل‌پلی و گیت‌هاب — یک‌جا. دانلود مستقیم، تاریخچه آپدیت‌ها و پشتیبانی ویژه گیت‌هاب.",
  keywords: ["آپدیت", "به‌روزرسانی", "بازار", "مایکت", "گیت‌هاب", "اپلیکیشن", "آپدیت‌یار"],
  applicationName: "آپدیت‌یار",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "آپدیت‌یار",
    description: "همه آپدیت‌های گوشی شما، یک‌جا",
    type: "website",
    locale: "fa_IR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0B0F14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* فونت وزیرمتن به‌صورت محلی از public/fonts لود می‌شود (globals.css) — آفلاین */}
      </head>
      <body className="antialiased bg-background text-foreground">
        <ErrorBoundary>
          {children}
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
