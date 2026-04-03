# Offers API Documentation

## Overview
The Offers API allows business owners to create, manage, and delete promotional offers for their car wash business. Each offer supports bilingual content (English & Arabic).

## Endpoints

### Base URL
```
https://car-backend-production-36e6.up.railway.app/api/business/offers
```

## Authentication
All endpoints require:
- Valid JWT token in `Authorization` header
- User role must be `business_owner`
- Optional: `x-branch-id` header for branch-specific operations

---

## API Reference

### 1. Get All Offers
**Method:** GET  
**Endpoint:** `/api/business/offers`

**Description:** Retrieves all offers for the authenticated business.

**Response:**
```json
[
  {
    "id": 1,
    "business_id": "uuid",
    "title_en": "Summer Discount",
    "title_ar": "خصم الصيف",
    "description_en": "Get 20% off on all services",
    "description_ar": "احصل على خصم 20٪ على جميع الخدمات",
    "discount_percentage": 20.00,
    "valid_until": "2026-12-31",
    "active": true,
    "created_at": "2026-04-02T10:00:00Z"
  }
]
```

---

### 2. Create New Offer
**Method:** POST  
**Endpoint:** `/api/business/offers`

**Request Body:**
```json
{
  "title_en": "Summer Discount",
  "title_ar": "خصم الصيف",
  "description_en": "Get 20% off on all services",
  "description_ar": "احصل على خصم 20٪ على جميع الخدمات",
  "discount_percentage": 20,
  "valid_until": "2026-12-31",
  "active": true
}
```

**Validation Rules:**
- At least one title (title_en or title_ar) is required
- discount_percentage must be between 0 and 100
- valid_until should be a valid date format (YYYY-MM-DD)

**Response (201 Created):**
```json
{
  "id": 1,
  "business_id": "uuid",
  "title_en": "Summer Discount",
  "title_ar": "خصم الصيف",
  "description_en": "Get 20% off on all services",
  "description_ar": "احصل على خصم 20٪ على جميع الخدمات",
  "discount_percentage": 20.00,
  "valid_until": "2026-12-31",
  "active": true,
  "created_at": "2026-04-02T10:00:00Z"
}
```

---

### 3. Update Offer
**Method:** PUT  
**Endpoint:** `/api/business/offers/:id`

**Request Body:**
```json
{
  "id": 1,
  "title_en": "Winter Special",
  "title_ar": "عرض الشتاء",
  "description_en": "Get 30% off on full detailing",
  "description_ar": "احصل على خصم 30٪ على التنفيس الكامل",
  "discount_percentage": 30,
  "valid_until": "2027-01-31",
  "active": true
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "business_id": "uuid",
  "title_en": "Winter Special",
  "title_ar": "عرض الشتاء",
  "description_en": "Get 30% off on full detailing",
  "description_ar": "احصل على خصم 30٪ على التنفيس الكامل",
  "discount_percentage": 30.00,
  "valid_until": "2027-01-31",
  "active": true,
  "created_at": "2026-04-02T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid data
- `404 Not Found` - Offer not found

---

### 4. Delete Offer
**Method:** DELETE  
**Endpoint:** `/api/business/offers/:id`

**Response (200 OK):**
```json
{
  "message": "Deleted"
}
```

**Error Responses:**
- `400 Bad Request` - Offer ID is required
- `404 Not Found` - Offer not found

---

## Database Schema

```sql
CREATE TABLE offers (
  id SERIAL PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  title_en VARCHAR(255) NOT NULL DEFAULT '',
  title_ar VARCHAR(255) NOT NULL DEFAULT '',
  description_en TEXT,
  description_ar TEXT,
  discount_percentage DECIMAL(5, 2),
  valid_until DATE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Migration

To update your database with the new bilingual columns, run:

```bash
node migrate-offers.ts
```

This will:
1. Add new columns: `title_en`, `title_ar`, `description_en`, `description_ar`
2. Migrate existing data from old columns to new ones
3. Remove old columns: `title`, `description`

---

## Example Usage (Frontend)

### Creating an Offer (React/JavaScript)

```javascript
const createOffer = async (offerData) => {
  const response = await fetch('/api/business/offers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title_en: "Summer Discount",
      title_ar: "خصم الصيف",
      description_en: "Get 20% off on all services",
      description_ar: "احصل على خصم 20٪ على جميع الخدمات",
      discount_percentage: 20,
      valid_until: "2026-12-31",
      active: true
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create offer');
  }
  
  return await response.json();
};
```

### Fetching All Offers

```javascript
const getOffers = async () => {
  const response = await fetch('/api/business/offers', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch offers');
  }
  
  return await response.json();
};
```

---

## Error Handling

All endpoints return detailed error messages:

```json
{
  "message": "Server error",
  "error": "Specific error message here"
}
```

Common error codes:
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Notes

1. **Business Isolation**: Each business can only see/manage their own offers
2. **Super Admin**: Super admins can view all offers across businesses
3. **Branch Support**: Use `x-branch-id` header for branch-specific filtering (if implemented)
4. **Date Format**: All dates should be in `YYYY-MM-DD` format
5. **Active Status**: Offers are active by default when created
6. **Soft Delete**: Consider setting `active = false` instead of deleting for historical records

---

## Testing

Run the test script:
```bash
node test-offers-api.ts
```

This will display:
- Available endpoints
- Request/response formats
- Features implemented
- Database schema

---

## Support

For issues or questions, check the error logs or contact the development team.
