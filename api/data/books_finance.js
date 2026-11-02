// api/data/books_finance.js - Módulo de Libros de Finanzas, Trading y Análisis Fundamental
const fs = require('fs');
const path = require('path');

function getMd(filename) {
  return fs.readFileSync(path.join(__dirname, 'markdown', filename), 'utf8');
}

module.exports = [
  {
    key: 'secrets-weinstein',
    title: 'Secrets for Profiting in Bull and Bear Markets (Stan Weinstein)',
    categoryName: 'Technical Analysis',
    categoryId: 8,
    areaIds: [2, 5],
    tags: ['technical-analysis', 'trading', 'stage-analysis', 'trend-following', 'breakouts', 'risk-management'],
    isFavorite: 1,
    pinned: 1,
    content: getMd('secrets-weinstein.md')
  },
  {
    key: 'analisis-tecnico-gregorio',
    title: 'Análisis Técnico y Velas Japonesas (Gregorio Hernández)',
    categoryName: 'Technical Analysis',
    categoryId: 8,
    areaIds: [2, 5],
    tags: ['trading', 'technical-analysis', 'chartism', 'candlesticks', 'investing', 'chart-patterns'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('analisis-tecnico-gregorio.md')
  },
  {
    key: 'nuevo-vivir-del-trading',
    title: 'El Nuevo Vivir del Trading (Dr. Alexander Elder)',
    categoryName: 'Technical Analysis',
    categoryId: 8,
    areaIds: [2, 5],
    tags: ['trading', 'technical-analysis', 'psychology', 'risk-management', 'money-management', 'triple-screen'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('nuevo-vivir-del-trading.md')
  },
  {
    key: 'intelligent-investor',
    title: 'The Intelligent Investor (Benjamin Graham)',
    categoryName: 'Investing',
    categoryId: 7,
    areaIds: [2, 5],
    tags: ['value-investing', 'investing', 'margin-of-safety', 'benjamin-graham', 'finance', 'stocks'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('intelligent-investor.md')
  },
  {
    key: 'university-berkshire',
    title: 'University of Berkshire Hathaway (Daniel Pecaut)',
    categoryName: 'Investing',
    categoryId: 7,
    areaIds: [2, 5],
    tags: ['warren-buffett', 'charlie-munger', 'value-investing', 'fundamental-analysis', 'economic-moats', 'capital-allocation'],
    isFavorite: 1,
    pinned: 0,
    content: getMd('university-berkshire.md')
  },
  {
    key: 'your-money-your-life',
    title: 'Your Money or Your Life (Vicki Robin & Joe Dominguez)',
    categoryName: 'Personal Finance',
    categoryId: 10,
    areaIds: [2, 3, 5],
    tags: ['personal-finance', 'financial-independence', 'fire-movement', 'frugality', 'life-energy'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('your-money-your-life.md')
  },
  {
    key: 'almanack-naval',
    title: 'The Almanack of Naval Ravikant (Eric Jorgenson)',
    categoryName: 'Personal Finance',
    categoryId: 10,
    areaIds: [2, 3, 5],
    tags: ['naval-ravikant', 'wealth-creation', 'leverage', 'happiness', 'philosophy', 'mental-models'],
    isFavorite: 0,
    pinned: 0,
    content: getMd('almanack-naval.md')
  }
];
