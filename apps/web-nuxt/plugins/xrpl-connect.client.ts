import { createXrplConnect } from '@xrpl-commons/xrpl-connect-vue'
import {
  GemWalletAdapter,
  WalletConnectAdapter,
  XamanAdapter,
} from 'xrpl-connect'
import { getInitialNetworkId } from '~/lib/networks'

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig()
  const publicConfig = runtimeConfig.public
  const xamanApiKey = String(publicConfig.xamanApiKey || '').trim()
  const walletConnectProjectId = String(publicConfig.walletConnectProjectId || '').trim()
  const network = getInitialNetworkId(publicConfig.defaultNetwork)

  nuxtApp.vueApp.use(
    createXrplConnect({
      adapters: [
        new XamanAdapter(xamanApiKey ? { apiKey: xamanApiKey } : undefined),
        new GemWalletAdapter(),
        new WalletConnectAdapter(
          walletConnectProjectId ? { projectId: walletConnectProjectId } : undefined,
        ),
      ],
      network,
      autoConnect: true,
      logger: { level: 'warn' },
    }),
  )
})
