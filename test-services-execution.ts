// Test script for services execution fix
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token

async function testServiceCreation() {
  console.log('\n=== Testing Service Creation ===\n');
  
  const testCases = [
    { name: 'Valid Type (Exterior)', data: { name_en: 'Test Wash', type: 'Exterior', price_small: 25, price_medium: 35, price_suv: 45 }, expectSuccess: true },
    { name: 'Case Insensitive (exterior)', data: { name_en: 'Test Wash 2', type: 'exterior', price_small: 25, price_medium: 35, price_suv: 45 }, expectSuccess: true },
    { name: 'Case Insensitive (INTERIOR)', data: { name_en: 'Test Wash 3', type: 'INTERIOR', price_small: 25, price_medium: 35, price_suv: 45 }, expectSuccess: true },
    { name: 'Invalid Type', data: { name_en: 'Test Wash 4', type: 'wash', price_small: 25, price_medium: 35, price_suv: 45 }, expectSuccess: false },
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/business/services`,
        testCase.data,
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
      );
      console.log(`✅ ${testCase.name}: SUCCESS - Service ID: ${response.data.id}, Type: ${response.data.type}`);
    } catch (error: any) {
      if (testCase.expectSuccess) {
        console.log(`❌ ${testCase.name}: FAILED - ${error.response?.data?.message || error.message}`);
      } else {
        console.log(`✅ ${testCase.name}: CORRECTLY REJECTED - ${error.response?.data?.message}`);
      }
    }
  }
}

async function testWashRecording() {
  console.log('\n=== Testing Wash Recording ===\n');
  
  // You'll need valid customer_id and service_id for this test
  const testData = {
    customer_id: 'CUSTOMER_ID_HERE',
    service_id: 1,
    car_size: 'medium',
    price: 35,
    payment_method: 'cash'
  };
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/business/washes`,
      testData,
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    console.log(`✅ Wash Recorded: ID: ${response.data.id}`);
  } catch (error: any) {
    console.log(`❌ Wash Recording Failed: ${error.response?.data?.message || error.message}`);
    console.log('Detail:', error.response?.data?.detail);
  }
}

async function testValidation() {
  console.log('\n=== Testing Validation ===\n');
  
  const validationTests = [
    { name: 'Invalid Car Size', data: { customer_id: 'test', service_id: 1, car_size: 'large', price: 35, payment_method: 'cash' } },
    { name: 'Invalid Payment Method', data: { customer_id: 'test', service_id: 1, car_size: 'medium', price: 35, payment_method: 'bank_transfer' } },
    { name: 'Missing Fields', data: { customer_id: 'test' } },
  ];
  
  for (const test of validationTests) {
    try {
      await axios.post(
        `${API_BASE_URL}/business/washes`,
        test.data,
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
      );
      console.log(`❌ ${test.name}: Should have failed but succeeded`);
    } catch (error: any) {
      console.log(`✅ ${test.name}: Correctly rejected - ${error.response?.data?.message}`);
    }
  }
}

async function runAllTests() {
  console.log('Starting Services Execution Fix Tests...\n');
  
  // Uncomment the tests you want to run
  // await testServiceCreation();
  // await testWashRecording();
  // await testValidation();
  
  console.log('\n=== Tests Complete ===\n');
}

runAllTests().catch(console.error);
