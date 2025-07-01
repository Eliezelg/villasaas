# Villa SaaS - Spécifications Fonctionnelles Détaillées
## Guide Complet des Fonctionnalités et Règles Métier

---

## 📋 Table des Matières

1. [Système de Tarification Avancé](#système-de-tarification-avancé)
2. [Gestion des Réservations](#gestion-des-réservations)
3. [Options et Services](#options-et-services)
4. [Taxes et Frais](#taxes-et-frais)
5. [Politiques d'Annulation](#politiques-dannulation)
6. [Système de Paiement](#système-de-paiement)
7. [Gestion des Propriétés](#gestion-des-propriétés)
8. [Communications Automatisées](#communications-automatisées)
9. [Tableau de Bord et Analytics](#tableau-de-bord-et-analytics)
10. [Recherche et Filtres](#recherche-et-filtres)
11. [Système d'Avis](#système-davis)
12. [Intégrations Externes](#intégrations-externes)

---

## 💰 1. Système de Tarification Avancé

### 1.1 Périodes Tarifaires

#### Concept
Les propriétaires peuvent définir des périodes avec des tarifs différents qui se chevauchent. Le système applique la période avec la **priorité la plus élevée**.

#### Structure d'une Période
```typescript
interface PricingPeriod {
  name: string;              // "Vacances de Noël 2024"
  startDate: Date;           // 2024-12-20
  endDate: Date;             // 2025-01-05
  priority: number;          // 100 (plus élevé = prioritaire)
  
  // Tarifs
  basePrice: number;         // 250€/nuit
  weekendSupplement: number; // +50€ vendredi/samedi
  
  // Contraintes de séjour
  minNights: number;         // 7 nuits minimum
  maxNights?: number;        // 14 nuits maximum
  
  // Jours d'arrivée/départ autorisés
  checkInDays: number[];     // [6, 0] = samedi/dimanche uniquement
  checkOutDays: number[];    // [6, 0] = samedi/dimanche uniquement
  
  // Délais de réservation
  advanceBooking: {
    min: number;             // Réserver minimum 7 jours avant
    max: number;             // Maximum 365 jours avant
  };
}
```

#### Exemples de Périodes

**1. Tarif de Base (Priorité: 0)**
```javascript
{
  name: "Tarif Standard",
  priority: 0,
  basePrice: 100,
  minNights: 2,
  checkInDays: [0,1,2,3,4,5,6], // Tous les jours
  isDefault: true
}
```

**2. Haute Saison (Priorité: 50)**
```javascript
{
  name: "Été 2024",
  startDate: "2024-07-01",
  endDate: "2024-08-31",
  priority: 50,
  basePrice: 200,
  weekendSupplement: 30,
  minNights: 7,
  checkInDays: [6], // Samedi uniquement
  checkOutDays: [6]
}
```

**3. Événement Spécial (Priorité: 100)**
```javascript
{
  name: "Festival de Cannes 2024",
  startDate: "2024-05-14",
  endDate: "2024-05-25",
  priority: 100,
  basePrice: 500,
  minNights: 3,
  advanceBooking: { min: 30, max: 180 }
}
```

### 1.2 Calcul du Prix

#### Algorithme de Calcul
```typescript
function calculatePrice(checkIn: Date, checkOut: Date, guests: number) {
  let totalPrice = 0;
  const nights = getDaysBetween(checkIn, checkOut);
  
  // Pour chaque nuit
  for (let date = checkIn; date < checkOut; date = addDays(date, 1)) {
    // Trouver la période applicable (priorité max)
    const period = findApplicablePeriod(date);
    
    // Prix de base
    let nightPrice = period.basePrice;
    
    // Supplément weekend ?
    if (isWeekend(date) && period.weekendSupplement) {
      nightPrice += period.weekendSupplement;
    }
    
    totalPrice += nightPrice;
  }
  
  // Réductions longue durée
  if (nights >= 7) totalPrice *= 0.95;  // -5%
  if (nights >= 28) totalPrice *= 0.90; // -10%
  
  return totalPrice;
}
```

### 1.3 Promotions Automatiques

#### Types de Promotions

**1. Early Bird (Réservation Anticipée)**
```javascript
{
  type: "EARLY_BIRD",
  config: {
    daysInAdvance: 60,      // Si réservé 60+ jours avant
    discountPercent: 15,    // -15%
    validForPeriods: ["all"] // Ou liste de périodes
  }
}
```

**2. Last Minute**
```javascript
{
  type: "LAST_MINUTE",
  config: {
    daysBeforeCheckIn: 7,   // Dans les 7 derniers jours
    discountPercent: 20,    // -20%
    minNights: 2            // Minimum 2 nuits
  }
}
```

**3. Long Séjour**
```javascript
{
  type: "LONG_STAY",
  config: {
    triggers: [
      { nights: 7, discount: 5 },   // 7+ nuits = -5%
      { nights: 14, discount: 10 }, // 14+ nuits = -10%
      { nights: 28, discount: 15 }  // 28+ nuits = -15%
    ]
  }
}
```

**4. Code Promo**
```javascript
{
  code: "SUMMER2024",
  type: "FIXED_AMOUNT", // ou "PERCENTAGE"
  value: 50,            // 50€ ou 50%
  conditions: {
    minAmount: 500,
    validFrom: "2024-06-01",
    validTo: "2024-08-31",
    maxUses: 100,
    usedCount: 23
  }
}
```

---

## 🏠 2. Gestion des Réservations

### 2.1 Processus de Réservation

#### Étapes
1. **Sélection dates** → Vérification disponibilité
2. **Calcul prix** → Affichage détaillé
3. **Ajout options** → Services additionnels
4. **Infos client** → Formulaire détaillé
5. **Paiement** → Stripe Checkout
6. **Confirmation** → Emails automatiques

#### Statuts de Réservation
```typescript
enum BookingStatus {
  INQUIRY = "inquiry",         // Demande d'info
  PENDING = "pending",         // En attente paiement
  CONFIRMED = "confirmed",     // Payée, confirmée
  CANCELLED = "cancelled",     // Annulée
  COMPLETED = "completed",     // Séjour terminé
  NO_SHOW = "no_show",        // Client absent
  REFUNDED = "refunded"       // Remboursée
}
```

### 2.2 Règles de Réservation

#### Validation des Contraintes
```typescript
function validateBooking(booking: BookingRequest): ValidationResult {
  const errors = [];
  
  // 1. Vérifier disponibilité
  if (!isAvailable(booking.propertyId, booking.checkIn, booking.checkOut)) {
    errors.push("Dates non disponibles");
  }
  
  // 2. Durée min/max
  const period = getPeriod(booking.checkIn);
  const nights = getNights(booking.checkIn, booking.checkOut);
  
  if (nights < period.minNights) {
    errors.push(`Minimum ${period.minNights} nuits`);
  }
  
  if (period.maxNights && nights > period.maxNights) {
    errors.push(`Maximum ${period.maxNights} nuits`);
  }
  
  // 3. Jours arrivée/départ
  const checkInDay = booking.checkIn.getDay();
  if (!period.checkInDays.includes(checkInDay)) {
    errors.push("Arrivée non autorisée ce jour");
  }
  
  // 4. Capacité
  if (booking.guests > property.maxGuests) {
    errors.push(`Maximum ${property.maxGuests} personnes`);
  }
  
  // 5. Délai de réservation
  const daysUntilCheckIn = getDaysUntil(booking.checkIn);
  if (daysUntilCheckIn < period.advanceBooking.min) {
    errors.push(`Réserver ${period.advanceBooking.min} jours avant`);
  }
  
  return { valid: errors.length === 0, errors };
}
```

### 2.3 Blocages Entre Réservations

#### Configuration
```javascript
{
  blockingDays: {
    beforeCheckIn: 0,  // Jours bloqués avant arrivée
    afterCheckOut: 1,  // 1 jour pour ménage
    betweenStays: 1    // Minimum entre 2 séjours
  }
}
```

---

## 🛎️ 3. Options et Services

### 3.1 Types d'Options

#### Structure d'une Option
```typescript
interface PropertyOption {
  id: string;
  name: string;              // "Ménage final"
  category: OptionCategory;  // "cleaning", "extras", "equipment"
  type: "mandatory" | "optional";
  
  // Modes de tarification
  pricingMode: PricingMode;
  price: number;
  
  // Configuration
  description?: string;
  maxQuantity?: number;      // Ex: max 3 vélos
  conditions?: {
    minNights?: number;      // Disponible si 3+ nuits
    seasons?: string[];      // Seulement en été
  };
}

enum PricingMode {
  PER_STAY = "per_stay",              // Prix fixe (ménage: 80€)
  PER_NIGHT = "per_night",            // Prix × nuits (parking: 10€/nuit)
  PER_PERSON = "per_person",          // Prix × personnes (draps: 15€/pers)
  PER_PERSON_NIGHT = "per_person_night", // Prix × pers × nuits
  PER_UNIT = "per_unit"               // Prix × quantité (vélo: 20€/unité)
}
```

### 3.2 Exemples d'Options

#### Catégorie: Ménage
```javascript
[
  {
    name: "Ménage final",
    category: "cleaning",
    type: "mandatory",
    pricingMode: "per_stay",
    price: 80,
    description: "Ménage complet en fin de séjour"
  },
  {
    name: "Ménage quotidien",
    category: "cleaning",
    type: "optional",
    pricingMode: "per_night",
    price: 30,
    conditions: { minNights: 7 }
  }
]
```

#### Catégorie: Équipements
```javascript
[
  {
    name: "Lit bébé",
    category: "equipment",
    type: "optional",
    pricingMode: "per_stay",
    price: 25,
    maxQuantity: 2
  },
  {
    name: "Location vélo",
    category: "equipment",
    type: "optional",
    pricingMode: "per_unit",
    price: 15,
    maxQuantity: 6,
    description: "VTT adulte, casque inclus"
  }
]
```

#### Catégorie: Services
```javascript
[
  {
    name: "Petit-déjeuner",
    category: "food",
    type: "optional",
    pricingMode: "per_person_night",
    price: 12,
    description: "Livré chaque matin à 8h30"
  },
  {
    name: "Navette aéroport",
    category: "transport",
    type: "optional",
    pricingMode: "per_stay",
    price: 60,
    description: "Aller simple, max 4 personnes"
  }
]
```

### 3.3 Calcul des Options

```typescript
function calculateOptionsPrice(options: SelectedOption[], booking: Booking): number {
  let total = 0;
  
  options.forEach(option => {
    switch (option.pricingMode) {
      case 'per_stay':
        total += option.price;
        break;
        
      case 'per_night':
        total += option.price * booking.nights;
        break;
        
      case 'per_person':
        total += option.price * booking.totalGuests;
        break;
        
      case 'per_person_night':
        total += option.price * booking.totalGuests * booking.nights;
        break;
        
      case 'per_unit':
        total += option.price * option.quantity;
        break;
    }
  });
  
  return total;
}
```

---

## 🏛️ 4. Taxes et Frais

### 4.1 Taxe de Séjour

#### Configuration
```typescript
interface TouristTax {
  enabled: boolean;
  
  // Montant par personne et par nuit
  amount: number;              // 1.50€
  
  // Ou pourcentage du prix
  percentage?: number;         // 5%
  
  // Plafond
  maxAmount?: number;          // Max 2.50€/nuit
  
  // Exemptions
  exemptions: {
    minAge: number;           // Gratuit < 18 ans
    maxNights?: number;       // Appliqué max 7 nuits
  };
  
  // Reversement
  collectionMode: "included" | "additional";
  paymentSchedule: "immediate" | "monthly" | "quarterly";
}
```

#### Calcul
```typescript
function calculateTouristTax(booking: Booking, config: TouristTax): number {
  if (!config.enabled) return 0;
  
  // Nombre de personnes taxables
  const taxableGuests = booking.adults + 
    booking.children.filter(age => age >= config.exemptions.minAge).length;
  
  // Nombre de nuits taxables
  const taxableNights = config.exemptions.maxNights 
    ? Math.min(booking.nights, config.exemptions.maxNights)
    : booking.nights;
  
  // Calcul du montant
  let amount = 0;
  
  if (config.amount) {
    // Montant fixe
    amount = config.amount * taxableGuests * taxableNights;
  } else if (config.percentage) {
    // Pourcentage
    amount = (booking.accommodationTotal * config.percentage / 100) / booking.nights * taxableNights;
  }
  
  // Appliquer le plafond
  if (config.maxAmount) {
    const maxTotal = config.maxAmount * taxableGuests * taxableNights;
    amount = Math.min(amount, maxTotal);
  }
  
  return Math.round(amount * 100) / 100; // Arrondi 2 décimales
}
```

### 4.2 TVA et Autres Taxes

```typescript
interface TaxConfiguration {
  vat: {
    rate: number;              // 10% pour hébergement en France
    included: boolean;         // Prix TTC ou HT
    number?: string;          // N° TVA intracommunautaire
  };
  
  localTaxes: Array<{
    name: string;             // "Taxe régionale"
    rate: number;             // 2%
    basis: "accommodation" | "total";
  }>;
}
```

### 4.3 Frais de Service

```typescript
interface ServiceFees {
  // Frais de réservation
  bookingFee: {
    type: "fixed" | "percentage";
    value: number;            // 25€ ou 3%
    min?: number;             // Minimum 10€
    max?: number;             // Maximum 50€
  };
  
  // Frais de paiement (carte bancaire)
  paymentProcessingFee: {
    passThrough: boolean;     // Répercuter au client
    rate: 2.9,               // Taux Stripe
    fixed: 0.25              // Frais fixes
  };
}
```

---

## ❌ 5. Politiques d'Annulation

### 5.1 Types de Politiques

#### 1. Flexible
```javascript
{
  name: "Flexible",
  rules: [
    {
      daysBeforeCheckIn: 1,
      refundPercent: 100,
      fees: ["cleaning", "service"] // Frais non remboursés
    },
    {
      daysBeforeCheckIn: 0,
      refundPercent: 0
    }
  ]
}
```

#### 2. Modérée
```javascript
{
  name: "Modérée",
  rules: [
    {
      daysBeforeCheckIn: 5,
      refundPercent: 100,
      fees: ["service"]
    },
    {
      daysBeforeCheckIn: 0,
      refundPercent: 50,
      fees: ["all"]
    }
  ]
}
```

#### 3. Stricte
```javascript
{
  name: "Stricte",
  rules: [
    {
      daysBeforeCheckIn: 14,
      refundPercent: 100,
      fees: ["service"]
    },
    {
      daysBeforeCheckIn: 7,
      refundPercent: 50,
      fees: ["all"]
    },
    {
      daysBeforeCheckIn: 0,
      refundPercent: 0
    }
  ]
}
```

#### 4. Personnalisée
```javascript
{
  name: "Spéciale Été",
  rules: [
    {
      daysBeforeCheckIn: 30,
      refundPercent: 100
    },
    {
      daysBeforeCheckIn: 21,
      refundPercent: 75
    },
    {
      daysBeforeCheckIn: 14,
      refundPercent: 50
    },
    {
      daysBeforeCheckIn: 7,
      refundPercent: 25
    },
    {
      daysBeforeCheckIn: 0,
      refundPercent: 0
    }
  ],
  exceptions: {
    medicalEmergency: {
      documentation: true,
      refundPercent: 100
    },
    naturalDisaster: {
      refundPercent: 100
    }
  }
}
```

### 5.2 Calcul des Remboursements

```typescript
function calculateRefund(booking: Booking, cancellationDate: Date): RefundDetails {
  const daysUntilCheckIn = getDaysBetween(cancellationDate, booking.checkIn);
  const policy = booking.cancellationPolicy;
  
  // Trouver la règle applicable
  const rule = policy.rules
    .sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
    .find(r => daysUntilCheckIn >= r.daysBeforeCheckIn);
  
  if (!rule) {
    return { amount: 0, breakdown: [] };
  }
  
  // Calculer les montants
  const breakdown = [];
  
  // Hébergement
  const accommodationRefund = booking.accommodationTotal * rule.refundPercent / 100;
  breakdown.push({
    item: "Hébergement",
    paid: booking.accommodationTotal,
    refunded: accommodationRefund
  });
  
  // Options (selon configuration)
  booking.options.forEach(option => {
    const refundOption = !rule.fees.includes("all") && 
                        !rule.fees.includes(option.category);
    
    breakdown.push({
      item: option.name,
      paid: option.total,
      refunded: refundOption ? option.total * rule.refundPercent / 100 : 0
    });
  });
  
  // Taxes (généralement remboursables)
  breakdown.push({
    item: "Taxe de séjour",
    paid: booking.touristTax,
    refunded: booking.touristTax
  });
  
  const totalRefund = breakdown.reduce((sum, item) => sum + item.refunded, 0);
  
  return {
    amount: totalRefund,
    breakdown,
    processingTime: "5-10 jours ouvrés"
  };
}
```

---

## 💳 6. Système de Paiement

### 6.1 Modes de Paiement

#### Paiement Intégral
```javascript
{
  mode: "FULL_PAYMENT",
  schedule: {
    atBooking: 100  // 100% à la réservation
  }
}
```

#### Paiement Échelonné
```javascript
{
  mode: "SPLIT_PAYMENT",
  schedule: {
    atBooking: 30,      // 30% acompte
    beforeCheckIn: {
      days: 30,         // 30 jours avant
      percent: 70       // Solde 70%
    }
  }
}
```

#### Paiement Multiple
```javascript
{
  mode: "INSTALLMENTS",
  schedule: [
    { percent: 30, timing: "at_booking" },
    { percent: 35, timing: "days_before", days: 60 },
    { percent: 35, timing: "days_before", days: 30 }
  ]
}
```

### 6.2 Caution / Dépôt de Garantie

```typescript
interface SecurityDeposit {
  enabled: boolean;
  amount: number | { percent: number }; // 500€ ou 20% du total
  
  // Méthode de collecte
  method: "pre_authorization" | "payment" | "cash_on_arrival";
  
  // Conditions de remboursement
  refund: {
    timing: "immediate" | "after_inspection"; // Immédiat ou après état des lieux
    maxDays: number;                          // Sous 7 jours
  };
  
  // Retenues possibles
  deductions: Array<{
    reason: string;           // "Dégâts", "Ménage supplémentaire"
    maxAmount?: number;       // Plafond
  }>;
}
```

### 6.3 Gestion des Paiements Stripe

```typescript
// Création d'un paiement avec commission
async function createPayment(booking: Booking) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: booking.totalAmount * 100, // En centimes
    currency: 'eur',
    
    // Commission automatique (si réservation hub)
    application_fee_amount: booking.source === 'hub' 
      ? booking.totalAmount * 0.10 * 100  // 10%
      : 0,
    
    // Virement au propriétaire
    transfer_data: {
      destination: property.tenant.stripeAccountId
    },
    
    // Métadonnées
    metadata: {
      bookingId: booking.id,
      propertyId: booking.propertyId,
      tenantId: booking.tenantId
    },
    
    // Pour paiement échelonné
    setup_future_usage: booking.paymentMode !== 'FULL_PAYMENT' 
      ? 'off_session' 
      : null
  });
  
  return paymentIntent;
}
```

---

## 🏡 7. Gestion des Propriétés

### 7.1 Types de Propriétés

```typescript
enum PropertyType {
  VILLA = "villa",
  APARTMENT = "apartment",
  HOUSE = "house",
  STUDIO = "studio",
  LOFT = "loft",
  CHALET = "chalet",
  BUNGALOW = "bungalow",
  MOBILE_HOME = "mobile_home",
  BOAT = "boat",
  UNUSUAL = "unusual" // Cabane, yourte, etc.
}
```

### 7.2 Informations Détaillées

#### Structure Complète
```typescript
interface PropertyDetails {
  // Identification
  name: string;
  type: PropertyType;
  description: {
    short: string;      // 160 caractères max
    long: string;       // Description complète
    languages?: {       // Multi-langue
      en?: string;
      de?: string;
      es?: string;
    }
  };
  
  // Capacité
  capacity: {
    maxGuests: number;
    adults: number;
    children: number;
    infants: number;    // < 2 ans
  };
  
  // Espaces
  spaces: {
    bedrooms: number;
    beds: {
      double: number;
      single: number;
      bunk: number;
      sofa: number;
      baby: number;
    };
    bathrooms: number;
    toilets: number;    // Séparés
    area: number;       // m²
  };
  
  // Localisation
  location: {
    address: string;
    city: string;
    postalCode: string;
    region: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    timezone: string;   // "Europe/Paris"
  };
  
  // Équipements structurés
  amenities: {
    essentials: {
      wifi: boolean;
      heating: boolean;
      airConditioning: boolean;
      parking: boolean;
      kitchen: boolean;
      washingMachine: boolean;
      dryer: boolean;
      dishwasher: boolean;
      tv: boolean;
    };
    
    comfort: {
      pool: boolean;
      poolType?: "private" | "shared" | "heated";
      jacuzzi: boolean;
      sauna: boolean;
      gym: boolean;
      elevator: boolean;
      fireplace: boolean;
      terrace: boolean;
      balcony: boolean;
      garden: boolean;
      bbq: boolean;
    };
    
    family: {
      crib: boolean;
      highChair: boolean;
      changingTable: boolean;
      babyBath: boolean;
      toys: boolean;
      playground: boolean;
      swing: boolean;
      trampoline: boolean;
      babyProofing: boolean;
    };
    
    accessibility: {
      wheelchairAccess: boolean;
      groundFloor: boolean;
      wideDoors: boolean;
      accessibleBathroom: boolean;
      ramp: boolean;
      grab_bars: boolean;
    };
    
    safety: {
      smokeDetector: boolean;
      carbonMonoxideDetector: boolean;
      fireExtinguisher: boolean;
      firstAidKit: boolean;
      safe: boolean;
      poolFence: boolean;
      securityAlarm: boolean;
      cctv: boolean;
    };
  };
}
```

### 7.3 Médias

```typescript
interface PropertyMedia {
  images: Array<{
    url: string;
    thumbnail: string;
    title?: string;
    alt: string;
    order: number;
    type: "exterior" | "interior" | "bedroom" | "bathroom" | "kitchen" | "view" | "amenity";
    room?: string;      // "Chambre 1", "Salon"
    season?: string;    // "summer", "winter"
  }>;
  
  virtualTour?: {
    provider: "matterport" | "custom";
    url: string;
    embedCode?: string;
  };
  
  videos?: Array<{
    url: string;
    platform: "youtube" | "vimeo" | "custom";
    title: string;
    duration: number;   // Secondes
  }>;
  
  documents?: Array<{
    name: string;       // "Plan de la maison"
    url: string;
    type: "pdf" | "image";
    size: number;       // Bytes
  }>;
}
```

---

## 📧 8. Communications Automatisées

### 8.1 Templates d'Emails

#### Types d'Emails Automatiques
```typescript
enum EmailTemplate {
  // Réservation
  BOOKING_CONFIRMATION = "booking_confirmation",
  PAYMENT_RECEIVED = "payment_received",
  BOOKING_REMINDER = "booking_reminder",
  
  // Pré-arrivée
  PRE_ARRIVAL = "pre_arrival",          // J-7
  CHECK_IN_INSTRUCTIONS = "check_in",   // J-1
  
  // Pendant le séjour
  WELCOME = "welcome",                  // Jour d'arrivée
  MID_STAY = "mid_stay",               // Milieu de séjour
  
  // Post-séjour
  CHECK_OUT_REMINDER = "checkout",      // Veille départ
  THANK_YOU = "thank_you",             // Après départ
  REVIEW_REQUEST = "review_request",    // J+2
  
  // Administratif
  INVOICE = "invoice",
  PAYMENT_REMINDER = "payment_reminder",
  CANCELLATION = "cancellation",
  REFUND = "refund"
}
```

#### Variables Disponibles
```typescript
interface EmailVariables {
  // Client
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    language: string;
  };
  
  // Réservation
  booking: {
    reference: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guests: number;
    totalAmount: string;
    property: {
      name: string;
      address: string;
      photos: string[];
    };
  };
  
  // Propriétaire
  owner: {
    name: string;
    phone: string;
    email: string;
    company?: string;
  };
  
  // Instructions
  instructions: {
    checkIn: string;
    wifi: { network: string; password: string };
    keybox?: { location: string; code: string };
    parking?: string;
    rules: string[];
  };
}
```

### 8.2 Automatisations

```typescript
interface AutomationRule {
  trigger: {
    event: "booking_created" | "payment_received" | "days_before_checkin";
    timing?: number;  // Jours avant/après
  };
  
  actions: Array<{
    type: "send_email" | "send_sms" | "create_task";
    template?: string;
    to: "guest" | "owner" | "cleaner" | "custom";
    customEmail?: string;
  }>;
  
  conditions?: {
    bookingSource?: string[];
    propertyId?: string[];
    minNights?: number;
    season?: string[];
  };
}
```

### 8.3 Messages Personnalisés

```typescript
// Exemple de personnalisation par langue
const templates = {
  welcome: {
    fr: {
      subject: "Bienvenue à {{property.name}}, {{guest.firstName}} !",
      body: `
        Bonjour {{guest.firstName}},
        
        Nous sommes ravis de vous accueillir à {{property.name}}.
        
        Voici vos informations d'arrivée :
        - Check-in : {{booking.checkIn}} à partir de 15h
        - Adresse : {{property.address}}
        - Code WiFi : {{instructions.wifi.password}}
        
        Bon séjour !
        {{owner.name}}
      `
    },
    en: {
      subject: "Welcome to {{property.name}}, {{guest.firstName}}!",
      body: `...`
    }
  }
};
```

---

## 📊 9. Tableau de Bord et Analytics

### 9.1 KPIs Principaux

```typescript
interface DashboardMetrics {
  // Revenus
  revenue: {
    total: number;              // Période courante
    comparison: number;         // % vs période précédente
    breakdown: {
      accommodation: number;
      options: number;
      fees: number;
    };
    projections: {
      month: number;
      quarter: number;
      year: number;
    };
  };
  
  // Occupation
  occupancy: {
    rate: number;              // %
    nights: {
      booked: number;
      available: number;
      blocked: number;
    };
    averageStay: number;       // Nuits
    gapNights: number;         // Nuits perdues entre réservations
  };
  
  // Performance
  performance: {
    adr: number;               // Average Daily Rate
    revPar: number;            // Revenue Per Available Room
    bookingLead: number;       // Jours entre réservation et arrivée
    conversionRate: number;    // Visites → Réservations
  };
  
  // Clients
  guests: {
    total: number;
    new: number;
    returning: number;
    satisfaction: number;      // Note moyenne
    countries: Array<{
      code: string;
      count: number;
      percent: number;
    }>;
  };
}
```

### 9.2 Rapports Détaillés

#### Types de Rapports
```typescript
enum ReportType {
  // Financiers
  REVENUE_SUMMARY = "revenue_summary",
  COMMISSION_REPORT = "commission_report",
  TAX_REPORT = "tax_report",
  PAYOUT_HISTORY = "payout_history",
  
  // Opérationnels
  OCCUPANCY_CALENDAR = "occupancy_calendar",
  BOOKING_LIST = "booking_list",
  GUEST_DATABASE = "guest_database",
  
  // Performance
  CHANNEL_ANALYSIS = "channel_analysis",
  PRICING_OPTIMIZATION = "pricing_optimization",
  SEASONAL_TRENDS = "seasonal_trends",
  
  // Comptabilité
  INVOICE_EXPORT = "invoice_export",
  EXPENSE_TRACKING = "expense_tracking",
  VAT_REPORT = "vat_report"
}
```

### 9.3 Exports et Intégrations

```typescript
interface ExportOptions {
  format: "csv" | "xlsx" | "pdf" | "json";
  
  // Filtres
  dateRange: {
    start: Date;
    end: Date;
  };
  
  properties?: string[];        // Filtrer par propriété
  
  // Colonnes personnalisées
  fields?: string[];
  
  // Groupement
  groupBy?: "day" | "week" | "month" | "property" | "source";
  
  // Planification
  schedule?: {
    frequency: "daily" | "weekly" | "monthly";
    time: string;               // "09:00"
    recipients: string[];       // Emails
  };
}
```

---

## 🔍 10. Recherche et Filtres

### 10.1 Recherche Classique

#### Filtres Disponibles
```typescript
interface SearchFilters {
  // Dates et capacité
  dates: {
    checkIn: Date;
    checkOut: Date;
    flexible?: boolean;         // +/- 3 jours
  };
  
  guests: {
    adults: number;
    children: number;
    infants: number;
    pets?: number;
  };
  
  // Localisation
  location: {
    city?: string;
    region?: string;
    radius?: number;            // km autour d'un point
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Type et caractéristiques
  property: {
    types?: PropertyType[];
    bedrooms?: { min: number; max: number };
    bathrooms?: { min: number };
    area?: { min: number; max: number };
  };
  
  // Prix
  price: {
    min?: number;
    max?: number;
    currency: string;
  };
  
  // Équipements requis
  amenities: {
    required: string[];         // Must have
    preferred: string[];        // Nice to have
  };
  
  // Autres critères
  features: {
    instantBooking?: boolean;
    petsAllowed?: boolean;
    smokingAllowed?: boolean;
    eventsAllowed?: boolean;
    wheelchairAccess?: boolean;
  };
}
```

### 10.2 Recherche IA (Future)

#### Exemples de Requêtes Naturelles
```typescript
const naturalQueries = [
  "Villa romantique avec jacuzzi pour anniversaire de mariage en août",
  "Appartement familial près de la plage avec piscine municipale à proximité",
  "Chalet accessible en fauteuil roulant pour 8 personnes à la montagne",
  "Maison avec jardin clôturé pour 2 chiens, proche forêt pour balades",
  "Studio calme avec bonne connexion internet pour télétravail longue durée",
  "Villa pour 12 personnes avec piscine chauffée pour réveillon nouvel an"
];
```

#### Parsing Intelligent
```typescript
interface ParsedIntent {
  // Extraction automatique
  propertyType?: string;        // "villa", "chalet"
  atmosphere?: string[];        // ["romantique", "calme"]
  
  capacity: {
    adults?: number;
    children?: number;
    totalGuests?: number;
  };
  
  amenities: {
    required: string[];         // ["jacuzzi", "piscine"]
    excluded: string[];         // ["pas de vis-à-vis"]
  };
  
  proximity: {
    near: string[];            // ["plage", "forêt"]
    distance?: string;         // "walking distance", "proche"
  };
  
  occasion?: string;           // "anniversaire", "télétravail"
  
  dates: {
    specific?: Date[];
    period?: string;           // "août", "nouvel an"
    duration?: string;         // "long séjour", "weekend"
    flexible: boolean;
  };
  
  budget?: {
    indication: string;        // "pas trop cher", "luxe"
    max?: number;
  };
}
```

### 10.3 Algorithme de Ranking

```typescript
interface RankingFactors {
  // Pertinence (0-100)
  relevance: {
    amenityMatch: number;      // % équipements matchés
    capacityFit: number;       // Adaptation capacité
    locationScore: number;     // Proximité souhaitée
    dateAvailability: number;  // Disponibilité dates
  };
  
  // Qualité
  quality: {
    reviewScore: number;       // Note moyenne
    reviewCount: number;       // Nombre d'avis
    responseRate: number;      // Taux réponse proprio
    completeness: number;      // Profil complet
  };
  
  // Popularité
  popularity: {
    bookingRate: number;       // Taux de réservation
    viewCount: number;         // Vues récentes
    favoriteCount: number;     // Mis en favoris
  };
  
  // Boost commercial
  commercial: {
    commission: number;        // Commission plus élevée
    featured: boolean;         // Mise en avant payante
    newListing: boolean;       // Boost nouveauté
  };
}

// Score final = weighted sum
function calculateScore(factors: RankingFactors): number {
  return (
    factors.relevance.amenityMatch * 0.3 +
    factors.relevance.capacityFit * 0.2 +
    factors.quality.reviewScore * 0.2 +
    factors.popularity.bookingRate * 0.15 +
    factors.commercial.commission * 0.15
  );
}
```

---

## ⭐ 11. Système d'Avis

### 11.1 Structure des Avis

```typescript
interface Review {
  id: string;
  bookingId: string;            // Lié à une vraie réservation
  
  // Notation détaillée
  ratings: {
    overall: number;            // 1-5 obligatoire
    cleanliness?: number;       // 1-5
    accuracy?: number;          // Correspond à la description
    communication?: number;     // Avec le propriétaire
    location?: number;
    value?: number;            // Rapport qualité/prix
    checkIn?: number;          // Processus d'arrivée
  };
  
  // Commentaire
  comment: {
    positive?: string;         // Points positifs
    negative?: string;         // Points à améliorer
    private?: string;          // Note privée au propriétaire
  };
  
  // Métadonnées
  stayDate: Date;
  guestType: "couple" | "family" | "friends" | "business" | "solo";
  
  // Réponse propriétaire
  response?: {
    text: string;
    date: Date;
  };
  
  // Modération
  status: "pending" | "approved" | "rejected";
  flags?: string[];            // Signalements
}
```

### 11.2 Règles de Publication

```typescript
const reviewRules = {
  // Timing
  timing: {
    minDaysAfterCheckout: 1,
    maxDaysAfterCheckout: 14,
    reminderAfterDays: 3
  },
  
  // Validation
  validation: {
    minCommentLength: 50,      // Caractères
    maxCommentLength: 1000,
    requireOverallRating: true,
    requireComment: false      // Peut noter sans commenter
  },
  
  // Modération automatique
  autoModeration: {
    keywords: ["arnaque", "scam", "fake"],
    minRating: 2,             // Review < 2 étoiles = modération manuelle
  },
  
  // Affichage
  display: {
    orderBy: "recent",        // recent, helpful, rating
    showGuestName: "partial", // "John D."
    showStayDates: "month",   // "Octobre 2024"
  }
};
```

### 11.3 Calcul de la Note Globale

```typescript
function calculatePropertyRating(reviews: Review[]): PropertyRating {
  const validReviews = reviews.filter(r => r.status === 'approved');
  
  if (validReviews.length === 0) {
    return { score: null, count: 0 };
  }
  
  // Moyenne pondérée (avis récents = plus de poids)
  const weights = validReviews.map((review, index) => {
    const monthsAgo = getMonthsDifference(review.stayDate, new Date());
    return Math.max(0.5, 1 - (monthsAgo * 0.05)); // -5% par mois
  });
  
  const weightedSum = validReviews.reduce((sum, review, index) => {
    return sum + (review.ratings.overall * weights[index]);
  }, 0);
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const averageScore = weightedSum / totalWeight;
  
  // Catégories détaillées
  const categories = ['cleanliness', 'accuracy', 'communication', 'location', 'value', 'checkIn'];
  const categoryScores = {};
  
  categories.forEach(category => {
    const scores = validReviews
      .filter(r => r.ratings[category])
      .map(r => r.ratings[category]);
    
    categoryScores[category] = scores.length > 0
      ? scores.reduce((a, b) => a + b) / scores.length
      : null;
  });
  
  return {
    overall: Math.round(averageScore * 10) / 10, // 4.7
    count: validReviews.length,
    categories: categoryScores,
    trend: calculateTrend(validReviews) // ↑ ↓ →
  };
}
```

---

## 🔗 12. Intégrations Externes

### 12.1 Channel Manager

#### Synchronisation Calendriers
```typescript
interface ChannelSync {
  // Plateformes supportées
  channels: {
    airbnb: {
      enabled: boolean;
      propertyId: string;
      syncMode: "ical" | "api";
      lastSync: Date;
    };
    booking: {
      enabled: boolean;
      hotelId: string;
      roomId: string;
      syncMode: "xml" | "api";
    };
    vrbo: {
      enabled: boolean;
      listingId: string;
      syncMode: "ical";
    };
  };
  
  // Configuration sync
  sync: {
    frequency: "realtime" | "hourly" | "daily";
    direction: "import" | "export" | "bidirectional";
    
    // Mapping des données
    priceSync: boolean;        // Synchroniser les prix
    availabilitySync: boolean; // Synchroniser disponibilités
    bookingSync: boolean;      // Importer réservations
    
    // Règles de conflits
    conflictResolution: "local_priority" | "remote_priority" | "newest_wins";
  };
}
```

#### Format iCal
```typescript
// Export iCal
function generateICal(property: Property, bookings: Booking[]): string {
  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Villa SaaS//Booking Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];
  
  bookings.forEach(booking => {
    cal.push(
      'BEGIN:VEVENT',
      `UID:${booking.id}@villa-saas.com`,
      `DTSTART;VALUE=DATE:${formatDate(booking.checkIn)}`,
      `DTEND;VALUE=DATE:${formatDate(booking.checkOut)}`,
      `SUMMARY:${booking.guestName} (${booking.reference})`,
      `DESCRIPTION:${booking.guests} guests\\nPhone: ${booking.guestPhone}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });
  
  cal.push('END:VCALENDAR');
  return cal.join('\r\n');
}
```

### 12.2 Services Tiers

#### Google Calendar
```typescript
interface GoogleCalendarIntegration {
  // Événements créés
  eventTypes: {
    bookings: boolean;         // Nouvelle réservation
    checkIns: boolean;         // Rappels arrivée
    checkOuts: boolean;        // Rappels départ
    maintenance: boolean;      // Travaux planifiés
    blocked: boolean;          // Périodes bloquées
  };
  
  // Format événement
  eventTemplate: {
    title: string;            // "{{guest}} - {{property}}"
    color: string;            // Code couleur
    reminders: Array<{
      method: "email" | "popup";
      minutes: number;        // Minutes avant
    }>;
  };
}
```

#### Comptabilité
```typescript
interface AccountingExport {
  format: "quickbooks" | "sage" | "excel" | "csv";
  
  // Données exportées
  includes: {
    bookings: boolean;
    payments: boolean;
    refunds: boolean;
    fees: boolean;
    taxes: boolean;
    payouts: boolean;
  };
  
  // Mapping comptable
  accounts: {
    revenue: string;          // "7000"
    touristTax: string;       // "4457"
    vat: string;             // "4457"
    commission: string;       // "6226"
  };
  
  // Automatisation
  schedule?: {
    frequency: "monthly" | "quarterly";
    day: number;             // Jour du mois
    email: string;           // Destinataire
  };
}
```

#### Services Locaux
```typescript
interface LocalServices {
  // Types de services
  cleaning: {
    provider: string;
    autoSchedule: boolean;    // Planifier après checkout
    pricing: {
      standard: number;
      deepClean: number;
      express: number;        // Supplément urgence
    };
    instructions?: string;
  };
  
  keyManagement: {
    type: "keybox" | "concierge" | "smart_lock";
    details: {
      location?: string;
      code?: string;
      contact?: string;
      appIntegration?: boolean;
    };
  };
  
  maintenance: Array<{
    service: "pool" | "garden" | "heating" | "general";
    provider: string;
    frequency: "weekly" | "monthly" | "seasonal";
    cost: number;
    autoSchedule: boolean;
  }>;
}
```

---

## 📝 Résumé des Points Clés

### Fonctionnalités Essentielles
1. **Tarification flexible** avec périodes et priorités
2. **Options modulaires** avec différents modes de prix
3. **Taxes automatisées** avec calculs complexes
4. **Politiques d'annulation** personnalisables
5. **Communications automatisées** multilingues
6. **Analytics poussés** pour optimisation
7. **Intégrations** avec écosystème existant

### Complexités à Gérer
1. **Chevauchement** des périodes tarifaires
2. **Calculs de taxes** selon législation locale
3. **Synchronisation** multi-canal sans conflits
4. **Remboursements** selon politiques complexes
5. **Multi-devise** et conversions
6. **Conformité légale** par pays

### Différenciateurs Clés
1. **Flexibilité totale** de configuration
2. **Automatisation maximale** des processus
3. **Transparence** des calculs et frais
4. **Interface intuitive** malgré la complexité
5. **IA intégrée** pour optimisation continue

---

Ce document constitue la référence complète pour comprendre toutes les fonctionnalités métier de Villa SaaS.