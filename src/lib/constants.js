export const MARKET_TYPES = [
  { value: '1N2', label: 'Résultat final (1N2)' },
  { value: 'exact_score', label: 'Score exact' },
  { value: 'ht_ft', label: 'Mi-temps / Fin de match' },
  { value: 'total_goals', label: 'Total de buts' },
  { value: 'scorer', label: 'Buteur' },
  { value: 'custom', label: 'Personnalisé' },
];

export const MARKET_PRESETS = {
  '1N2': {
    label: 'Résultat final',
    options: [
      { label: 'Domicile', odds: 2.0 },
      { label: 'Nul', odds: 3.0 },
      { label: 'Extérieur', odds: 2.5 },
    ],
  },
  exact_score: {
    label: 'Score exact',
    options: [
      { label: '1-0', odds: 6.0 },
      { label: '2-1', odds: 7.0 },
      { label: '0-0', odds: 8.0 },
    ],
  },
  ht_ft: {
    label: 'Mi-temps / Fin de match',
    options: [
      { label: 'Dom/Dom', odds: 2.5 },
      { label: 'Nul/Dom', odds: 5.0 },
      { label: 'Ext/Ext', odds: 3.0 },
    ],
  },
  total_goals: {
    label: 'Total de buts',
    options: [
      { label: '0-1 buts', odds: 3.0 },
      { label: '2-3 buts', odds: 2.0 },
      { label: '4+ buts', odds: 3.5 },
    ],
  },
  scorer: {
    label: 'Buteur',
    options: [
      { label: 'Joueur A', odds: 3.0 },
      { label: 'Joueur B', odds: 4.0 },
    ],
  },
  custom: {
    label: 'Personnalisé',
    options: [
      { label: 'Option 1', odds: 2.0 },
      { label: 'Option 2', odds: 2.0 },
    ],
  },
};
