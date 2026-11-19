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

const existingIds = new Set(db.vehicles.map(v => String(v.source_loan_id)));

const newRows = excelData.filter(r => !existingIds.has(String(r['LOAN_ID'] || '').trim()));
console.log(`New rows to add: ${newRows.length}`);

let withPic = 0;
let withoutPic = 0;

newRows.forEach(r => {
  const pic = String(r['pic'] || '').trim();
  if (pic && pic.startsWith('http')) {
    withPic++;
    console.log(`NEW WITH PIC: Loan ${r['LOAN_ID']} | ${r['VehicleNo']} | ${r['VEHICLE_DESC']} -> ${pic.substring(0, 50)}...`);
  } else {
    withoutPic++;
    console.log(`NEW WITHOUT PIC: Loan ${r['LOAN_ID']} | ${r['VehicleNo']} | ${r['VEHICLE_DESC']}`);
  }
});

console.log(`Summary of new rows: ${withPic} with pic, ${withoutPic} without pic`);
