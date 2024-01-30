export default (): any => ({
  env: process.env.APP,
  port: process.env.ORDER_PAYMENT_ENGINE_APP_PORT,
  defaultLanguage: process.env.DEFAULT_LANGUAGE,
  corsWhitelist: process.env.CORS_WHITELIST,

  database: {
    host: process.env.ORDER_PAYMENT_ENGINE_DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    name: process.env.ORDER_PAYMENT_ENGINE_DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },

  endpoints: {
    payment: process.env.PAYMENT_ENDPOINT,
    wallet: process.env.WALLET_ENDPOINT,
    cart: process.env.CART_ENDPOINT,
  },

  paymentEndpoint: process.env.PAYMENT_ENDPOINT,
  paymentGrpc: {
    host: process.env.PAYMENT_GRPC_SERVER_HOST,
    port: process.env.PAYMENT_GRPC_SERVER_PORT,
  },

  transactionGrpc: {
    host: '0.0.0.0',
    port: process.env.ORDER_PAYMENT_ENGINE_GRPC_SERVER_PORT,
  },

  walletEndpoint: process.env.WALLET_ENDPOINT,
  walletGrpc: {
    host: process.env.WALLET_GRPC_SERVER_HOST,
    port: process.env.WALLET_GRPC_SERVER_PORT,
  },

  jwt: {
    secretKey: process.env.JWT_SECRET_KEY,
    accessTokenExpiresInSec: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRY_IN_SEC, 10),
  },

  knexaEndpoint: process.env.KNEXA_ENDPOINT,
  knexaClientId: process.env.KNEXA_CLIENT_ID,
});
