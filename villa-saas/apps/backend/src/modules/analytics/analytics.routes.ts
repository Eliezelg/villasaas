import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AnalyticsService } from './analytics.service';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { getTenantId } from '@villa-saas/utils';

const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  propertyId: z.string().uuid().optional()
});

export async function analyticsRoutes(fastify: FastifyInstance) {
  const analyticsService = new AnalyticsService(fastify.prisma);

  // Get overview analytics
  fastify.get('/overview', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Analytics'],
      summary: 'Get analytics overview',
      description: 'Get key performance indicators and overview metrics',
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          propertyId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            totalBookings: { type: 'number' },
            totalRevenue: { type: 'number' },
            averageStayDuration: { type: 'number' },
            occupancyRate: { type: 'number' },
            topProperties: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  revenue: { type: 'number' },
                  bookings: { type: 'number' }
                }
              }
            },
            bookingSources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  source: { type: 'string' },
                  count: { type: 'number' },
                  revenue: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const validation = dateRangeSchema.safeParse(request.query);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { startDate, endDate, propertyId } = validation.data;
    
    // Default to last 3 months if no date range provided
    const dateRange = {
      startDate: startDate ? new Date(startDate) : startOfMonth(subMonths(new Date(), 2)),
      endDate: endDate ? new Date(endDate) : endOfMonth(new Date())
    };

    try {
      const tenantId = getTenantId(request);
      const overview = await analyticsService.getOverview(
        tenantId,
        dateRange,
        propertyId
      );
      
      return reply.send(overview);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to get analytics overview' });
    }
  });

  // Get occupancy analytics
  fastify.get('/occupancy', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Analytics'],
      summary: 'Get occupancy analytics',
      description: 'Get occupancy rates and trends',
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          propertyId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            totalDays: { type: 'number' },
            occupiedDays: { type: 'number' },
            occupancyRate: { type: 'number' },
            monthlyData: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month: { type: 'string' },
                  year: { type: 'number' },
                  occupiedDays: { type: 'number' },
                  totalDays: { type: 'number' },
                  occupancyRate: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const validation = dateRangeSchema.safeParse(request.query);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { startDate, endDate, propertyId } = validation.data;
    
    const dateRange = {
      startDate: startDate ? new Date(startDate) : startOfMonth(subMonths(new Date(), 2)),
      endDate: endDate ? new Date(endDate) : endOfMonth(new Date())
    };

    try {
      const occupancy = await analyticsService.getOccupancy(
        getTenantId(request),
        dateRange,
        propertyId
      );
      
      return reply.send(occupancy);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to get occupancy analytics' });
    }
  });

  // Get revenue analytics
  fastify.get('/revenue', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Analytics'],
      summary: 'Get revenue analytics',
      description: 'Get revenue metrics and trends',
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          propertyId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            totalRevenue: { type: 'number' },
            averageRevenuePerNight: { type: 'number' },
            averageRevenuePerBooking: { type: 'number' },
            monthlyData: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month: { type: 'string' },
                  year: { type: 'number' },
                  revenue: { type: 'number' },
                  bookings: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const validation = dateRangeSchema.safeParse(request.query);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { startDate, endDate, propertyId } = validation.data;
    
    const dateRange = {
      startDate: startDate ? new Date(startDate) : startOfMonth(subMonths(new Date(), 2)),
      endDate: endDate ? new Date(endDate) : endOfMonth(new Date())
    };

    try {
      const revenue = await analyticsService.getRevenue(
        getTenantId(request),
        dateRange,
        propertyId
      );
      
      return reply.send(revenue);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to get revenue analytics' });
    }
  });

  // Get top properties
  fastify.get('/top-properties', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Analytics'],
      summary: 'Get top performing properties',
      description: 'Get properties ranked by revenue or bookings',
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          limit: { type: 'number', default: 10 },
          sortBy: { type: 'string', enum: ['revenue', 'bookings'], default: 'revenue' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              revenue: { type: 'number' },
              bookings: { type: 'number' },
              occupancyRate: { type: 'number' },
              averageNightlyRate: { type: 'number' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { startDate, endDate, limit = 10, sortBy = 'revenue' } = request.query as any;
    
    const dateRange = {
      startDate: startDate ? new Date(startDate) : startOfMonth(subMonths(new Date(), 2)),
      endDate: endDate ? new Date(endDate) : endOfMonth(new Date())
    };

    try {
      const tenantId = getTenantId(request);
      const topProperties = await analyticsService.getTopProperties(
        tenantId,
        dateRange,
        limit,
        sortBy
      );
      
      return reply.send(topProperties);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to get top properties' });
    }
  });

  // Get booking sources
  fastify.get('/booking-sources', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Analytics'],
      summary: 'Get booking sources analytics',
      description: 'Get bookings breakdown by source',
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          propertyId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              count: { type: 'number' },
              revenue: { type: 'number' },
              percentage: { type: 'number' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const validation = dateRangeSchema.safeParse(request.query);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { startDate, endDate, propertyId } = validation.data;
    
    const dateRange = {
      startDate: startDate ? new Date(startDate) : startOfMonth(subMonths(new Date(), 2)),
      endDate: endDate ? new Date(endDate) : endOfMonth(new Date())
    };

    try {
      const tenantId = getTenantId(request);
      const bookingSources = await analyticsService.getBookingSources(
        tenantId,
        dateRange,
        propertyId
      );
      
      return reply.send(bookingSources);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to get booking sources' });
    }
  });

  // Export analytics data
  fastify.get('/export', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Analytics'],
      summary: 'Export analytics data',
      description: 'Export analytics data as CSV',
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          propertyId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'string',
          description: 'CSV file content'
        }
      }
    }
  }, async (request, reply) => {
    const validation = dateRangeSchema.safeParse(request.query);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { startDate, endDate, propertyId } = validation.data;
    
    const dateRange = {
      startDate: startDate ? new Date(startDate) : startOfMonth(subMonths(new Date(), 2)),
      endDate: endDate ? new Date(endDate) : endOfMonth(new Date())
    };

    try {
      const csvBuffer = await analyticsService.exportData(
        getTenantId(request),
        dateRange,
        propertyId
      );
      
      const filename = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      
      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csvBuffer);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to export analytics data' });
    }
  });
}