import { APIGatewayProxyHandler } from 'aws-lambda'
import { deleteByConnectionID } from '../../core/data/subscription'

export const handler: APIGatewayProxyHandler = async (event) => {
  const { connectionId } = event.requestContext

  if (connectionId) await deleteByConnectionID(connectionId)

  return { statusCode: 200, body: 'Disconnected' }
}
