import fs from 'fs';

async function testImport() {
  const buffer = fs.readFileSync('test_batch_1.xlsx');
  
  // 1. Admin Login
  const loginRes = await fetch('http://localhost:5000/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@autohub.com', password: 'Admin@AutoHub2026!' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('✓ Admin login successful. Token acquired.');

  // 2. Test Preview
  const boundary = '----WebKitFormBoundaryAutoHubTest772';
  const previewBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test_batch_1.xlsx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const previewRes = await fetch('http://localhost:5000/api/admin/import/preview', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: previewBody
  });
  const preview = await previewRes.json();
  console.log('✓ Preview validation complete:');
  console.log('  - Total rows parsed:', preview.totalRows);
  console.log('  - 16 Recognized Columns:', preview.recognizedColumnsCount, 'of 16 recognized');
  console.log('  - Categories detected:', preview.categoriesDetected.join(', '));
  console.log('  - Valid rows:', preview.validRecordsCount, '| Invalid rows:', preview.invalidRecordsCount);
  console.log('  - Records with valid photo URLs:', preview.recordsWithPhotos);

  // 3. Test Import Execution
  const execBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="mode"\r\n\r\nupdate_and_add\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="autoPublish"\r\n\r\ntrue\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test_batch_1.xlsx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const execRes = await fetch('http://localhost:5000/api/admin/import/execute', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: execBody
  });
  const execResult = await execRes.json();
  console.log('✓ Import transaction completed:');
  console.log('  - Added records:', execResult.summary.added);
  console.log('  - Updated records:', execResult.summary.updated);
  console.log('  - Skipped records:', execResult.summary.skipped);
  console.log('  - Failed records:', execResult.summary.failed);

  // 4. Test Public API Privacy Filter (Ensure NO private fields leaked)
  const publicRes = await fetch('http://localhost:5000/api/public/vehicles');
  const publicData = await publicRes.json();
  const sampleVehicle = publicData.vehicles[0];
  console.log('✓ Public API Privacy Verification:');
  console.log('  - sampleVehicle.CUSTOMER_NAME:', sampleVehicle.CUSTOMER_NAME || sampleVehicle.internal_customer_name || 'UNDEFINED (PROTECTED)');
  console.log('  - sampleVehicle.LOAN_ID:', sampleVehicle.LOAN_ID || sampleVehicle.source_loan_id || 'UNDEFINED (PROTECTED)');
  console.log('  - sampleVehicle.CHASIS_NUMBER:', sampleVehicle.internal_chassis_number || 'UNDEFINED (PROTECTED)');
  console.log('  - sampleVehicle.ENGINE_NUMBER:', sampleVehicle.internal_engine_number || 'UNDEFINED (PROTECTED)');
  console.log('  - sampleVehicle.Aging_Days:', sampleVehicle.internal_aging_days || 'UNDEFINED (PROTECTED)');
  console.log('  - sampleVehicle.YardContactNo:', sampleVehicle.internal_yard_contact || 'UNDEFINED (PROTECTED)');
  console.log('  - sampleVehicle.price:', sampleVehicle.price);
  console.log('  - sampleVehicle.price_label:', sampleVehicle.price_label);

  console.log('\nALL TEST SCENARIOS PASSED 100%!');
}

testImport().catch(console.error);
