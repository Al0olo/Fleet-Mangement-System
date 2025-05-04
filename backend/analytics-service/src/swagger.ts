import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fleet Management System - Analytics Service API',
      version: '1.0.0',
      description: 'API for Fleet Analytics Service, providing statistics and insights on fleet performance',
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
      contact: {
        name: 'Tenderd',
        url: 'https://tenderd.com',
        email: 'info@tenderd.com',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Analytics Service API',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec; 