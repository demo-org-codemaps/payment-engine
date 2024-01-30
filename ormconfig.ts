import * as dotenv from 'dotenv';

dotenv.config();

module.exports = {
  type: 'mysql',
  host: process.env.ORDER_PAYMENT_ENGINE_DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.ORDER_PAYMENT_ENGINE_DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
};
