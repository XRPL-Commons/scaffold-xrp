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
        <section class="mb-10 max-w-2xl">
          <p class="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Build on the XRPL
          </p>
          <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">Scaffold-XRP</h1>
          <p v-if="subtitle" class="mt-4 text-lg leading-relaxed text-muted-foreground">
            {{ subtitle }}
          </p>
        </section>

        <div class="grid gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <slot />
        </div>

        <div v-if="$slots.experimental" class="mt-6 grid gap-6 md:grid-cols-2">
          <slot name="experimental" />
        </div>
      </div>
    </main>

    <footer class="mx-auto mt-12 w-full max-w-6xl px-4 sm:px-6">
      <div
        class="flex flex-wrap items-center justify-between gap-4 border-t py-6 text-xs text-muted-foreground"
      >
        <span>Scaffold-XRP</span>
        <nav aria-label="Resources" class="flex items-center gap-5">
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
