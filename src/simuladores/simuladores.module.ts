import { Module } from '@nestjs/common';
import { SimuladoresController } from './simuladores.controller.js';
import { SimuladoresService } from './simuladores.service.js';

@Module({
  controllers: [SimuladoresController],
  providers: [SimuladoresService],
  exports: [SimuladoresService],
})
export class SimuladoresModule {}
