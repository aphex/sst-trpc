import { App } from '@serverless-stack/resources'
import { RemovalPolicy } from 'aws-cdk-lib'
import { DataStack } from './DataStack'
import { FrontendStack } from './FrontendStack'
import { tRPCStack } from './tRPCStack'

// 🥞
export default function (app: App) {
  if (app.stage !== 'prod') app.setDefaultRemovalPolicy(RemovalPolicy.DESTROY)

  app.setDefaultFunctionProps({
    runtime: 'nodejs16.x',
    srcPath: 'services',
    bundle: {
      format: 'esm',
    },
  })

  app.stack(DataStack).stack(tRPCStack).stack(FrontendStack)
}
