// sectorMap.js - Normalización de sectores a la taxonomía fija del screener
// Sectores válidos: Comunicaciones, Consumo Básico, Consumo Discrecional,
// Criptomonedas, Energía, Financiero, Industrial, Materiales, Salud,
// Semiconductores, Software

export const sectorOverrides = {
  // --- Semiconductores / hardware ---
  AVGO: 'Semiconductores', AMAT: 'Semiconductores', LRCX: 'Semiconductores',
  MRVL: 'Semiconductores', ADI: 'Semiconductores', ARM: 'Semiconductores',
  ALAB: 'Semiconductores', SNDK: 'Semiconductores', HPQ: 'Semiconductores',
  GLW: 'Materiales', // vidrio especial, no chip

  // --- Software / IT ---
  ACN: 'Software', ADP: 'Software', AI: 'Software', MSI: 'Comunicaciones',
  MSTR: 'Software', PATH: 'Software', RGTI: 'Software', SHOP: 'Software',
  GOGLB: 'Software', NBIS: 'Software', CRWV: 'Software', FISV: 'Financiero',

  // --- Financiero ---
  AIG: 'Financiero', BCS: 'Financiero', BK: 'Financiero', BNY: 'Financiero',
  BX: 'Financiero', SAN: 'Financiero', BBV: 'Financiero', BSBR: 'Financiero',
  BBAS3: 'Financiero', BBDC3: 'Financiero', BBDC: 'Financiero',
  MUFG: 'Financiero', O: 'Financiero', EFX: 'Financiero', PAGS: 'Financiero',
  COIN: 'Financiero',

  // --- Energía ---
  CEG: 'Energía', OKLO: 'Energía', NXE: 'Energía', GLNG: 'Energía',
  EQNR: 'Energía', E: 'Energía', HAL: 'Energía', PSX: 'Energía',
  BKR: 'Energía', FSLR: 'Energía', KEP: 'Energía', NGG: 'Energía',
  GPRK: 'Energía', PETR3: 'Energía', PRIO3: 'Energía', TTE: 'Energía',
  VST: 'Energía',

  // --- Materiales / minería ---
  FCX: 'Materiales', NEM: 'Materiales', GFI: 'Materiales', GGB: 'Materiales',
  B: 'Materiales', HL: 'Materiales', HMY: 'Materiales', PAAS: 'Materiales',
  CDE: 'Materiales', SCCO: 'Materiales', RIO: 'Materiales', BHP: 'Materiales',
  NUE: 'Materiales', DOW: 'Materiales', ECL: 'Materiales', MOS: 'Materiales',
  IP: 'Materiales', LAR: 'Materiales', MP: 'Materiales', MUX: 'Materiales',
  NG: 'Materiales', BNG: 'Materiales', BAK: 'Materiales', CX: 'Materiales',
  ADGO: 'Materiales', AEM: 'Materiales', PKS: 'Materiales', CCJ: 'Materiales',

  // --- Consumo Discrecional ---
  AAL: 'Consumo Discrecional', DAL: 'Consumo Discrecional', CCL: 'Consumo Discrecional',
  LVS: 'Consumo Discrecional', HOG: 'Consumo Discrecional', CAR: 'Consumo Discrecional',
  DECK: 'Consumo Discrecional', ROST: 'Consumo Discrecional', ORLY: 'Consumo Discrecional',
  AAP: 'Consumo Discrecional', ANF: 'Consumo Discrecional', ARCO: 'Consumo Discrecional',
  JMIA: 'Consumo Discrecional', SE: 'Consumo Discrecional', GT: 'Consumo Discrecional',
  GRMN: 'Consumo Discrecional', RACE: 'Consumo Discrecional', SDA: 'Consumo Discrecional',
  RENT3: 'Consumo Discrecional', MGLU3: 'Consumo Discrecional', ETSY: 'Consumo Discrecional',

  // --- Consumo Básico ---
  HSY: 'Consumo Básico', KMB: 'Consumo Básico', CL: 'Consumo Básico',
  KOFM: 'Consumo Básico', MO: 'Consumo Básico', PM: 'Consumo Básico',

  // --- Salud ---
  CVS: 'Salud', BMY: 'Salud', BIIB: 'Salud', HAPV3: 'Salud',

  // --- Comunicaciones ---
  ANET: 'Comunicaciones', AMX: 'Comunicaciones', NOKA: 'Comunicaciones',
  ONDS: 'Comunicaciones', ASTS: 'Comunicaciones', SATL: 'Comunicaciones',
  JOYY: 'Comunicaciones', DISN: 'Comunicaciones',

  // --- Industrial ---
  HWM: 'Industrial', FDX: 'Industrial', PCAR: 'Industrial', EMBJ: 'Industrial',
  SNA: 'Industrial', SPCE: 'Industrial', RKLB: 'Industrial', ASR: 'Industrial',

  // --- Criptomonedas (mineras / plays cripto) ---
  BITF: 'Criptomonedas', HUT: 'Criptomonedas', RIOT: 'Criptomonedas',
  IREN: 'Criptomonedas', BMNR: 'Criptomonedas',
};
