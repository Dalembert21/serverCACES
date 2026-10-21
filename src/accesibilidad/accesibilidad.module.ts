import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module.js';
import { AccesibilidadController } from './accesibilidad.controller.js';
import { AccesibilidadService } from './accesibilidad.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [AccesibilidadController],
  providers: [AccesibilidadService],
  exports: [AccesibilidadService],
})
export class AccesibilidadModule {}
