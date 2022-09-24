import { getEmitter } from '../../../../core/emitter'
import { t } from '../t'

// Simple procedure that just emits an event to the websocket
const start = Date.now()
export const dispatch = t.procedure.mutation(() => {
  const emit = getEmitter()
  const now = Date.now()

  // Note that this is typed. you can only emit a `uptime` event
  // with the type uptime payload
  emit('uptime', { uptime: now - start })
})
