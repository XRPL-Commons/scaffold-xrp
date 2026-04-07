"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, XCircle, Info } from "lucide-react";

export function EscrowInteraction() {
  const { walletManager, isConnected, addEvent, showStatus } = useWallet();
  const [action, setAction] = useState("finish");
  const [owner, setOwner] = useState("");
  const [sequence, setSequence] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      setResult(null);

      let transaction;

      if (action === "create") {
        if (!destination || !amount) {
          showStatus("Please provide destination and amount", "error");
          setIsSubmitting(false);
          return;
        }
        transaction = {
          TransactionType: "EscrowCreate",
          Account: walletManager.account.address,
          Destination: destination,
          Amount: amount,
          Fee: "12",
        };
      } else if (action === "finish") {
        if (!owner || !sequence) {
          showStatus("Please provide owner and sequence", "error");
          setIsSubmitting(false);
          return;
        }
        transaction = {
          TransactionType: "EscrowFinish",
          Account: walletManager.account.address,
          Owner: owner,
          OfferSequence: parseInt(sequence, 10),
          Fee: "12",
        };
      } else {
        if (!owner || !sequence) {
          showStatus("Please provide owner and sequence", "error");
          setIsSubmitting(false);
          return;
        }
        transaction = {
          TransactionType: "EscrowCancel",
          Account: walletManager.account.address,
          Owner: owner,
          OfferSequence: parseInt(sequence, 10),
          Fee: "12",
        };
      }

      const txResult = await walletManager.signAndSubmit(transaction);

      setResult({
        success: true,
        hash: txResult.hash || "Pending",
        id: txResult.id,
      });

      showStatus(`Escrow ${action} successful!`, "success");
      addEvent(`Escrow ${action}`, txResult);
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
      });
      showStatus(`Escrow ${action} failed: ${error.message}`, "error");
      addEvent(`Escrow ${action} Failed`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Escrow Interaction</CardTitle>
        <CardDescription>Create and manage smart escrows</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Action</Label>
          <div className="flex gap-2">
            <Button
              variant={action === "create" ? "default" : "outline"}
              size="sm"
              onClick={() => setAction("create")}
            >
              Create
            </Button>
            <Button
              variant={action === "finish" ? "default" : "outline"}
              size="sm"
              onClick={() => setAction("finish")}
            >
              Finish
            </Button>
            <Button
              variant={action === "cancel" ? "default" : "outline"}
              size="sm"
              onClick={() => setAction("cancel")}
            >
              Cancel
            </Button>
          </div>
        </div>

        {action === "create" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="escrowDestination">Destination</Label>
              <Input
                id="escrowDestination"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="rAddress..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="escrowAmount">Amount (drops)</Label>
              <Input
                id="escrowAmount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 1000000"
              />
            </div>
          </>
        )}

        {(action === "finish" || action === "cancel") && (
          <>
            <div className="space-y-2">
              <Label htmlFor="escrowOwner">Owner</Label>
              <Input
                id="escrowOwner"
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="rAddress..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="escrowSequence">Offer Sequence</Label>
              <Input
                id="escrowSequence"
                type="text"
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                placeholder="e.g., 12"
              />
            </div>
          </>
        )}

        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium mb-2">Smart Escrow Entry Point</p>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>finish() - WASM condition checked on EscrowFinish</li>
            <li>Returns 1 to release funds, 0 to keep locked</li>
          </ul>
        </div>

        {isConnected && (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : `Escrow ${action.charAt(0).toUpperCase() + action.slice(1)}`}
          </Button>
        )}

        {!isConnected && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>Connect your wallet to interact with escrows</AlertDescription>
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
