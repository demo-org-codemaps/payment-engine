import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './services';
import { JwtStrategy, ConsumerAuthStrategy, ServiceAuthStrategy } from './strategies';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secretKey'),
        signOptions: {},
      }),
    }),
    HttpModule,
  ],
  providers: [AuthService, JwtStrategy, ConsumerAuthStrategy, ServiceAuthStrategy],
  exports: [AuthService],
})
export class AuthModule {}
