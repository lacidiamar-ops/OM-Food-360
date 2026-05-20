export const WATER_SOURCES = {
  flat: {
    label: 'Eau plate',
    icon: '💧',
    color: 'var(--color-primary)',
    bicarbonates_mg_per_l: 0,
    sodium_mg_per_l: 0,
  },
  st_yorre: {
    label: 'St. Yorre',
    icon: '⚡',
    color: 'var(--color-warning)',
    bicarbonates_mg_per_l: 1708,
    sodium_mg_per_l: 150,
    magnesium_mg_per_l: 11,
    calcium_mg_per_l: 90,
    note: 'Recommandée veille + jour de match — alcalinisation',
  },
  isotonic_powerbar: {
    label: 'PowerBar Isotonic',
    icon: '⚡',
    color: 'var(--color-energy)',
    sodium_mg_per_l: 460,
    potassium_mg_per_l: 148,
    note: 'Pendant effort > 45min',
  },
  isotonic_apurna: {
    label: 'Apurna Isotonique',
    icon: '⚡',
    color: 'var(--color-active)',
    sodium_mg_per_l: 420,
    note: 'Pendant effort, goût neutre',
  },
  sislab_electrolyte: {
    label: 'SiSLab Electrolyte',
    icon: '🔋',
    color: 'var(--color-active)',
    note: 'Récupération post-effort et chaleur',
  },
  sislab_rego: {
    label: 'SiSLab REGO',
    icon: '🔄',
    color: 'var(--color-success)',
    note: 'Post-match immédiat — dans les 20 minutes',
  },
} as const;

export type WaterSourceKey = keyof typeof WATER_SOURCES;

export const HYDRATION_PROTOCOLS: Record<string, {
  flat_ml: number;
  st_yorre_ml: number;
  isotonic_ml: number;
  sislab_rego_ml?: number;
  note?: string;
}> = {
  'j-5': { flat_ml: 3000, st_yorre_ml: 0, isotonic_ml: 500 },
  'j-4': { flat_ml: 3000, st_yorre_ml: 0, isotonic_ml: 500 },
  'j-3': { flat_ml: 3000, st_yorre_ml: 250, isotonic_ml: 300 },
  'j-2': { flat_ml: 2500, st_yorre_ml: 500, isotonic_ml: 300 },
  'j-1': {
    flat_ml: 2500, st_yorre_ml: 1000, isotonic_ml: 0,
    note: 'Veille match — 250ml St Yorre ×4 répartis sur la journée',
  },
  match: {
    flat_ml: 1500, st_yorre_ml: 500, isotonic_ml: 750, sislab_rego_ml: 400,
    note: 'St Yorre à jeun + H-2. SiSLab REGO dans les 20min post-match',
  },
  'j+1': {
    flat_ml: 3000, st_yorre_ml: 500, isotonic_ml: 0,
    note: 'Réhydratation complète + réalcalinisation',
  },
};

export const URINE_COLORS = [
  { level: 1, label: 'Très clair — excellent', color: '#fffde7', status: 'gold' },
  { level: 2, label: 'Paille clair — bon', color: '#fff9c4', status: 'gold' },
  { level: 3, label: 'Paille — correct', color: '#f9e48a', status: 'green' },
  { level: 4, label: 'Jaune — acceptable', color: '#f4c542', status: 'yellow' },
  { level: 5, label: 'Ambré — boire plus', color: '#e6a817', status: 'orange' },
  { level: 6, label: 'Orange — déshydraté', color: '#c97a10', status: 'orange' },
  { level: 7, label: 'Brun clair — alerte', color: '#8b4513', status: 'red' },
  { level: 8, label: 'Brun foncé — urgence', color: '#4a2507', status: 'red' },
] as const;
