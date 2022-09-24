import { Config, StackContext, Table } from '@serverless-stack/resources'

// Data stack has one table that is used to store client subscriptions to various
// tRPC topics. This allows us to send messages to the right clients
export function DataStack({ stack }: StackContext) {
  const table = new Table(stack, 'table', {
    fields: {
      PK: 'string',
      SK: 'string',
      GSI1PK: 'string',
      GSI1SK: 'string',
    },
    primaryIndex: { partitionKey: 'PK', sortKey: 'SK' },
    globalIndexes: {
      GSI1: { partitionKey: 'GSI1PK', sortKey: 'GSI1SK' },
    },
  })

  const TABLE_NAME = new Config.Parameter(stack, 'TABLE_NAME', {
    value: table.tableName,
  })

  stack.addOutputs({
    TableName: table.tableName,
  })

  return { table, TABLE_NAME }
}
