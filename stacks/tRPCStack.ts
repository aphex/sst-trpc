import { Api, WebSocketApi, Config, StackContext, use } from '@serverless-stack/resources'
import { DataStack } from './DataStack'

// Main tRPC stack for the app where all HTTP + Websocket Requests will land
export function tRPCStack({ stack }: StackContext) {
  // Need access to the table to create, delete and query subscriptions
  const { table, TABLE_NAME } = use(DataStack)

  // Custom tRPC AWS Websocket Lambda handlers, attempts to recreate how tRPC
  // dispatches its own socket messages but keeps everything stateless (or dynamo only state that is)
  const ws = new WebSocketApi(stack, 'WsApi', {
    defaults: {
      function: {
        permissions: [table],
        config: [TABLE_NAME],
      },
    },
    accessLog: false,
    routes: {
      $disconnect: 'functions/api/disconnect.handler',
      $default: 'functions/api/message.handler',
    },
  })

  const WS_URL = new Config.Parameter(stack, 'WS_URL', {
    value: ws.url,
  })

  // The normal tRPC HTTP API we use this to get a couple quick test procedures. One just
  // gets a random users, the other will simulate a AWS dispatch. This could be hooked to
  // SNS, SQS, or a dynamo stream instead.
  const api = new Api(stack, 'api', {
    defaults: {
      function: {
        permissions: [table, ws],
        config: [TABLE_NAME, WS_URL],
      },
    },
    routes: {
      'GET /{proxy+}': 'functions/api/trpc/index.handler',
      'POST /{proxy+}': 'functions/api/trpc/index.handler',
    },
  })
  const tRPC_URL = new Config.Parameter(stack, 'tRPC_URL', {
    value: api.url,
  })

  stack.addOutputs({
    TrpcUrl: api.url,
    WsUrl: ws.url,
  })

  return { tRPC_URL, WS_URL }
}
