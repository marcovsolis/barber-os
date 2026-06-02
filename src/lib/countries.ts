export interface Country {
  code:          string
  label:         string
  timezone:      string
  currency:      string
  currencyLabel: string
  dialCode:      string   // e.g. "+506"
  flag:          string   // emoji flag e.g. "🇨🇷"
}

/** Generate flag emoji from ISO 3166-1 alpha-2 country code */
export function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('')
}

const raw = [
  { code: 'CR', label: 'Costa Rica',           timezone: 'America/Costa_Rica',             currency: 'CRC', currencyLabel: 'Colón costarricense (CRC)',  dialCode: '+506' },
  { code: 'MX', label: 'México',               timezone: 'America/Mexico_City',            currency: 'MXN', currencyLabel: 'Peso mexicano (MXN)',        dialCode: '+52'  },
  { code: 'AR', label: 'Argentina',            timezone: 'America/Argentina/Buenos_Aires', currency: 'ARS', currencyLabel: 'Peso argentino (ARS)',        dialCode: '+54'  },
  { code: 'BO', label: 'Bolivia',              timezone: 'America/La_Paz',                 currency: 'BOB', currencyLabel: 'Boliviano (BOB)',             dialCode: '+591' },
  { code: 'CL', label: 'Chile',                timezone: 'America/Santiago',               currency: 'CLP', currencyLabel: 'Peso chileno (CLP)',          dialCode: '+56'  },
  { code: 'CO', label: 'Colombia',             timezone: 'America/Bogota',                 currency: 'COP', currencyLabel: 'Peso colombiano (COP)',       dialCode: '+57'  },
  { code: 'CU', label: 'Cuba',                 timezone: 'America/Havana',                 currency: 'CUP', currencyLabel: 'Peso cubano (CUP)',           dialCode: '+53'  },
  { code: 'DO', label: 'República Dominicana', timezone: 'America/Santo_Domingo',          currency: 'DOP', currencyLabel: 'Peso dominicano (DOP)',       dialCode: '+1'   },
  { code: 'EC', label: 'Ecuador',              timezone: 'America/Guayaquil',              currency: 'USD', currencyLabel: 'Dólar (USD)',                 dialCode: '+593' },
  { code: 'SV', label: 'El Salvador',          timezone: 'America/El_Salvador',            currency: 'USD', currencyLabel: 'Dólar (USD)',                 dialCode: '+503' },
  { code: 'GT', label: 'Guatemala',            timezone: 'America/Guatemala',              currency: 'GTQ', currencyLabel: 'Quetzal (GTQ)',               dialCode: '+502' },
  { code: 'HN', label: 'Honduras',             timezone: 'America/Tegucigalpa',            currency: 'HNL', currencyLabel: 'Lempira (HNL)',               dialCode: '+504' },
  { code: 'NI', label: 'Nicaragua',            timezone: 'America/Managua',                currency: 'NIO', currencyLabel: 'Córdoba (NIO)',               dialCode: '+505' },
  { code: 'PA', label: 'Panamá',               timezone: 'America/Panama',                 currency: 'USD', currencyLabel: 'Dólar (USD)',                 dialCode: '+507' },
  { code: 'PY', label: 'Paraguay',             timezone: 'America/Asuncion',               currency: 'PYG', currencyLabel: 'Guaraní (PYG)',               dialCode: '+595' },
  { code: 'PE', label: 'Perú',                 timezone: 'America/Lima',                   currency: 'PEN', currencyLabel: 'Sol peruano (PEN)',           dialCode: '+51'  },
  { code: 'PR', label: 'Puerto Rico',          timezone: 'America/Puerto_Rico',            currency: 'USD', currencyLabel: 'Dólar (USD)',                 dialCode: '+1'   },
  { code: 'UY', label: 'Uruguay',              timezone: 'America/Montevideo',             currency: 'UYU', currencyLabel: 'Peso uruguayo (UYU)',         dialCode: '+598' },
  { code: 'VE', label: 'Venezuela',            timezone: 'America/Caracas',                currency: 'VES', currencyLabel: 'Bolívar venezolano (VES)',    dialCode: '+58'  },
  { code: 'ES', label: 'España',               timezone: 'Europe/Madrid',                  currency: 'EUR', currencyLabel: 'Euro (EUR)',                  dialCode: '+34'  },
  { code: 'US', label: 'Estados Unidos',       timezone: 'America/New_York',               currency: 'USD', currencyLabel: 'Dólar (USD)',                 dialCode: '+1'   },
]

export const COUNTRIES: Country[] = raw.map(c => ({ ...c, flag: countryFlag(c.code) }))

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code)
}
