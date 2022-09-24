import { Config } from '@serverless-stack/node/config'
import type { AnyProcedure, AnyRouter, inferProcedureOutput, ProcedureType } from '@trpc/server'
import type { Observable } from '@trpc/server/observable'
import { ApiGatewayManagementApi, AWSError } from 'aws-sdk'
import { deleteSubscription, getByTopic } from '../core/data/subscription'
import type { Router } from '../functions/api/trpc/'

// Convert a Router and procedure type to a union of all procedure
// names in single string dot notation
export type inferProcedureNames<
  R extends AnyRouter,
  T extends ProcedureType,
  P extends R['_def']['procedures'] = R['_def']['procedures'],
  K extends keyof P = keyof P
> = K extends string
  ? P[K] extends AnyProcedure
    ? P[K]['_type'] extends T
      ? K
      : never
    : P[K] extends AnyRouter
    ? `${K}.${inferProcedureNames<P[K], T>}`
    : never
  : never

// Convert a single string dot notation procedure name to the procedure value
export type inferProcedureValue<
  T extends AnyRouter,
  P extends inferProcedureNames<T, ProcedureType>
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? T[K] extends AnyRouter
      ? Rest extends inferProcedureNames<T, ProcedureType>
        ? inferProcedureValue<T[K], Rest>
        : never
      : never
    : never
  : P extends keyof T
  ? T[P] extends AnyProcedure
    ? T[P]
    : never
  : never

// Pull the WS URL from the AWS config
const WS_URL = Config.WS_URL
const apiG = new ApiGatewayManagementApi({
  endpoint: WS_URL.replace('wss://', 'https://'),
})

// Create an emit function given for the applications main Router
// this will force topic and data to be typed properly when any tRPC procedures
// want to emit a message
export const getEmitter = () => {
  return async <
    T extends inferProcedureNames<Router, 'subscription'>,
    Y extends inferProcedureOutput<inferProcedureValue<Router, T>> = inferProcedureOutput<
      inferProcedureValue<Router, T>
    >,
    Z extends [any, any] = Y extends Observable<infer O, infer E> ? [O, E] : [never, never]
  >(
    topic: T,
    data: Z[0]
  ) => {
    // Get all the connections that are subscribed to this topic
    const subscriptions = await getByTopic(topic)

    // Send the message to a connection
    const post = async function ({ id, connectionId }: typeof subscriptions[number]) {
      try {
        // tRPC formatted subscription "next" message
        const Data = {
          id,
          result: { type: 'data', data },
        }

        // Send the message to the given client
        await apiG
          .postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(Data),
          })
          .promise()
      } catch (e) {
        if ((e as AWSError).statusCode === 410) {
          await deleteSubscription(connectionId, id)
        }
      }
    }

    // Send the message to all the connections
    await Promise.all(subscriptions.map(post))
  }
}
