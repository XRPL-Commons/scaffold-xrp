"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, XCircle, Info } from "lucide-react";

export function ContractInteraction() {
  const { walletManager, isConnected, addEvent, showStatus } = useWallet();
  const [contractAddress, setContractAddress] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [functionArgs, setFunctionArgs] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [callResult, setCallResult] = useState(null);

  const stringToHex = (str) => {
    return Array.from(str)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  };

  const loadCounterExample = () => {
    setFunctionName("increment");
    setFunctionArgs("");
    setCallResult(null);
  };

  const handleCallContract = async () => {
    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    if (!contractAddress || !functionName) {
      showStatus("Please provide contract address and function name", "error");
      return;
    }

    try {
      setIsCalling(true);
      setCallResult(null);

      const transaction = {
        TransactionType: "ContractCall",
        Account: walletManager.account.address,
        ContractAccount: contractAddress,
        Fee: "1000000",
        FunctionName: stringToHex(functionName),
        ComputationAllowance: "1000000",
      };

      if (functionArgs) {
        transaction.FunctionArguments = stringToHex(functionArgs);
      }

      const txResult = await walletManager.signAndSubmit(transaction);

      setCallResult({
        success: true,
        hash: txResult.hash || "Pending",
        id: txResult.id,
      });

      showStatus("Contract called successfully!", "success");
      addEvent("Contract Called", txResult);
    } catch (error) {
      setCallResult({
        success: false,
        error: error.message,
      });
      showStatus(`Contract call failed: ${error.message}`, "error");
      addEvent("Contract Call Failed", error);
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Contract Interaction</CardTitle>
            <CardDescription>Call functions on deployed contracts</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={loadCounterExample}>
            Load Example
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contractAddress">Contract Address</Label>
          <Input
            id="contractAddress"
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="rAddress..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="functionName">Function Name</Label>
          <Input
            id="functionName"
            type="text"
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            placeholder="e.g., increment, get_value"
          />
          {functionName && (
            <p className="text-xs text-muted-foreground">
              Hex: {stringToHex(functionName)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="functionArgs">Arguments (optional)</Label>
          <Input
            id="functionArgs"
            type="text"
            value={functionArgs}
            onChange={(e) => setFunctionArgs(e.target.value)}
            placeholder="e.g., 5, hello"
          />
          {functionArgs && (
            <p className="text-xs text-muted-foreground">
              Hex: {stringToHex(functionArgs)}
            </p>
          )}
        </div>

        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium mb-2">Counter Contract Functions</p>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>increment - Increase counter by 1</li>
            <li>decrement - Decrease counter by 1</li>
            <li>get_value - Get current counter value</li>
            <li>reset - Reset counter to 0</li>
          </ul>
        </div>

        {isConnected && contractAddress && functionName && (
          <Button onClick={handleCallContract} disabled={isCalling} className="w-full">
            {isCalling ? "Calling Contract..." : "Call Contract"}
          </Button>
        )}

        {!isConnected && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>Connect your wallet to interact with contracts</AlertDescription>
          </Alert>
        )}

        {callResult && (
          <Alert variant={callResult.success ? "success" : "destructive"}>
            {callResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>{callResult.success ? "Contract Called" : "Call Failed"}</AlertTitle>
            <AlertDescription>
              {callResult.success ? (
                <div className="space-y-1">
                  <p className="font-mono text-xs break-all">Hash: {callResult.hash}</p>
                  {callResult.id && <p className="text-xs">ID: {callResult.id}</p>}
                </div>
              ) : (
                <p>{callResult.error}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
