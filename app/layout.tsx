import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Highway Heaven Cafe & Restaurant — Order Online | Farrukhabad",
  description:
    "Order food online from Highway Heaven Restaurant & Cafe, Baghar Road, Farrukhabad. Fresh tandoor, Chinese, pizza, shakes and more, delivered to your door. Open daily 10 AM – 10 PM.",
};

export const viewport: Viewport = {
  themeColor: "#15111B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,600&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-asphalt text-cream antialiased">{children}</body>
    </html>
  );
}
