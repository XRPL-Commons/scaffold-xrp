"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, XCircle, Info } from "lucide-react";

const RIPPLE_EPOCH_OFFSET = 946684800;

export function EscrowInteraction() {
  const { walletManager, isConnected, addEvent, showStatus } = useWallet();
  const [action, setAction] = useState("finish");
  const [owner, setOwner] = useState("");
  const [escrowId, setEscrowId] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [finishAfter, setFinishAfter] = useState("");
  const [cancelAfter, setCancelAfter] = useState("");
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
        const parsedAmount = Number(amount);
        if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
          showStatus("Amount must be a positive integer (drops)", "error");
          setIsSubmitting(false);
          return;
        }
        if (!finishAfter && !cancelAfter) {
          showStatus("Please provide at least one of Finish After or Cancel After", "error");
          setIsSubmitting(false);
          return;
        }
        if (finishAfter && cancelAfter && parseInt(cancelAfter, 10) <= parseInt(finishAfter, 10)) {
          showStatus("Cancel After must be greater than Finish After", "error");
          setIsSubmitting(false);
          return;
        }
        const nowRipple = Math.floor(Date.now() / 1000) - RIPPLE_EPOCH_OFFSET;
        transaction = {
          TransactionType: "EscrowCreate",
          Account: walletManager.account.address,
          Destination: destination,
          Amount: String(parsedAmount),
        };
        if (finishAfter) {
          transaction.FinishAfter = nowRipple + parseInt(finishAfter, 10);
        }
        if (cancelAfter) {
          transaction.CancelAfter = nowRipple + parseInt(cancelAfter, 10);
        }
      } else if (action === "finish") {
        if (!owner || !escrowId) {
          showStatus("Please provide owner and escrow ID", "error");
          setIsSubmitting(false);
          return;
        }
        transaction = {
          TransactionType: "EscrowFinish",
          Account: walletManager.account.address,
          Owner: owner,
          EscrowID: escrowId,
        };
      } else {
        if (!owner || !escrowId) {
          showStatus("Please provide owner and escrow ID", "error");
          setIsSubmitting(false);
          return;
        }
        transaction = {
          TransactionType: "EscrowCancel",
          Account: walletManager.account.address,
          Owner: owner,
          EscrowID: escrowId,
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
      const message = error instanceof Error ? error.message : String(error);
      setResult({
        success: false,
        error: message,
      });
      showStatus(`Escrow ${action} failed: ${message}`, "error");
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
            <div className="space-y-2">
              <Label htmlFor="escrowFinishAfter">Finish After (seconds from now)</Label>
              <Input
                id="escrowFinishAfter"
                type="text"
                value={finishAfter}
                onChange={(e) => setFinishAfter(e.target.value)}
                placeholder="e.g., 60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="escrowCancelAfter">Cancel After (seconds from now)</Label>
              <Input
                id="escrowCancelAfter"
                type="text"
                value={cancelAfter}
                onChange={(e) => setCancelAfter(e.target.value)}
                placeholder="e.g., 3600"
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
              <Label htmlFor="escrowId">Escrow ID</Label>
              <Input
                id="escrowId"
                type="text"
                value={escrowId}
                onChange={(e) => setEscrowId(e.target.value)}
                placeholder="Escrow ledger ID..."
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
