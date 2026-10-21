import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  entorno: process.env.NODE_ENV || 'development',
  puerto: parseInt(process.env.PORT || '3000', 10),
  prefijoApi: process.env.API_PREFIX || 'api/v1',
  corsOrigen: process.env.CORS_ORIGIN || 'http://localhost:4200',
  rateLimit: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limite: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
  pruebaGratuita: {
    maxPreguntas: parseInt(process.env.TRIAL_MAX_PREGUNTAS || '30', 10),
    maxSimuladores: parseInt(process.env.TRIAL_MAX_SIMULADORES || '1', 10),
  },
}));
