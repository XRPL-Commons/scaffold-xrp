"use client";

import { useMemo, useRef, useState } from "react";
import {
  useSigner,
  useWallet as useBindingWallet,
  useWalletModal,
} from "@xrpl-commons/xrpl-connect-react";
import {
  isWalletError,
  WalletErrorCode,
} from "xrpl-connect";
import { isValidClassicAddress } from "xrpl";
import { useWallet } from "./providers/WalletProvider";
import {
  buildPaymentTransaction,
  normalizeSubmittedPaymentResult,
  parseXrpAmount,
} from "../lib/payment.mjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, Info, XCircle } from "lucide-react";

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function isCancelledWalletAction(error) {
  return (
    isWalletError(error) &&
    [WalletErrorCode.SIGN_REJECTED, WalletErrorCode.CONNECTION_REJECTED].includes(
      error.code
    )
  );
}

export function TransactionForm() {
  const { connected, account, connecting } = useBindingWallet();
  const { signAndSubmit } = useSigner();
  const { ready, open } = useWalletModal();
  const { selectedNetwork, addEvent, showStatus } = useWallet();
  const [destination, setDestination] = useState("");
  const [amountXrp, setAmountXrp] = useState("");
  const [destinationTag, setDestinationTag] = useState("");
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const dropsPreview = useMemo(() => {
    if (!amountXrp.trim()) return null;
    try {
      return parseXrpAmount(amountXrp);
    } catch {
      return null;
    }
  }, [amountXrp]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current || isSubmitting) return;

    if (!connected || !account) {
      showStatus("Connect a wallet before sending XRP.", "error");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setResult(null);

    try {
      const transaction = buildPaymentTransaction({
        accountAddress: account.address,
        accountNetworkId: account.network.id,
        selectedNetworkId: selectedNetwork.id,
        destination,
        amountXrp,
        destinationTag,
        isValidAddress: isValidClassicAddress,
      });
      const submittedTransaction = await signAndSubmit(transaction);
      const nextResult = normalizeSubmittedPaymentResult(submittedTransaction);

      if (nextResult.status === "error") {
        setResult(nextResult);
        showStatus(`Payment failed: ${nextResult.error}`, "error");
        addEvent("Payment Failed", submittedTransaction);
        return;
      }

      setResult(nextResult);
      showStatus(
        nextResult.status === "validated"
          ? "Payment validated on the ledger."
          : "Payment submitted; validation is pending.",
        "success"
      );
      addEvent("Payment Submitted", submittedTransaction);
      setDestination("");
      setAmountXrp("");
      setDestinationTag("");
    } catch (error) {
      const cancelled = isCancelledWalletAction(error);
      const message = cancelled ? "Transaction signing was cancelled." : getErrorMessage(error);
      setResult({ status: cancelled ? "cancelled" : "error", error: message });
      if (cancelled) {
        showStatus(message, "info");
      } else {
        showStatus(`Payment failed: ${message}`, "error");
        addEvent("Payment Failed", error);
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleConnect = async () => {
    try {
      await open();
    } catch (error) {
      showStatus(`Wallet connection failed: ${getErrorMessage(error)}`, "error");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Send XRP</CardTitle>
        <CardDescription>
          Send XRP on {selectedNetwork.name}. Amounts are converted to drops exactly.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!connected && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>Connect a wallet to sign this payment.</span>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleConnect()}
                disabled={!ready || connecting}
              >
                {connecting ? "Connecting…" : "Connect wallet"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destination">Destination address</Label>
            <Input
              id="destination"
              type="text"
              autoComplete="off"
              placeholder="rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoQT"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destinationTag">Destination tag (optional)</Label>
            <Input
              id="destinationTag"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 12345"
              value={destinationTag}
              onChange={(event) => setDestinationTag(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Include a tag when the recipient provides one, such as an exchange deposit.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountXrp">Amount (XRP)</Label>
            <Input
              id="amountXrp"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="1.5"
              value={amountXrp}
              onChange={(event) => setAmountXrp(event.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              {dropsPreview
                ? `${dropsPreview} drops (1 XRP = 1,000,000 drops)`
                : "Up to six decimal places; 1 XRP = 1,000,000 drops."}
            </p>
          </div>

          <Button
            type="submit"
            disabled={!connected || connecting || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Waiting for wallet…" : "Sign & submit payment"}
          </Button>
        </form>

        {result?.status === "submitted" || result?.status === "validated" ? (
          <Alert variant="success" className="mt-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>
              {result.status === "validated" ? "Payment validated" : "Payment submitted"}
            </AlertTitle>
            <AlertDescription>
              <div className="space-y-1">
                <p className="break-all font-mono text-xs">Hash: {result.hash}</p>
                {result.id && <p className="text-xs">ID: {result.id}</p>}
                {result.status === "submitted" && (
                  <p className="text-xs">The ledger has not reported validation yet.</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ) : result ? (
          <Alert
            variant={result.status === "cancelled" ? "warning" : "destructive"}
            className="mt-4"
          >
            <XCircle className="h-4 w-4" />
            <AlertTitle>
              {result.status === "cancelled" ? "Payment cancelled" : "Payment failed"}
            </AlertTitle>
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
