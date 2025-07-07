import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/services/ai.service';
import { prisma } from '@villa-saas/database';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, context, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Extraire l'intention de recherche
    const searchIntent = await aiService.extractSearchIntent(message, context);

    // Rechercher des propriétés basées sur l'intention
    let properties = [];
    
    if (Object.keys(searchIntent).length > 0) {
      // Si on a des critères, chercher des propriétés
      const whereClause: any = {
        status: 'PUBLISHED',
      };

      if (searchIntent.location) {
        whereClause.OR = [
          { city: { contains: searchIntent.location, mode: 'insensitive' } },
          { address: { contains: searchIntent.location, mode: 'insensitive' } },
        ];
      }

      if (searchIntent.guests) {
        whereClause.maxGuests = { gte: searchIntent.guests };
      }

      if (searchIntent.propertyType?.length) {
        whereClause.propertyType = { in: searchIntent.propertyType };
      }

      if (searchIntent.priceRange) {
        whereClause.basePrice = {};
        if (searchIntent.priceRange.min) {
          whereClause.basePrice.gte = searchIntent.priceRange.min;
        }
        if (searchIntent.priceRange.max) {
          whereClause.basePrice.lte = searchIntent.priceRange.max;
        }
      }

      // Recherche de base
      properties = await prisma.property.findMany({
        where: whereClause,
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
        },
        take: 10,
      });

      // Si on a un texte de recherche, utiliser la recherche sémantique
      if (message.length > 10) {
        const embedding = await aiService.generateEmbedding(message);
        const similarProperties = await aiService.findSimilarProperties(
          embedding,
          10,
          searchIntent
        );
        
        // Combiner et dédupliquer les résultats
        const propertyIds = new Set(properties.map(p => p.id));
        similarProperties.forEach(p => {
          if (!propertyIds.has(p.id)) {
            properties.push(p);
          }
        });
      }
    }

    // Générer une réponse conversationnelle
    const aiResponse = await aiService.generateSearchResponse(
      message,
      properties,
      'fr'
    );

    // Sauvegarder la conversation
    await prisma.aIConversation.create({
      data: {
        sessionId: sessionId || `session_${Date.now()}`,
        messages: [...(context || []), { role: 'user', content: message }, { role: 'assistant', content: aiResponse }],
        context: searchIntent,
        searchResults: properties.map(p => ({
          id: p.id,
          name: p.name,
          city: p.city,
          price: p.basePrice,
        })),
      },
    });

    return NextResponse.json({
      message: aiResponse,
      searchParams: searchIntent,
      properties: properties.slice(0, 6), // Limiter à 6 propriétés
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}