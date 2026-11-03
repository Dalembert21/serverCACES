import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service.js';

@ApiTags('Monitoreo y Salud del Sistema')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @SkipThrottle()
  @Get('health')
  @ApiOperation({
    summary: 'Monitoreo de disponibilidad del backend (Keep-Alive)',
    description:
      'Endpoint ultraligero sin sobrecarga de base de datos para mantener activa la instancia de Render y verificar salud del sistema.',
  })
  @ApiResponse({
    status: 200,
    description: 'Servicio en línea y operativo.',
  })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      servicio: 'SaaS CACES API',
    };
  }

  @SkipThrottle()
  @Get('ping')
  ping() {
    return { status: 'pong', timestamp: new Date().toISOString() };
  }
}
