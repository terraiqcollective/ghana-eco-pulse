import { Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-ui",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "EcoPulse Ghana | Forest Carbon Monitoring",
    description: "Portal for mapping forest carbon stock and estimated carbon loss associated with mining disturbance across Ghana.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${interTight.variable} ${fraunces.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
