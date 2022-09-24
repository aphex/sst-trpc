import { CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda'
import { APIGatewayProxyEventV2 } from 'aws-lambda'

// Not able to do use APIGatewayProxyEventV2 | APIGatewayProxyWebsocketEventV2
// as CreateAWSLambdaContextOptions requires the generic to extend APIGatewayEvent
// which APIGatewayProxyWebsocketEventV2 does not extend 🤷
export const createContext = async ({ event }: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>) => {
  const headers = event.headers
  const cookies = event.cookies
  // const connectionId =
  //   `requestContext` in event && `connectionId` in event.requestContext ? event.requestContext.connectionId : undefined

  return { headers, cookies }
}

export type Context = Awaited<ReturnType<typeof createContext>>
