/**
 * Dynamic page generation based on selected primitives.
 * Replaces the old file-variant approach (page.js vs page-without-sc.js).
 */

import type { Primitive } from './types.js';

const PRIMITIVE_COMPONENTS: Record<Primitive, string> = {
  contract: 'ContractInteraction',
  vault: 'VaultInteraction',
  escrow: 'EscrowInteraction',
};

function buildGettingStartedSteps(primitives: Primitive[]): string[] {
  const steps = ['Connect your wallet using the button in the header'];

  if (primitives.length === 0) {
    steps.push('View your account details in the account info panel');
    steps.push('Send XRP transactions using the transaction form');
    return steps;
  }

  if (primitives.includes('contract')) {
    steps.push('Deploy your smart contract using Bedrock CLI');
    steps.push('Interact with deployed contracts using the contract panel');
  }
  if (primitives.includes('vault')) {
    steps.push('Deploy a smart vault and manage deposits/withdrawals');
  }
  if (primitives.includes('escrow')) {
    steps.push('Create smart escrows with programmable release conditions');
  }
  steps.push('Send XRP transactions using the transaction form');
  return steps;
}

function subtitle(primitives: Primitive[]): string {
  if (primitives.length === 0) {
    return 'A starter kit for building dApps on the XRP Ledger';
  }
  const names: Record<Primitive, string> = {
    contract: 'smart contracts',
    vault: 'smart vaults',
    escrow: 'smart escrows',
  };
  const parts = primitives.map((p) => names[p]);
  return `Build dApps on XRPL with ${parts.join(', ')}`;
}

// ---------------------------------------------------------------------------
// Next.js page generator
// ---------------------------------------------------------------------------

export function generateNextJsPage(primitives: Primitive[]): string {
  const imports = [
    'import { Header } from "../components/Header";',
    'import { AccountInfo } from "../components/AccountInfo";',
  ];

  const components: string[] = ['<AccountInfo />'];

  for (const p of primitives) {
    const comp = PRIMITIVE_COMPONENTS[p];
    imports.push(`import { ${comp} } from "../components/${comp}";`);
    components.push(`<${comp} />`);
  }

  imports.push('import { TransactionForm } from "../components/TransactionForm";');
  components.push('<TransactionForm />');

  if (primitives.includes('contract')) {
    imports.push('import { MPTokenCard } from "../components/MPTokenCard";');
    components.push('<MPTokenCard />');
  }

  const steps = buildGettingStartedSteps(primitives);
  const stepsJsx = steps
    .map((s) => `              <li>${s}</li>`)
    .join('\n');

  return `"use client";

${imports.join('\n')}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-6">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Scaffold-XRP</h1>
            <p className="text-muted-foreground">
              ${subtitle(primitives)}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            ${components.join('\n            ')}
          </div>

          <div className="mt-8 rounded-lg border p-6">
            <h2 className="font-semibold mb-3">Getting Started</h2>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
${stepsJsx}
            </ol>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          Built with Scaffold-XRP
        </div>
      </footer>
    </div>
  );
}
`;
}

// ---------------------------------------------------------------------------
// Nuxt page generator
// ---------------------------------------------------------------------------

export function generateNuxtPage(primitives: Primitive[]): string {
  // Nuxt auto-imports components, so no explicit imports needed
  const components: string[] = ['<AccountInfo />'];

  for (const p of primitives) {
    components.push(`<${PRIMITIVE_COMPONENTS[p]} />`);
  }

  components.push('<TransactionForm />');

  const steps = buildGettingStartedSteps(primitives);
  const stepsHtml = steps
    .map((s) => `            <li>${s}</li>`)
    .join('\n');

  return `<script setup lang="ts">
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
            ${subtitle(primitives)}
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          ${components.join('\n          ')}
        </div>

        <div class="mt-8 rounded-lg border p-6">
          <h2 class="font-semibold mb-3">Getting Started</h2>
          <ol class="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
${stepsHtml}
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
`;
}
