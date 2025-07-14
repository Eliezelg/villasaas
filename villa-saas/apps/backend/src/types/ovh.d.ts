declare module 'ovh' {
  interface OvhOptions {
    endpoint: string;
    appKey: string;
    appSecret: string;
    consumerKey?: string;
  }

  interface OvhClient {
    request(method: string, path: string, params?: any): Promise<any>;
  }

  function ovh(options: OvhOptions): OvhClient;
  
  export = ovh;
}