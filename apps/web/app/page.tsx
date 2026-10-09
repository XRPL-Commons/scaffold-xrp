import { AppShell } from "../components/AppShell";
import { AccountInfo } from "../components/AccountInfo";
import { TransactionForm } from "../components/TransactionForm";

export default function Home() {
  return (
    <AppShell>
      <AccountInfo />
      <TransactionForm />
    </AppShell>
  );
}
