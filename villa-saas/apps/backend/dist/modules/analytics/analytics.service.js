"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const date_fns_1 = require("date-fns");
class AnalyticsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getOverview(tenantId, dateRange, propertyId) {
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
        const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.total), 0);
        // Calculate average stay duration
        const totalStayDays = bookings.reduce((sum, booking) => sum + (0, date_fns_1.differenceInDays)(booking.checkOut, booking.checkIn), 0);
        const averageStayDuration = bookings.length > 0 ? totalStayDays / bookings.length : 0;
        // Get occupancy rate
        const occupancyData = await this.getOccupancy(tenantId, dateRange, propertyId);
        // Group by property for top properties
        const propertyStats = bookings.reduce((acc, booking) => {
            const propId = booking.propertyId;
            if (!acc[propId]) {
                acc[propId] = {
                    id: propId,
                    name: booking.property?.name || 'Unknown',
                    revenue: 0,
                    bookings: 0
                };
            }
            acc[propId].revenue += Number(booking.total);
            acc[propId].bookings += 1;
            return acc;
        }, {});
        const topProperties = Object.values(propertyStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
        // Group by booking source
        const sourceStats = bookings.reduce((acc, booking) => {
            const source = booking.source || 'UNKNOWN';
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
        }, {});
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
    async getOccupancy(tenantId, dateRange, propertyId) {
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
            const monthStart = (0, date_fns_1.startOfMonth)(currentMonth);
            const monthEnd = (0, date_fns_1.endOfMonth)(currentMonth);
            const effectiveStart = monthStart < dateRange.startDate ? dateRange.startDate : monthStart;
            const effectiveEnd = monthEnd > dateRange.endDate ? dateRange.endDate : monthEnd;
            const daysInMonth = (0, date_fns_1.differenceInDays)(effectiveEnd, effectiveStart) + 1;
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
                        occupiedDays += (0, date_fns_1.differenceInDays)(bookingEnd, bookingStart) + 1;
                    }
                }
                // Calculate days blocked
                for (const blocked of propertyBlocked) {
                    const blockedStart = blocked.startDate < effectiveStart ? effectiveStart : blocked.startDate;
                    const blockedEnd = blocked.endDate > effectiveEnd ? effectiveEnd : blocked.endDate;
                    if (blockedStart <= blockedEnd) {
                        occupiedDays += (0, date_fns_1.differenceInDays)(blockedEnd, blockedStart) + 1;
                    }
                }
            }
            monthlyData.push({
                month: (0, date_fns_1.format)(currentMonth, 'MMMM'),
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
    async getRevenue(tenantId, dateRange, propertyId) {
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
            const monthStart = (0, date_fns_1.startOfMonth)(currentMonth);
            const monthEnd = (0, date_fns_1.endOfMonth)(currentMonth);
            const monthBookings = bookings.filter(booking => {
                const bookingMonth = new Date(booking.checkIn);
                return bookingMonth >= monthStart && bookingMonth <= monthEnd;
            });
            const monthRevenue = monthBookings.reduce((sum, booking) => sum + Number(booking.total), 0);
            monthlyData.push({
                month: (0, date_fns_1.format)(currentMonth, 'MMMM'),
                year: currentMonth.getFullYear(),
                revenue: monthRevenue,
                bookings: monthBookings.length
            });
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        }
        // Calculate totals
        const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.total), 0);
        const totalNights = bookings.reduce((sum, booking) => sum + (0, date_fns_1.differenceInDays)(booking.checkOut, booking.checkIn), 0);
        const averageRevenuePerNight = totalNights > 0 ? totalRevenue / totalNights : 0;
        const averageRevenuePerBooking = bookings.length > 0 ? totalRevenue / bookings.length : 0;
        return {
            totalRevenue,
            averageRevenuePerNight: Math.round(averageRevenuePerNight * 100) / 100,
            averageRevenuePerBooking: Math.round(averageRevenuePerBooking * 100) / 100,
            monthlyData
        };
    }
    async getTopProperties(tenantId, dateRange, limit = 10, sortBy = 'revenue') {
        const bookings = await this.db.booking.findMany({
            where: {
                tenantId,
                status: { in: ['CONFIRMED', 'COMPLETED'] },
                checkIn: { gte: dateRange.startDate },
                checkOut: { lte: dateRange.endDate }
            },
            include: {
                property: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        // Group by property
        const propertyStats = new Map();
        for (const booking of bookings) {
            const propId = booking.propertyId;
            const stats = propertyStats.get(propId) || {
                id: propId,
                name: booking.property.name,
                revenue: 0,
                bookings: 0,
                nights: 0
            };
            stats.revenue += Number(booking.total);
            stats.bookings += 1;
            stats.nights += (0, date_fns_1.differenceInDays)(booking.checkOut, booking.checkIn);
            propertyStats.set(propId, stats);
        }
        // Calculate occupancy rates
        const propertiesArray = Array.from(propertyStats.values());
        const totalDays = (0, date_fns_1.differenceInDays)(dateRange.endDate, dateRange.startDate) + 1;
        const results = propertiesArray.map(prop => ({
            ...prop,
            occupancyRate: Math.round((prop.nights / totalDays) * 100),
            averageNightlyRate: prop.nights > 0 ? Math.round(prop.revenue / prop.nights) : 0
        }));
        // Sort by specified criteria
        results.sort((a, b) => b[sortBy] - a[sortBy]);
        return results.slice(0, limit);
    }
    async getBookingSources(tenantId, dateRange, propertyId) {
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
                source: true
            }
        });
        // Group by source
        const sourceStats = new Map();
        let totalRevenue = 0;
        for (const booking of bookings) {
            const source = booking.source || 'DIRECT';
            const stats = sourceStats.get(source) || {
                source,
                count: 0,
                revenue: 0
            };
            stats.count += 1;
            stats.revenue += Number(booking.total);
            totalRevenue += Number(booking.total);
            sourceStats.set(source, stats);
        }
        // Calculate percentages
        const results = Array.from(sourceStats.values()).map(source => ({
            ...source,
            percentage: totalRevenue > 0 ? Math.round((source.revenue / totalRevenue) * 100) : 0
        }));
        // Sort by revenue
        results.sort((a, b) => b.revenue - a.revenue);
        return results;
    }
    async exportData(tenantId, dateRange, propertyId) {
        // Get all data
        const [overview, occupancy, revenue] = await Promise.all([
            this.getOverview(tenantId, dateRange, propertyId),
            this.getOccupancy(tenantId, dateRange, propertyId),
            this.getRevenue(tenantId, dateRange, propertyId)
        ]);
        // Create CSV content
        const csvLines = [
            'Villa SaaS - Analytics Report',
            `Period: ${(0, date_fns_1.format)(dateRange.startDate, 'yyyy-MM-dd')} to ${(0, date_fns_1.format)(dateRange.endDate, 'yyyy-MM-dd')}`,
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
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map