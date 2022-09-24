import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda'
import { createContext } from './context'
import { dispatch } from './procedures/dispatch'
import { getUser } from './procedures/getUser'
import { uptime } from './subscriptions/uptime'
import { t } from './t'

export const router = t.router({
  getUser,
  dispatch,
  uptime,
})
export type Router = typeof router

export const handler = awsLambdaRequestHandler({
  router,
  createContext,
})
