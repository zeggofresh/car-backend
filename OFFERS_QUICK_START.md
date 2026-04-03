# Offers API - Quick Start Guide

## ✅ Migration Complete!

The database has been successfully updated with bilingual support for offers.

## 📋 What's Available

The offers endpoint is now fully functional at:
```
https://car-backend-production-36e6.up.railway.app/api/business/offers
```

## 🚀 How to Use

### 1. Create an Offer

**Example Request:**
```javascript
POST /api/business/offers
Headers:
  Authorization: Bearer <your_token>
  Content-Type: application/json

Body:
{
  "title_en": "Summer Special",
  "title_ar": "عرض الصيف",
  "description_en": "Get 20% off on all car wash services",
  "description_ar": "احصل على خصم 20٪ على جميع خدمات غسيل السيارات",
  "discount_percentage": 20,
  "valid_until": "2026-12-31",
  "active": true
}
```

**Response:**
```json
{
  "id": 1,
  "business_id": "uuid-here",
  "title_en": "Summer Special",
  "title_ar": "عرض الصيف",
  "description_en": "Get 20% off on all car wash services",
  "description_ar": "احصل على خصم 20٪ على جميع خدمات غسيل السيارات",
  "discount_percentage": 20.00,
  "valid_until": "2026-12-31",
  "active": true,
  "created_at": "2026-04-02T10:00:00Z"
}
```

### 2. Get All Offers

```javascript
GET /api/business/offers
Headers:
  Authorization: Bearer <your_token>
```

Returns array of all offers for your business.

### 3. Update an Offer

```javascript
PUT /api/business/offers/1
Headers:
  Authorization: Bearer <your_token>
  Content-Type: application/json

Body:
{
  "id": 1,
  "title_en": "Updated Title",
  "title_ar": "عنوان محدث",
  "discount_percentage": 25
}
```

### 4. Delete an Offer

```javascript
DELETE /api/business/offers/1
Headers:
  Authorization: Bearer <your_token>
```

## 📝 Required Fields

When creating/updating offers:
- ✅ At least one title (title_en OR title_ar)
- ✅ discount_percentage (0-100)
- ⭕ valid_until (optional but recommended)
- ⭕ active (defaults to true)

## 🔐 Authentication

All endpoints require:
- Valid JWT token in `Authorization` header
- User must have role: `business_owner`
- Business ID is automatically extracted from token

## 💡 Example Frontend Code

### React Component Example

```jsx
import { useState, useEffect } from 'react';

function OffersManager() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch offers
  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/business/offers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setOffers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  // Create offer
  const createOffer = async (offerData) => {
    try {
      const response = await fetch('/api/business/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(offerData)
      });
      
      if (!response.ok) throw new Error('Failed to create');
      
      const newOffer = await response.json();
      setOffers([...offers, newOffer]);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Offers</h1>
      <button onClick={() => createOffer({
        title_en: "New Offer",
        title_ar: "عرض جديد",
        discount_percentage: 15,
        valid_until: "2026-12-31"
      })}>
        Create Offer
      </button>
      {offers.map(offer => (
        <div key={offer.id}>
          <h3>{offer.title_en} / {offer.title_ar}</h3>
          <p>Discount: {offer.discount_percentage}%</p>
          <p>Valid until: {offer.valid_until}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🎯 Features Implemented

✅ **Bilingual Support** - English & Arabic titles and descriptions  
✅ **Validation** - Discount percentage (0-100), required fields  
✅ **Business Isolation** - Each business sees only their offers  
✅ **Active/Inactive Status** - Toggle offers without deleting  
✅ **Expiry Tracking** - Set validity dates for offers  
✅ **Error Handling** - Detailed error messages  
✅ **404 Handling** - Proper not found responses  

## 📊 Database Schema

```sql
offers (
  id: SERIAL PRIMARY KEY,
  business_id: UUID,
  title_en: VARCHAR(255),
  title_ar: VARCHAR(255),
  description_en: TEXT,
  description_ar: TEXT,
  discount_percentage: DECIMAL(5,2),
  valid_until: DATE,
  active: BOOLEAN DEFAULT TRUE,
  created_at: TIMESTAMPTZ
)
```

## 🧪 Testing

Test the API using the test script:
```bash
node test-offers-api.ts
```

Or use tools like:
- Postman
- Insomnia
- curl
- Frontend fetch/axios calls

## 📞 Need Help?

Check the detailed documentation in `OFFERS_API_README.md` for more information.

---

**Status:** ✅ Ready to use!  
**Endpoint:** `/api/business/offers`  
**Last Updated:** April 2, 2026
