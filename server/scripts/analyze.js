import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = path.join(__dirname, '../data/autohub_db.json');
const excelFile = 'C:/Users/Bipin Chandra/.gemini/antigravity/brain/32b61dca-e883-44f1-bddf-f801ecf36164/.user_uploaded/media_1795094028650_a92c9658.xlsx';

const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
const wbExcel = xlsx.readFile(excelFile);
const excelData = xlsx.utils.sheet_to_json(wbExcel.Sheets[wbExcel.SheetNames[0]]);

const excelLoanIds = new Set(excelData.map(r => String(r['LOAN_ID'] || '').trim()));
const excelRegs = new Set(excelData.map(r => String(r['VehicleNo'] || '').trim().toUpperCase()));

console.log('Total DB vehicles:', db.vehicles.length);
console.log('Total Excel vehicles:', excelData.length);

const matchedInDb = [];
const notInExcel = [];
db.vehicles.forEach(v => {
  const loanMatch = excelLoanIds.has(String(v.source_loan_id));
  const regMatch = excelRegs.has(String(v.registration_number || '').trim().toUpperCase());
  if (loanMatch || regMatch) {
    matchedInDb.push(v);
  } else {
    notInExcel.push(v);
  }
});

console.log('Matched in DB:', matchedInDb.length);
console.log('In DB but not in Excel:', notInExcel.length);
notInExcel.forEach(v => {
  console.log(` - ID: ${v.id}, Reg: ${v.registration_number}, Model: ${v.model}, Desc: ${v.original_vehicle_description}, Status: ${v.publication_status}`);
});

