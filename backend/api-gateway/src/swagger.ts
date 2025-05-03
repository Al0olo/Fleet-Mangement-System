import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../package.json';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Fleet Management System API Gateway',
    version,
    description: 'API documentation for the Fleet Management System',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'Fleet Management System Team',
    },
  },
  servers: [
    {
      url: `/api`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
      },
    },
  },
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
  tags: [
    {
      name: 'Gateway',
      description: 'API Gateway endpoints',
    },
    {
      name: 'Vehicles',
      description: 'Vehicle management endpoints',
    },
    {
      name: 'Tracking',
      description: 'Vehicle tracking endpoints',
    },
    {
      name: 'Maintenance',
      description: 'Vehicle maintenance endpoints',
    },
    {
      name: 'Analytics',
      description: 'Fleet analytics endpoints',
    },
    {
      name: 'Simulator',
      description: 'Fleet simulation endpoints',
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files with OpenAPI annotations in comments
  apis: [
    './src/routes/*.ts',
    './src/middleware/**/*.ts',
    './src/models/*.ts',
    './src/**/*.yaml',
  ],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec; 