/**
 * Validaciones del formulario de pedido (el servidor vuelve a validar lo mismo).
 */
export interface PhoneCountry { code: string; flag: string; name: string; min: number; max: number; }

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: '51', flag: '🇵🇪', name: 'Perú', min: 9, max: 9 },
  { code: '591', flag: '🇧🇴', name: 'Bolivia', min: 8, max: 8 },
  { code: '56', flag: '🇨🇱', name: 'Chile', min: 9, max: 9 },
  { code: '57', flag: '🇨🇴', name: 'Colombia', min: 10, max: 10 },
  { code: '593', flag: '🇪🇨', name: 'Ecuador', min: 9, max: 9 },
  { code: '54', flag: '🇦🇷', name: 'Argentina', min: 10, max: 11 },
  { code: '55', flag: '🇧🇷', name: 'Brasil', min: 10, max: 11 },
  { code: '58', flag: '🇻🇪', name: 'Venezuela', min: 10, max: 10 },
  { code: '52', flag: '🇲🇽', name: 'México', min: 10, max: 10 },
  { code: '1', flag: '🇺🇸', name: 'EE. UU.', min: 10, max: 10 },
  { code: '34', flag: '🇪🇸', name: 'España', min: 9, max: 9 },
];

/** Espacios simples y cada palabra con mayúscula inicial: "maría  fernández quispe" → "María Fernández Quispe" */
export const normalizeName = (v: string) =>
  v.trim().replace(/\s+/g, ' ').split(' ')
    .map(w => (w ? w.charAt(0).toLocaleUpperCase('es') + w.slice(1).toLocaleLowerCase('es') : w)).join(' ');

export function validateFullName(v: string): string | null {
  const clean = v.trim().replace(/\s+/g, ' ');
  if (!clean) return 'Escribe tu nombre completo.';
  if (!/^[A-Za-zÀ-ÿÑñ' .-]+$/.test(clean)) return 'Solo se permiten letras.';
  const words = clean.split(' ');
  if (words.length < 3) return 'Escribe tu nombre y tus dos apellidos (paterno y materno).';
  if (words.some(w => w.replace(/[.'-]/g, '').length < 2)) return 'Revisa tu nombre: cada nombre o apellido debe tener al menos 2 letras.';
  return null;
}

export function validateDni(v: string): string | null {
  const d = v.trim();
  if (!d) return 'Ingresa tu DNI o carné de extranjería.';
  if (!/^\d+$/.test(d)) return 'Solo números.';
  if (d.length < 8) return 'El DNI tiene 8 dígitos (el carné de extranjería, 9).';
  if (d.length > 9) return 'Máximo 9 dígitos.';
  return null;
}

export function validatePhone(v: string, country: PhoneCountry): string | null {
  const d = v.replace(/\D/g, '');
  if (!d) return 'Ingresa tu número de WhatsApp.';
  if (country.code === '51') {
    if (d.length !== 9 || !d.startsWith('9')) return 'El celular debe tener 9 dígitos y empezar con 9.';
    return null;
  }
  if (d.length < country.min || d.length > country.max) {
    return country.min === country.max
      ? `El número de ${country.name} tiene ${country.min} dígitos.`
      : `El número de ${country.name} tiene entre ${country.min} y ${country.max} dígitos.`;
  }
  return null;
}
