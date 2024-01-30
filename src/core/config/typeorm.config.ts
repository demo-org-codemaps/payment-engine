import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';

export default class TypeOrmConfig {
  static getOrmConfig(configService: ConfigService): TypeOrmModuleOptions {
    const isDevelopmentEnv = configService.get('env') === 'development';

    return {
      type: 'mysql',
      host: configService.get('database.host'),
      port: configService.get<number | undefined>('database.port'),
      database: configService.get('database.name'),
      username: configService.get('database.username'),
      password: configService.get('database.password'),
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
      // synchronize: isDevelopmentEnv, // TODO: Comment this prop asap
      logging: isDevelopmentEnv,
      supportBigNumbers: true,
      bigNumberStrings: false,
      // keepConnectionAlive: isDevelopmentEnv,
      // namingStrategy: new TypeOrmNamingStrategy(),

      // Timezone configured on the MySQL server. This is used to typecast server date/time values to JavaScript Date object and vice versa.
      timezone: 'Z',
      // debug: isDevelopmentEnv,
    };
  }
}

export const typeOrmConfigAsync: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> =>
    TypeOrmConfig.getOrmConfig(configService),
};
