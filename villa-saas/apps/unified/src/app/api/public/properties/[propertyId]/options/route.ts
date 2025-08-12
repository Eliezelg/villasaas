import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params

    // Récupérer les options de la propriété
    const property = await prisma.property.findFirst({
      where: { id: propertyId },
      include: {
        propertyOptions: {
          include: {
            option: true
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Extraire et formater les options
    const options = property.propertyOptions.map(po => ({
      id: po.option.id,
      name: po.option.name,
      description: po.option.description,
      category: po.option.category,
      pricePerUnit: po.pricePerUnit || po.option.pricePerUnit,
      pricingType: po.option.pricingType,
      pricingPeriod: po.option.pricingPeriod,
      isMandatory: po.isMandatory,
      isActive: po.isActive,
      minGuests: po.option.minGuests,
      maxGuests: po.option.maxGuests,
      minNights: po.option.minNights
    })).filter(o => o.isActive)

    return NextResponse.json(options)
  } catch (error) {
    console.error('Error fetching property options:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}