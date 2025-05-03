import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fleet Management - Vehicle Service API',
      version: '1.0.0',
      description: 'API documentation for the Vehicle Service of the Fleet Management System',
      contact: {
        name: 'API Support',
        email: 'support@fleetmanagement.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
    tags: [
      {
        name: 'Vehicles',
        description: 'Vehicle management operations',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec; 