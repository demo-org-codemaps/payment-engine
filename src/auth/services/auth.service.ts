import { Injectable } from '@nestjs/common';
import { AuthDto } from '../dtos';
import { verifyServiceToken, verifyUserToken, createServiceToken } from '@demoorg/auth-library/dist';
import { IVerifyTokenResponse } from '@demoorg/auth-library/dist/interfaces';
import { LogDecorator } from '../../core';

@Injectable()
export class AuthService {
  @LogDecorator()
  async verifyAuthToken(dto: AuthDto) {
    try {
      const verifyUserTokenResponse: IVerifyTokenResponse = await verifyUserToken(dto.authToken);
      return verifyUserTokenResponse;
    } catch (error) {
      return false; // Don't fail it
    }
  }

  @LogDecorator()
  async verifyToken(dto: AuthDto): Promise<any> {
    try {
      const verifyTokenResponse: IVerifyTokenResponse = await verifyServiceToken(dto.authToken);
      return verifyTokenResponse;
    } catch (error) {
      return false; // Don't fail it
    }
  }

  @LogDecorator()
  async generateServiceToken(token: string): Promise<string> {
    try {
      const serviceToken = await createServiceToken(token);
      return serviceToken || '';
    } catch (error) {
      return ''; // Don't fail it
    }
  }
}
