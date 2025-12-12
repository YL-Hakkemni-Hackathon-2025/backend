import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hakkemni HealthPass API',
      version: '1.0.0',
      description: `
## Overview
Hakkemni HealthPass is a digital health passport system for Lebanese citizens. Users authenticate using their Lebanese ID card, manage their health records, and generate QR-coded health passes for medical appointments.

## Authentication
All endpoints (except \`/auth/*\` and \`/health-passes/access/:accessCode\`) require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

## Getting Started
1. **Scan Lebanese ID** - POST to \`/auth/verify-id\` with base64 image
2. **Receive tokens** - Get access & refresh tokens
3. **Add health data** - Create conditions, medications, allergies, etc.
4. **Generate HealthPass** - Create a shareable QR code for appointments
      `,
      contact: {
        name: 'Hakkemni Support',
        email: 'support@hakkemni.health'
      }
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1'
      }
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & Lebanese ID verification' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Medical Conditions', description: 'Manage medical conditions/diagnoses' },
      { name: 'Medications', description: 'Manage current and past medications' },
      { name: 'Allergies', description: 'Manage allergies' },
      { name: 'Lifestyles', description: 'Manage lifestyle choices (smoking, exercise, etc.)' },
      { name: 'Documents', description: 'Upload and manage medical documents' },
      { name: 'Health Passes', description: 'Generate and manage QR-coded health passes' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your access token'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  // Scan route files for JSDoc annotations
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../routes/*.js')
  ]
};

export const openApiSpec = swaggerJsdoc(options);

