# SST + tRPC v10
A example of a AWS serverless application that uses both tRPC procedures and subscriptions in 
a stateless way. 

This repo is for reference, I don't think I would recommend pushing this into a production environment 
as it re-implements a lot of tRPC which could change and make this unstable...

but hey what do I know do whatever want 🤷

# Running 🏃
Make sure your AWS credentials are all setup https://docs.sst.dev/advanced/iam-credentials#loading-from-a-file 

[degit](https://www.npmjs.com/package/degit) or clone this repo.

```bash
npm i
```

Terminal 1
```bash
npm start
```

Terminal 2
```bash
cd frontend
npm run dev
```