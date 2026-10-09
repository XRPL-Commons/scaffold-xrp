"use client";

import { useRef, useState, type FormEvent } from "react";
import { useSigner, useWallet as useBindingWallet } from "@xrpl-commons/xrpl-connect-react";
import { isWalletError, WalletErrorCode } from "xrpl-connect";
import { isValidClassicAddress } from "xrpl";
import { useWallet } from "./providers/WalletProvider";
import { buildPaymentTransaction, normalizeSubmittedPaymentResult } from "../lib/payment";
import type { NormalizedPaymentResult } from "../lib/payment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, ChevronDown, XCircle } from "lucide-react";

type PaymentFormResult =
  | NormalizedPaymentResult
  | {
      status: "cancelled";
      error: string;
    };

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isCancelledWalletAction(error: unknown): boolean {
  return (
    isWalletError(error) &&
    [WalletErrorCode.SIGN_REJECTED, WalletErrorCode.CONNECTION_REJECTED].includes(error.code)
  );
}

export function TransactionForm() {
  const { connected, account, connecting } = useBindingWallet();
  const { signAndSubmit } = useSigner();
  const { selectedNetwork, addEvent, showStatus } = useWallet();
  const [destination, setDestination] = useState("");
  const [amountXrp, setAmountXrp] = useState("");
  const [destinationTag, setDestinationTag] = useState("");
  const [result, setResult] = useState<PaymentFormResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const networkMismatch = Boolean(account && account.network.id !== selectedNetwork.id);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

  return (
    <Card className="min-w-0 rounded-xl">
      <CardHeader className="p-6 pb-6 md:p-8 md:pb-6">
        <CardTitle className="text-xl">Send XRP</CardTitle>
        <CardDescription>Send XRP on {selectedNetwork.name}.</CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 md:p-8 md:pt-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="destination">Destination address</Label>
            <Input
              id="destination"
              type="text"
              autoComplete="off"
              placeholder="r…"
              className="h-12 rounded-lg text-base"
              disabled={isSubmitting}
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountXrp">Amount (XRP)</Label>
            <div className="relative">
              <Input
                id="amountXrp"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="1.5"
                className="h-12 rounded-lg pr-16 text-base"
                value={amountXrp}
                onChange={(event) => setAmountXrp(event.target.value)}
                aria-describedby="amount-help"
                disabled={isSubmitting}
                required
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground"
              >
                XRP
              </span>
            </div>
            <p id="amount-help" className="text-xs text-muted-foreground">
              Up to six decimal places.
            </p>
          </div>

          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <ChevronDown
                className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
              {destinationTag.trim() ? `Destination tag: ${destinationTag}` : "Add destination tag"}
              {!destinationTag.trim() && (
                <span className="font-normal text-muted-foreground">(optional)</span>
              )}
            </summary>
            <div className="mt-4 space-y-2">
              <Label htmlFor="destinationTag">Destination tag</Label>
              <Input
                id="destinationTag"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 12345"
                className="h-12 rounded-lg text-base"
                value={destinationTag}
                onChange={(event) => setDestinationTag(event.target.value)}
                aria-describedby="destination-tag-help"
                disabled={isSubmitting}
              />
              <p id="destination-tag-help" className="text-xs text-muted-foreground">
                Include the tag if the recipient requires one.
              </p>
            </div>
          </details>

          <Button
            type="submit"
            disabled={!connected || connecting || networkMismatch || isSubmitting}
            className="h-12 w-full rounded-lg disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none"
          >
            {isSubmitting ? "Waiting for wallet…" : "Sign & submit payment"}
          </Button>
        </form>

        {result ? (
          result.status === "submitted" || result.status === "validated" ? (
            <Alert variant="success" className="mt-4" role="status">
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
          ) : (
            <Alert
              variant={result.status === "cancelled" ? "warning" : "destructive"}
              className="mt-4"
              role="alert"
            >
              <XCircle className="h-4 w-4" />
              <AlertTitle>
                {result.status === "cancelled" ? "Payment cancelled" : "Payment failed"}
              </AlertTitle>
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
