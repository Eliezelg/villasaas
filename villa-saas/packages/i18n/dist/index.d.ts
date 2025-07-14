export declare const locales: readonly ["fr", "en", "es", "de", "it", "pt", "nl", "ru", "zh", "ja", "ar", "he", "hi", "tr", "pl"];
export type Locale = typeof locales[number];
export declare const defaultLocale: Locale;
export declare const localeNames: Record<Locale, string>;
export declare const messages: {
    readonly fr: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
        };
        readonly booking: {
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
        };
    };
    readonly en: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
        };
        readonly booking: {
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
        };
    };
    readonly es: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
        };
        readonly booking: {
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
        };
    };
    readonly de: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
        };
        readonly booking: {
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
        };
    };
    readonly it: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
        };
        readonly booking: {
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
        };
    };
    readonly pt: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
        };
        readonly booking: {
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
        };
    };
    readonly nl: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
        };
        readonly booking: {
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
        };
    };
    readonly ru: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
        };
        readonly booking: {
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
        };
    };
    readonly zh: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
        };
        readonly booking: {
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
        };
    };
    readonly ja: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
        };
        readonly booking: {
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
        };
    };
    readonly ar: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
            _rtl: boolean;
        };
        readonly booking: {
            _rtl: boolean;
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
            _rtl: boolean;
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
            _rtl: boolean;
        };
    };
    readonly he: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
            _rtl: boolean;
        };
        readonly booking: {
            _rtl: boolean;
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
            _rtl: boolean;
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
            _rtl: boolean;
        };
    };
    readonly hi: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
        };
        readonly booking: {
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
        };
    };
    readonly tr: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
        };
        readonly booking: {
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
        };
    };
    readonly pl: {
        readonly common: {
            navigation: {
                home: string;
                properties: string;
                about: string;
                contact: string;
                login: string;
                signup: string;
                dashboard: string;
            };
            actions: {
                search: string;
                filter: string;
                sort: string;
                book: string;
                cancel: string;
                confirm: string;
                save: string;
                delete: string;
                edit: string;
                view: string;
                back: string;
                next: string;
                previous: string;
                continue: string;
                backToHome: string;
            };
            labels: {
                email: string;
                password: string;
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                language: string;
                currency: string;
            };
            messages: {
                loading: string;
                error: string;
                success: string;
                noResults: string;
                required: string;
                invalidEmail: string;
                invalidPhone: string;
                notFound: string;
            };
            footer: {
                rights: string;
                privacy: string;
                terms: string;
                cookies: string;
            };
        };
        readonly booking: {
            hero: {
                title: string;
                subtitle: string;
                searchPlaceholder: string;
                checkIn: string;
                checkOut: string;
                guests: string;
                guestsSingular: string;
                guestsPlural: string;
            };
            search: {
                title: string;
                results: string;
                noResults: string;
                tryDifferent: string;
                noProperties: string;
                contactOwner: string;
                sortBy: string;
                sortOptions: {
                    relevance: string;
                    priceAsc: string;
                    priceDesc: string;
                    rating: string;
                    newest: string;
                };
            };
            filters: {
                title: string;
                clear: string;
                apply: string;
                showing: string;
                priceRange: string;
                pricePerNight: string;
                propertyType: string;
                bedrooms: string;
                bathrooms: string;
                amenities: string;
                atmosphere: string;
                instantBook: string;
                superhost: string;
            };
            property: {
                perNight: string;
                from: string;
                sleeps: string;
                bedrooms: string;
                bathrooms: string;
                beds: string;
                minStay: string;
                maxGuests: string;
                checkInTime: string;
                checkOutTime: string;
                description: string;
                amenities: string;
                location: string;
                houseRules: string;
                cancellationPolicy: string;
                reviews: string;
                rating: string;
                noReviews: string;
            };
            booking: {
                title: string;
                selectDates: string;
                guestInfo: string;
                payment: string;
                confirmation: string;
                summary: string;
                nights: string;
                guests: string;
                subtotal: string;
                cleaningFee: string;
                serviceFee: string;
                touristTax: string;
                discount: string;
                total: string;
                agreeTerms: string;
                confirmBooking: string;
                processing: string;
                bookingConfirmed: string;
                bookingReference: string;
                emailSent: string;
            };
            availability: {
                available: string;
                unavailable: string;
                checkIn: string;
                checkOut: string;
                minStay: string;
                selectCheckIn: string;
                selectCheckOut: string;
            };
            payment: {
                title: string;
                secure: string;
                cardNumber: string;
                expiryDate: string;
                cvc: string;
                nameOnCard: string;
                billingAddress: string;
                sameAsGuest: string;
                payNow: string;
                processing: string;
                success: string;
                error: string;
                tryAgain: string;
            };
            guest: {
                title: string;
                additionalGuests: string;
                specialRequests: string;
                arrivalTime: string;
                purposeOfStay: string;
                purposes: {
                    leisure: string;
                    business: string;
                    event: string;
                    other: string;
                };
            };
            propertyTypes: {
                APARTMENT: string;
                HOUSE: string;
                VILLA: string;
                STUDIO: string;
                LOFT: string;
                ROOM: string;
                OTHER: string;
            };
            amenities: {
                wifi: string;
                parking: string;
                pool: string;
                airConditioning: string;
                heating: string;
                kitchen: string;
                washer: string;
                dryer: string;
                dishwasher: string;
                tv: string;
                fireplace: string;
                balcony: string;
                terrace: string;
                garden: string;
                bbq: string;
                gym: string;
                elevator: string;
                wheelchairAccess: string;
                petsAllowed: string;
                smokingAllowed: string;
            };
            atmosphere: {
                family: string;
                romantic: string;
                business: string;
                party: string;
                quiet: string;
                adventure: string;
                luxury: string;
                nature: string;
                urban: string;
                beach: string;
                mountain: string;
                countryside: string;
            };
            myBooking: {
                title: string;
                description: string;
                referenceLabel: string;
                referenceHelp: string;
                findBooking: string;
                notFound: string;
                tooManyAttempts: string;
                needHelp: string;
                details: {
                    title: string;
                    status: string;
                    property: string;
                    dates: string;
                    guests: string;
                    totalAmount: string;
                    paymentStatus: string;
                    bookingDate: string;
                    guestInfo: string;
                    specialRequests: string;
                    downloadInvoice: string;
                    modifyBooking: string;
                    cancelBooking: string;
                    contactHost: string;
                };
                statuses: {
                    DRAFT: string;
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                };
                paymentStatuses: {
                    PENDING: string;
                    PAID: string;
                    FAILED: string;
                    REFUNDED: string;
                };
            };
            promocode: {
                placeholder: string;
                apply: string;
                invalid: string;
                discount: string;
                applied: string;
                removed: string;
            };
        };
        readonly emails: {
            bookingConfirmation: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                thankYou: string;
                footer: string;
            };
            paymentFailed: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                warning: string;
                retryButton: string;
                contact: string;
                footer: string;
            };
            bookingCancelled: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    checkIn: string;
                    checkOut: string;
                };
                newBooking: string;
                footer: string;
            };
            ownerNotification: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                details: {
                    title: string;
                    reference: string;
                    property: string;
                    guest: string;
                    checkIn: string;
                    checkOut: string;
                    guests: string;
                    total: string;
                };
                footer: string;
            };
            checkInReminder: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                checkInTime: string;
                instructions: string;
                contact: string;
                footer: string;
            };
            checkInInstructions: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                address: string;
                accessCode: string;
                wifiPassword: string;
                checkOut: string;
                emergency: string;
                enjoyStay: string;
                footer: string;
            };
            reviewRequest: {
                subject: string;
                title: string;
                greeting: string;
                intro: string;
                request: string;
                reviewButton: string;
                thankYou: string;
                footer: string;
            };
        };
        readonly admin: {
            dashboard: {
                title: string;
                welcome: string;
                stats: {
                    properties: string;
                    activeProperties: string;
                    bookings: string;
                    thisMonth: string;
                    revenue: string;
                    occupancyRate: string;
                    averageThisMonth: string;
                };
                recentBookings: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
                recentActivity: {
                    title: string;
                    subtitle: string;
                    empty: string;
                };
            };
            properties: {
                title: string;
                subtitle: string;
                addProperty: string;
                loading: string;
                error: string;
                empty: {
                    title: string;
                    description: string;
                };
                deleteConfirm: string;
                labels: {
                    bedrooms: string;
                    guests: string;
                    pricePerNight: string;
                    edit: string;
                };
                types: {
                    APARTMENT: string;
                    HOUSE: string;
                    VILLA: string;
                    STUDIO: string;
                    LOFT: string;
                    ROOM: string;
                    OTHER: string;
                };
                statuses: {
                    DRAFT: string;
                    PUBLISHED: string;
                    ARCHIVED: string;
                };
            };
            bookings: {
                title: string;
                subtitle: string;
                newBooking: string;
                search: string;
                filters: {
                    allProperties: string;
                    allStatuses: string;
                    apply: string;
                };
                table: {
                    reference: string;
                    property: string;
                    client: string;
                    dates: string;
                    guests: string;
                    total: string;
                    status: string;
                    actions: string;
                };
                labels: {
                    nights: string;
                    night: string;
                    babies: string;
                    baby: string;
                    viewDetails: string;
                    confirm: string;
                    cancel: string;
                };
                empty: string;
                pagination: string;
                errors: {
                    loadError: string;
                };
                messages: {
                    confirmSuccess: string;
                    cancelSuccess: string;
                    cancelConfirm: string;
                    cancelReason: string;
                };
                statuses: {
                    PENDING: string;
                    CONFIRMED: string;
                    CANCELLED: string;
                    COMPLETED: string;
                    NO_SHOW: string;
                };
            };
            settings: {
                title: string;
                subtitle: string;
                sections: {
                    profile: {
                        title: string;
                        description: string;
                    };
                    payments: {
                        title: string;
                        description: string;
                    };
                    users: {
                        title: string;
                        description: string;
                    };
                    emails: {
                        title: string;
                        description: string;
                    };
                    autoResponses: {
                        title: string;
                        description: string;
                    };
                    integrations: {
                        title: string;
                        description: string;
                    };
                    security: {
                        title: string;
                        description: string;
                    };
                    preferences: {
                        title: string;
                        description: string;
                    };
                };
            };
            auth: {
                backToHome: string;
                login: {
                    title: string;
                    subtitle: string;
                    email: string;
                    emailPlaceholder: string;
                    password: string;
                    errors: {
                        invalidEmail: string;
                        passwordRequired: string;
                        generic: string;
                    };
                    submit: string;
                    submitting: string;
                    noAccount: string;
                    createAccount: string;
                };
                logout: string;
            };
            navigation: {
                dashboard: string;
                properties: string;
                bookings: string;
                messages: string;
                analytics: string;
                bookingOptions: string;
                paymentConfiguration: string;
                users: string;
                settings: string;
            };
            common: {
                loading: string;
                error: string;
                retry: string;
                save: string;
                cancel: string;
                delete: string;
                edit: string;
                confirm: string;
                back: string;
                next: string;
                previous: string;
                yes: string;
                no: string;
                close: string;
                search: string;
                filter: string;
                sort: string;
                refresh: string;
                export: string;
                import: string;
                download: string;
                upload: string;
                print: string;
                share: string;
                copy: string;
                paste: string;
                cut: string;
                selectAll: string;
                deselectAll: string;
            };
        };
    };
};
export type Messages = typeof messages;
export type MessageKeys = keyof Messages[Locale];
export declare function getLocaleFromAcceptLanguage(acceptLanguage: string): Locale;
export declare function getLocaleFromPath(pathname: string): Locale | null;
export declare function formatCurrency(amount: number, locale: Locale, currency?: string): string;
export declare function formatDate(date: Date | string, locale: Locale, options?: Intl.DateTimeFormatOptions): string;
export declare function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string;
export declare function pluralize(count: number, locale: Locale, key: string): string;
