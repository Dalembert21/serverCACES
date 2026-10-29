import { Module } from '@nestjs/common';
import { PracticaController } from './practica.controller.js';
import { PracticaService } from './practica.service.js';

@Module({
  controllers: [PracticaController],
  providers: [PracticaService],
  exports: [PracticaService],
})
export class PracticaModule {}
