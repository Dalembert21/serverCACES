import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { obtenerDatosSeguridad } from './datos-seguridad.js';
import { obtenerDatosComerciales } from './datos-comerciales.js';
import { obtenerDatosAcademicos } from './datos-academicos.js';
import { obtenerDatosPreguntas } from './datos-preguntas.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL no está definida para ejecutar el seed');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando Seed Idempotente para CACES SaaS (Modelo Enterprise)...');

  // 1. Roles y Usuarios
  const { roles, usuarios } = await obtenerDatosSeguridad();
  console.log('1. Sembrando roles...');
  for (const rol of roles) {
    await prisma.rol.upsert({
      where: { nombre: rol.nombre },
      update: { descripcion: rol.descripcion },
      create: {
        id: rol.nombre,
        nombre: rol.nombre,
        descripcion: rol.descripcion,
      },
    });
  }

  // 2. Planes Comerciales
  console.log('2. Sembrando planes comerciales...');
  const { planes } = obtenerDatosComerciales();
  for (const plan of planes) {
    await prisma.planSuscripcion.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }

  console.log('3. Sembrando usuarios del sistema...');
  const usuariosCreados: Record<string, string> = {};
  for (const usr of usuarios) {
    const rolDb = await prisma.rol.findUniqueOrThrow({
      where: { nombre: usr.rol },
    });

    const usuarioDb = await prisma.usuario.upsert({
      where: { correo: usr.correo },
      update: {
        nombreCompleto: usr.nombreCompleto,
        contrasenaHash: usr.contrasenaHash,
      },
      create: {
        correo: usr.correo,
        nombreCompleto: usr.nombreCompleto,
        contrasenaHash: usr.contrasenaHash,
        correoVerificado: usr.correoVerificado,
      },
    });

    usuariosCreados[usr.correo] = usuarioDb.id;

    await prisma.usuarioRol.upsert({
      where: {
        usuarioId_rolId: {
          usuarioId: usuarioDb.id,
          rolId: rolDb.id,
        },
      },
      update: {},
      create: {
        usuarioId: usuarioDb.id,
        rolId: rolDb.id,
      },
    });

    // Suscripción base para estudiantes demo
    if (usr.rol === 'ESTUDIANTE') {
      const expiraEn = new Date();
      expiraEn.setDate(expiraEn.getDate() + 365);

      const subExistente = await prisma.suscripcionUsuario.findFirst({
        where: { usuarioId: usuarioDb.id },
      });

      if (!subExistente) {
        await prisma.suscripcionUsuario.create({
          data: {
            usuarioId: usuarioDb.id,
            planId: 'PLAN_GRATUITO_BASE',
            estado: 'ACTIVA',
            iniciaEn: new Date(),
            expiraEn,
            preguntasGratisConsumidas: 0,
            simuladoresGratisConsumidos: 0,
          },
        });
      }
    }
  }

  // 3. Catálogo Académico (Programas, Temarios, Competencias)
  console.log('4. Sembrando catálogo académico oficial CACES...');
  const { programas } = obtenerDatosAcademicos();

  const subareasMap: Record<string, string> = {};

  for (const prog of programas) {
    const programaDb = await prisma.programaAcademico.upsert({
      where: { id: prog.codigo },
      update: {
        nombre: prog.nombre,
        descripcion: prog.descripcion,
        codigoOficialCaces: `CACES-${prog.codigo}`,
      },
      create: {
        id: prog.codigo,
        codigoOficialCaces: `CACES-${prog.codigo}`,
        nombre: prog.nombre,
        descripcion: prog.descripcion,
      },
    });

    // Versión Temario Oficial 2026.1
    const temarioVersion = await prisma.temarioVersion.upsert({
      where: {
        programaAcademicoId_codigoVersion: {
          programaAcademicoId: programaDb.id,
          codigoVersion: '2026.1',
        },
      },
      update: {},
      create: {
        programaAcademicoId: programaDb.id,
        codigoVersion: '2026.1',
        fechaInicioVigencia: new Date('2026-01-01'),
        fechaFinVigencia: new Date('2026-12-31'),
      },
    });

    // Áreas y Subáreas de Competencia CACES
    for (const area of prog.areas) {
      let areaDb = await prisma.areaAcademica.findFirst({
        where: {
          temarioVersionId: temarioVersion.id,
          nombre: area.nombre,
        },
      });

      if (!areaDb) {
        areaDb = await prisma.areaAcademica.create({
          data: {
            temarioVersionId: temarioVersion.id,
            nombre: area.nombre,
            pesoPorcentual: Math.round(100 / (prog.areas.length || 1)),
          },
        });
      }

      for (const comp of area.competencias) {
        const subareaDb = await prisma.subareaCompetencia.upsert({
          where: {
            areaAcademicaId_codigoOficial: {
              areaAcademicaId: areaDb.id,
              codigoOficial: comp.codigo,
            },
          },
          update: {
            nombre: comp.descripcion.slice(0, 100),
            descripcion: comp.descripcion,
          },
          create: {
            areaAcademicaId: areaDb.id,
            codigoOficial: comp.codigo,
            nombre: comp.descripcion.slice(0, 100),
            descripcion: comp.descripcion,
          },
        });

        // Mapear temas hacia subáreas
        for (const tema of comp.temas) {
          subareasMap[tema.nombre] = subareaDb.id;
        }
      }
    }

    // Configuraciones de Simuladores Oficiales
    for (const sim of prog.simuladores) {
      const simExistente = await prisma.configuracionSimulador.findFirst({
        where: {
          programaAcademicoId: programaDb.id,
          titulo: sim.titulo,
        },
      });

      if (!simExistente) {
        await prisma.configuracionSimulador.create({
          data: {
            programaAcademicoId: programaDb.id,
            titulo: sim.titulo,
            modalidad:
              sim.totalPreguntas >= 100 ? 'SIMULACRO_OFICIAL' : 'DIAGNOSTICO',
            duracionMinutos: sim.duracionMinutos,
            totalPreguntas: sim.totalPreguntas,
            notaMinimaAprobacion: 70.0,
          },
        });
      }
    }
  }

  // 4. Preguntas Clínicas con Versionado Inmutable
  console.log('5. Sembrando banco de preguntas clínicas con versionado...');
  const { preguntasMedicina, preguntasOdontologia, preguntasEnfermeria } =
    obtenerDatosPreguntas();
  const todasLasPreguntas = [
    ...preguntasMedicina,
    ...preguntasOdontologia,
    ...preguntasEnfermeria,
  ];

  const adminId = usuariosCreados['admin@caces-prep.ec'];
  const revisorId = usuariosCreados['revisor.academico@caces-prep.ec'];

  for (const item of todasLasPreguntas) {
    const subareaCompetenciaId = subareasMap[item.temaNombre];
    if (!subareaCompetenciaId) {
      console.warn(
        `Subárea no encontrada para tema de pregunta ${item.codigoPublico}: ${item.temaNombre}`,
      );
      continue;
    }

    const preguntaDb = await prisma.pregunta.upsert({
      where: { codigoPublico: item.codigoPublico },
      update: { subareaCompetenciaId },
      create: {
        codigoPublico: item.codigoPublico,
        subareaCompetenciaId,
        creadorId: adminId,
      },
    });

    const versionDb = await prisma.preguntaVersion.upsert({
      where: {
        preguntaId_numeroVersion: {
          preguntaId: preguntaDb.id,
          numeroVersion: 1,
        },
      },
      update: {
        enunciado: item.enunciado,
        explicacionPedagogica: item.explicacionPedagogica,
        dificultad: item.dificultad,
        estado: item.estado,
        revisorId,
        fechaRevision: new Date(),
      },
      create: {
        preguntaId: preguntaDb.id,
        numeroVersion: 1,
        enunciado: item.enunciado,
        explicacionPedagogica: item.explicacionPedagogica,
        dificultad: item.dificultad,
        estado: item.estado,
        revisorId,
        fechaRevision: new Date(),
      },
    });

    // Referencia bibliográfica
    const refExistente = await prisma.preguntaReferencia.findFirst({
      where: { preguntaVersionId: versionDb.id },
    });

    if (!refExistente) {
      await prisma.preguntaReferencia.create({
        data: {
          preguntaVersionId: versionDb.id,
          fuenteOficial: item.referencia.fuente,
          tituloPublicacion: item.referencia.referenciaBibliografica,
          anioPublicacion: item.referencia.anio,
        },
      });
    }

    // Opciones de respuesta
    const letras = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < item.opciones.length; i++) {
      const opc = item.opciones[i];
      const letra = letras[i] || 'A';

      await prisma.preguntaOpcion.upsert({
        where: {
          preguntaVersionId_letra: {
            preguntaVersionId: versionDb.id,
            letra,
          },
        },
        update: {
          texto: opc.texto,
          esCorrecta: opc.esCorrecta,
          justificacion: opc.retroalimentacionEspecifica,
        },
        create: {
          preguntaVersionId: versionDb.id,
          letra,
          texto: opc.texto,
          esCorrecta: opc.esCorrecta,
          justificacion: opc.retroalimentacionEspecifica,
        },
      });
    }
  }

  console.log('✅ Seed completado con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
