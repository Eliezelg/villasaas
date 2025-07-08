import { NextResponse } from 'next/server';
import { aiService } from '@/services/ai.service';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    // Extract search intent from the conversation
    const searchIntent = await aiService.extractSearchIntent(lastMessage.content);
    
    // Search for properties based on the intent
    const properties = await aiService.searchProperties(searchIntent);
    
    // Generate a response
    const response = await aiService.generateResponse(
      lastMessage.content,
      searchIntent,
      properties
    );

    return NextResponse.json({
      message: response,
      properties: properties.slice(0, 6), // Return top 6 properties
      searchIntent
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}