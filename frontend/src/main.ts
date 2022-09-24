import { createTRPCProxyClient, createWSClient, httpLink, splitLink, wsLink } from '@trpc/client'
import type { Router } from '../../services/functions/api/trpc/'
const { VITE_TRPC_URL, VITE_WS_URL } = import.meta.env
const uptimeEl = document.querySelector<HTMLDivElement>('#uptime')
const userEl = document.querySelector<HTMLDivElement>('#user')
const getUserEl = document.querySelector<HTMLDivElement>('#getUser')
const dispatchEl = document.querySelector<HTMLDivElement>('#dispatch')
const subscribeEl = document.querySelector<HTMLDivElement>('#subscribe')
const unsubscribeEl = document.querySelector<HTMLDivElement>('#unsubscribe')

const client = createTRPCProxyClient<Router>({
  links: [
    splitLink({
      condition(op) {
        return op.type === 'subscription'
      },
      true: wsLink({
        client: createWSClient({
          url: VITE_WS_URL,
          onClose() {
            console.log('Socket Connection Closed')
          },
          onOpen() {
            console.log('Socket Connection Opened')
          },
        }),
      }),
      false: httpLink({ url: VITE_TRPC_URL }),
    }),
  ],
})

let uptime = 0
let user = {}
const render = () => {
  uptimeEl && (uptimeEl.innerHTML = `<p>${uptime}</p>`)
  userEl && (userEl.innerHTML = `<pre>${JSON.stringify(user, null, 2)}</pre>`)
}

getUserEl?.addEventListener('click', async () => {
  user = await client.getUser.query({ id: 1 })
  render()
})

dispatchEl?.addEventListener('click', async () => {
  await client.dispatch.mutate()
})

let subscription: { unsubscribe: () => void } | undefined
subscribeEl?.addEventListener('click', async () => {
  subscription = client.uptime.subscribe(0, {
    onData(data) {
      uptime = data.uptime
      render()
    },
  })
})

unsubscribeEl?.addEventListener('click', async () => {
  if (subscription) {
    subscription.unsubscribe()
    subscription = undefined
  }
})

render()
