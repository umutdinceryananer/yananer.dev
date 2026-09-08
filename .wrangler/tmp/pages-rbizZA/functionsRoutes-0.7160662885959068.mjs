import { onRequest as __api_collect_ts_onRequest } from "/home/umut/Projects/yananer.dev/functions/api/collect.ts"

export const routes = [
    {
      routePath: "/api/collect",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_collect_ts_onRequest],
    },
  ]