/**
 * Declaration for midtrans-client (CommonJS) - default export for ESM interop
 */
declare module 'midtrans-client' {
  interface MidtransClientOptions {
    isProduction: boolean
    serverKey: string
    clientKey?: string
  }

  interface SnapInstance {
    createTransaction(parameter: object): Promise<{ token: string; redirect_url: string }>
  }

  const client: {
    Snap: new (options: MidtransClientOptions) => SnapInstance
  }
  export default client
}
