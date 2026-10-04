import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://saltrepublic.mv"),
  title: {
    default:
      "Salt Republic — Private Yacht Charter Maldives | Luxury Malé Atoll Experience Aboard Finch 65",
    template: "%s · Salt Republic",
  },
  description:
    "Private luxury yacht experiences in the Maldives aboard Finch 65. Half-day, full-day and overnight charters, sandbank escapes, snorkelling and bespoke ocean journeys around Malé Atoll.",
  keywords: [
    "Salt Republic",
    "Maldives private yacht",
    "Maldives yacht charter",
    "private yacht Maldives",
    "luxury yacht Maldives",
    "Malé Atoll yacht charter",
    "private boat charter Maldives",
    "Finch 65",
  ],
  openGraph: {
    title: "Salt Republic — Private Yacht Experiences in the Maldives",
    description:
      "Discover the Maldives on your own terms. Private luxury yacht charter aboard Finch 65 around Malé Atoll.",
    images: [{ url: "/images/hero.jpg", width: 1600, height: 900, alt: "Finch 65 anchored in a Maldivian lagoon" }],
    locale: "en_US",
    type: "website",
    siteName: "Salt Republic",
  },
  twitter: {
    card: "summary_large_image",
    title: "Salt Republic — Private Yacht Experiences in the Maldives",
    description:
      "Private luxury yacht charter aboard Finch 65 around Malé Atoll, Maldives.",
    images: ["/images/hero.jpg"],
  },
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml," +
          encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='%23071b26'/><text x='32' y='42' font-family='Georgia,serif' font-size='30' fill='%23cbb795' text-anchor='middle'>S</text></svg>`
          ),
      },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" key="font-preconnect-1" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
          key="font-preconnect-2"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;500;600&family=Manrope:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
          key="google-fonts-stylesheet"
        />
      </head>
      <body className="min-h-screen bg-navy-950 text-ivory antialiased selection:bg-teal-400 selection:text-navy-950">
        {children}
      </body>
    </html>
  );
}
