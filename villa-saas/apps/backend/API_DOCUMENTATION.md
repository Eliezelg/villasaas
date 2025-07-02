# Villa SaaS API Documentation

## Vue d'ensemble

L'API Villa SaaS est une API RESTful qui permet de gérer une plateforme multi-tenant de location de propriétés de vacances.

**Base URL**: `http://localhost:3001/api`

**Documentation Swagger**: `http://localhost:3001/documentation`

## Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification. Incluez le token dans l'en-tête `Authorization`:

```
Authorization: Bearer <your-token>
```

## Endpoints

### 🔐 Authentification

#### POST /api/auth/register
Créer un nouveau compte et une organisation.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "Jean",
  "lastName": "Dupont",
  "tenantName": "Ma Société",
  "domain": "ma-societe"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "clg...",
    "email": "user@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "ADMIN",
    "isActive": true
  },
  "tenant": {
    "id": "clg...",
    "name": "Ma Société",
    "domain": "ma-societe"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

#### POST /api/auth/login
Se connecter à un compte existant.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:** `200 OK`
(Même format que register)

#### POST /api/auth/refresh
Rafraîchir le token d'accès.

**Request Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

#### POST /api/auth/logout
Se déconnecter (invalide le refresh token).

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

---

### 🏢 Tenants (Organisations)

#### GET /api/tenants/me
Récupérer les informations de l'organisation courante.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "clg...",
  "name": "Ma Société",
  "domain": "ma-societe",
  "settings": {
    "currency": "EUR",
    "timezone": "Europe/Paris"
  }
}
```

#### PATCH /api/tenants/me
Mettre à jour l'organisation.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Nouveau Nom",
  "settings": {
    "currency": "USD"
  }
}
```

---

### 👥 Users (Utilisateurs)

#### GET /api/users
Lister tous les utilisateurs de l'organisation.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `role`: Filtrer par rôle (ADMIN, OWNER, MANAGER, VIEWER)
- `isActive`: Filtrer par statut actif (true/false)

**Response:** `200 OK`
```json
[
  {
    "id": "clg...",
    "email": "user@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "ADMIN",
    "isActive": true
  }
]
```

#### POST /api/users
Créer un nouvel utilisateur.

**Headers:** `Authorization: Bearer <token>` (Rôle: ADMIN)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Marie",
  "lastName": "Martin",
  "role": "MANAGER"
}
```

---

### 🏠 Properties (Propriétés)

#### GET /api/properties
Lister toutes les propriétés.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: Filtrer par statut (DRAFT, PUBLISHED, ARCHIVED)
- `propertyType`: Filtrer par type

**Response:** `200 OK`
```json
[
  {
    "id": "clg...",
    "name": "Villa Les Oliviers",
    "slug": "villa-les-oliviers",
    "propertyType": "VILLA",
    "status": "PUBLISHED",
    "city": "Nice",
    "basePrice": 250,
    "maxGuests": 8,
    "images": [
      {
        "id": "clg...",
        "url": "/uploads/properties/image.jpg",
        "isPrimary": true
      }
    ],
    "_count": {
      "bookings": 15,
      "images": 10
    }
  }
]
```

#### GET /api/properties/:id
Récupérer une propriété spécifique.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
(Propriété complète avec images et périodes)

#### POST /api/properties
Créer une nouvelle propriété.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Villa Les Oliviers",
  "propertyType": "VILLA",
  "address": "123 Rue de la Paix",
  "city": "Nice",
  "postalCode": "06000",
  "country": "FR",
  "bedrooms": 4,
  "bathrooms": 3,
  "maxGuests": 8,
  "surfaceArea": 200,
  "description": {
    "fr": "Belle villa avec vue sur mer..."
  },
  "basePrice": 250,
  "weekendPremium": 50,
  "cleaningFee": 100,
  "securityDeposit": 1000,
  "minNights": 3,
  "checkInTime": "16:00",
  "checkOutTime": "11:00",
  "instantBooking": false,
  "latitude": 43.7102,
  "longitude": 7.2620,
  "amenities": {
    "wifi": true,
    "pool": true,
    "parking": true,
    "airConditioning": true
  },
  "atmosphere": {
    "luxurious": 5,
    "cozy": 4,
    "modern": 5
  }
}
```

#### PATCH /api/properties/:id
Mettre à jour une propriété.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (Champs à modifier uniquement)

#### DELETE /api/properties/:id
Supprimer une propriété.

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

#### POST /api/properties/:id/publish
Publier une propriété.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

#### POST /api/properties/:id/unpublish
Dépublier une propriété.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

### 📸 Property Images

#### POST /api/properties/:propertyId/images
Uploader une ou plusieurs images.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `images`: Fichier(s) image (multiple)
- `alt`: Texte alternatif
- `caption`: Légende (JSON multilingue)

**Response:** `201 Created`
```json
[
  {
    "id": "clg...",
    "url": "/uploads/properties/image.jpg",
    "urls": {
      "small": "/uploads/properties/image_small.jpg",
      "medium": "/uploads/properties/image_medium.jpg",
      "large": "/uploads/properties/image_large.jpg",
      "original": "/uploads/properties/image.jpg"
    },
    "order": 0,
    "isPrimary": false
  }
]
```

#### PUT /api/properties/:propertyId/images/order
Réorganiser les images.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "updates": [
    { "id": "image1", "order": 0 },
    { "id": "image2", "order": 1 }
  ]
}
```

#### DELETE /api/properties/:propertyId/images/:imageId
Supprimer une image.

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

---

### 📅 Periods (Périodes tarifaires)

#### GET /api/periods
Lister les périodes tarifaires.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `propertyId`: Filtrer par propriété

**Response:** `200 OK`
```json
[
  {
    "id": "clg...",
    "name": "Haute saison été",
    "startDate": "2024-07-01T00:00:00Z",
    "endDate": "2024-08-31T23:59:59Z",
    "basePrice": 350,
    "weekendPremium": 75,
    "minNights": 7,
    "priority": 10,
    "isActive": true
  }
]
```

#### POST /api/periods
Créer une période tarifaire.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "propertyId": "clg...",
  "name": "Haute saison été",
  "startDate": "2024-07-01T00:00:00Z",
  "endDate": "2024-08-31T23:59:59Z",
  "basePrice": 350,
  "weekendPremium": 75,
  "minNights": 7,
  "priority": 10,
  "isActive": true
}
```

#### PATCH /api/periods/:id
Modifier une période.

**Headers:** `Authorization: Bearer <token>`

#### DELETE /api/periods/:id
Supprimer une période.

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

---

### 💰 Pricing (Tarification)

#### POST /api/pricing/calculate
Calculer le prix d'un séjour.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "propertyId": "clg...",
  "checkIn": "2024-07-15T00:00:00Z",
  "checkOut": "2024-07-22T00:00:00Z",
  "guests": 4
}
```

**Response:** `200 OK`
```json
{
  "nights": 7,
  "basePrice": 250,
  "totalAccommodation": 2100,
  "weekendPremium": 150,
  "seasonalAdjustment": 350,
  "longStayDiscount": 105,
  "cleaningFee": 100,
  "touristTax": 28,
  "subtotal": 2095,
  "total": 2123,
  "averagePricePerNight": 303.29,
  "breakdown": [
    {
      "date": "2024-07-15",
      "basePrice": 350,
      "weekendPremium": 0,
      "finalPrice": 350,
      "periodName": "Haute saison été"
    }
  ]
}
```

#### GET /api/pricing/availability
Vérifier la disponibilité.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `propertyId`: ID de la propriété (requis)
- `checkIn`: Date d'arrivée (YYYY-MM-DD)
- `checkOut`: Date de départ (YYYY-MM-DD)
- `excludeBookingId`: Exclure une réservation (optionnel)

**Response:** `200 OK`
```json
{
  "available": true
}
```

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Bad Request - Paramètres invalides |
| 401 | Unauthorized - Token manquant ou invalide |
| 403 | Forbidden - Permissions insuffisantes |
| 404 | Not Found - Ressource non trouvée |
| 409 | Conflict - Conflit (ex: email déjà utilisé) |
| 422 | Unprocessable Entity - Validation échouée |
| 429 | Too Many Requests - Rate limit atteint |
| 500 | Internal Server Error - Erreur serveur |

## Rate Limiting

- 100 requêtes par minute par IP
- Headers de réponse:
  - `X-RateLimit-Limit`: Limite
  - `X-RateLimit-Remaining`: Requêtes restantes
  - `X-RateLimit-Reset`: Timestamp de reset

## Multi-tenancy

Toutes les requêtes authentifiées sont automatiquement filtrées par l'organisation (tenant) de l'utilisateur connecté. Il n'est pas possible d'accéder aux données d'une autre organisation.

## Pagination (À venir)

Les endpoints de liste supporteront la pagination avec les paramètres:
- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre d'éléments par page (défaut: 20, max: 100)

## Webhooks (À venir)

Des webhooks seront disponibles pour les événements:
- Nouvelle réservation
- Annulation de réservation
- Mise à jour de propriété
- Nouveau paiement