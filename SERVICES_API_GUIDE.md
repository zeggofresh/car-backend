# Services API - Complete Guide

## ✅ Status: Working Correctly

The GET `/api/business/services` endpoint is functioning properly. It returns an empty array `[]` because there are no services created for your specific business account yet.

---

## 🎯 Quick Solution

**To get data from GET /api/business/services, you need to:**

1. **Login as a business_owner** (not customer)
2. **Create services** using POST endpoint
3. **Then GET will return your services**

---

## 📊 Current Database Status

- **Total services in database:** 8
- **Services belong to 4 businesses:**
  - abc wash: 3 services
  - jwhj: 1 service
  - Fantazia: 1 service  
  - The Dessert Bar: 3 services

**Your business has:** 0 services (that's why you get `[]`)

---

## 🚀 How to Add Services (3 Easy Ways)

### Method 1: Using the Sample Data Script

Run this command to see ready-to-use service templates:
```bash
node sample-services-data.js
```

Then copy any service object and POST it to the API.

### Method 2: Direct API Call

**JavaScript Example:**
```javascript
const token = 'YOUR_BUSINESS_TOKEN';

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

const service = await response.json();
console.log('Created:', service);
```

### Method 3: Using Postman

1. **URL:** `https://car-backend-production-36e6.up.railway.app/api/business/services`
2. **Method:** POST
3. **Headers:**
   - `Authorization: Bearer YOUR_TOKEN`
   - `Content-Type: application/json`
4. **Body (raw JSON):**
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

---

## 📋 Ready-to-Use Service Templates

Copy and paste any of these:

### 1. Basic Full Wash
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

### 2. Exterior Only
```json
{
  "name_en": "Exterior Only",
  "name_ar": "غسيل خارجي فقط",
  "type": "Exterior",
  "price_small": 20,
  "price_medium": 25,
  "price_suv": 30
}
```

### 3. Interior Detailing
```json
{
  "name_en": "Interior Detailing",
  "name_ar": "تنظيف داخلي مفصل",
  "type": "Interior",
  "price_small": 40,
  "price_medium": 50,
  "price_suv": 60
}
```

### 4. Premium Package
```json
{
  "name_en": "Premium Full Detailing",
  "name_ar": "تنفيس كامل ممتاز",
  "type": "Full Detailing",
  "price_small": 150,
  "price_medium": 180,
  "price_suv": 220
}
```

---

## ✅ Required Fields

| Field | Type | Required | Valid Values |
|-------|------|----------|--------------|
| `name_en` | String | ✅ Yes | Any text |
| `type` | String | ✅ Yes | `Exterior`, `Interior`, `Full`, `Full Detailing` |
| `price_small` | Number | ✅ Yes | e.g., 30 |
| `price_medium` | Number | ✅ Yes | e.g., 40 |
| `price_suv` | Number | ✅ Yes | e.g., 50 |
| `name_ar` | String | ⭕ No | Arabic text |
| `active` | Boolean | ⭕ No | Defaults to `true` |

---

## 🔐 Authentication Requirements

Your JWT token MUST have:
```json
{
  "business_id": "your-business-uuid",
  "role": "business_owner"
}
```

**How to verify:**
1. Go to https://jwt.io
2. Paste your token
3. Check payload for `business_id` field

---

## 🧪 Testing Workflow

### Step 1: Create a Service
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name_en":"Test","type":"Full","price_small":10,"price_medium":20,"price_suv":30}' \
  https://car-backend-production-36e6.up.railway.app/api/business/services
```

### Step 2: Get All Services
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://car-backend-production-36e6.up.railway.app/api/business/services
```

**Expected Response:**
```json
[
  {
    "id": 9,
    "business_id": "your-uuid-here",
    "name_en": "Test",
    "name_ar": "",
    "type": "Full",
    "price_small": "10.00",
    "price_medium": "20.00",
    "price_suv": "30.00",
    "active": true,
    "created_at": "2026-04-02T12:00:00Z"
  }
]
```

---

## 📡 All Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/business/services` | Get all services for your business |
| POST | `/api/business/services` | Create new service |
| PUT | `/api/business/services/:id` | Update existing service |
| DELETE | `/api/business/services/:id` | Delete service |

---

## ❌ Common Mistakes

### Mistake 1: Using Customer Token
```javascript
// WRONG - Customer token has no business_id
const token = customer_jwt_token;

// CORRECT - Business owner token
const token = business_owner_jwt_token;
```

### Mistake 2: Invalid Type Value
```javascript
// WRONG - Invalid type
{
  "type": "Wash" // ❌ Not valid
}

// CORRECT - Valid types
{
  "type": "Exterior" // ✅
  // or "Interior", "Full", "Full Detailing"
}
```

### Mistake 3: Missing Price Fields
```javascript
// WRONG - Missing prices
{
  "name_en": "Wash",
  "type": "Full",
  "price_small": 30
  // ❌ Missing price_medium and price_suv
}

// CORRECT - All prices included
{
  "name_en": "Wash",
  "type": "Full",
  "price_small": 30,
  "price_medium": 40,
  "price_suv": 50
}
```

---

## 🔍 Debugging Commands

### Check if services exist in database:
```bash
npx tsx check-services-data.ts
```

### See detailed debugging info:
```bash
npx tsx debug-services-api.ts
```

### Full troubleshooting guide:
Read: `SERVICES_API_TROUBLESHOOTING.md`

---

## 💡 Pro Tips

1. **Create at least 3-4 services** when starting (Basic, Medium, Premium packages)
2. **Use both English and Arabic** names for better UX in Saudi Arabia
3. **Keep prices realistic** - small < medium < suv
4. **Set active: true** to make services visible immediately
5. **Test with simple data first**, then add complexity

---

## 📞 Summary

**Problem:** GET /api/business/services returns `[]`  
**Cause:** No services created for your business yet  
**Solution:** Use POST endpoint to create services first  

**The API is working correctly** - it's just filtering by your business_id for data security.

---

## 📚 Related Files

- `sample-services-data.js` - Ready-to-use service templates
- `debug-services-api.ts` - Diagnostic information
- `check-services-data.ts` - Database verification script
- `SERVICES_API_TROUBLESHOOTING.md` - Detailed troubleshooting guide

---

**Last Updated:** April 2, 2026  
**Status:** ✅ API Working - Just Add Data!
