import { TRPCError } from '@trpc/server'
import { TRPC_ERROR_CODES_BY_KEY } from '@trpc/server/rpc'
import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda'
import { ApiGatewayManagementApi } from 'aws-sdk'
import { z } from 'zod'
import * as Subscription from '../../core/data/subscription'

/* -------------------------------------------------------------------------- */
/*                           Request Body Validators                          */
/* -------------------------------------------------------------------------- */
const SocketBodyValidator = z.object({
  id: z.number(),
  method: z.string(),
})

type SocketBody = z.infer<typeof SocketBodyValidator>

const SubscribeBodyValidator = SocketBodyValidator.merge(
  z.object({
    params: z.object({
      path: z.string(),
      input: z.any().optional(),
    }),
  })
)

type SubscribeBody = z.infer<typeof SubscribeBodyValidator>

/* -------------------------------------------------------------------------- */
/*                           Socket Message Handler                           */
/* -------------------------------------------------------------------------- */
export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const { connectionId } = event.requestContext
  if (!event.body || !connectionId) return { statusCode: 200, body: 'No Data' }

  // This is used to send messages back to websocket clients
  const { domainName, stage } = event.requestContext
  const apiG = new ApiGatewayManagementApi({
    endpoint: `${domainName}/${stage}`,
  })

  // POC for sending tRPC styled errors back to the client
  const sendError = async (error: TRPCError) => {
    await apiG
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify({
          id,
          error: {
            message: error.message,
            code: TRPC_ERROR_CODES_BY_KEY[error.code],
            data: {
              code: error.code,
              path: body?.params?.path,
              stack: error.stack,
              httpStatus: 401,
            },
          },
        }),
      })
      .promise()
  }

  const body = JSON.parse(event.body)

  // tRPC will send an empty array right after connecting as it calls `dispatch` when a socket connection
  // is opened. However if there are no queued messages it will still send a "batch send" of nothing
  // due to this if statement.
  // https://github.com/trpc/trpc/blob/next/packages/client/src/links/wsLink.ts#L81
  // its likely this else could be an `else if (outgoing.length)`
  if (Array.isArray(body) && body.length === 0) return { statusCode: 200, body: 'No Message' }

  // Validate the the body has an ID and method
  try {
    SocketBodyValidator.parse(body)
  } catch (e) {
    const message = `Invalid Body: ${(e as Error).message}`
    const error = new TRPCError({
      code: 'BAD_REQUEST',
      message,
    })
    sendError(error)
    return { statusCode: 200, body: message }
  }

  const { method, id } = body as SocketBody

  // Handle subscribe and unsubscribe requests
  switch (method) {
    case 'subscription': {
      // Validate the body has params with a path and input
      try {
        SubscribeBodyValidator.parse(body)
      } catch (e) {
        const message = `Invalid Subscription Body: ${(e as Error).message}`
        const error = new TRPCError({
          code: 'BAD_REQUEST',
          message,
        })
        sendError(error)

        return { statusCode: 200, body: message }
      }

      const {
        params: { path },
      } = body as SubscribeBody

      // Store the subscription in DynamoDB
      await Subscription.create(connectionId, id, path)

      // Reply with tRPC style subscription started message
      await apiG
        .postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify({ id, result: { type: 'started' } }),
        })
        .promise()

      return { statusCode: 200, body: 'subscribed' }
    }
    case 'subscription.stop': {
      // Delete the subscription from DynamoDB
      await Subscription.deleteSubscription(connectionId, id)

      // Reply with tRPC style subscription stopped message
      await apiG
        .postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify({ id, result: { type: 'stopped' } }),
        })
        .promise()

      return { statusCode: 200, body: 'stopped' }
    }
  }

  return { statusCode: 200, body: '' }
}
