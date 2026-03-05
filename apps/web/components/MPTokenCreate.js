"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import { stringToHex } from "../lib/utils";

const MIN_ASSET_SCALE = 0;
const MAX_ASSET_SCALE = 255;
const FLAG_TRANSFERABLE = 0x20;

export function MPTokenCreate() {
  const { walletManager, addEvent, showStatus } = useWallet();

  const [tokenName, setTokenName] = useState("");
  const [assetScale, setAssetScale] = useState("2");
  const [maxAmount, setMaxAmount] = useState("");
  const [canTransfer, setCanTransfer] = useState(true);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    const scale = parseInt(assetScale, 10);
    if (isNaN(scale) || scale < MIN_ASSET_SCALE || scale > MAX_ASSET_SCALE) {
      showStatus(`Asset scale must be between ${MIN_ASSET_SCALE} and ${MAX_ASSET_SCALE}`, "error");
      return;
    }

    try {
      setIsSubmitting(true);
      setResult(null);

      const metadata = JSON.stringify({
        name: tokenName,
        description: "MPToken created via Scaffold-XRP",
      });

      const transaction = {
        TransactionType: "MPTokenIssuanceCreate",
        Account: walletManager.account.address,
        AssetScale: scale,
        Flags: canTransfer ? FLAG_TRANSFERABLE : 0,
        MPTokenMetadata: stringToHex(metadata),
      };

      if (maxAmount && maxAmount.trim() !== "") {
        transaction.MaximumAmount = maxAmount;
      }

      const txResult = await walletManager.signAndSubmit(transaction);

      const issuanceId =
        txResult?.result?.mpt_issuance_id ||
        txResult?.mpt_issuance_id ||
        "Check transaction for ID";

      setResult({
        success: true,
        hash: txResult.hash || "Pending",
        issuanceId,
        id: txResult.id,
      });

      showStatus("MPToken created successfully!", "success");
      addEvent("MPToken Created", txResult);

      setTokenName("");
      setMaxAmount("");
    } catch (error) {
      setResult({ success: false, error: error.message });
      showStatus(`Failed to create MPToken: ${error.message}`, "error");
      addEvent("MPToken Create Failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="tokenName">Token Name</Label>
          <Input
            id="tokenName"
            type="text"
            placeholder="My Token"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assetScale">Asset Scale (Decimal Places)</Label>
          <Input
            id="assetScale"
            type="number"
            placeholder="2"
            min={MIN_ASSET_SCALE}
            max={MAX_ASSET_SCALE}
            value={assetScale}
            onChange={(e) => setAssetScale(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Number of decimal places (0-255). Default is 2.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAmount">Maximum Amount (Optional)</Label>
          <Input
            id="maxAmount"
            type="text"
            placeholder="1000000"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Maximum tokens that can be issued. Leave empty for no limit.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="canTransfer" checked={canTransfer} onCheckedChange={setCanTransfer} />
          <Label htmlFor="canTransfer" className="text-sm font-normal">
            Allow transfers between holders
          </Label>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating Token..." : "Create MPToken"}
        </Button>
      </form>

      {result && (
        <Alert variant={result.success ? "success" : "destructive"} className="mt-4">
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>{result.success ? "MPToken Created" : "Creation Failed"}</AlertTitle>
          <AlertDescription>
            {result.success ? (
              <div className="space-y-1">
                <p className="font-mono text-xs break-all">Hash: {result.hash}</p>
                {result.issuanceId && (
                  <p className="font-mono text-xs break-all">Issuance ID: {result.issuanceId}</p>
                )}
                <p className="text-xs">Save the Issuance ID to transfer tokens later</p>
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
