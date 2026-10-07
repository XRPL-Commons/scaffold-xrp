import "./globals.css";
import { WalletProvider } from "../components/providers/WalletProvider";

export const metadata = {
  title: "Scaffold-XRP",
  description: "A starter for building XRP Ledger apps with Next.js.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
