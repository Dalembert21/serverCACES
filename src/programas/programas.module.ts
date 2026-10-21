import { Module } from '@nestjs/common';
import { ProgramasController } from './programas.controller.js';
import { ProgramasService } from './programas.service.js';

@Module({
  controllers: [ProgramasController],
  providers: [ProgramasService],
  exports: [ProgramasService],
})
export class ProgramasModule {}
