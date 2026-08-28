const xlsx = require('xlsx');

const workbook = xlsx.readFile('c:/Users/teoch/OneDrive/Desktop/React/Chiappital/Chiappital/IEB-2026-08-28-Portafolio-347621-ARS.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

for (let i = 8; i < 30; i++) {
  console.log(`Row ${i}:`, data[i]);
}
