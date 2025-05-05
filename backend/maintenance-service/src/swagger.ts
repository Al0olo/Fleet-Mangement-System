import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fleet Management - Maintenance API',
      version: '1.0.0',
      description: 'API for fleet maintenance management',
      contact: {
        name: 'Fleet Management System',
        url: 'https://fleetmanagement.example.com',
        email: 'info@fleetmanagement.example.com'
      },
      license: {
        name: 'MIT License',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Local Development Server'
      },
      {
        url: 'https://api.fleetmanagement.example.com/maintenance',
        description: 'Production Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  // Path to the API docs
  apis: [
    path.resolve(__dirname, './routes/*.ts'),
    path.resolve(__dirname, './models/*.ts'),
    path.resolve(__dirname, '../dist/routes/*.js'),
    path.resolve(__dirname, '../dist/models/*.js')
  ]
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec; 