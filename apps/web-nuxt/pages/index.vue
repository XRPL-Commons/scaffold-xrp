<script setup lang="ts">
useHead({
  title: 'Scaffold-XRP - Build dApps on XRPL',
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <Header />

    <main class="flex-1">
      <div class="container py-6">
        <div class="mb-8">
          <h1 class="text-2xl font-semibold tracking-tight">Scaffold-XRP</h1>
          <p class="text-muted-foreground">
            Build dApps on XRPL with smart contracts
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AccountInfo />
          <ContractInteraction />
          <TransactionForm />
        </div>

        <div class="mt-8 rounded-lg border p-6">
          <h2 class="font-semibold mb-3">Getting Started</h2>
          <ol class="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Connect your wallet using the button in the header</li>
            <li>Deploy your smart contract using Bedrock or XRPL CLI</li>
            <li>Interact with deployed contracts using the contract panel</li>
            <li>Send XRP transactions using the transaction form</li>
          </ol>
        </div>
      </div>
    </main>

    <footer class="border-t py-6">
      <div class="container text-center text-sm text-muted-foreground">
        Built with Scaffold-XRP
      </div>
    </footer>
  </div>
</template>
