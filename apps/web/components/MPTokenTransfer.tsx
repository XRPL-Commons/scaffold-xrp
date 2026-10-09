"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useWallet } from "./providers/WalletProvider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import type { MPTokenPaymentTransaction, TransactionResult } from "../lib/transactions";

const HEX_64_REGEX = /^[0-9a-fA-F]{64}$/;
const R_ADDRESS_REGEX = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

export function MPTokenTransfer() {
  const { walletManager, signAndSubmit, addEvent, showStatus } = useWallet();

  const [mptIssuanceId, setMptIssuanceId] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    if (!HEX_64_REGEX.test(mptIssuanceId)) {
      showStatus("Issuance ID must be a 64-character hex string", "error");
      return;
    }

    if (!R_ADDRESS_REGEX.test(destination)) {
      showStatus("Destination must be a valid r-address", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      setResult(null);

      const transaction: MPTokenPaymentTransaction = {
        TransactionType: "Payment",
        Account: walletManager.account.address,
        Destination: destination,
        Amount: {
          mpt_issuance_id: mptIssuanceId,
          value: amount,
        },
      };

      const txResult = await signAndSubmit(transaction);

      setResult({
        success: true,
        hash: txResult.hash || "Pending",
        id: txResult.id,
      });

      showStatus("MPToken transferred successfully!", "success");
      addEvent("MPToken Transferred", txResult);

      setDestination("");
      setAmount("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setResult({ success: false, error: message });
      showStatus(`Failed to transfer MPToken: ${message}`, "error");
      addEvent("MPToken Transfer Failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="mptIssuanceId">MPToken Issuance ID</Label>
          <Input
            id="mptIssuanceId"
            type="text"
            placeholder="000100001E962F495F07A990F4ED55D2..."
            value={mptIssuanceId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setMptIssuanceId(e.target.value)}
            className="font-mono text-xs"
            required
          />
          <p className="text-xs text-muted-foreground">The unique ID of the MPToken issuance</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transferDestination">Destination Address</Label>
          <Input
            id="transferDestination"
            type="text"
            placeholder="rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoQT"
            value={destination}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDestination(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Recipient must authorize this MPToken first
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transferAmount">Amount</Label>
          <Input
            id="transferAmount"
            type="text"
            placeholder="100"
            value={amount}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Amount in base units (considering asset scale)
          </p>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Transferring..." : "Transfer MPToken"}
        </Button>
      </form>

      {result && (
        <Alert variant={result.success ? "success" : "destructive"} className="mt-4">
          {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertTitle>{result.success ? "Transfer Successful" : "Transfer Failed"}</AlertTitle>
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
    </>
  );
}
