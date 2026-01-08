"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, XCircle, Info } from "lucide-react";

export function MPTokenCard() {
  const { walletManager, isConnected, addEvent, showStatus } = useWallet();

  const [activeTab, setActiveTab] = useState("create");

  // Create MPToken state
  const [tokenName, setTokenName] = useState("");
  const [assetScale, setAssetScale] = useState("2");
  const [maxAmount, setMaxAmount] = useState("");
  const [canTransfer, setCanTransfer] = useState(true);
  const [createResult, setCreateResult] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Transfer MPToken state
  const [mptIssuanceId, setMptIssuanceId] = useState("");
  const [transferDestination, setTransferDestination] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferResult, setTransferResult] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Authorize MPToken state
  const [authIssuanceId, setAuthIssuanceId] = useState("");
  const [unauthorize, setUnauthorize] = useState(false);
  const [authResult, setAuthResult] = useState(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const stringToHex = (str) => {
    return Buffer.from(str, "utf8").toString("hex").toUpperCase();
  };

  const calculateFlags = () => {
    let flags = 0;
    if (canTransfer) {
      flags |= 0x20;
    }
    return flags;
  };

  const handleCreateToken = async (e) => {
    e.preventDefault();

    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    try {
      setIsCreating(true);
      setCreateResult(null);

      const metadata = JSON.stringify({
        name: tokenName,
        description: `MPToken created via Scaffold-XRP`,
      });

      const transaction = {
        TransactionType: "MPTokenIssuanceCreate",
        Account: walletManager.account.address,
        AssetScale: parseInt(assetScale, 10),
        Flags: calculateFlags(),
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

      setCreateResult({
        success: true,
        hash: txResult.hash || "Pending",
        issuanceId: issuanceId,
        id: txResult.id,
      });

      showStatus("MPToken created successfully!", "success");
      addEvent("MPToken Created", txResult);

      setTokenName("");
      setMaxAmount("");
    } catch (error) {
      setCreateResult({
        success: false,
        error: error.message,
      });
      showStatus(`Failed to create MPToken: ${error.message}`, "error");
      addEvent("MPToken Create Failed", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();

    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    if (!mptIssuanceId || !transferDestination || !transferAmount) {
      showStatus("Please fill in all transfer fields", "error");
      return;
    }

    try {
      setIsTransferring(true);
      setTransferResult(null);

      const transaction = {
        TransactionType: "Payment",
        Account: walletManager.account.address,
        Destination: transferDestination,
        Amount: {
          mpt_issuance_id: mptIssuanceId,
          value: transferAmount,
        },
      };

      const txResult = await walletManager.signAndSubmit(transaction);

      setTransferResult({
        success: true,
        hash: txResult.hash || "Pending",
        id: txResult.id,
      });

      showStatus("MPToken transferred successfully!", "success");
      addEvent("MPToken Transferred", txResult);

      setTransferDestination("");
      setTransferAmount("");
    } catch (error) {
      setTransferResult({
        success: false,
        error: error.message,
      });
      showStatus(`Failed to transfer MPToken: ${error.message}`, "error");
      addEvent("MPToken Transfer Failed", error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleAuthorize = async (e) => {
    e.preventDefault();

    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    if (!authIssuanceId) {
      showStatus("Please enter the MPToken Issuance ID", "error");
      return;
    }

    try {
      setIsAuthorizing(true);
      setAuthResult(null);

      const transaction = {
        TransactionType: "MPTokenAuthorize",
        Account: walletManager.account.address,
        MPTokenIssuanceID: authIssuanceId,
        Flags: unauthorize ? 1 : 0,
      };

      const txResult = await walletManager.signAndSubmit(transaction);

      setAuthResult({
        success: true,
        hash: txResult.hash || "Pending",
        id: txResult.id,
        action: unauthorize ? "unauthorized" : "authorized",
      });

      const actionText = unauthorize ? "unauthorized" : "authorized";
      showStatus(`MPToken ${actionText} successfully!`, "success");
      addEvent(`MPToken ${unauthorize ? "Unauthorized" : "Authorized"}`, txResult);

      setAuthIssuanceId("");
      setUnauthorize(false);
    } catch (error) {
      setAuthResult({
        success: false,
        error: error.message,
      });
      showStatus(`Failed to authorize MPToken: ${error.message}`, "error");
      addEvent("MPToken Authorize Failed", error);
    } finally {
      setIsAuthorizing(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Multi-Purpose Token</CardTitle>
        <CardDescription>Create, transfer, and authorize MPTokens</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="transfer">Transfer</TabsTrigger>
            <TabsTrigger value="authorize">Authorize</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <form onSubmit={handleCreateToken} className="space-y-4 pt-4">
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
                  min="0"
                  max="255"
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
                <Checkbox
                  id="canTransfer"
                  checked={canTransfer}
                  onCheckedChange={setCanTransfer}
                />
                <Label htmlFor="canTransfer" className="text-sm font-normal">
                  Allow transfers between holders
                </Label>
              </div>

              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? "Creating Token..." : "Create MPToken"}
              </Button>
            </form>

            {createResult && (
              <Alert
                variant={createResult.success ? "success" : "destructive"}
                className="mt-4"
              >
                {createResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {createResult.success ? "MPToken Created" : "Creation Failed"}
                </AlertTitle>
                <AlertDescription>
                  {createResult.success ? (
                    <div className="space-y-1">
                      <p className="font-mono text-xs break-all">Hash: {createResult.hash}</p>
                      {createResult.issuanceId && (
                        <p className="font-mono text-xs break-all">
                          Issuance ID: {createResult.issuanceId}
                        </p>
                      )}
                      <p className="text-xs">Save the Issuance ID to transfer tokens later</p>
                    </div>
                  ) : (
                    <p>{createResult.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="transfer">
            <form onSubmit={handleTransfer} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="mptIssuanceId">MPToken Issuance ID</Label>
                <Input
                  id="mptIssuanceId"
                  type="text"
                  placeholder="000100001E962F495F07A990F4ED55D2..."
                  value={mptIssuanceId}
                  onChange={(e) => setMptIssuanceId(e.target.value)}
                  className="font-mono text-xs"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The unique ID of the MPToken issuance
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transferDestination">Destination Address</Label>
                <Input
                  id="transferDestination"
                  type="text"
                  placeholder="rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoQT"
                  value={transferDestination}
                  onChange={(e) => setTransferDestination(e.target.value)}
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
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Amount in base units (considering asset scale)
                </p>
              </div>

              <Button type="submit" disabled={isTransferring} className="w-full">
                {isTransferring ? "Transferring..." : "Transfer MPToken"}
              </Button>
            </form>

            {transferResult && (
              <Alert
                variant={transferResult.success ? "success" : "destructive"}
                className="mt-4"
              >
                {transferResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {transferResult.success ? "Transfer Successful" : "Transfer Failed"}
                </AlertTitle>
                <AlertDescription>
                  {transferResult.success ? (
                    <div className="space-y-1">
                      <p className="font-mono text-xs break-all">Hash: {transferResult.hash}</p>
                      {transferResult.id && <p className="text-xs">ID: {transferResult.id}</p>}
                    </div>
                  ) : (
                    <p>{transferResult.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="authorize">
            <form onSubmit={handleAuthorize} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="authIssuanceId">MPToken Issuance ID</Label>
                <Input
                  id="authIssuanceId"
                  type="text"
                  placeholder="000100001E962F495F07A990F4ED55D2..."
                  value={authIssuanceId}
                  onChange={(e) => setAuthIssuanceId(e.target.value)}
                  className="font-mono text-xs"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The unique ID of the MPToken you want to hold
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unauthorize"
                  checked={unauthorize}
                  onCheckedChange={setUnauthorize}
                />
                <Label htmlFor="unauthorize" className="text-sm font-normal">
                  Revoke authorization (remove token holding)
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isAuthorizing}
                variant={unauthorize ? "destructive" : "default"}
                className="w-full"
              >
                {isAuthorizing
                  ? "Processing..."
                  : unauthorize
                  ? "Revoke Authorization"
                  : "Authorize MPToken"}
              </Button>

              <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium text-foreground">Authorize:</span> Allows your
                  account to receive this MPToken. Required before someone can transfer tokens to
                  you.
                </p>
                <p>
                  <span className="font-medium text-foreground">Revoke:</span> Removes your ability
                  to hold this token. Only works if your balance is zero.
                </p>
              </div>
            </form>

            {authResult && (
              <Alert variant={authResult.success ? "success" : "destructive"} className="mt-4">
                {authResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {authResult.success
                    ? authResult.action === "authorized"
                      ? "Authorization Successful"
                      : "Authorization Revoked"
                    : "Authorization Failed"}
                </AlertTitle>
                <AlertDescription>
                  {authResult.success ? (
                    <div className="space-y-1">
                      <p className="font-mono text-xs break-all">Hash: {authResult.hash}</p>
                      {authResult.id && <p className="text-xs">ID: {authResult.id}</p>}
                      <p className="text-xs">
                        {authResult.action === "authorized"
                          ? "You can now receive this MPToken"
                          : "You can no longer hold this MPToken"}
                      </p>
                    </div>
                  ) : (
                    <p>{authResult.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            MPTokens require the MPTokensV1 amendment. Recipients must authorize the token using
            MPTokenAuthorize before receiving transfers.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
