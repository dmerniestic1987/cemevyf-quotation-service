import { Global, Module } from '@nestjs/common';
import { CemevyfMessageServiceModule } from './cemevyf-message-service/cemevyf-message-service.module';

@Global()
@Module({
  imports: [CemevyfMessageServiceModule],
  exports: [CemevyfMessageServiceModule],
})
export class ExternalServicesModule {}
