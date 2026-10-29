import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export interface ResultadoValidacionCedula {
  esValida: boolean;
  motivo?: string;
}

/**
 * Valida un número de cédula de identidad ecuatoriana (persona natural).
 * Aplica:
 * 1. Longitud exacta de 10 dígitos numéricos.
 * 2. Rechazo de secuencias idénticas repetitivas (ej. 2222222222, 1111111111) o patrones repetitivos.
 * 3. Código de provincia válido (01 a 24, o 30 para ecuatorianos en el exterior).
 * 4. Tercer dígito menor a 6 (personas naturales).
 * 5. Algoritmo oficial Módulo 10 con coeficientes 2-1-2-1-2-1-2-1-2.
 */
export function validarCedulaEcuatoriana(
  valor: unknown,
): ResultadoValidacionCedula {
  if (typeof valor !== 'string') {
    return {
      esValida: false,
      motivo: 'La cédula debe ser una cadena de texto.',
    };
  }

  const cedula = valor.trim();

  if (!/^\d{10}$/.test(cedula)) {
    return {
      esValida: false,
      motivo: 'La cédula debe contener exactamente 10 dígitos numéricos.',
    };
  }

  // Rechazar números con todos los dígitos idénticos o patrones repetitivos
  if (
    /^(\d)\1{9}$/.test(cedula) ||
    /^(\d{2})\1{4}$/.test(cedula) ||
    /^(\d)\1{8}/.test(cedula)
  ) {
    return {
      esValida: false,
      motivo:
        'El número de cédula no puede estar compuesto por dígitos repetitivos o incoherentes.',
    };
  }

  // Validación de provincia (dos primeros dígitos)
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return {
      esValida: false,
      motivo:
        'El código de provincia de la cédula no es válido en el Registro Civil ecuatoriano.',
    };
  }

  // Tercer dígito para persona natural (0 a 5)
  const tercerDigito = parseInt(cedula.charAt(2), 10);
  if (tercerDigito >= 6) {
    return {
      esValida: false,
      motivo:
        'El tercer dígito de la cédula no corresponde a una persona natural.',
    };
  }

  // Algoritmo de Módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const digitoVerificador = parseInt(cedula.charAt(9), 10);
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valorDigito = parseInt(cedula.charAt(i), 10) * coeficientes[i];
    if (valorDigito >= 10) {
      valorDigito -= 9;
    }
    suma += valorDigito;
  }

  const digitoCalculado = (10 - (suma % 10)) % 10;

  if (digitoCalculado !== digitoVerificador) {
    return {
      esValida: false,
      motivo:
        'El número de cédula ingresado no es válido según el algoritmo oficial del Registro Civil.',
    };
  }

  return { esValida: true };
}

/**
 * Valida nombres y apellidos de personas.
 * Solo permite letras (incluyendo tildes y caracteres en español), apóstrofes o guiones simples,
 * con mínimo 2 letras reales y sin números ni signos de puntuación o símbolos (*, ., etc.).
 */
export function validarNombrePersona(
  valor: unknown,
): { esValido: boolean; motivo?: string } {
  if (typeof valor !== 'string') {
    return {
      esValido: false,
      motivo: 'El valor debe ser una cadena de texto.',
    };
  }

  const texto = valor.trim();

  if (texto.length < 2) {
    return {
      esValido: false,
      motivo: 'Debe contener al menos 2 caracteres.',
    };
  }

  if (texto.length > 60) {
    return {
      esValido: false,
      motivo: 'No puede exceder los 60 caracteres.',
    };
  }

  // Detectar si solo son signos de puntuación o símbolos
  if (/^[\.\-_~`!@#$%^&*()+=\[\]{}|\\:;"'<>,?\/]+$/.test(texto)) {
    return {
      esValido: false,
      motivo: 'No puede estar compuesto únicamente por puntos o signos.',
    };
  }

  // Debe comenzar estrictamente con una letra (incluye tildes y eñe)
  if (!/^[a-zA-Z\u00C0-\u017F]/.test(texto)) {
    return {
      esValido: false,
      motivo:
        'El nombre o apellido debe comenzar con una letra (no puede iniciar con puntos, asteriscos ni símbolos).',
    };
  }

  // No puede contener asteriscos ni puntos
  if (/[\*\._~`!@#$%^&+=\[\]{}|\\:;"<>?\/]/.test(texto)) {
    return {
      esValido: false,
      motivo:
        'El nombre o apellido no puede contener asteriscos (*), puntos (...) ni símbolos especiales.',
    };
  }

  // Solo letras (con acentos y ñ), espacios sencillos, apóstrofes o guiones
  const patron = /^[a-zA-Z\u00C0-\u017F]+(?:[' -][a-zA-Z\u00C0-\u017F]+)*$/;
  if (!patron.test(texto)) {
    return {
      esValido: false,
      motivo:
        'Solo se permiten letras reales sin números, puntos (...) ni caracteres especiales.',
    };
  }

  const soloLetras = texto.replace(/[^a-zA-Z\u00C0-\u017F]/g, '');
  if (soloLetras.length < 2) {
    return {
      esValido: false,
      motivo: 'Debe contener al menos 2 letras alfabéticas reales.',
    };
  }

  return { esValido: true };
}

/**
 * Valida correos electrónicos coherentes.
 * Rechaza cadenas que inicien con puntos/asteriscos, secuencias como '...@...' o asteriscos.
 */
export function validarCorreoCoherente(
  valor: unknown,
): { esValido: boolean; motivo?: string } {
  if (typeof valor !== 'string') {
    return {
      esValido: false,
      motivo: 'El correo electrónico debe ser una cadena de texto.',
    };
  }

  const texto = valor.trim().toLowerCase();

  if (!texto || texto.length < 5 || texto.length > 100) {
    return {
      esValido: false,
      motivo: 'El correo electrónico debe tener una longitud válida.',
    };
  }

  if (/^[\.\-_~`!@#$%^&*()+=\[\]{}|\\:;"'<>,?\/]+$/.test(texto)) {
    return {
      esValido: false,
      motivo: 'El correo no puede consistir únicamente en puntos o símbolos.',
    };
  }

  if (/^[\*\.\-_]/.test(texto) || texto.includes('*') || texto.includes('..')) {
    return {
      esValido: false,
      motivo:
        'El correo electrónico no puede comenzar con símbolos, asteriscos ni contener puntos consecutivos.',
    };
  }

  const patronCorreo =
    /^[a-zA-Z0-9!#$%&'+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

  if (!patronCorreo.test(texto)) {
    return {
      esValido: false,
      motivo: 'El formato del correo electrónico no es válido.',
    };
  }

  return { esValido: true };
}

/**
 * Valida texto descriptivo o explicativo general (evita campos con solo '...', '---', etc.)
 */
export function validarTextoCoherente(
  valor: unknown,
  minCaracteres = 3,
): { esValido: boolean; motivo?: string } {
  if (typeof valor !== 'string') {
    return {
      esValido: false,
      motivo: 'El campo debe ser una cadena de texto.',
    };
  }

  const texto = valor.trim();

  if (texto.length < minCaracteres) {
    return {
      esValido: false,
      motivo: `Debe contener al menos ${minCaracteres} caracteres.`,
    };
  }

  // Rechaza texto formado solo por signos
  if (/^[\.\-_~`!@#$%^&*()+=\[\]{}|\\:;"'<>,?\/]+$/.test(texto)) {
    return {
      esValido: false,
      motivo:
        'El contenido no puede consistir únicamente en puntos (...) o símbolos incoherentes.',
    };
  }

  // No puede iniciar con asterisco, punto o símbolos
  if (/^[\*\.\/\\#_~`!@$%^+=]/.test(texto)) {
    return {
      esValido: false,
      motivo:
        'El contenido no puede comenzar con asteriscos (*), puntos (.) ni símbolos especiales.',
    };
  }

  // Debe contener al menos 2 caracteres alfanuméricos
  const alfanumericos = texto.replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '');
  if (alfanumericos.length < 2) {
    return {
      esValido: false,
      motivo: 'El contenido debe incluir texto legible con letras o números.',
    };
  }

  return { esValido: true };
}

/**
 * Valida códigos de comprobante bancario o referencia de pago
 */
export function validarCodigoReferencia(
  valor: unknown,
): { esValido: boolean; motivo?: string } {
  if (typeof valor !== 'string') {
    return {
      esValido: false,
      motivo: 'La referencia debe ser una cadena de texto.',
    };
  }

  const texto = valor.trim();

  if (texto.length < 4 || texto.length > 40) {
    return {
      esValido: false,
      motivo: 'La referencia debe tener entre 4 y 40 caracteres.',
    };
  }

  if (/^[\.\-_~`!@#$%^&*()+=\[\]{}|\\:;"'<>,?\/]+$/.test(texto)) {
    return {
      esValido: false,
      motivo: 'La referencia no puede ser solo puntos o símbolos.',
    };
  }

  if (!/^[a-zA-Z0-9]/.test(texto)) {
    return {
      esValido: false,
      motivo:
        'La referencia debe comenzar con un número o letra (no puede iniciar con asteriscos ni puntos).',
    };
  }

  if (!/^[a-zA-Z0-9\-_]{4,40}$/.test(texto)) {
    return {
      esValido: false,
      motivo:
        'La referencia debe contener solo caracteres alfanuméricos, guiones o guiones bajos (sin puntos ni espacios).',
    };
  }

  const alfanumericos = texto.replace(/[^a-zA-Z0-9]/g, '');
  if (alfanumericos.length < 2) {
    return {
      esValido: false,
      motivo: 'La referencia debe contener al menos 2 caracteres alfanuméricos.',
    };
  }

  return { esValido: true };
}

/**
 * Valida que una contraseña sea segura y coherente:
 * 1. Mínimo 8 caracteres, máximo 72 caracteres (límite recomendado bcrypt).
 * 2. Sin espacios en blanco.
 * 3. No puede estar compuesta únicamente por signos de puntuación (...) ni símbolos.
 * 4. No puede consistir en un mismo carácter repetido (ej. ......., aaaaaaaa, 11111111).
 * 5. Debe contener al menos una letra alfabética (a-z o A-Z).
 * 6. Debe contener al menos un dígito numérico (0-9).
 */
export function validarClaveSegura(
  valor: unknown,
): { esValida: boolean; motivo?: string } {
  if (typeof valor !== 'string') {
    return {
      esValida: false,
      motivo: 'La contraseña debe ser una cadena de texto.',
    };
  }

  const clave = valor;

  if (clave.length < 8) {
    return {
      esValida: false,
      motivo: 'La contraseña debe tener al menos 8 caracteres.',
    };
  }

  if (clave.length > 72) {
    return {
      esValida: false,
      motivo: 'La contraseña no puede exceder los 72 caracteres.',
    };
  }

  if (clave.includes(' ')) {
    return {
      esValida: false,
      motivo: 'La contraseña no puede contener espacios en blanco.',
    };
  }

  // Rechazar si está compuesta únicamente por puntos o símbolos (ej. ......., *******)
  if (/^[\.\-_~`!@#$%^&*()+=\[\]{}|\\:;'"<>,?\/]+$/.test(clave)) {
    return {
      esValida: false,
      motivo:
        'La contraseña no puede consistir únicamente en puntos (...) o símbolos. Debe incluir letras y números.',
    };
  }

  // Rechazar caracteres idénticos repetidos (ej. 11111111, aaaaaaaa, ........)
  if (/^(.)\1+$/.test(clave)) {
    return {
      esValida: false,
      motivo: 'La contraseña no puede consistir en un mismo carácter repetido.',
    };
  }

  // Exigir al menos una letra
  if (!/[a-zA-Z\u00C0-\u017F]/.test(clave)) {
    return {
      esValida: false,
      motivo: 'La contraseña debe incluir al menos una letra (a-z o A-Z).',
    };
  }

  // Exigir al menos un número
  if (!/\d/.test(clave)) {
    return {
      esValida: false,
      motivo: 'La contraseña debe incluir al menos un número (0-9).',
    };
  }

  return { esValida: true };
}

/* -------------------------------------------------------------
 * Decoradores Class-Validator
 * ----------------------------------------------------------- */

@ValidatorConstraint({ name: 'EsCedulaEcuatoriana', async: false })
export class EsCedulaEcuatorianaConstraint
  implements ValidatorConstraintInterface
{
  private ultimoMensajeError = 'La cédula ecuatoriana ingresada no es válida';

  validate(value: any, _args: ValidationArguments) {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    const resultado = validarCedulaEcuatoriana(value);
    if (!resultado.esValida) {
      this.ultimoMensajeError = resultado.motivo || this.ultimoMensajeError;
      return false;
    }
    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return this.ultimoMensajeError;
  }
}

export function EsCedulaEcuatoriana(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EsCedulaEcuatorianaConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'EsNombrePersona', async: false })
export class EsNombrePersonaConstraint implements ValidatorConstraintInterface {
  private ultimoMensajeError = 'El nombre o apellido ingresado no es válido';

  validate(value: any, _args: ValidationArguments) {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    const resultado = validarNombrePersona(value);
    if (!resultado.esValido) {
      this.ultimoMensajeError = resultado.motivo || this.ultimoMensajeError;
      return false;
    }
    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return this.ultimoMensajeError;
  }
}

export function EsNombrePersona(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EsNombrePersonaConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'EsCorreoCoherente', async: false })
export class EsCorreoCoherenteConstraint
  implements ValidatorConstraintInterface
{
  private ultimoMensajeError = 'El correo electrónico ingresado no es válido';

  validate(value: any, _args: ValidationArguments) {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    const resultado = validarCorreoCoherente(value);
    if (!resultado.esValido) {
      this.ultimoMensajeError = resultado.motivo || this.ultimoMensajeError;
      return false;
    }
    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return this.ultimoMensajeError;
  }
}

export function EsCorreoCoherente(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EsCorreoCoherenteConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'EsTextoCoherente', async: false })
export class EsTextoCoherenteConstraint implements ValidatorConstraintInterface {
  private ultimoMensajeError = 'El texto ingresado no es coherente';

  validate(value: any, args: ValidationArguments) {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    const min = (args.constraints && args.constraints[0]) || 3;
    const resultado = validarTextoCoherente(value, min);
    if (!resultado.esValido) {
      this.ultimoMensajeError = resultado.motivo || this.ultimoMensajeError;
      return false;
    }
    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return this.ultimoMensajeError;
  }
}

export function EsTextoCoherente(
  minCaracteres = 3,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minCaracteres],
      validator: EsTextoCoherenteConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'EsCodigoReferencia', async: false })
export class EsCodigoReferenciaConstraint
  implements ValidatorConstraintInterface
{
  private ultimoMensajeError =
    'El código de referencia o comprobante no es válido';

  validate(value: any, _args: ValidationArguments) {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    const resultado = validarCodigoReferencia(value);
    if (!resultado.esValido) {
      this.ultimoMensajeError = resultado.motivo || this.ultimoMensajeError;
      return false;
    }
    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return this.ultimoMensajeError;
  }
}

export function EsCodigoReferencia(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EsCodigoReferenciaConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'EsClaveSegura', async: false })
export class EsClaveSeguraConstraint implements ValidatorConstraintInterface {
  private ultimoMensajeError =
    'La contraseña no cumple con los requisitos de seguridad (mínimo 8 caracteres, letras y números, sin secuencias repetitivas ni solo puntos)';

  validate(value: any, _args: ValidationArguments) {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    const resultado = validarClaveSegura(value);
    if (!resultado.esValida) {
      this.ultimoMensajeError = resultado.motivo || this.ultimoMensajeError;
      return false;
    }
    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return this.ultimoMensajeError;
  }
}

export function EsClaveSegura(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EsClaveSeguraConstraint,
    });
  };
}
