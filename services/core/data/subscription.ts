import { Config } from '@serverless-stack/node/config'
import { DynamoDB } from 'aws-sdk'
import { Entity } from 'electrodb'
const TABLE_NAME = Config.TABLE_NAME
const dynamoDb = new DynamoDB.DocumentClient()

const SubscriptionEntity = new Entity(
  {
    model: {
      entity: 'subscription',
      version: '1',
      service: 'events',
    },
    attributes: {
      connectionId: {
        type: 'string',
        required: true,
      },
      id: {
        type: 'number',
        required: true,
      },
      topic: {
        type: 'string',
        required: true,
      },
    },
    indexes: {
      subscriptions: {
        pk: {
          field: 'PK',
          composite: ['connectionId'],
        },
        sk: {
          field: 'SK',
          composite: ['id'],
        },
      },
      topics: {
        index: 'GSI1',
        pk: {
          field: 'GSI1PK',
          composite: ['topic'],
        },
        sk: {
          field: 'GSI1SK',
          composite: [],
        },
      },
    },
  },
  {
    table: TABLE_NAME,
    client: dynamoDb,
  }
)

export const create = async (connectionId: string, id: number, topic: string) => {
  return SubscriptionEntity.create({
    connectionId,
    id,
    topic,
  }).go()
}

export const getByTopic = async (topic: string) => {
  const entities = await SubscriptionEntity.query
    .topics({
      topic,
    })
    .go()

  return entities.data
}

export const deleteByConnectionID = async (connectionId: string) => {
  const entities = await SubscriptionEntity.query
    .subscriptions({
      connectionId,
    })
    .go()

  return Promise.all(entities.data.map((entity) => deleteSubscription(entity.connectionId, entity.id)))
}

export const deleteSubscription = async (connectionId: string, id: number) => {
  return SubscriptionEntity.delete({
    connectionId,
    id,
  }).go()
}
