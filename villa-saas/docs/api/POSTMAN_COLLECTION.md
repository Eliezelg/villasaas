# Villa SaaS Postman Collection

This document provides instructions for using the Villa SaaS API with Postman.

## 📥 Import Collection

1. Download the [Villa SaaS Postman Collection](./villa-saas.postman_collection.json)
2. Open Postman
3. Click "Import" → Select the downloaded file
4. The collection will appear in your workspace

## 🔧 Environment Setup

Create a new Postman environment with these variables:

```json
{
  "base_url": "http://localhost:3001/api",
  "access_token": "",
  "refresh_token": "",
  "tenant_id": "",
  "property_id": "",
  "booking_id": ""
}
```

## 📋 Collection Structure

### 1. Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate tokens

### 2. Properties
- `GET /properties` - List all properties
- `POST /properties` - Create new property
- `GET /properties/:id` - Get property details
- `PATCH /properties/:id` - Update property
- `DELETE /properties/:id` - Delete property

### 3. Property Images
- `POST /properties/:id/images` - Upload images
- `PATCH /properties/:id/images/:imageId` - Update image
- `DELETE /properties/:id/images/:imageId` - Delete image

### 4. Pricing Periods
- `GET /periods` - List pricing periods
- `POST /periods` - Create pricing period
- `PATCH /periods/:id` - Update period
- `DELETE /periods/:id` - Delete period

### 5. Availability
- `GET /availability/calendar` - Get availability calendar
- `GET /availability/blocked-periods` - List blocked periods
- `POST /availability/blocked-periods` - Block dates
- `DELETE /availability/blocked-periods/:id` - Unblock dates

### 6. Bookings
- `GET /bookings` - List bookings
- `POST /bookings` - Create booking
- `GET /bookings/:id` - Get booking details
- `PATCH /bookings/:id` - Update booking
- `POST /bookings/:id/confirm` - Confirm booking
- `POST /bookings/:id/cancel` - Cancel booking
- `POST /bookings/calculate-price` - Calculate price

### 7. Analytics
- `GET /analytics/overview` - Dashboard metrics
- `GET /analytics/occupancy` - Occupancy rates
- `GET /analytics/revenue` - Revenue data
- `GET /analytics/export` - Export CSV data

## 🚀 Quick Start Guide

### 1. Register and Login
```javascript
// 1. Register new account
POST {{base_url}}/auth/register
{
  "email": "test@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "tenantName": "My Vacation Rentals",
  "domain": "my-rentals"
}

// 2. Login
POST {{base_url}}/auth/login
{
  "email": "test@example.com",
  "password": "SecurePassword123"
}

// Response will include tokens - Postman will auto-save them
```

### 2. Create Your First Property
```javascript
POST {{base_url}}/properties
Authorization: Bearer {{access_token}}
{
  "name": "Beautiful Beach Villa",
  "description": "Stunning beachfront property...",
  "propertyType": "VILLA",
  "address": "123 Beach Road",
  "city": "Miami",
  "country": "USA",
  "postalCode": "33139",
  "latitude": 25.7617,
  "longitude": -80.1918,
  "maxGuests": 8,
  "bedrooms": 4,
  "bathrooms": 3,
  "amenities": ["WIFI", "POOL", "PARKING", "AC"],
  "basePrice": 250,
  "currency": "USD",
  "cleaningFee": 100
}
```

### 3. Set Up Pricing
```javascript
POST {{base_url}}/periods
Authorization: Bearer {{access_token}}
{
  "propertyId": "{{property_id}}",
  "name": "Summer High Season",
  "startDate": "2025-06-01",
  "endDate": "2025-08-31",
  "nightlyRate": 350,
  "minNights": 5,
  "priority": 10
}
```

### 4. Create a Test Booking
```javascript
// First, calculate the price
POST {{base_url}}/bookings/calculate-price
Authorization: Bearer {{access_token}}
{
  "propertyId": "{{property_id}}",
  "checkIn": "2025-07-15T14:00:00Z",
  "checkOut": "2025-07-22T11:00:00Z",
  "adults": 4,
  "children": 2
}

// Then create the booking
POST {{base_url}}/bookings
Authorization: Bearer {{access_token}}
{
  "propertyId": "{{property_id}}",
  "checkIn": "2025-07-15T14:00:00Z",
  "checkOut": "2025-07-22T11:00:00Z",
  "adults": 4,
  "children": 2,
  "guestFirstName": "Jane",
  "guestLastName": "Smith",
  "guestEmail": "jane@example.com",
  "guestPhone": "+1234567890"
}
```

## 🔑 Authentication Flow

The API uses JWT with refresh tokens:

1. **Login** returns:
   - `accessToken` (expires in 15 minutes)
   - `refreshToken` (expires in 7 days)

2. **Use access token** for all API calls:
   ```
   Authorization: Bearer {{access_token}}
   ```

3. **When token expires**, refresh it:
   ```javascript
   POST {{base_url}}/auth/refresh
   {
     "refreshToken": "{{refresh_token}}"
   }
   ```

## 📝 Common Workflows

### Upload Property Images
```javascript
POST {{base_url}}/properties/{{property_id}}/images
Authorization: Bearer {{access_token}}
Content-Type: multipart/form-data

image: [Select file]
isCover: true
alt: "Villa exterior view"
```

### Check Availability
```javascript
GET {{base_url}}/availability/calendar?propertyId={{property_id}}&startDate=2025-07-01&endDate=2025-07-31
Authorization: Bearer {{access_token}}
```

### Get Analytics
```javascript
GET {{base_url}}/analytics/overview?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer {{access_token}}
```

## 🧪 Testing Tips

### Use Pre-request Scripts
```javascript
// Auto-refresh token if expired
if (pm.environment.get("token_expiry") < Date.now()) {
    pm.sendRequest({
        url: pm.environment.get("base_url") + "/auth/refresh",
        method: "POST",
        header: {
            "Content-Type": "application/json"
        },
        body: {
            mode: "raw",
            raw: JSON.stringify({
                refreshToken: pm.environment.get("refresh_token")
            })
        }
    }, function (err, res) {
        if (!err && res.code === 200) {
            const response = res.json();
            pm.environment.set("access_token", response.accessToken);
            pm.environment.set("token_expiry", Date.now() + 900000); // 15 min
        }
    });
}
```

### Use Tests to Save Variables
```javascript
// After creating a property
pm.test("Save property ID", function () {
    const response = pm.response.json();
    pm.environment.set("property_id", response.id);
});
```

## 🚨 Error Handling

Common error responses:

### 400 Bad Request
```json
{
  "error": {
    "issues": [
      {
        "path": ["email"],
        "message": "Invalid email"
      }
    ]
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Dates already booked"
}
```

## 📊 Rate Limiting

- **Default limit**: 100 requests per minute per IP
- **Auth endpoints**: 5 requests per minute
- **Upload endpoints**: 10 requests per minute

Headers returned:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Reset timestamp

## 🔗 Useful Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Swagger UI](http://localhost:3001/documentation)
- [Development Guidelines](../guides/DEVELOPMENT_GUIDELINES.md)