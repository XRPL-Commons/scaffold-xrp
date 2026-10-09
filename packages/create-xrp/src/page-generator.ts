import type { Primitive } from './types.js';

const PRIMITIVE_COMPONENTS: Record<Primitive, string> = {
  contract: 'ContractInteraction',
  vault: 'VaultInteraction',
  escrow: 'EscrowInteraction',
};

function experimentalSubtitle(primitives: Primitive[]): string {
  const names: Record<Primitive, string> = {
    contract: 'smart contracts',
    vault: 'smart vaults',
    escrow: 'smart escrows',
  };
  return `Explore experimental ${primitives.map((primitive) => names[primitive]).join(', ')} on a compatible ledger.`;
}

export function generateNextJsPage(primitives: Primitive[]): string {
  const imports = [
    'import { AppShell } from "../components/AppShell";',
    'import { AccountInfo } from "../components/AccountInfo";',
    'import { TransactionForm } from "../components/TransactionForm";',
    ...primitives.map((primitive) => {
      const component = PRIMITIVE_COMPONENTS[primitive];
      return `import { ${component} } from "../components/${component}";`;
    }),
  ];
  const shellProps =
    primitives.length > 0
      ? `
      subtitle=${JSON.stringify(experimentalSubtitle(primitives))}
      experimental={
        <>
${primitives.map((primitive) => `          <${PRIMITIVE_COMPONENTS[primitive]} />`).join('\n')}
        </>
      }
    `
      : '';

  return `${imports.join('\n')}

export default function Home() {
  return (
    <AppShell${shellProps}>
      <AccountInfo />
      <TransactionForm />
    </AppShell>
  );
}
`;
}

export function generateNuxtPage(primitives: Primitive[]): string {
  const shellProps = primitives.length > 0 ? ` subtitle="${experimentalSubtitle(primitives)}"` : '';
  const experimental =
    primitives.length > 0
      ? `
    <template #experimental>
${primitives.map((primitive) => `      <${PRIMITIVE_COMPONENTS[primitive]} />`).join('\n')}
    </template>`
      : '';

  return `<script setup lang="ts">
useHead({
  title: 'Scaffold-XRP - Build on the XRP Ledger',
})
</script>

<template>
  <AppShell${shellProps}>
    <AccountInfo />
    <TransactionForm />${experimental}
  </AppShell>
</template>
`;
}
