<script setup lang="ts">
useHead({
  title: 'Scaffold-XRP - Build on the XRP Ledger',
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <Header />

    <main class="flex-1">
      <div class="container py-8 md:py-12">
        <section class="mb-8 max-w-2xl">
          <p class="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-xrpl">
            XRP Ledger starter
          </p>
          <h1 class="text-3xl font-semibold tracking-tight md:text-4xl">Ship your XRPL dApp</h1>
          <p class="mt-3 text-muted-foreground">
            Connect a wallet, inspect the active account, and send XRP on Testnet or Devnet.
            Smart contract modules stay opt-in through the CLI when you need them.
          </p>
        </section>

        <div class="grid gap-6 md:grid-cols-2">
          <AccountInfo />
          <TransactionForm />
        </div>

        <section class="mt-8 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 class="mb-3 font-semibold">Getting started</h2>
          <ol class="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>Choose Testnet or Devnet and connect Xaman, GemWallet, or WalletConnect.</li>
            <li>View your connected account details in the account panel.</li>
            <li>Send XRP with an optional destination tag from the payment panel.</li>
          </ol>
        </section>
      </div>
    </main>

    <footer class="border-t py-6">
      <div class="container text-center text-sm text-muted-foreground">Built with Scaffold-XRP</div>
    </footer>
  </div>
</template>
