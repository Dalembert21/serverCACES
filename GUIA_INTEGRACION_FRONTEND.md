# Guía Maestra de Integración Frontend (API CACES SaaS Enterprise)

Esta documentación técnica está redactada para que el equipo de frontend (Angular / Web) implemente de forma directa e inequívoca todos los módulos, roles y procesos CRUD expuestos por el backend.

---

## 1. Configuración Global de la API

* **URL Base de la API:** `http://localhost:3000/api/v1` (ajustable en `environment.ts`)
* **Documentación Interactiva Swagger:** `http://localhost:3000/api/v1/docs`
* **Cabeceras Generales Obligatorias:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <tokenAcceso>` (para todas las rutas protegidas)

### Formato de Respuestas Exitosas
Todas las respuestas siguen la envoltura estándar:
```json
{
  "exito": true,
  "datos": { ... },
  "mensaje": "Mensaje informativo opcional",
  "timestamp": "2026-10-25T16:30:00.000Z"
}
```

### Formato de Respuestas de Error
```json
{
  "exito": false,
  "codigoEstado": 400,
  "mensaje": "La cédula ecuatoriana debe contener exactamente 10 dígitos numéricos",
  "ruta": "/api/v1/admin/estudiantes/...",
  "timestamp": "2026-10-25T16:30:00.000Z"
}
```

---

## 2. Roles del Sistema y Enrutamiento en Frontend

Los roles oficiales devueltos en el login son:
* **`SUPERADMIN`**: Acceso total al panel de administración.
* **`TESORERIA`**: Acceso al panel de recaudación, validación de pagos y auditoría de estudiantes.
* **`ESTUDIANTE`**: Acceso a simuladores, práctica guiada, accesibilidad y suscripciones.

### Enrutamiento recomendado post-login:
* Si `roles.includes('SUPERADMIN')` $\rightarrow$ Redirigir a `/admin/dashboard`
* Si `roles.includes('TESORERIA')` $\rightarrow$ Redirigir a `/admin/pagos`
* Si `roles.includes('ESTUDIANTE')` $\rightarrow$ Redirigir a `/estudiante/simuladores`

---

## 3. Módulo de Autenticación (`/auth`)

### 3.1. Iniciar Sesión (Todos los Roles)
* **Endpoint:** `POST /auth/login` o `POST /auth/iniciar-sesion`
* **Acceso:** Público
* **Cuerpo de la Petición:**
```json
{
  "identificador": "dalembertbravo2@gmail.com",
  "password": "TuPasswordSeguro123!"
}
```
* **Respuesta Exitosa (`200 OK`):**
```json
{
  "usuario": {
    "id": "uuid-usuario",
    "cedula": "0912345678",
    "nombre": "Dalembert",
    "apellido": "Bravo",
    "nombreCompleto": "Dalembert Bravo",
    "correo": "dalembertbravo2@gmail.com",
    "rol": "administrador_academico",
    "roles": ["SUPERADMIN"],
    "programaActivoId": "prog-medicina",
    "fechaRegistro": "2026-10-25T..."
  },
  "tokens": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  },
  "tokenAcceso": "eyJhbGciOi...",
  "tokenRefresco": "eyJhbGciOi..."
}
```

### 3.2. Registro de Nuevo Estudiante
* **Endpoint:** `POST /auth/registro`
* **Acceso:** Público
* **Cuerpo de la Petición:**
```json
{
  "correo": "estudiante@ejemplo.com",
  "password": "Password123!",
  "nombre": "Juan",
  "apellido": "Pérez",
  "cedula": "1712345678",
  "programaInicialId": "prog-medicina"
}
```

### 3.3. Login / Registro unificado con Google
* **Endpoint:** `POST /auth/google`
* **Acceso:** Público
* **Cuerpo de la Petición:**
```json
{
  "idToken": "token_emitido_por_google_identity_services"
}
```

### 3.4. Completar Perfil CACES (Tras registrarse con Google)
* **Endpoint:** `POST /auth/completar-perfil`
* **Acceso:** Requiere Bearer Token
* **Cuerpo:**
```json
{
  "cedula": "0912345678",
  "programaActivoId": "prog-medicina"
}
```

### 3.5. Consultar Perfil Propio
* **Endpoint:** `GET /auth/perfil`
* **Acceso:** Requiere Bearer Token
* **Devuelve:** Datos personales, cuota de preguntas gratuitas restantes y estado de la suscripción.

### 3.6. Refrescar Token de Acceso
* **Endpoint:** `POST /auth/renovar-token`
* **Cuerpo:**
```json
{
  "refreshToken": "token_refresco_guardado"
}
```

---

## 4. Módulo de Tesorería y Pagos (`/admin/pagos`)
**Roles permitidos:** `SUPERADMIN`, `TESORERIA`

### 4.1. Listar Comprobantes Declarados
* **Endpoint:** `GET /admin/pagos`
* **Query Params Opcionales:**
  * `estado`: `PENDIENTE_VERIFICACION` | `APROBADA` | `RECHAZADA`
  * `termino`: búsqueda por texto libre (cédula, correo, nombre o comprobante).
* **Ejemplo:** `GET /admin/pagos?estado=PENDIENTE_VERIFICACION`
* **Respuesta Exitosa (`200 OK`):**
```json
[
  {
    "id": "uuid-transaccion",
    "estudianteId": "uuid-estudiante",
    "estudianteNombre": "Juan Pérez",
    "estudianteCorreo": "juan.perez@universidad.edu.ec",
    "estudianteCedula": "1712345678",
    "planId": "PLAN_SEMESTRAL_PRO",
    "planNombre": "Plan Semestral Pro",
    "montoDolares": 49.99,
    "entidadBancariaOrigen": "Banco Pichincha",
    "numeroComprobanteReferencia": "TRANSF-884920",
    "urlFotoComprobante": "https://bucket-s3.com/comprobantes/foto1.jpg",
    "estado": "PENDIENTE_VERIFICACION",
    "aprobadorNombre": null,
    "motivoObservacion": null,
    "fechaPagoDeclarada": "2026-10-25T10:00:00.000Z",
    "fechaRegistro": "2026-10-25T10:05:00.000Z"
  }
]
```

### 4.2. Ver Detalle de un Comprobante
* **Endpoint:** `GET /admin/pagos/:id`

### 4.3. Aprobar Pago y Activar Suscripción Pro
* **Endpoint:** `PATCH /admin/pagos/:id/aprobar`
* **Headers:** `Authorization: Bearer <token_tesorero_o_superadmin>`
* **Cuerpo:** Vacío `{}`
* **Efecto en el backend:** Marca la transacción como `APROBADA`, vincula el usuario aprobador y activa la suscripción Pro extendiendo la vigencia según los días del plan.

### 4.4. Rechazar Comprobante Bancario
* **Endpoint:** `PATCH /admin/pagos/:id/rechazar`
* **Cuerpo de la Petición:**
```json
{
  "motivo": "El comprobante adjunto no es legible y el número de referencia no coincide con los depósitos bancarios de la fecha."
}
```

---

## 5. Módulo de Gestión de Estudiantes (`/admin/estudiantes`)
**Roles permitidos:** Lectura (`SUPERADMIN`, `TESORERIA`), Edición (`SUPERADMIN`)

### 5.1. Listar Estudiantes
* **Endpoint:** `GET /admin/estudiantes`
* **Roles:** `SUPERADMIN`, `TESORERIA`

### 5.2. Detalle Profundo del Estudiante
* **Endpoint:** `GET /admin/estudiantes/:id`
* **Roles:** `SUPERADMIN`, `TESORERIA`
* **Respuesta Exitosa:**
```json
{
  "id": "uuid-estudiante",
  "cedula": "1712345678",
  "nombre": "Juan",
  "apellido": "Pérez",
  "nombreCompleto": "Juan Pérez",
  "correo": "juan.perez@universidad.edu.ec",
  "telefonoContacto": "+593991234567",
  "programaActivoId": "prog-medicina",
  "activo": true,
  "estadoPlan": "mensual_pro",
  "suscripcionActiva": {
    "planNombre": "Plan Semestral Pro",
    "estado": "ACTIVA",
    "expiraEn": "2027-04-25T..."
  },
  "historialTransacciones": [ ... ],
  "estadisticasSimulacros": {
    "totalIntentos": 12,
    "promedioCalificacion": 81.5,
    "ultimosIntentos": [ ... ]
  }
}
```

### 5.3. Editar Datos del Estudiante
* **Endpoint:** `PATCH /admin/estudiantes/:id`
* **Rol:** `SUPERADMIN`
* **Cuerpo (opcional según lo que se edite):**
```json
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez Gómez",
  "cedula": "1712345678",
  "telefonoContacto": "+593998877665",
  "programaActivoId": "prog-medicina"
}
```

### 5.4. Suspender o Reactivar Cuenta de Estudiante (Toggle)
* **Endpoint:** `PATCH /admin/estudiantes/:id/estado`
* **Rol:** `SUPERADMIN`
* **Cuerpo:** Vacío `{}`

### 5.5. Activación Manual / Beca Pro
* **Endpoint:** `PATCH /admin/estudiantes/:id/activar`
* **Roles:** `SUPERADMIN`, `TESORERIA`
* **Cuerpo:**
```json
{
  "diasVigencia": 30
}
```

---

## 6. Módulo de Banco de Preguntas CACES (`/admin/preguntas`)

### 6.1. Listar Banco de Preguntas
* **Endpoint:** `GET /admin/preguntas`
* **Roles:** `SUPERADMIN`, `TESORERIA`

### 6.2. Detalle de Pregunta por ID o Código Público
* **Endpoint:** `GET /admin/preguntas/:id`
* **Roles:** `SUPERADMIN`, `TESORERIA`

### 6.3. Crear Nueva Pregunta
* **Endpoint:** `POST /admin/preguntas`
* **Rol:** `SUPERADMIN`
* **Cuerpo:**
```json
{
  "codigoSubarea": "MED-INT-01",
  "enunciado": "Paciente masculino de 58 años hipertenso que acude por disnea súbita y dolor precordial...",
  "explicacionPedagogica": "De acuerdo con el protocolo nacional, se debe administrar oxígeno y diuréticos de asa antes de iniciar vasodilatadores.",
  "dificultad": "MEDIA",
  "opciones": [
    {
      "letra": "A",
      "texto": "Administrar Furosemida 40 mg EV y Oxigenoterapia",
      "esCorrecta": true,
      "justificacion": "Reduce la precarga y descongestiona el lecho vascular pulmonar de inmediato."
    },
    {
      "letra": "B",
      "texto": "Indicar betabloqueantes en dosis de carga",
      "esCorrecta": false,
      "justificacion": "Contraindicado en fase aguda de descompensación hemodinámica."
    },
    {
      "letra": "C",
      "texto": "Realizar cardioversión eléctrica no sincronizada",
      "esCorrecta": false,
      "justificacion": "No hay presencia de fibrilación ventricular ni paro cardíaco."
    },
    {
      "letra": "D",
      "texto": "Alta con cita ambulatoria a medicina interna",
      "esCorrecta": false,
      "justificacion": "Cuadro potencialmente mortal que requiere hospitalización inmediata."
    }
  ],
  "referenciaOficial": "Guías de Insuficiencia Cardíaca Aguda MSP Ecuador 2024",
  "imagenUrl": "https://storage.caces.ec/preguntas/ecg-scacest-01.png",
  "descripcionImagen": "Electrocardiograma de 12 derivaciones con elevación del segmento ST",
  "tipoMultimedia": "IMAGEN_ECG"
}
```

### 6.4. Editar Contenido de una Pregunta
* **Endpoint:** `PATCH /admin/preguntas/:id`
* **Rol:** `SUPERADMIN`
* **Cuerpo:** Permite enviar los campos modificados (`enunciado`, `explicacionPedagogica`, `dificultad`, `opciones`, `referenciaOficial`, `codigoSubarea`).

### 6.5. Actualizar Estado de Revisión
* **Endpoint:** `PATCH /admin/preguntas/:id/estado`
* **Rol:** `SUPERADMIN`
* **Cuerpo:**
```json
{
  "estado": "PUBLICADA"
}
```
*Valores posibles:* `BORRADOR`, `EN_REVISION`, `APROBADA`, `PUBLICADA`, `OBSERVADA`, `RETIRADA`.

### 6.6. Eliminar o Retirar Pregunta
* **Endpoint:** `DELETE /admin/preguntas/:id`
* **Rol:** `SUPERADMIN`
* **Comportamiento:** Si tiene respuestas en exámenes previos, el backend automáticamente la marca como `RETIRADA` para no alterar calificaciones históricas. Si no tiene intentos, la elimina físicamente.

---

## 7. Módulo de Gestión de Trabajadores/Personal (`/admin/trabajadores`)

### 7.1. Listar Personal
* **Endpoint:** `GET /admin/trabajadores`
* **Query Params:** `termino` (opcional), `departamento` (opcional)
* **Roles:** `SUPERADMIN`, `TESORERIA`

### 7.2. Crear Trabajador
* **Endpoint:** `POST /admin/trabajadores`
* **Rol:** `SUPERADMIN`
* **Cuerpo:**
```json
{
  "correo": "tesorero@caces.edu.ec",
  "contrasena": "CacesTesoreria2026!",
  "nombre": "Esteban",
  "apellido": "Salazar",
  "cedula": "0987654321",
  "cargo": "Analista de Recaudación",
  "departamento": "Tesorería",
  "telefonoContacto": "+593987112233",
  "rol": "TESORERIA"
}
```
*(El rol solo puede ser `SUPERADMIN` o `TESORERIA`)*.

### 7.3. Editar Trabajador
* **Endpoint:** `PATCH /admin/trabajadores/:id`
* **Rol:** `SUPERADMIN`

### 7.4. Alternar Activo/Inactivo del Trabajador
* **Endpoint:** `PATCH /admin/trabajadores/:id/estado`
* **Rol:** `SUPERADMIN`

---

## 8. Módulo de Planes Comerciales (`/admin/planes`)

* `GET /admin/planes`: Listar todos los planes (`SUPERADMIN`, `TESORERIA`).
* `GET /admin/planes/:id`: Detalle del plan (`SUPERADMIN`, `TESORERIA`).
* `POST /admin/planes`: Crear plan (`SUPERADMIN`):
```json
{
  "id": "PLAN_ANUAL_ENTERPRISE",
  "nombre": "Plan Anual de Preparación CACES",
  "descripcion": "Acceso ilimitado por 365 días a todos los simuladores oficiales",
  "precioDolares": 89.99,
  "duracionDiasVigencia": 365,
  "limitePreguntasGratis": 50,
  "accesoSimuladoresIlimitados": true,
  "accesoAnaliticaAvanzada": true,
  "activo": true
}
```
* `PATCH /admin/planes/:id`: Editar precios y características (`SUPERADMIN`).
* `DELETE /admin/planes/:id`: Desactivar o eliminar plan (`SUPERADMIN`).

---

## 9. Módulo de Catálogo Académico (`/admin/programas` y `/admin/areas`)

* `POST /admin/programas` (`SUPERADMIN`): Crear carrera CACES.
```json
{
  "id": "prog-enfermeria",
  "codigoOficialCaces": "CACES-ENF-2026",
  "nombre": "Enfermería General CACES",
  "descripcion": "Simulador oficial para el Examen de Habilitación Profesional en Enfermería",
  "duracionMinutos": 180,
  "totalPreguntas": 120,
  "notaMinimaAprobacion": 70,
  "activo": true
}
```
* `PATCH /admin/programas/:id` (`SUPERADMIN`): Editar parámetros de carrera o simulacro.
* `DELETE /admin/programas/:id` (`SUPERADMIN`): Desactivar carrera.
* `POST /admin/areas` (`SUPERADMIN`): Crear área temática con peso porcentual.
```json
{
  "programaId": "prog-enfermeria",
  "nombre": "Atención Primaria y Salud Comunitaria",
  "pesoPorcentual": 25.0
}
```
* `PATCH /admin/areas/:id` (`SUPERADMIN`): Modificar nombre o peso.
* `DELETE /admin/areas/:id` (`SUPERADMIN`): Eliminar área (si no contiene preguntas asociadas).

---

## 10. Módulo de Estudiantes: Práctica, Exámenes y Pagos

### 10.1. Práctica Guiada
* `GET /practica/preguntas?programaId=prog-medicina&areaId=uuid`: Obtener preguntas de práctica.
* `POST /practica/respuestas`: Responder pregunta y calcular retroalimentación:
```json
{
  "preguntaVersionId": "uuid-version",
  "opcionSeleccionadaId": "uuid-opcion",
  "tiempoSegundos": 45
}
```

### 10.2. Simuladores Oficiales
* `GET /simuladores/configuracion/:programaId`: Duración, cantidad de preguntas y puntaje mínimo.
* `POST /simuladores/iniciar`:
```json
{
  "programaId": "prog-medicina"
}
```
* `POST /simuladores/finalizar`: Concluye el simulacro y devuelve la calificación sobre 100 con el desglose por áreas CACES.
* `GET /simuladores/historial`: Historial de simulacros rendidos con puntajes.

### 10.3. Subir Comprobante de Pago
* `POST /suscripciones/declarar-pago`
* **Headers:** Bearer Token de estudiante
* **Cuerpo:**
```json
{
  "planId": "PLAN_SEMESTRAL_PRO",
  "entidadBancariaOrigen": "Banco Guayaquil",
  "numeroComprobanteReferencia": "REF-998811",
  "montoDolares": 49.99,
  "urlFotoComprobante": "https://mi-storage.com/comprobante123.jpg"
}
```

---

## 11. Implementación Angular: Interceptor y Guards

### 11.1. Interceptor de Autenticación (`auth.interceptor.ts`)
```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('tokenAcceso');

  let peticionClonada = req;
  if (token) {
    peticionClonada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(peticionClonada).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.clear();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        alert('Acceso Denegado: No tienes permisos para ingresar a este módulo.');
      }
      return throwError(() => error);
    })
  );
};
```

### 11.2. Guard de Roles para Rutas (`role.guard.ts`)
```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard = (rolesPermitidos: string[]): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const usuarioJson = localStorage.getItem('usuario');
    if (!usuarioJson) {
      router.navigate(['/login']);
      return false;
    }

    const usuario = JSON.parse(usuarioJson);
    const tienePermiso = rolesPermitidos.some(rol => usuario.roles?.includes(rol));

    if (!tienePermiso) {
      router.navigate(['/acceso-denegado']);
      return false;
    }
    return true;
  };
};
```
