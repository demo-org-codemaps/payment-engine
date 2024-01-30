export const CONSTANTS = {
  ERROR_MESSAGE_KEY_PREFIX: 'messages.',

  HEADERS: {
    X_REQUEST_ID: 'x-request-id',
    X_LANG: 'language',
  },

  API_VERSION: 'paymentorder/api/v1/',

  ENVIRONMENT: {
    PRODUCTION: 'production',
    DEVELOPMENT: 'development',
    TEST: 'test',
  },

  IDEMP_KEY: 'Idempotency-Key',
  CONSUMER_AUTH: 'CONSUMER_AUTH',
  SERVICE_AUTH: 'SERVICE_AUTH',

  CURRENCIES: {
    PKR: {
      CURRENCY: 'PKR',
      COUNTRY: 'PAKISTAN',
      LOWEST_DENOMINATION: 100,
      PRECISION: 2,
      LABEL: 'PAISA',
      COUNTRY_CODE: 'PK',
    },
    SAR: {
      CURRENCY: 'SAR',
      COUNTRY: 'SAUDI ARABIA',
      LOWEST_DENOMINATION: 100,
      PRECISION: 2,
      LABEL: 'HALALA',
      COUNTRY_CODE: 'SA',
    },
    AED: {
      CURRENCY: 'AED',
      COUNTRY: 'UNITED ARAB EMIRATES',
      LOWEST_DENOMINATION: 100,
      PRECISION: 2,
      LABEL: 'FILS',
      COUNTRY_CODE: 'AE',
    },
  },

  DEFAULTS: {
    APP_TYPE: 'ORDER PAYMENT SERVICE',
  },

  demo_ENDPOINTS: {
    BASE_URL: 'https://dev.demo.me',
    SIGN_IN: '/useridentity/sign-in',
    ORDER_URL: 'https://dev.demo.me/orders',
  },
};
