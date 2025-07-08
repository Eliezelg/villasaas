import { PrismaClient } from '@villa-saas/database';
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
export declare class AnalyticsService {
    private db;
    constructor(db: PrismaClient);
    getOverview(tenantId: string, dateRange: DateRange, propertyId?: string): Promise<OverviewData>;
    getOccupancy(tenantId: string, dateRange: DateRange, propertyId?: string): Promise<OccupancyData>;
    getRevenue(tenantId: string, dateRange: DateRange, propertyId?: string): Promise<RevenueData>;
    exportData(tenantId: string, dateRange: DateRange, propertyId?: string): Promise<Buffer>;
}
export {};
//# sourceMappingURL=analytics.service.d.ts.map