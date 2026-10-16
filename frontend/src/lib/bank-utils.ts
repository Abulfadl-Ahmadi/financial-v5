export interface IranianBankInfo {
  id: string
  nameFa: string
  nameEn: string
  cardPrefixes: string[]
  iconFile: string
  themeColor?: string
}

export const IRANIAN_BANKS: IranianBankInfo[] = [
  {
    id: 'melli',
    nameFa: 'بانک ملی ایران',
    nameEn: 'Bank Melli Iran',
    cardPrefixes: ['603799', '636214'],
    iconFile: '/banks/melli.svg',
    themeColor: '#003366',
  },
  {
    id: 'mellat',
    nameFa: 'بانک ملت',
    nameEn: 'Bank Mellat',
    cardPrefixes: ['610433', '991975'],
    iconFile: '/banks/mellat.svg',
    themeColor: '#e30613',
  },
  {
    id: 'tejarat',
    nameFa: 'بانک تجارت',
    nameEn: 'Tejarat Bank',
    cardPrefixes: ['627353', '585983'],
    iconFile: '/banks/tejarat.svg',
    themeColor: '#005f73',
  },
  {
    id: 'sepah',
    nameFa: 'بانک سپه',
    nameEn: 'Bank Sepah',
    cardPrefixes: ['627381', '589210'],
    iconFile: '/banks/sepah.svg',
    themeColor: '#d4af37',
  },
  {
    id: 'saderat',
    nameFa: 'بانک صادرات ایران',
    nameEn: 'Bank Saderat',
    cardPrefixes: ['603769'],
    iconFile: '/banks/saderat.svg',
    themeColor: '#1d3557',
  },
  {
    id: 'blubank',
    nameFa: 'بلو بانک (سامان)',
    nameEn: 'BluBank',
    cardPrefixes: ['62198618', '62198619', '621986'],
    iconFile: '/banks/blubank.svg',
    themeColor: '#4e91e6',
  },
  {
    id: 'saman',
    nameFa: 'بانک سامان',
    nameEn: 'Saman Bank',
    cardPrefixes: ['621986'],
    iconFile: '/banks/saman.svg',
    themeColor: '#009688',
  },
  {
    id: 'pasargad',
    nameFa: 'بانک پاسارگاد',
    nameEn: 'Pasargad Bank',
    cardPrefixes: ['502229', '639347'],
    iconFile: '/banks/pasargad.svg',
    themeColor: '#2b2d42',
  },
  {
    id: 'parsian',
    nameFa: 'بانک پارسیان',
    nameEn: 'Parsian Bank',
    cardPrefixes: ['622106'],
    iconFile: '/banks/parsian.svg',
    themeColor: '#800020',
  },
  {
    id: 'keshavarzi',
    nameFa: 'بانک کشاورزی',
    nameEn: 'Keshavarzi Bank',
    cardPrefixes: ['603770', '639217'],
    iconFile: '/banks/keshavarzi.svg',
    themeColor: '#2d6a4f',
  },
  {
    id: 'maskan',
    nameFa: 'بانک مسکن',
    nameEn: 'Maskan Bank',
    cardPrefixes: ['628023'],
    iconFile: '/banks/maskan.svg',
    themeColor: '#f77f00',
  },
  {
    id: 'refah',
    nameFa: 'بانک رفاه کارگران',
    nameEn: 'Refah Bank',
    cardPrefixes: ['589463'],
    iconFile: '/banks/refah.svg',
    themeColor: '#1d4e89',
  },
  {
    id: 'shahr',
    nameFa: 'بانک شهر',
    nameEn: 'Shahr Bank',
    cardPrefixes: ['504706', '502806'],
    iconFile: '/banks/shahr.svg',
    themeColor: '#c1121f',
  },
  {
    id: 'sina',
    nameFa: 'بانک سینا',
    nameEn: 'Sina Bank',
    cardPrefixes: ['639346'],
    iconFile: '/banks/sina.svg',
    themeColor: '#457b9d',
  },
  {
    id: 'dey',
    nameFa: 'بانک دی',
    nameEn: 'Dey Bank',
    cardPrefixes: ['502938'],
    iconFile: '/banks/dey.svg',
    themeColor: '#0077b6',
  },
  {
    id: 'resalat',
    nameFa: 'بانک قرض‌الحسنه رسالت',
    nameEn: 'Resalat Bank',
    cardPrefixes: ['504172'],
    iconFile: '/banks/resalat.svg',
    themeColor: '#38b000',
  },
  {
    id: 'mehr-iran',
    nameFa: 'بانک قرض‌الحسنه مهر ایران',
    nameEn: 'Mehr Iran Bank',
    cardPrefixes: ['606373', '639370'],
    iconFile: '/banks/mehr-iran.svg',
    themeColor: '#008000',
  },
  {
    id: 'eghtesad-novin',
    nameFa: 'بانک اقتصاد نوین',
    nameEn: 'Eghtesad Novin',
    cardPrefixes: ['627412'],
    iconFile: '/banks/eghtesad-novin.svg',
    themeColor: '#4a0e4e',
  },
  {
    id: 'karafarin',
    nameFa: 'بانک کارآفرین',
    nameEn: 'Karafarin Bank',
    cardPrefixes: ['627488', '502910'],
    iconFile: '/banks/karafarin.svg',
    themeColor: '#105652',
  },
  {
    id: 'gardeshgari',
    nameFa: 'بانک گردشگری',
    nameEn: 'Gardeshgari Bank',
    cardPrefixes: ['505416'],
    iconFile: '/banks/gardeshgari.svg',
    themeColor: '#b5179e',
  },
  {
    id: 'postbank',
    nameFa: 'پست بانک ایران',
    nameEn: 'Post Bank',
    cardPrefixes: ['627760'],
    iconFile: '/banks/postbank.svg',
    themeColor: '#2b9348',
  },
  {
    id: 'ayandeh',
    nameFa: 'بانک آینده',
    nameEn: 'Ayandeh Bank',
    cardPrefixes: ['636214'],
    iconFile: '/banks/ayandeh.svg',
    themeColor: '#6a040f',
  },
  {
    id: 'sarmayeh',
    nameFa: 'بانک سرمایه',
    nameEn: 'Sarmayeh Bank',
    cardPrefixes: ['639607'],
    iconFile: '/banks/sarmayeh.svg',
    themeColor: '#03045e',
  },
  {
    id: 'iran-zamin',
    nameFa: 'بانک ایران زمین',
    nameEn: 'Iran Zamin Bank',
    cardPrefixes: ['505785'],
    iconFile: '/banks/iran-zamin.svg',
    themeColor: '#7209b7',
  },
  {
    id: 'tosee-taavon',
    nameFa: 'بانک توسعه تعاون',
    nameEn: 'Tosee Taavon Bank',
    cardPrefixes: ['502908'],
    iconFile: '/banks/tosee-taavon.svg',
    themeColor: '#2a9d8f',
  },
]

export function normalizePersianDigits(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
}

export function normalizeCardNumber(value: string | number | null | undefined): string {
  return normalizePersianDigits(value)
    .replace(/\D/g, '')
    .slice(0, 16)
}

export function formatCardNumber(value: string | number | null | undefined, separator = '-'): string {
  const digits = normalizeCardNumber(value)
  if (!digits) return ''
  const parts = []
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4))
  }
  return parts.join(separator)
}

export function getBankByCardNumber(value: string | number | null | undefined): IranianBankInfo | undefined {
  const digits = normalizeCardNumber(value)
  if (digits.length < 6) return undefined
  // First match longer prefix if exists (like 8-digit or 6-digit)
  return (
    IRANIAN_BANKS.find((bank) =>
      bank.cardPrefixes.some((prefix) => prefix.length === 8 && digits.startsWith(prefix))
    ) ||
    IRANIAN_BANKS.find((bank) =>
      bank.cardPrefixes.some((prefix) => digits.startsWith(prefix))
    )
  )
}

export function detectBankName(cardNumber: string): string {
  const bank = getBankByCardNumber(cardNumber)
  if (bank) {
    return `${bank.nameFa} (${bank.nameEn})`
  }
  return 'بانک شتاب (Shetab)'
}

export function validateIranianCard(value: string | number | null | undefined): boolean {
  const digits = normalizeCardNumber(value)
  if (digits.length !== 16 || /^0+$/.test(digits)) return false

  const sum = digits.split('').reduce((total, character, index) => {
    let digit = Number(character)
    if (index % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    return total + digit
  }, 0)

  return sum % 10 === 0
}
