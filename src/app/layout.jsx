import "./globals.css";
import AppLayout from "@/components/AppLayout";

export const metadata = {
  title: "IT PING PLOTTER",
  description: "Device uptime monitoring dashboard",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
