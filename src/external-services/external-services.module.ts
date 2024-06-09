import { Global, Module } from '@nestjs/common';
import { HsmGatewayModule } from './hsm-gateway/hsm-gateway.module';
import { AbstractionLayerModule } from './abstraction-layer/abstraction-layer.module';

@Global()
@Module({
  imports: [HsmGatewayModule, AbstractionLayerModule],
  exports: [HsmGatewayModule, AbstractionLayerModule],
})
export class ExternalServicesModule {}
