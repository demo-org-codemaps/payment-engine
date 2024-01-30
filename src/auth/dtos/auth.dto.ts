import { IsJWT, IsNotEmpty } from 'class-validator';

export class AuthDto {
  @IsNotEmpty()
  @IsJWT()
  authToken: string;
}
