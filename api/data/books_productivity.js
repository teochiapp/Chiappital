// api/data/books_productivity.js - Módulo de Libros de Hábitos, Enfoque y Neuroproductividad
const fs = require('fs');
const path = require('path');

function getMd(filename) {
  return fs.readFileSync(path.join(__dirname, 'markdown', filename), 'utf8');
}

module.exports = [
  {
    key: 'atomic-habits',
    title: 'Atomic Habits (James Clear)',
    categoryName: 'Habits & Productivity',
    categoryId: 15,
    areaIds: [3, 5],
    tags: ['habits', 'productivity', 'psychology', 'systems', 'behavioral-design', 'atomic-habits'],
    isFavorite: 1,
    pinned: 0,
    content: getMd('atomic-habits.md')
  },
  {
    key: 'deep-work',
    title: 'Deep Work: Rules for Focused Success in a Distracted World (Cal Newport)',
    categoryName: 'Habits & Productivity',
    categoryId: 15,
    areaIds: [3, 5],
    tags: ['deep-work', 'productivity', 'focus', 'time-management', 'cognition', 'cal-newport'],
    isFavorite: 1,
    pinned: 0,
    content: getMd('deep-work.md')
  },
  {
    key: 'eat-that-frog',
    title: 'Eat That Frog!: 21 Great Ways to Stop Procrastinating and Get More Done (Brian Tracy)',
    categoryName: 'Habits & Productivity',
    categoryId: 15,
    areaIds: [3, 5],
    tags: ['productivity', 'time-management', 'focus', 'execution', 'priorities', 'brian-tracy'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('eat-that-frog.md')
  },
  {
    key: 'compound-effect',
    title: 'The Compound Effect (Darren Hardy)',
    categoryName: 'Habits & Productivity',
    categoryId: 15,
    areaIds: [3, 5],
    tags: ['compound-effect', 'productivity', 'habits', 'discipline', 'consistency', 'darren-hardy'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('compound-effect.md')
  },
  {
    key: 'hackea-tu-cerebro',
    title: 'Hackea tu Cerebro: Aprender a Aprender & Neuroproductividad (Nicolás Fernández Miranda)',
    categoryName: 'Habits & Productivity',
    categoryId: 15,
    areaIds: [3, 5],
    tags: ['neuroscience', 'learning', 'brain', 'productivity', 'dopamine', 'focus', 'memory'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('hackea-tu-cerebro.md')
  },
  {
    key: 'fitness-mindset',
    title: 'The Fitness Mindset (Brian Keane)',
    categoryName: 'Personal Growth',
    categoryId: 17,
    areaIds: [3, 5],
    tags: ['fitness', 'health', 'sleep', 'nutrition', 'energy', 'discipline', 'mindset'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('fitness-mindset.md')
  }
];
