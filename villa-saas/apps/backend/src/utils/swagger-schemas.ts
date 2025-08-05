export const swaggerTags = {
  auth: 'Auth',
  tenants: 'Tenants',
  users: 'Users',
  properties: 'Properties',
  propertyImages: 'Property Images',
  periods: 'Periods',
  pricing: 'Pricing',
  health: 'Health',
  public: 'Public',
};

export const swaggerSchemas = {
  // Common error response
  errorResponse: {
    400: {
      description: 'Bad Request',
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    403: {
      description: 'Forbidden',
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    404: {
      description: 'Not Found',
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    500: {
      description: 'Internal Server Error',
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },

  // Security schemas
  bearerAuth: [
    {
      bearerAuth: [],
    },
  ],
};