import { observable } from '@trpc/server/observable'
import { z } from 'zod'
import { t } from '../t'

// We never really user this observable, or the subscription callback this is all
// taken over by the AWS websocket message handler. However we do define this so that
// the client can have type-safe access to the subscription.
export const uptime = t.procedure.input(z.number()).subscription(() => {
  return observable<{ uptime: number }>(() => {})
})
