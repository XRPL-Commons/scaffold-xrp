import "./globals.css";
import { XRPLProvider } from "../components/providers/XRPLProvider";

export const metadata = {
  title: "Scaffold-XRP",
  description: "A starter kit for building dApps on XRPL with smart contracts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <XRPLProvider>{children}</XRPLProvider>
      </body>
    </html>
  );
}
