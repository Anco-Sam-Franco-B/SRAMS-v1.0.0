import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SRAMS Enterprise API',
      version: '2.0.0',
      description: 'Student Records & Academic Management System — Enterprise Education Platform API',
      contact: { name: 'SRAMS Team' },
    },
    servers: [
      { url: 'http://localhost:5000/api/v1', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            pages: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/router/*.js', './routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
