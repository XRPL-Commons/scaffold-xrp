<script setup lang="ts">
// Page meta
useHead({
  title: 'Scaffold-XRP - Build dApps on XRPL',
})
</script>

<template>
  <div class="min-h-screen">
    <Header />

    <main class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">Scaffold-XRP</h1>
        <p class="text-gray-600">
          A starter kit for building dApps on XRPL with smart contracts
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <AccountInfo />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ContractInteraction />
        <TransactionForm />
      </div>

      <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 class="text-xl font-bold mb-3">Getting Started</h2>
        <div class="space-y-2 text-sm">
          <p>1. Connect your wallet using the button in the header</p>
          <p>2. Deploy your smart contract using Bedrock or XRPL CLI</p>
          <p>3. Interact with deployed contracts using the contract interaction panel</p>
          <p>4. Send XRP transactions using the transaction form</p>
        </div>
      </div>
    </main>

    <footer class="border-t border-gray-200 mt-16">
      <div class="container mx-auto px-4 py-6 text-center text-gray-600">
        <p>Built with Scaffold-XRP</p>
      </div>
    </footer>
  </div>
</template>
