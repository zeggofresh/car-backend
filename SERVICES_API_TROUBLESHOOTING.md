# Services API - Troubleshooting Guide

## Problem: GET /api/business/services returns `[]` (empty array)

### ✅ The API is Working Correctly

The services endpoint is **NOT broken** - it's filtering by your business_id. If it returns an empty array, it means there are no services associated with YOUR specific business account.

---

## 🔍 Root Cause Analysis

The API uses this query:
```sql
SELECT * FROM services WHERE business_id = YOUR_TOKEN_BUSINESS_ID
```

**Current Database Status:**
- Total services in database: **8 services**
- These services belong to 4 different businesses:
  - `abc wash`: 3 services
  - `jwhj`: 1 service
  - `Fantazia`: 1 service
  - "The Dessert Bar": 3 services

If you're getting `[]`, your business account doesn't have any services created yet.

---

## 🛠️ How to Fix

### Solution 1: Create Services (Recommended)

You need to create services for your business using the POST endpoint.

#### Using JavaScript/Fetch:

```javascript
const token = 'YOUR_JWT_TOKEN'; // Replace with your actual token

const response = await fetch('https://car-backend-production-36e6.up.railway.app/api/business/services', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name_en: "Full Wash",
    name_ar: "غسيل كامل",
    type: "Full",
    price_small: 30,
    price_medium: 40,
    price_suv: 50,
    active: true
  })
});

if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}

const service = await response.json();
console.log('Service created:', service);
```

#### Using Postman/Insomnia:

1. **Method:** POST
2. **URL:** `https://car-backend-production-36e6.up.railway.app/api/business/services`
3. **Headers:**
   - `Authorization: Bearer YOUR_TOKEN_HERE`
   - `Content-Type: application/json`
4. **Body (raw JSON):**
```json
{
  "name_en": "Full Wash",
  "name_ar": "غسيل كامل",
  "type": "Full",
  "price_small": 30,
  "price_medium": 40,
  "price_suv": 50,
  "active": true
}
```

#### Using curl:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name_en": "Full Wash",
    "name_ar": "غسيل كامل",
    "type": "Full",
    "price_small": 30,
    "price_medium": 40,
    "price_suv": 50
  }' \
  https://car-backend-production-36e6.up.railway.app/api/business/services
```

---

## ✅ Required Fields for Creating Services

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name_en` | String | ✅ Yes | Service name in English |
| `type` | String | ✅ Yes | Must be one of: `Exterior`, `Interior`, `Full`, `Full Detailing` |
| `price_small` | Number | ✅ Yes | Price for small cars |
| `price_medium` | Number | ✅ Yes | Price for medium cars |
| `price_suv` | Number | ✅ Yes | Price for SUV/large cars |
| `name_ar` | String | ⭕ No | Service name in Arabic |
| `active` | Boolean | ⭕ No | Defaults to `true` |

---

## 🔐 Authentication Check

### Step 1: Verify Your Token

Your JWT token must include:
```json
{
  "business_id": "your-business-uuid-here",
  "role": "business_owner",
  ...
}
```

**How to check:**
1. Copy your token
2. Go to https://jwt.io
3. Paste your token
4. Check the payload for `business_id` field

### Step 2: Common Authentication Mistakes

❌ **Using customer token instead of business_owner token**
- Customers don't have `business_id` in their token
- You must login as a business owner

❌ **Token expired**
- Tokens typically expire after 24 hours
- Get a fresh token by logging in again

❌ **Wrong environment**
- Make sure you're using production URL with production token
- Or local URL with local development token

---

## 📋 Complete API Reference

### GET /api/business/services
Returns all services for your business.

**Response Example:**
```json
[
  {
    "id": 1,
    "business_id": "5cc4bd34-21d5-48fb-b3f7-dc46213f5609",
    "name_en": "Full Wash",
    "name_ar": "غسيل كامل",
    "type": "Full",
    "price_small": "30.00",
    "price_medium": "40.00",
    "price_suv": "50.00",
    "active": true,
    "created_at": "2026-04-02T10:00:00Z"
  }
]
```

### POST /api/business/services
Create a new service.

**Request:** See examples above  
**Response:** Returns the created service object

### PUT /api/business/services/:id
Update an existing service.

**Request Body:**
```json
{
  "id": 1,
  "name_en": "Updated Name",
  "type": "Full",
  "price_small": 35,
  "price_medium": 45,
  "price_suv": 55,
  "active": true
}
```

### DELETE /api/business/services/:id
Delete a service.

**Response:**
```json
{
  "message": "Deleted"
}
```

---

## 🧪 Testing Checklist

- [ ] I have a valid JWT token for a business_owner account
- [ ] My token is not expired (check expiration)
- [ ] My token contains the `business_id` field
- [ ] I'm sending the Authorization header correctly
- [ ] I created at least one service using POST
- [ ] I'm using the correct API URL

---

## 💡 Quick Start - Create Your First 3 Services

Copy and paste these examples to quickly populate your services:

### Service 1: Full Wash
```json
{
  "name_en": "Full Wash",
  "name_ar": "غسيل كامل",
  "type": "Full",
  "price_small": 30,
  "price_medium": 40,
  "price_suv": 50
}
```

### Service 2: Exterior Only
```json
{
  "name_en": "Exterior Wash",
  "name_ar": "غسيل خارجي",
  "type": "Exterior",
  "price_small": 20,
  "price_medium": 25,
  "price_suv": 30
}
```

### Service 3: Interior Detailing
```json
{
  "name_en": "Interior Detailing",
  "name_ar": "تنظيف داخلي",
  "type": "Interior",
  "price_small": 40,
  "price_medium": 50,
  "price_suv": 60
}
```

---

## 🚨 Still Not Working?

### Debug Steps:

1. **Check the logs:**
   - Backend logs will show: `Fetching services for business: YOUR_BUSINESS_ID`
   - This helps verify which business_id is being used

2. **Verify database connection:**
   ```bash
   node check-db.ts
   ```

3. **Check your business exists:**
   Run in database:
   ```sql
   SELECT id, name FROM businesses;
   ```

4. **Manually check services:**
   ```sql
   SELECT * FROM services WHERE business_id = 'YOUR_BUSINESS_ID';
   ```

---

## 📞 Summary

**Problem:** Empty array from GET /api/business/services  
**Cause:** No services created for your business yet  
**Solution:** Use POST endpoint to create services first  

The API is working correctly - it's just filtering by your business_id as designed for data security and isolation.

---

**Last Updated:** April 2, 2026  
**Status:** ✅ API Working as Expected
