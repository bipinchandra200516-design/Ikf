import xlsx from 'xlsx';
import crypto from 'crypto';

export const REQUIRED_COLUMNS = [
  'LOAN_BRANCH',
  'LOAN_ID',
  'CUSTOMER_NAME',
  'Aging_Days',
  'Sold Data',
  'B>Prices',
  'LOAN_PRODUCT',
  'VehicleNo',
  'YOM',
  'MAKE&VEHICLE_DESC',
  'CHASIS NUMBER',
  'ENGINE_NUMBER',
  'PIC',
  'Seized On',
  'YardContactNo',
  'Yard Name'
];

export const VALID_CATEGORIES = [
  'Own Car',
  'Taxi Car',
  'SCV',
  'LCV',
  'HCV',
  'Tractor',
  'CE'
];

// Smart description parser that extracts make, model, variant while preserving the exact original string
export function parseVehicleDescription(rawDesc) {
  if (!rawDesc) return { make: '', model: '', variant: '' };
  const desc = String(rawDesc).trim();

  // Known patterns in Indian automotive & commercial inventory:
  // e.g. "CELERIO ZXI+", "BALENO DELTA PETROL", "AL_DOST LS", "EICHER PRO 21.14", "SW_744", "TATA_3718"
  let make = '';
  let model = '';
  let variant = '';

  const upper = desc.toUpperCase();

  if (upper.startsWith('AL_DOST') || upper.includes('DOST')) {
    make = 'Ashok Leyland';
    model = 'Dost';
    variant = desc.replace(/AL_DOST|DOST/i, '').trim();
  } else if (upper.startsWith('SW_') || upper.includes('SWARAJ')) {
    make = 'Swaraj';
    model = desc.replace(/SW_/i, '').trim();
    variant = 'Agricultural Tractor';
  } else if (upper.startsWith('TATA_') || upper.startsWith('TATA ')) {
    make = 'Tata Motors';
    const rest = desc.replace(/^TATA[_ ]/i, '').trim();
    const parts = rest.split(/[\s_]+/);
    model = parts[0] || 'Commercial';
    variant = parts.slice(1).join(' ');
  } else if (upper.startsWith('EICHER')) {
    make = 'Eicher';
    const rest = desc.replace(/^EICHER\s*/i, '').trim();
    model = rest;
  } else if (upper.includes('CELERIO')) {
    make = 'Maruti Suzuki';
    model = 'Celerio';
    variant = desc.replace(/CELERIO/i, '').trim();
  } else if (upper.includes('BALENO')) {
    make = 'Maruti Suzuki';
    model = 'Baleno';
    variant = desc.replace(/BALENO/i, '').trim();
  } else if (upper.includes('SWIFT')) {
    make = 'Maruti Suzuki';
    model = 'Swift';
    variant = desc.replace(/SWIFT/i, '').trim();
  } else if (upper.includes('DZIRE')) {
    make = 'Maruti Suzuki';
    model = 'Dzire';
    variant = desc.replace(/DZIRE/i, '').trim();
  } else if (upper.includes('BOLERO')) {
    make = 'Mahindra';
    model = 'Bolero';
    variant = desc.replace(/BOLERO/i, '').trim();
  } else if (upper.includes('SCORPIO')) {
    make = 'Mahindra';
    model = 'Scorpio';
    variant = desc.replace(/SCORPIO/i, '').trim();
  } else if (upper.includes('MAHINDRA')) {
    make = 'Mahindra';
    const rest = desc.replace(/^MAHINDRA\s*/i, '').trim();
    model = rest;
  } else if (upper.includes('SONALIKA')) {
    make = 'Sonalika';
    model = desc.replace(/SONALIKA/i, '').trim();
    variant = 'Tractor';
  } else if (upper.includes('JOHN DEERE')) {
    make = 'John Deere';
    model = desc.replace(/JOHN DEERE/i, '').trim();
    variant = 'Tractor';
  } else if (upper.includes('JCB')) {
    make = 'JCB';
    model = desc.replace(/JCB\s*/i, '').trim() || '3DX Backhoe Loader';
    variant = 'Commercial Equipment';
  } else if (upper.includes('TIPPER')) {
    make = upper.startsWith('AL') || upper.includes('ASHOK') ? 'Ashok Leyland' : upper.includes('TATA') ? 'Tata Motors' : 'Commercial';
    model = desc;
    variant = 'Tipper';
  } else {
    // Generic fallback: first word is make or model
    const tokens = desc.split(/[\s_]+/);
    make = tokens[0] || 'Unknown';
    model = tokens.slice(1).join(' ') || tokens[0] || '';
  }

  return { make, model, variant };
}

// Normalize category whitespace and capitalization
export function normalizeCategory(raw) {
  if (!raw) return null;
  const str = String(raw).trim();
  const upper = str.toUpperCase();
  if (upper === 'CE' || upper === 'COMMERCIAL EQUIPMENT' || upper.includes('EQUIPMENT') || upper.includes('JCB')) {
    return 'CE';
  }
  for (const valid of VALID_CATEGORIES) {
    if (valid.toLowerCase() === str.toLowerCase()) {
      return valid;
    }
  }
  return str; // return as-is for validation detection
}

// Server-side URL safety check (SSRF prevention)
export function isSafeImageUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    // Block localhost and loopback
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') {
      return false;
    }

    // Block private IP ranges (RFC 1918) and cloud metadata (169.254.169.254)
    if (
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

// Parse date safely from Excel serial date or ISO/formatted string
export function parseExcelDate(val) {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') {
    // Excel epoch 1900
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  const dateStr = String(val).trim();
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return dateStr;
}

// Parse buffer into raw rows with column validation
export function parseExcelBuffer(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Spreadsheet contains no sheets');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    return {
      recognizedColumns: [],
      missingColumns: REQUIRED_COLUMNS,
      rows: [],
      rawHeaders: []
    };
  }

  const rawHeaders = Object.keys(rawRows[0]);
  const recognizedColumns = REQUIRED_COLUMNS.filter(col => rawHeaders.includes(col));
  const missingColumns = REQUIRED_COLUMNS.filter(col => !rawHeaders.includes(col));

  return {
    rawHeaders,
    recognizedColumns,
    missingColumns,
    rows: rawRows
  };
}

// Validate rows against business rules & current database
export function validateAndPreview(parsedData, existingVehicles, statusMappings) {
  const { rows, recognizedColumns, missingColumns } = parsedData;

  const statusMap = new Map();
  (statusMappings || []).forEach(m => {
    statusMap.set(m.source_value.toLowerCase().trim(), m);
  });

  const existingLoanIds = new Set(existingVehicles.map(v => v.source_loan_id).filter(Boolean));
  const existingRegNos = new Set(existingVehicles.map(v => v.registration_number).filter(Boolean));

  const validRecords = [];
  const invalidRecords = [];
  const categoriesDetected = new Set();
  let recordsWithPhotos = 0;
  let recordsWithoutPhotos = 0;
  let potentialDuplicatesCount = 0;
  const duplicateLoanIdsInFile = new Set();
  const seenLoanIds = new Set();

  rows.forEach((row, index) => {
    const rowNum = index + 2; // 1-based + 1 for header
    const errors = [];
    const warnings = [];

    // Extract exact fields
    const loanBranch = String(row['LOAN_BRANCH'] || '').trim();
    const loanId = String(row['LOAN_ID'] || '').trim();
    const customerName = String(row['CUSTOMER_NAME'] || '').trim();
    const agingDaysRaw = row['Aging_Days'];
    const soldData = String(row['Sold Data'] || '').trim();
    const rawPrice = row['B>Prices'];
    const rawCategory = row['LOAN_PRODUCT'];
    const vehicleNo = String(row['VehicleNo'] || '').trim();
    const rawYOM = row['YOM'];
    const makeDesc = String(row['MAKE&VEHICLE_DESC'] || '').trim();
    const chasisNumber = String(row['CHASIS NUMBER'] || '').trim();
    const engineNumber = String(row['ENGINE_NUMBER'] || '').trim();
    const rawPic = String(row['PIC'] || '').trim();
    const seizedOnRaw = row['Seized On'];
    const yardContactNo = String(row['YardContactNo'] || '').trim();
    const yardName = String(row['Yard Name'] || '').trim();

    // 1. Category validation
    const normalizedCat = normalizeCategory(rawCategory);
    if (!rawCategory) {
      errors.push('LOAN_PRODUCT (Vehicle Category) is required');
    } else if (!VALID_CATEGORIES.includes(normalizedCat)) {
      errors.push(`Unknown vehicle category "${rawCategory}". Allowed: ${VALID_CATEGORIES.join(', ')}`);
    } else {
      categoriesDetected.add(normalizedCat);
    }

    // 2. MAKE&VEHICLE_DESC validation
    if (!makeDesc) {
      errors.push('MAKE&VEHICLE_DESC is required');
    }

    // 3. YOM (Year of Manufacture)
    let yom = null;
    if (rawYOM !== undefined && rawYOM !== null && rawYOM !== '') {
      const parsedYear = parseInt(rawYOM, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(parsedYear) || parsedYear < 1980 || parsedYear > currentYear + 1) {
        errors.push(`Invalid YOM (Manufacturing Year): "${rawYOM}". Expected 4-digit year between 1980 and ${currentYear + 1}`);
      } else {
        yom = parsedYear;
      }
    } else {
      errors.push('YOM (Manufacturing Year) is required');
    }

    // 4. B>Prices validation
    let sourcePrice = null;
    if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '') {
      const cleanPrice = String(rawPrice).replace(/[^\d.-]/g, '');
      const parsedNum = parseFloat(cleanPrice);
      if (isNaN(parsedNum) || parsedNum < 0) {
        errors.push(`Invalid price format in B>Prices: "${rawPrice}"`);
      } else {
        sourcePrice = parsedNum;
      }
    } else {
      errors.push('B>Prices (Source Price) is required');
    }

    // 5. Aging Days
    let agingDays = 0;
    if (agingDaysRaw !== undefined && agingDaysRaw !== null && agingDaysRaw !== '') {
      const parsedAging = parseInt(agingDaysRaw, 10);
      if (!isNaN(parsedAging)) {
        agingDays = parsedAging;
      }
    }

    // 6. Photo URL validation
    let hasValidPhoto = false;
    let photoStatus = 'none';
    if (rawPic) {
      if (isSafeImageUrl(rawPic)) {
        hasValidPhoto = true;
        photoStatus = 'valid_url';
        recordsWithPhotos++;
      } else {
        photoStatus = 'invalid_url';
        warnings.push(`Image URL in PIC is invalid or insecure: "${rawPic.substring(0, 40)}..."`);
        recordsWithoutPhotos++;
      }
    } else {
      photoStatus = 'missing';
      recordsWithoutPhotos++;
    }

    // 7. Duplicate detection
    let isExistingInDb = false;
    let isDuplicateInFile = false;

    if (loanId) {
      if (seenLoanIds.has(loanId)) {
        isDuplicateInFile = true;
        duplicateLoanIdsInFile.add(loanId);
        warnings.push(`Duplicate LOAN_ID "${loanId}" in current spreadsheet`);
      } else {
        seenLoanIds.add(loanId);
      }

      if (existingLoanIds.has(loanId)) {
        isExistingInDb = true;
      }
    } else if (vehicleNo && existingRegNos.has(vehicleNo)) {
      isExistingInDb = true;
    }

    if (isExistingInDb || isDuplicateInFile) {
      potentialDuplicatesCount++;
    }

    // 8. Sold Data status mapping
    const cleanSold = soldData.toLowerCase().trim();
    const mapped = statusMap.get(cleanSold);
    let targetStatus = 'pending_review';
    let autoPublish = false;
    if (mapped) {
      targetStatus = mapped.target_status;
      autoPublish = mapped.auto_publish;
    } else if (cleanSold) {
      warnings.push(`Unrecognized "Sold Data" value "${soldData}". Defaulting to Pending Review.`);
    }

    const seizedOn = parseExcelDate(seizedOnRaw);
    const parsedDesc = parseVehicleDescription(makeDesc);

    const recordData = {
      rowIndex: rowNum,
      source_loan_id: loanId,
      branch_location: loanBranch,
      internal_customer_name: customerName,
      internal_aging_days: agingDays,
      source_sale_status: soldData,
      source_price: sourcePrice,
      vehicle_category: normalizedCat,
      registration_number: vehicleNo,
      manufacturing_year: yom,
      original_vehicle_description: makeDesc,
      make: parsedDesc.make,
      model: parsedDesc.model,
      variant: parsedDesc.variant,
      internal_chassis_number: chasisNumber,
      internal_engine_number: engineNumber,
      source_image_url: rawPic,
      photo_status: photoStatus,
      internal_seized_on: seizedOn,
      internal_yard_contact: yardContactNo,
      yard_name: yardName,
      target_availability_status: targetStatus,
      auto_publish: autoPublish,
      is_existing_in_db: isExistingInDb,
      is_duplicate_in_file: isDuplicateInFile
    };

    if (errors.length > 0) {
      invalidRecords.push({
        rowIndex: rowNum,
        record: recordData,
        errors,
        warnings
      });
    } else {
      validRecords.push({
        rowIndex: rowNum,
        record: recordData,
        warnings
      });
    }
  });

  return {
    totalRows: rows.length,
    recognizedColumnsCount: recognizedColumns.length,
    recognizedColumns,
    missingColumns,
    categoriesDetected: Array.from(categoriesDetected),
    recordsWithPhotos,
    recordsWithoutPhotos,
    potentialDuplicatesCount,
    validRecordsCount: validRecords.length,
    invalidRecordsCount: invalidRecords.length,
    validRecords,
    invalidRecords,
    summary: {
      newRecordsCount: validRecords.filter(r => !r.record.is_existing_in_db).length,
      existingRecordsCount: validRecords.filter(r => r.record.is_existing_in_db).length
    }
  };
}

// Generate downloadable sample Excel template
export function generateSampleTemplate() {
  const headers = REQUIRED_COLUMNS;
  const sampleData = [
    {
      'LOAN_BRANCH': 'Delhi North',
      'LOAN_ID': 'LN-2024-001',
      'CUSTOMER_NAME': 'Ramesh Kumar',
      'Aging_Days': 18,
      'Sold Data': 'to be sale',
      'B>Prices': 525000,
      'LOAN_PRODUCT': 'Own Car',
      'VehicleNo': 'DL-01-AB-1234',
      'YOM': 2021,
      'MAKE&VEHICLE_DESC': 'BALENO DELTA PETROL',
      'CHASIS NUMBER': 'MBHBA43SML110022',
      'ENGINE_NUMBER': 'K12MN110022',
      'PIC': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
      'Seized On': '2024-02-10',
      'YardContactNo': '+91 98111 22334',
      'Yard Name': 'GT Road Logistics Yard'
    },
    {
      'LOAN_BRANCH': 'Mumbai Central',
      'LOAN_ID': 'LN-2024-002',
      'CUSTOMER_NAME': 'Vijay Jadhav',
      'Aging_Days': 25,
      'Sold Data': 'to be sale',
      'B>Prices': 395000,
      'LOAN_PRODUCT': 'Taxi Car',
      'VehicleNo': 'MH-02-CD-5678',
      'YOM': 2020,
      'MAKE&VEHICLE_DESC': 'CELERIO ZXI+ CNG',
      'CHASIS NUMBER': 'MA3FNEB1S112233',
      'ENGINE_NUMBER': 'K10B112233',
      'PIC': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
      'Seized On': '2024-01-20',
      'YardContactNo': '+91 98222 33445',
      'Yard Name': 'Bhiwandi Auto Terminal'
    },
    {
      'LOAN_BRANCH': 'Noida Hub',
      'LOAN_ID': 'LN-2024-003',
      'CUSTOMER_NAME': 'Amit Singh',
      'Aging_Days': 12,
      'Sold Data': 'to be sale',
      'B>Prices': 480000,
      'LOAN_PRODUCT': 'SCV',
      'VehicleNo': 'UP-16-EF-9012',
      'YOM': 2022,
      'MAKE&VEHICLE_DESC': 'AL_DOST LS DIESEL',
      'CHASIS NUMBER': 'MB1A2C3D4E998877',
      'ENGINE_NUMBER': 'TDCR15X9988',
      'PIC': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1000&q=80',
      'Seized On': '2024-02-15',
      'YardContactNo': '+91 99111 44556',
      'Yard Name': 'Greater Noida Transport Nagar'
    },
    {
      'LOAN_BRANCH': 'Gurgaon Yard',
      'LOAN_ID': 'LN-2024-004',
      'CUSTOMER_NAME': 'Satnam Freight Movers',
      'Aging_Days': 30,
      'Sold Data': 'to be sale',
      'B>Prices': 910000,
      'LOAN_PRODUCT': 'LCV',
      'VehicleNo': 'HR-55-GH-3456',
      'YOM': 2019,
      'MAKE&VEHICLE_DESC': 'EICHER PRO 21.14',
      'CHASIS NUMBER': 'MC2B17CK0KC88776',
      'ENGINE_NUMBER': 'E483TCI8877',
      'PIC': 'https://images.unsplash.com/photo-1586191582056-a6519184518d?auto=format&fit=crop&w=1000&q=80',
      'Seized On': '2024-01-05',
      'YardContactNo': '+91 98111 66778',
      'Yard Name': 'Manesar Logistics Center'
    },
    {
      'LOAN_BRANCH': 'Jaipur North',
      'LOAN_ID': 'LN-2024-005',
      'CUSTOMER_NAME': 'Rajasthan Roadways Transport',
      'Aging_Days': 45,
      'Sold Data': 'to be sale',
      'B>Prices': 1720000,
      'LOAN_PRODUCT': 'HCV',
      'VehicleNo': 'RJ-14-IJ-7890',
      'YOM': 2020,
      'MAKE&VEHICLE_DESC': 'TATA_3718 COWL',
      'CHASIS NUMBER': 'MAT443012L0C11223',
      'ENGINE_NUMBER': 'ISBE5.9112',
      'PIC': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1000&q=80',
      'Seized On': '2023-12-28',
      'YardContactNo': '+91 94140 33221',
      'Yard Name': 'Transport Nagar Depot'
    },
    {
      'LOAN_BRANCH': 'Ludhiana Central',
      'LOAN_ID': 'LN-2024-006',
      'CUSTOMER_NAME': 'Gurpreet Singh',
      'Aging_Days': 10,
      'Sold Data': 'to be sale',
      'B>Prices': 475000,
      'LOAN_PRODUCT': 'Tractor',
      'VehicleNo': 'PB-10-KL-1357',
      'YOM': 2021,
      'MAKE&VEHICLE_DESC': 'SW_744 FE 48HP',
      'CHASIS NUMBER': 'SW744T091122C',
      'ENGINE_NUMBER': 'RB33.0112',
      'PIC': 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=80',
      'Seized On': '2024-02-01',
      'YardContactNo': '+91 98720 55667',
      'Yard Name': 'Agri Yard Samrala Road'
    }
  ];

  const worksheet = xlsx.utils.json_to_sheet(sampleData, { header: headers });
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'AutoHub_Inventory');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
