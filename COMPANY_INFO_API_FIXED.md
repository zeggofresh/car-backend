# Company Info API - Fixed! ✅

## Problem Solved

The server error when updating company info has been fixed!

### ❌ Original Error
```json
{
  "message": "Server error"
}
```

### 🔧 What Was Fixed

1. **Added Missing Database Columns:**
   - `map_link` (TEXT)
   - `logo` (TEXT)
   - `images` (JSONB array)
   - `booking_settings` (JSONB object)
   - `allow_bookings` (BOOLEAN)
   - `mobile` (VARCHAR)

2. **Updated Column Types:**
   - `opening_hours` changed from VARCHAR(50) to VARCHAR(500) to support longer values

3. **Enhanced API Support:**
   - Added support for `working_hours` → maps to `opening_hours`
   - Added support for `cr_number` → maps to `commercial_registration`
   - Proper JSON serialization for `images` and `booking_settings`
   - Better error logging with detailed messages

---

## ✅ Updated API Endpoint

**URL:** `PUT /api/business/company-info`

### Supported Fields

All of these fields are now supported:

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Business name |
| `phone` | String | Primary phone number |
| `mobile` | String | Mobile number |
| `tax_number` | String | Tax/VAT number |
| `cr_number` | String | Commercial registration (alias for `commercial_registration`) |
| `commercial_registration` | String | Commercial registration number |
| `map_link` | String | Google Maps link |
| `logo` | String | Logo URL |
| `images` | Array | Gallery images (array of URLs) |
| `opening_hours` | String | Working hours |
| `working_hours` | String | Alias for opening_hours |
| `booking_settings` | Object | Booking configuration |
| `allow_bookings` | Boolean | Enable/disable bookings |

---

## 📝 Request Example

Your original request that was failing:

```json
{
  "allow_bookings": true,
  "cr_number": "v fggf",
  "images": [],
  "logo": "",
  "map_link": "https://railway.com/...",
  "mobile": "852852095620",
  "name": "The Dessert Bar",
  "tax_number": "fhty",
  "working_hours": ""
}
```

**This will now work!** ✅

---

## 🚀 How It Works Now

### Field Mappings

The API automatically handles these mappings:

1. **`working_hours` → `opening_hours`**
   ```javascript
   // Frontend sends:
   { "working_hours": "09:00 - 22:00" }
   
   // Backend stores in: opening_hours column
   ```

2. **`cr_number` → `commercial_registration`**
   ```javascript
   // Frontend sends:
   { "cr_number": "123456789" }
   
   // Backend stores in: commercial_registration column
   ```

3. **JSON Serialization**
   ```javascript
   // Frontend sends:
   { 
     "images": ["url1.jpg", "url2.jpg"],
     "booking_settings": { "maxBookingsPerDay": 10 }
   }
   
   // Backend properly serializes to JSONB
   ```

---

## 💡 Usage Examples

### Update Basic Info

```javascript
const response = await fetch('https://car-backend-production-36e6.up.railway.app/api/business/company-info', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "My Car Wash Center",
    mobile: "+966501234567",
    tax_number: "123456789",
    cr_number: "987654321"
  })
});

const result = await response.json();
console.log(result);
```

### Update Location & Media

```javascript
const response = await fetch('https://car-backend-production-36e6.up.railway.app/api/business/company-info', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    map_link: "https://goo.gl/maps/abc123",
    logo: "https://example.com/logo.png",
    images: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ]
  })
});
```

### Update Hours & Bookings

```javascript
const response = await fetch('https://car-backend-production-36e6.up.railway.app/api/business/company-info', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    working_hours: "Saturday-Thursday: 08:00-22:00, Friday: 14:00-22:00",
    allow_bookings: true,
    booking_settings: {
      maxBookingsPerDay: 20,
      advanceBookingDays: 7,
      cancellationPolicy: "24 hours notice required"
    }
  })
});
```

### Complete Update (All Fields)

```javascript
const response = await fetch('https://car-backend-production-36e6.up.railway.app/api/business/company-info', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Premium Auto Care",
    phone: "920012345",
    mobile: "0501234567",
    tax_number: "300123456700003",
    cr_number: "1010101010",
    map_link: "https://maps.google.com/?q=24.7136,46.6753",
    logo: "https://cdn.example.com/logo.png",
    images: [
      "https://cdn.example.com/gallery/1.jpg",
      "https://cdn.example.com/gallery/2.jpg",
      "https://cdn.example.com/gallery/3.jpg"
    ],
    working_hours: "Daily: 08:00 - 23:00",
    allow_bookings: true,
    booking_settings: {
      enableOnlinePayment: true,
      requireDeposit: false,
      minNoticeHours: 2
    }
  })
});
```

---

## 🎯 Response Format

**Success (200 OK):**
```json
{
  "id": "uuid-here",
  "name": "Premium Auto Care",
  "status": "approved",
  "phone": "920012345",
  "mobile": "0501234567",
  "tax_number": "300123456700003",
  "commercial_registration": "1010101010",
  "map_link": "https://maps.google.com/?q=24.7136,46.6753",
  "logo": "https://cdn.example.com/logo.png",
  "images": ["https://cdn.example.com/gallery/1.jpg"],
  "opening_hours": "Daily: 08:00 - 23:00",
  "allow_bookings": true,
  "booking_settings": {
    "enableOnlinePayment": true,
    "requireDeposit": false,
    "minNoticeHours": 2
  },
  "rating": 4.5,
  "created_at": "2026-04-02T10:00:00Z"
}
```

**Error (500 Server Error):**
```json
{
  "message": "Server error",
  "error": "Specific error message here",
  "details": "Additional error details"
}
```

---

## 🔍 Debugging

### Enhanced Logging

The API now logs detailed information:

```
Updating company info: {
  name: "Premium Auto Care",
  phone: "920012345",
  tax_number: "300123456700003",
  crNumber: "1010101010",
  hours: "Daily: 08:00 - 23:00",
  map_link: "https://maps.google.com/...",
  logo: "https://cdn.example.com/logo.png",
  allow_bookings: true,
  mobile: "0501234567"
}
Executing company info update
Company info updated successfully: uuid-here
```

### Check Database Columns

Run this to verify all columns exist:
```bash
npx tsx migrate-company-info-columns.ts
```

This will show you all available columns in the businesses table.

---

## 📋 Migration Applied

The migration script has been run successfully and added these columns to production:

✅ `map_link` TEXT  
✅ `logo` TEXT  
✅ `images` JSONB DEFAULT `'[]'::jsonb`  
✅ `booking_settings` JSONB DEFAULT `'{}'::jsonb`  
✅ `allow_bookings` BOOLEAN DEFAULT TRUE  
✅ `mobile` VARCHAR(20)  
✅ `opening_hours` VARCHAR(500) (updated from VARCHAR(50))  

---

## 🛠️ Files Modified

1. **`api/business.ts`** - Enhanced PUT endpoint with:
   - Support for all new fields
   - Field mapping (working_hours → opening_hours, cr_number → commercial_registration)
   - JSON serialization for complex types
   - Better error handling with detailed messages

2. **`db/schema.sql`** - Updated schema with new columns

3. **`migrate-company-info-columns.ts`** - Migration script (already executed)

---

## ✨ Key Improvements

| Before | After |
|--------|-------|
| ❌ Server error on update | ✅ Updates work perfectly |
| ❌ Missing columns | ✅ All required columns exist |
| ❌ No support for working_hours | ✅ working_hours mapped to opening_hours |
| ❌ Poor error messages | ✅ Detailed error logging |
| ❌ Limited field support | ✅ Support for all business fields |

---

## 🎉 Test Your Update Now!

Your original request should work now:

```javascript
const response = await fetch('https://car-backend-production-36e6.up.railway.app/api/business/company-info', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    allow_bookings: true,
    cr_number: "v fggf",
    images: [],
    logo: "",
    map_link: "https://railway.com/project/...",
    mobile: "852852095620",
    name: "The Dessert Bar",
    tax_number: "fhty",
    working_hours: ""
  })
});

const result = await response.json();
console.log('Success:', result);
```

---

## 📞 Summary

**Status:** ✅ FIXED  
**Issue:** Server error when updating company info  
**Cause:** Missing database columns  
**Solution:** Added all required columns + enhanced API support  

The endpoint now supports all the fields your frontend is sending!

---

**Last Updated:** April 2, 2026  
**Database:** ✅ Migrated successfully  
**API:** ✅ Enhanced and tested
