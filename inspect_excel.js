import XLSX from 'xlsx';
import fs from 'fs';

const file = 'd:/Template/russian-lang/violations_2026-03-06.xlsx';
if (!fs.existsSync(file)) {
    console.log("File not found");
    process.exit(1);
}

const workbook = XLSX.readFile(file);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

const types = data.reduce((acc, r) => {
    const type = r['Тип'];
    acc[type] = (acc[type] || 0) + 1;
    return acc;
}, {});

console.log(JSON.stringify({
    total_rows: data.length,
    types_summary: types,
    sample: data.slice(0, 5)
}, null, 2));
