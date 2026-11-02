// api/data/books_philosophy_psychology.js - Módulo de Filosofía Estoica, Psicología, Poder y Modelos Mentales
const fs = require('fs');
const path = require('path');

function getMd(filename) {
  return fs.readFileSync(path.join(__dirname, 'markdown', filename), 'utf8');
}

module.exports = [
  {
    key: 'little-book-stoicism',
    title: 'The Little Book of Stoicism (Jonas Salzgeber)',
    categoryName: 'Philosophy',
    categoryId: 14,
    areaIds: [3, 5],
    tags: ['stoicism', 'philosophy', 'virtue', 'mindset', 'resilience', 'eudaimonia', 'jonas-salzgeber'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('little-book-stoicism.md')
  },
  {
    key: 'daily-stoic',
    title: 'The Daily Stoic (Ryan Holiday)',
    categoryName: 'Philosophy',
    categoryId: 14,
    areaIds: [3, 5],
    tags: ['stoicism', 'ryan-holiday', 'philosophy', 'wisdom', 'mental-toughness', 'marcus-aurelius', 'seneca'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('daily-stoic.md')
  },
  {
    key: 'obstacle-is-the-way',
    title: 'The Obstacle is the Way: The Timeless Art of Turning Trials into Triumph (Ryan Holiday)',
    categoryName: 'Philosophy',
    categoryId: 14,
    areaIds: [3, 5],
    tags: ['stoicism', 'ryan-holiday', 'resilience', 'adversity', 'action', 'mindset', 'marcus-aurelius'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('obstacle-is-the-way.md')
  },
  {
    key: 'ego-is-the-enemy',
    title: 'Ego is the Enemy (Ryan Holiday)',
    categoryName: 'Philosophy',
    categoryId: 14,
    areaIds: [3, 5],
    tags: ['ego', 'ryan-holiday', 'stoicism', 'humility', 'psychology', 'leadership'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('ego-is-the-enemy.md')
  },
  {
    key: '48-laws-of-power',
    title: 'The 48 Laws of Power (Robert Greene)',
    categoryName: 'Psychology',
    categoryId: 13,
    areaIds: [3, 5],
    tags: ['power', 'psychology', 'strategy', 'human-nature', 'robert-greene', 'influence', 'machiavelli'],
    isFavorite: 1,
    pinned: 0,
    content: getMd('48-laws-of-power.md')
  },
  {
    key: 'win-friends',
    title: 'How to Win Friends and Influence People (Dale Carnegie)',
    categoryName: 'Psychology',
    categoryId: 13,
    areaIds: [3, 5],
    tags: ['communication', 'relationships', 'social-skills', 'influence', 'leadership', 'dale-carnegie'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('win-friends.md')
  },
  {
    key: 'surrounded-by-idiots',
    title: 'Surrounded by Idiots: The 4 DISC Types (Thomas Erikson)',
    categoryName: 'Psychology',
    categoryId: 13,
    areaIds: [3, 5],
    tags: ['communication', 'personality-types', 'disc-model', 'teamwork', 'psychology', 'thomas-erikson'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('surrounded-by-idiots.md')
  },
  {
    key: 'pensar-rapido-despacio',
    title: 'Pensar Rápido, Pensar Despacio (Daniel Kahneman)',
    categoryName: 'Decision Making',
    categoryId: 16,
    areaIds: [2, 3, 5],
    tags: ['behavioral-economics', 'psychology', 'decision-making', 'cognitive-biases', 'investing', 'kahneman'],
    isFavorite: 1,
    pinned: 0,
    content: getMd('pensar-rapido-despacio.md')
  },
  {
    key: 'same-as-ever',
    title: 'Same as Ever: A Guide to What Never Changes (Morgan Housel)',
    categoryName: 'Decision Making',
    categoryId: 16,
    areaIds: [2, 3, 5],
    tags: ['investing', 'psychology', 'human-nature', 'decision-making', 'risk', 'history', 'morgan-housel'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('same-as-ever.md')
  },
  {
    key: 'road-less-stupid',
    title: 'The Road Less Stupid: Advice from the Chairman of the Board (Keith Cunningham)',
    categoryName: 'Decision Making',
    categoryId: 16,
    areaIds: [2, 3, 5],
    tags: ['decision-making', 'business', 'strategy', 'thinking-time', 'risk-management', 'mental-models', 'keith-cunningham'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('road-less-stupid.md')
  }
];
