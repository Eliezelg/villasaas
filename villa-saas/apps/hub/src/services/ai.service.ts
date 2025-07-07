import OpenAI from 'openai';
import { prisma } from '@villa-saas/database';
import { Property } from '@prisma/client';

interface SearchIntent {
  location?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  propertyType?: string[];
  amenities?: string[];
  priceRange?: { min?: number; max?: number };
  ambiance?: string[];
}

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async extractSearchIntent(message: string, context?: any[]): Promise<SearchIntent> {
    const systemPrompt = `You are an AI assistant that extracts search parameters from natural language queries about vacation rentals.
    Extract the following information if present:
    - location (city, region, or country)
    - checkIn and checkOut dates (return as ISO date strings)
    - number of guests
    - property type (apartment, house, villa, etc.)
    - amenities (pool, wifi, parking, etc.)
    - price range (min and max per night)
    - ambiance (romantic, family, luxury, etc.)
    
    Return the extracted data as a JSON object. If a field is not mentioned, omit it from the response.
    Today's date is ${new Date().toISOString().split('T')[0]}.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(context || []),
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response || '{}');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }

  async findSimilarProperties(
    embedding: number[],
    limit: number = 10,
    filters?: Partial<SearchIntent>
  ): Promise<Property[]> {
    // Construire la requête SQL avec pgvector
    let whereClause = 'WHERE p.status = $1';
    const params: any[] = ['PUBLISHED'];
    let paramIndex = 2;

    if (filters?.location) {
      whereClause += ` AND (LOWER(p.city) LIKE $${paramIndex} OR LOWER(p.address) LIKE $${paramIndex})`;
      params.push(`%${filters.location.toLowerCase()}%`);
      paramIndex++;
    }

    if (filters?.guests) {
      whereClause += ` AND p."maxGuests" >= $${paramIndex}`;
      params.push(filters.guests);
      paramIndex++;
    }

    if (filters?.priceRange) {
      if (filters.priceRange.min) {
        whereClause += ` AND p."basePrice" >= $${paramIndex}`;
        params.push(filters.priceRange.min);
        paramIndex++;
      }
      if (filters.priceRange.max) {
        whereClause += ` AND p."basePrice" <= $${paramIndex}`;
        params.push(filters.priceRange.max);
        paramIndex++;
      }
    }

    // Requête avec similarité cosinus
    const query = `
      SELECT p.*, 
             1 - (pe.embedding <=> $${paramIndex}::vector) as similarity
      FROM "Property" p
      LEFT JOIN "PropertyEmbedding" pe ON p.id = pe."propertyId"
      ${whereClause}
      ORDER BY similarity DESC NULLS LAST
      LIMIT $${paramIndex + 1}
    `;

    params.push(JSON.stringify(embedding));
    params.push(limit);

    // Exécuter la requête brute
    const properties = await prisma.$queryRawUnsafe<Property[]>(query, ...params);
    
    return properties;
  }

  async generatePropertyDescription(property: any, language: string = 'fr'): Promise<string> {
    const prompt = `Generate an engaging and SEO-optimized description for this vacation rental property in ${language}.
    
    Property details:
    - Name: ${property.name}
    - Type: ${property.propertyType}
    - Location: ${property.city}, ${property.country}
    - Capacity: ${property.maxGuests} guests, ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms
    - Amenities: ${JSON.stringify(property.amenities)}
    - Ambiance: ${JSON.stringify(property.atmosphere)}
    
    The description should be around 150-200 words, highlight unique features, and appeal to travelers.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    return completion.choices[0].message.content || '';
  }

  async generateSearchResponse(
    query: string,
    properties: Property[],
    language: string = 'fr'
  ): Promise<string> {
    const prompt = `You are a helpful travel assistant. The user asked: "${query}"
    
    Based on their query, here are ${properties.length} properties that match their criteria:
    ${properties.map((p, i) => `
    ${i + 1}. ${p.name} in ${p.city}
    - Type: ${p.propertyType}
    - Capacity: ${p.maxGuests} guests
    - Price: €${p.basePrice}/night
    `).join('')}
    
    Provide a friendly response in ${language} that:
    1. Acknowledges their request
    2. Summarizes what you found
    3. Highlights 2-3 best options with brief descriptions
    4. Offers to help refine the search if needed
    
    Keep the response conversational and helpful.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content || '';
  }

  async updatePropertyEmbeddings(propertyId: string): Promise<void> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) return;

    // Créer le contenu pour l'embedding
    const content = `
      ${property.name}
      ${property.propertyType}
      ${property.city} ${property.country}
      ${property.maxGuests} guests ${property.bedrooms} bedrooms
      ${JSON.stringify(property.amenities)}
      ${JSON.stringify(property.atmosphere)}
      ${property.description}
    `.trim();

    // Générer l'embedding
    const embedding = await this.generateEmbedding(content);

    // Sauvegarder ou mettre à jour
    await prisma.propertyEmbedding.upsert({
      where: { propertyId },
      update: {
        embedding,
        model: 'text-embedding-3-small',
        updatedAt: new Date(),
      },
      create: {
        propertyId,
        embedding,
        model: 'text-embedding-3-small',
      },
    });

    // Mettre à jour le contenu searchable
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        searchableContent: content,
        embedding,
      },
    });
  }
}

export const aiService = new AIService();