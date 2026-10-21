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
  console.log('🌱 Iniciando Seed Idempotente para CACES SaaS...');

  // 1. Roles y Usuarios
  const { roles, usuarios } = await obtenerDatosSeguridad();
  console.log('1. Sembrando roles...');
  for (const rol of roles) {
    await prisma.rol.upsert({
      where: { nombre: rol.nombre },
      update: { descripcion: rol.descripcion },
      create: rol,
    });
  }

  console.log('2. Sembrando usuarios del sistema...');
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

    // Crear registro de prueba gratuita para cuentas de estudiantes demo
    if (usr.rol === 'ESTUDIANTE') {
      await prisma.pruebaGratuita.upsert({
        where: { usuarioId: usuarioDb.id },
        update: {},
        create: {
          usuarioId: usuarioDb.id,
          preguntasConsumidas: 0,
          simuladoresConsumidos: 0,
        },
      });
    }
  }

  // 2. Planes Comerciales
  console.log('3. Sembrando planes comerciales...');
  const { planes } = obtenerDatosComerciales();
  for (const plan of planes) {
    await prisma.planSuscripcion.upsert({
      where: { codigo: plan.codigo },
      update: plan,
      create: plan,
    });
  }

  // 3. Catálogo Académico (Examen, Programas, Temarios, Competencias, Temas)
  console.log('4. Sembrando catálogo académico (CACES Medicina, Odontología, Enfermería)...');
  const { examen, programas } = obtenerDatosAcademicos();
  const examenDb = await prisma.examen.upsert({
    where: { codigo: examen.codigo },
    update: { nombre: examen.nombre, pais: examen.pais },
    create: examen,
  });

  const temasMap: Record<string, string> = {};

  for (const prog of programas) {
    const programaDb = await prisma.programa.upsert({
      where: { codigo: prog.codigo },
      update: {
        nombre: prog.nombre,
        descripcion: prog.descripcion,
        examenId: examenDb.id,
      },
      create: {
        examenId: examenDb.id,
        codigo: prog.codigo,
        nombre: prog.nombre,
        descripcion: prog.descripcion,
      },
    });

    // Temario Versión 2026.1
    const temarioVersion = await prisma.temarioVersion.upsert({
      where: {
        programaId_codigoVersion: {
          programaId: programaDb.id,
          codigoVersion: '2026.1',
        },
      },
      update: {},
      create: {
        programaId: programaDb.id,
        codigoVersion: '2026.1',
        fechaVigencia: new Date('2026-12-31'),
      },
    });

    // Áreas y competencias
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
          },
        });
      }

      for (const comp of area.competencias) {
        const compDb = await prisma.competencia.upsert({
          where: {
            areaAcademicaId_codigo: {
              areaAcademicaId: areaDb.id,
              codigo: comp.codigo,
            },
          },
          update: { descripcion: comp.descripcion },
          create: {
            areaAcademicaId: areaDb.id,
            codigo: comp.codigo,
            descripcion: comp.descripcion,
          },
        });

        for (const tema of comp.temas) {
          let temaDb = await prisma.tema.findFirst({
            where: {
              competenciaId: compDb.id,
              nombre: tema.nombre,
            },
          });

          if (!temaDb) {
            temaDb = await prisma.tema.create({
              data: {
                competenciaId: compDb.id,
                nombre: tema.nombre,
              },
            });
          }

          temasMap[tema.nombre] = temaDb.id;

          for (const subtemaNombre of tema.subtemas) {
            const subtemaExistente = await prisma.subtema.findFirst({
              where: {
                temaId: temaDb.id,
                nombre: subtemaNombre,
              },
            });

            if (!subtemaExistente) {
              await prisma.subtema.create({
                data: {
                  temaId: temaDb.id,
                  nombre: subtemaNombre,
                },
              });
            }
          }
        }
      }
    }

    // Plantillas de Simuladores
    for (const sim of prog.simuladores) {
      const simExistente = await prisma.simuladorPlantilla.findFirst({
        where: {
          programaId: programaDb.id,
          titulo: sim.titulo,
        },
      });

      if (!simExistente) {
        await prisma.simuladorPlantilla.create({
          data: {
            programaId: programaDb.id,
            titulo: sim.titulo,
            descripcion: sim.descripcion,
            duracionMinutos: sim.duracionMinutos,
            totalPreguntas: sim.totalPreguntas,
          },
        });
      }
    }
  }

  // 4. Preguntas con Casos Clínicos, Opciones y Referencias
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
    const temaId = temasMap[item.temaNombre];
    if (!temaId) {
      console.warn(`Tema no encontrado para pregunta ${item.codigoPublico}: ${item.temaNombre}`);
      continue;
    }

    const preguntaDb = await prisma.pregunta.upsert({
      where: { codigoPublico: item.codigoPublico },
      update: { temaId },
      create: {
        codigoPublico: item.codigoPublico,
        temaId,
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
        tipo: item.tipo,
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
        tipo: item.tipo,
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
          fuente: item.referencia.fuente,
          autor: item.referencia.autor,
          anio: item.referencia.anio,
          referenciaBibliografica: item.referencia.referenciaBibliografica,
          tipoLicencia: item.referencia.tipoLicencia,
        },
      });
    }

    // Opciones de respuesta
    const opcionesCount = await prisma.preguntaOpcion.count({
      where: { preguntaVersionId: versionDb.id },
    });

    if (opcionesCount === 0) {
      for (const opc of item.opciones) {
        await prisma.preguntaOpcion.create({
          data: {
            preguntaVersionId: versionDb.id,
            texto: opc.texto,
            esCorrecta: opc.esCorrecta,
            orden: opc.orden,
            retroalimentacionEspecifica: opc.retroalimentacionEspecifica,
          },
        });
      }
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
