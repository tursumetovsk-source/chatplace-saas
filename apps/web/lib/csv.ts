export function parseCsv(text: string, maxRows = 1_001) {
  const source = text.replace(/^\uFEFF/, '');
  const firstLine = source.split(/\r?\n/, 1)[0] || '';
  const delimiter = (firstLine.match(/;/g)?.length || 0) > (firstLine.match(/,/g)?.length || 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
      continue;
    }
    if (char === '"' && !field) quoted = true;
    else if (char === delimiter) { row.push(field); field = ''; }
    else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some(value => value.length)) rows.push(row);
      row = [];
      field = '';
      if (rows.length > maxRows) throw new Error(`CSV содержит больше ${maxRows - 1} строк данных`);
    } else field += char;
  }
  if (quoted) throw new Error('CSV содержит незакрытое поле в кавычках');
  row.push(field.replace(/\r$/, ''));
  if (row.some(value => value.length)) rows.push(row);
  if (rows.length > maxRows) throw new Error(`CSV содержит больше ${maxRows - 1} строк данных`);
  return rows;
}

function safeSpreadsheetValue(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return /^[\t ]*[=+\-@]/.test(text) ? `'${text}` : text;
}

export function csvRow(values: unknown[]) {
  return values.map(value => {
    const safe = safeSpreadsheetValue(value);
    return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  }).join(',');
}

export function normalizeCsvHeader(value: string) {
  return value.trim().toLocaleLowerCase('ru-RU').replace(/[\s-]+/g, '_');
}

export function parseConsent(value: string) {
  const normalized = value.trim().toLocaleLowerCase('ru-RU');
  if (!normalized) return undefined;
  if (['1', 'true', 'yes', 'да', 'согласие'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'нет', 'отписан'].includes(normalized)) return false;
  return undefined;
}
