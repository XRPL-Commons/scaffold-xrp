"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Info } from "lucide-react";
import { MPTokenCreate } from "./MPTokenCreate";
import { MPTokenTransfer } from "./MPTokenTransfer";
import { MPTokenAuthorize } from "./MPTokenAuthorize";

export function MPTokenCard() {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState("create");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Multi-Purpose Token</CardTitle>
        <CardDescription>Create, transfer, and authorize MPTokens</CardDescription>
      </CardHeader>

      <CardContent>
        {!isConnected ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>Connect your wallet to manage MPTokens</AlertDescription>
          </Alert>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="create">Create</TabsTrigger>
                <TabsTrigger value="transfer">Transfer</TabsTrigger>
                <TabsTrigger value="authorize">Authorize</TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <MPTokenCreate />
              </TabsContent>

              <TabsContent value="transfer">
                <MPTokenTransfer />
              </TabsContent>

              <TabsContent value="authorize">
                <MPTokenAuthorize />
              </TabsContent>
            </Tabs>

            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                MPTokens require the MPTokensV1 amendment. Recipients must authorize the token
                using MPTokenAuthorize before receiving transfers.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}
