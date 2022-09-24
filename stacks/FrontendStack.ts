import { StackContext, use, ViteStaticSite } from '@serverless-stack/resources'
import { tRPCStack } from './tRPCStack'

// Simple Vite site, this is really just used to make quick work of getting the
// tRPC Url and the WS URL passed along as ENV variables so we don't have to keep
// copying and pasting them for different users.
export function FrontendStack({ stack }: StackContext) {
  const { tRPC_URL, WS_URL } = use(tRPCStack)

  const site = new ViteStaticSite(stack, 'frontend', {
    path: 'frontend',
    disablePlaceholder: true,
    environment: {
      VITE_TRPC_URL: tRPC_URL.value,
      VITE_WS_URL: WS_URL.value,
    },
  })

  stack.addOutputs({
    SiteUrl: site.url,
  })
}
