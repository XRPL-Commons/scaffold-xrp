"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

const HEX_64_REGEX = /^[0-9a-fA-F]{64}$/;

export function MPTokenAuthorize() {
  const { walletManager, addEvent, showStatus } = useWallet();

  const [issuanceId, setIssuanceId] = useState("");
  const [unauthorize, setUnauthorize] = useState(false);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    if (!HEX_64_REGEX.test(issuanceId)) {
      showStatus("Issuance ID must be a 64-character hex string", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      setResult(null);

      const transaction = {
        TransactionType: "MPTokenAuthorize",
        Account: walletManager.account.address,
        MPTokenIssuanceID: issuanceId,
        Flags: unauthorize ? 1 : 0,
      };

      const txResult = await walletManager.signAndSubmit(transaction);

      const action = unauthorize ? "unauthorized" : "authorized";

      setResult({
        success: true,
        hash: txResult.hash || "Pending",
        id: txResult.id,
        action,
      });

      showStatus(`MPToken ${action} successfully!`, "success");
      addEvent(`MPToken ${unauthorize ? "Unauthorized" : "Authorized"}`, txResult);

      setIssuanceId("");
      setUnauthorize(false);
    } catch (error) {
      setResult({ success: false, error: error.message });
      showStatus(`Failed to authorize MPToken: ${error.message}`, "error");
      addEvent("MPToken Authorize Failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="authIssuanceId">MPToken Issuance ID</Label>
          <Input
            id="authIssuanceId"
            type="text"
            placeholder="000100001E962F495F07A990F4ED55D2..."
            value={issuanceId}
            onChange={(e) => setIssuanceId(e.target.value)}
            className="font-mono text-xs"
            required
          />
          <p className="text-xs text-muted-foreground">
            The unique ID of the MPToken you want to hold
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="unauthorize" checked={unauthorize} onCheckedChange={setUnauthorize} />
          <Label htmlFor="unauthorize" className="text-sm font-normal">
            Revoke authorization (remove token holding)
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          variant={unauthorize ? "destructive" : "default"}
          className="w-full"
        >
          {isSubmitting
            ? "Processing..."
            : unauthorize
            ? "Revoke Authorization"
            : "Authorize MPToken"}
        </Button>

        <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-1">
          <p>
            <span className="font-medium text-foreground">Authorize:</span> Allows your account to
            receive this MPToken. Required before someone can transfer tokens to you.
          </p>
          <p>
            <span className="font-medium text-foreground">Revoke:</span> Removes your ability to
            hold this token. Only works if your balance is zero.
          </p>
        </div>
      </form>

      {result && (
        <Alert variant={result.success ? "success" : "destructive"} className="mt-4">
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {result.success
              ? result.action === "authorized"
                ? "Authorization Successful"
                : "Authorization Revoked"
              : "Authorization Failed"}
          </AlertTitle>
          <AlertDescription>
            {result.success ? (
              <div className="space-y-1">
                <p className="font-mono text-xs break-all">Hash: {result.hash}</p>
                {result.id && <p className="text-xs">ID: {result.id}</p>}
                <p className="text-xs">
                  {result.action === "authorized"
                    ? "You can now receive this MPToken"
                    : "You can no longer hold this MPToken"}
                </p>
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
