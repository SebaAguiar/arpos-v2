const ARCA_BUSINESS_PATTERN = /^\s*\d+\s*:\s*/;

const NETWORK_PATTERNS = [
  /ETIMEDOUT/,
  /timed out/i,
  /timeout/i,
  /socket hang up/i,
  /ECONNREFUSED|ECONNRESET|EAI_AGAIN|ENETUNREACH|ENOTFOUND/,
  /fetch failed/i,
];

const AUTH_PATTERNS = [
  /notAuthorized|not authorized|unauthorized/i,
  /computador no autorizado/i,
  /no autorizado a acceder/i,
];

const CERT_PATTERNS = [
  /certificate|pem|private key|self-signed|signature/i,
];

const INTERNAL_TECH_PATTERNS = [
  /array\s+iva/i,
  /debe informarse el array/i,
  /FECAEDet/i,
];

function stripArcaCodePrefix(message: string): string {
  return message.replace(ARCA_BUSINESS_PATTERN, '').trim();
}

export function translateArcaError(
  raw: string | undefined,
  isBusinessError: boolean,
): string {
  if (!raw) {
    return 'Ocurrió un error al comunicarse con ARCA. Intentá de nuevo.';
  }

  if (isBusinessError) {
    const clean = stripArcaCodePrefix(raw);
    if (INTERNAL_TECH_PATTERNS.some((pattern) => pattern.test(raw))) {
      return 'El comprobante fue rechazado por una validación interna de ARCA. Repetí el intento o contactá a soporte.';
    }
    return `ARCA rechazó el comprobante: ${clean}`;
  }

  if (AUTH_PATTERNS.some((pattern) => pattern.test(raw))) {
    return 'El certificado o la habilitación del servicio no es válida en ARCA. Revisá la configuración del certificado.';
  }

  if (CERT_PATTERNS.some((pattern) => pattern.test(raw))) {
    return 'El certificado o la clave privada de ARCA no pudieron validarse. Revisá la configuración.';
  }

  if (NETWORK_PATTERNS.some((pattern) => pattern.test(raw))) {
    return 'No se pudo conectar con ARCA. Verificá la conexión a internet e intentá de nuevo.';
  }

  return 'Ocurrió un error al comunicarse con ARCA. Intentá nuevamente en unos minutos.';
}