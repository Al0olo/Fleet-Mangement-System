import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fleet Management - Tracking Service API',
      version: '1.0.0',
      description: 'API documentation for the Tracking Service of the Fleet Management System',
      contact: {
        name: 'API Support',
        email: 'support@fleetmanagement.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3002}`,
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
        name: 'Tracking',
        description: 'Vehicle tracking operations',
      },
    ],
  },
  apis: [
    path.resolve(__dirname, './routes/*.ts'),
    path.resolve(__dirname, './models/*.ts'),
    path.resolve(__dirname, '../dist/routes/*.js'),
    path.resolve(__dirname, '../dist/models/*.js')
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec; 