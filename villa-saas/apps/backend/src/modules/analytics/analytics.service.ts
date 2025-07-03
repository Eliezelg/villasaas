import { PrismaClient } from '@villa-saas/database';
import { startOfMonth, endOfMonth, subMonths, differenceInDays, format } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface OccupancyData {
  totalDays: number;
  occupiedDays: number;
  occupancyRate: number;
  monthlyData: {
    month: string;
    year: number;
    occupiedDays: number;
    totalDays: number;
    occupancyRate: number;
  }[];
}

interface RevenueData {
  totalRevenue: number;
  averageRevenuePerNight: number;
  averageRevenuePerBooking: number;
  monthlyData: {
    month: string;
    year: number;
    revenue: number;
    bookings: number;
  }[];
}

interface OverviewData {
  totalBookings: number;
  totalRevenue: number;
  averageStayDuration: number;
  occupancyRate: number;
  topProperties: {
    id: string;
    name: string;
    revenue: number;
    bookings: number;
  }[];
  bookingSources: {
    source: string;
    count: number;
    revenue: number;
  }[];
}

export class AnalyticsService {
  constructor(private db: PrismaClient) {}

  async getOverview(tenantId: string, dateRange: DateRange, propertyId?: string): Promise<OverviewData> {
    const bookingFilter = {
      tenantId,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      checkIn: { gte: dateRange.startDate },
      checkOut: { lte: dateRange.endDate },
      ...(propertyId && { propertyId })
    };

    // Get all bookings for the period
    const bookings = await this.db.booking.findMany({
      where: bookingFilter,
      include: {
        property: {
          select: { id: true, name: true }
        }
      }
    });

    // Calculate total revenue
    const totalRevenue = bookings.reduce((sum, booking) => 
      sum + Number(booking.total), 0
    );

    // Calculate average stay duration
    const totalStayDays = bookings.reduce((sum, booking) => 
      sum + differenceInDays(booking.checkOut, booking.checkIn), 0
    );
    const averageStayDuration = bookings.length > 0 ? totalStayDays / bookings.length : 0;

    // Get occupancy rate
    const occupancyData = await this.getOccupancy(tenantId, dateRange, propertyId);

    // Group by property for top properties
    const propertyStats = bookings.reduce((acc, booking) => {
      const propId = booking.property.id;
      if (!acc[propId]) {
        acc[propId] = {
          id: propId,
          name: booking.property.name,
          revenue: 0,
          bookings: 0
        };
      }
      acc[propId].revenue += Number(booking.total);
      acc[propId].bookings += 1;
      return acc;
    }, {} as Record<string, any>);

    const topProperties = Object.values(propertyStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    // Group by booking source
    const sourceStats = bookings.reduce((acc, booking) => {
      const source = booking.source;
      if (!acc[source]) {
        acc[source] = {
          source,
          count: 0,
          revenue: 0
        };
      }
      acc[source].count += 1;
      acc[source].revenue += Number(booking.total);
      return acc;
    }, {} as Record<string, any>);

    const bookingSources = Object.values(sourceStats);

    return {
      totalBookings: bookings.length,
      totalRevenue,
      averageStayDuration: Math.round(averageStayDuration * 10) / 10,
      occupancyRate: occupancyData.occupancyRate,
      topProperties,
      bookingSources
    };
  }

  async getOccupancy(tenantId: string, dateRange: DateRange, propertyId?: string): Promise<OccupancyData> {
    const propertyFilter = {
      tenantId,
      status: 'PUBLISHED',
      ...(propertyId && { id: propertyId })
    };

    // Get all properties
    const properties = await this.db.property.findMany({
      where: propertyFilter,
      select: { id: true }
    });

    if (properties.length === 0) {
      return {
        totalDays: 0,
        occupiedDays: 0,
        occupancyRate: 0,
        monthlyData: []
      };
    }

    // Get all bookings and blocked periods for these properties
    const [bookings, blockedPeriods] = await Promise.all([
      this.db.booking.findMany({
        where: {
          propertyId: { in: properties.map(p => p.id) },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          checkOut: { gte: dateRange.startDate },
          checkIn: { lte: dateRange.endDate }
        },
        select: {
          propertyId: true,
          checkIn: true,
          checkOut: true
        }
      }),
      this.db.blockedPeriod.findMany({
        where: {
          propertyId: { in: properties.map(p => p.id) },
          endDate: { gte: dateRange.startDate },
          startDate: { lte: dateRange.endDate }
        },
        select: {
          propertyId: true,
          startDate: true,
          endDate: true
        }
      })
    ]);

    // Calculate monthly occupancy
    const monthlyData = [];
    let currentMonth = new Date(dateRange.startDate);
    
    while (currentMonth <= dateRange.endDate) {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const effectiveStart = monthStart < dateRange.startDate ? dateRange.startDate : monthStart;
      const effectiveEnd = monthEnd > dateRange.endDate ? dateRange.endDate : monthEnd;
      
      const daysInMonth = differenceInDays(effectiveEnd, effectiveStart) + 1;
      const totalPropertyDays = daysInMonth * properties.length;
      
      // Calculate occupied days for this month
      let occupiedDays = 0;
      
      for (const property of properties) {
        const propertyBookings = bookings.filter(b => b.propertyId === property.id);
        const propertyBlocked = blockedPeriods.filter(b => b.propertyId === property.id);
        
        // Calculate days occupied by bookings
        for (const booking of propertyBookings) {
          const bookingStart = booking.checkIn < effectiveStart ? effectiveStart : booking.checkIn;
          const bookingEnd = booking.checkOut > effectiveEnd ? effectiveEnd : booking.checkOut;
          
          if (bookingStart <= bookingEnd) {
            occupiedDays += differenceInDays(bookingEnd, bookingStart) + 1;
          }
        }
        
        // Calculate days blocked
        for (const blocked of propertyBlocked) {
          const blockedStart = blocked.startDate < effectiveStart ? effectiveStart : blocked.startDate;
          const blockedEnd = blocked.endDate > effectiveEnd ? effectiveEnd : blocked.endDate;
          
          if (blockedStart <= blockedEnd) {
            occupiedDays += differenceInDays(blockedEnd, blockedStart) + 1;
          }
        }
      }
      
      monthlyData.push({
        month: format(currentMonth, 'MMMM'),
        year: currentMonth.getFullYear(),
        occupiedDays,
        totalDays: totalPropertyDays,
        occupancyRate: Math.round((occupiedDays / totalPropertyDays) * 100)
      });
      
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }

    // Calculate total occupancy
    const totalDays = monthlyData.reduce((sum, month) => sum + month.totalDays, 0);
    const occupiedDays = monthlyData.reduce((sum, month) => sum + month.occupiedDays, 0);
    const occupancyRate = totalDays > 0 ? Math.round((occupiedDays / totalDays) * 100) : 0;

    return {
      totalDays,
      occupiedDays,
      occupancyRate,
      monthlyData
    };
  }

  async getRevenue(tenantId: string, dateRange: DateRange, propertyId?: string): Promise<RevenueData> {
    const bookingFilter = {
      tenantId,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      checkIn: { gte: dateRange.startDate },
      checkOut: { lte: dateRange.endDate },
      ...(propertyId && { propertyId })
    };

    const bookings = await this.db.booking.findMany({
      where: bookingFilter,
      select: {
        total: true,
        checkIn: true,
        checkOut: true,
        createdAt: true
      }
    });

    // Calculate monthly revenue
    const monthlyData = [];
    let currentMonth = new Date(dateRange.startDate);
    
    while (currentMonth <= dateRange.endDate) {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const monthBookings = bookings.filter(booking => {
        const bookingMonth = new Date(booking.checkIn);
        return bookingMonth >= monthStart && bookingMonth <= monthEnd;
      });
      
      const monthRevenue = monthBookings.reduce((sum, booking) => 
        sum + Number(booking.total), 0
      );
      
      monthlyData.push({
        month: format(currentMonth, 'MMMM'),
        year: currentMonth.getFullYear(),
        revenue: monthRevenue,
        bookings: monthBookings.length
      });
      
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }

    // Calculate totals
    const totalRevenue = bookings.reduce((sum, booking) => 
      sum + Number(booking.total), 0
    );
    
    const totalNights = bookings.reduce((sum, booking) => 
      sum + differenceInDays(booking.checkOut, booking.checkIn), 0
    );
    
    const averageRevenuePerNight = totalNights > 0 ? totalRevenue / totalNights : 0;
    const averageRevenuePerBooking = bookings.length > 0 ? totalRevenue / bookings.length : 0;

    return {
      totalRevenue,
      averageRevenuePerNight: Math.round(averageRevenuePerNight * 100) / 100,
      averageRevenuePerBooking: Math.round(averageRevenuePerBooking * 100) / 100,
      monthlyData
    };
  }

  async exportData(tenantId: string, dateRange: DateRange, propertyId?: string): Promise<Buffer> {
    // Get all data
    const [overview, occupancy, revenue] = await Promise.all([
      this.getOverview(tenantId, dateRange, propertyId),
      this.getOccupancy(tenantId, dateRange, propertyId),
      this.getRevenue(tenantId, dateRange, propertyId)
    ]);

    // Create CSV content
    const csvLines = [
      'Villa SaaS - Analytics Report',
      `Period: ${format(dateRange.startDate, 'yyyy-MM-dd')} to ${format(dateRange.endDate, 'yyyy-MM-dd')}`,
      '',
      'OVERVIEW',
      `Total Bookings,${overview.totalBookings}`,
      `Total Revenue,${overview.totalRevenue}`,
      `Average Stay Duration,${overview.averageStayDuration} days`,
      `Occupancy Rate,${overview.occupancyRate}%`,
      '',
      'MONTHLY REVENUE',
      'Month,Year,Revenue,Bookings'
    ];

    revenue.monthlyData.forEach(month => {
      csvLines.push(`${month.month},${month.year},${month.revenue},${month.bookings}`);
    });

    csvLines.push('', 'MONTHLY OCCUPANCY', 'Month,Year,Occupied Days,Total Days,Occupancy Rate');
    
    occupancy.monthlyData.forEach(month => {
      csvLines.push(`${month.month},${month.year},${month.occupiedDays},${month.totalDays},${month.occupancyRate}%`);
    });

    csvLines.push('', 'TOP PROPERTIES', 'Property,Revenue,Bookings');
    
    overview.topProperties.forEach(prop => {
      csvLines.push(`"${prop.name}",${prop.revenue},${prop.bookings}`);
    });

    csvLines.push('', 'BOOKING SOURCES', 'Source,Count,Revenue');
    
    overview.bookingSources.forEach(source => {
      csvLines.push(`${source.source},${source.count},${source.revenue}`);
    });

    return Buffer.from(csvLines.join('\n'), 'utf-8');
  }
}