import { ConfigService } from '@nestjs/config';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

export const grpcConfig = (configService: ConfigService, packageFile: string): GrpcOptions => {
  const host = configService.get(`${packageFile}Grpc.host`);
  const port = configService.get(`${packageFile}Grpc.port`);
  return {
    transport: Transport.GRPC,
    options: {
      package: packageFile, // ['hero', 'hero2']
      url: `${host}:${port}`,
      protoPath: join(__dirname, `../../../protos/${packageFile}.proto`), // ['./hero/hero.proto', './hero/hero2.proto']
      loader: {
        longs: String,
        enums: String,
        keepCase: true,
        defaults: true,
        oneofs: true,
      },
    },
  };
};
