<script setup lang="ts">
withDefaults(
  defineProps<{
    subtitle?: string
  }>(),
  {
    subtitle: 'A starter kit for building dApps on the XRP Ledger.',
  },
)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <Header />

    <main class="flex-1">
      <div class="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <section class="mb-10 max-w-3xl">
          <p class="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-xrpl">
            Build on the XRPL
          </p>
          <h1 class="text-4xl font-semibold tracking-tight md:text-5xl">Scaffold-XRP</h1>
          <p v-if="subtitle" class="mt-4 text-lg text-muted-foreground">
            {{ subtitle }}
          </p>
        </section>

        <div class="grid gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <slot />
        </div>

        <div v-if="$slots.experimental" class="mt-8">
          <slot name="experimental" />
        </div>
      </div>
    </main>

    <footer class="mt-16 border-t">
      <div
        class="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <span class="font-medium text-foreground">Scaffold-XRP</span>
        <nav aria-label="Footer" class="flex items-center gap-5">
          <a
            href="https://github.com/XRPL-Commons/scaffold-xrp#readme"
            target="_blank"
            rel="noreferrer"
            class="transition-colors hover:text-foreground"
          >
            Documentation
          </a>
          <a
            href="https://github.com/XRPL-Commons/scaffold-xrp"
            target="_blank"
            rel="noreferrer"
            class="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  </div>
</template>
