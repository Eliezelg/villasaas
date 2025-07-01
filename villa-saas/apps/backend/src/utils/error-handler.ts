import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  request.log.error(error);

  // Erreurs de validation Zod
  if (error instanceof ZodError) {
    reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.errors,
    });
    return;
  }

  // Erreurs Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        reply.status(409).send({
          error: 'Conflict',
          message: 'A record with this value already exists',
          field: error.meta?.target,
        });
        return;
      case 'P2025':
        reply.status(404).send({
          error: 'Not Found',
          message: 'Record not found',
        });
        return;
      case 'P2003':
        reply.status(400).send({
          error: 'Invalid Reference',
          message: 'Invalid foreign key reference',
          field: error.meta?.field_name,
        });
        return;
      default:
        reply.status(500).send({
          error: 'Database Error',
          message: 'An error occurred while processing your request',
        });
        return;
    }
  }

  // Erreurs Fastify standard
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      validation: error.validation,
    });
    return;
  }

  // Erreurs personnalisées avec statusCode
  if (error.statusCode) {
    reply.status(error.statusCode).send({
      error: error.name || 'Error',
      message: error.message,
    });
    return;
  }

  // Erreur par défaut
  reply.status(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message,
  });
}