"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, XCircle, Info } from "lucide-react";

export function VaultInteraction() {
  const { walletManager, isConnected, addEvent, showStatus } = useWallet();
  const [vaultId, setVaultId] = useState("");
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState("deposit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    if (!vaultId || !amount) {
      showStatus("Please provide vault ID and amount", "error");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      showStatus("Amount must be a positive integer (drops)", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      setResult(null);

      const transaction = {
        TransactionType: action === "deposit" ? "VaultDeposit" : "VaultWithdraw",
        Account: walletManager.account.address,
        VaultID: vaultId,
        Amount: String(parsedAmount),
        ComputationAllowance: 1000000,
        Fee: "1000000",
      };

      const txResult = await walletManager.signAndSubmit(transaction);

      setResult({
        success: true,
        hash: txResult.hash || "Pending",
        id: txResult.id,
      });

      showStatus(`Vault ${action} successful!`, "success");
      addEvent(`Vault ${action}`, txResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setResult({
        success: false,
        error: message,
      });
      showStatus(`Vault ${action} failed: ${message}`, "error");
      addEvent(`Vault ${action} Failed`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Vault Interaction</CardTitle>
        <CardDescription>Deposit and withdraw from smart vaults</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vaultId">Vault ID</Label>
          <Input
            id="vaultId"
            type="text"
            value={vaultId}
            onChange={(e) => setVaultId(e.target.value)}
            placeholder="Vault ledger ID..."
          />
        </div>

        <div className="space-y-2">
          <Label>Action</Label>
          <div className="flex gap-2">
            <Button
              variant={action === "deposit" ? "default" : "outline"}
              size="sm"
              onClick={() => setAction("deposit")}
            >
              Deposit
            </Button>
            <Button
              variant={action === "withdraw" ? "default" : "outline"}
              size="sm"
              onClick={() => setAction("withdraw")}
            >
              Withdraw
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vaultAmount">Amount (drops)</Label>
          <Input
            id="vaultAmount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 1000000"
          />
        </div>

        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium mb-2">Smart Vault Entry Points</p>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>on_deposit() - Called when assets are deposited</li>
            <li>on_withdraw() - Called when assets are withdrawn</li>
          </ul>
        </div>

        {isConnected && (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : `${action === "deposit" ? "Deposit" : "Withdraw"}`}
          </Button>
        )}

        {!isConnected && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>Connect your wallet to interact with vaults</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert variant={result.success ? "success" : "destructive"}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>{result.success ? "Transaction Sent" : "Transaction Failed"}</AlertTitle>
            <AlertDescription>
              {result.success ? (
                <div className="space-y-1">
                  <p className="font-mono text-xs break-all">Hash: {result.hash}</p>
                  {result.id && <p className="text-xs">ID: {result.id}</p>}
                </div>
              ) : (
                <p>{result.error}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
