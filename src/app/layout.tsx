import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
