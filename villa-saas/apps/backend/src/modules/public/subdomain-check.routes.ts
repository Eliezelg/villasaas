import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { swaggerTags } from '../../utils/swagger-schemas';

const checkSubdomainSchema = z.object({
  subdomain: z.string()
    .min(3, 'Le sous-domaine doit contenir au moins 3 caractères')
    .max(30, 'Le sous-domaine doit contenir au maximum 30 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le sous-domaine ne peut contenir que des lettres minuscules, des chiffres et des tirets')
    .regex(/^[a-z0-9]/, 'Le sous-domaine doit commencer par une lettre ou un chiffre')
    .regex(/[a-z0-9]$/, 'Le sous-domaine doit se terminer par une lettre ou un chiffre'),
});

export async function subdomainCheckRoutes(fastify: FastifyInstance) {
  // Vérifier la disponibilité d'un sous-domaine
  fastify.post('/public/subdomain/check', {
    schema: {
      tags: [swaggerTags.public],
      summary: 'Vérifier la disponibilité d\'un sous-domaine',
      description: 'Vérifie si un sous-domaine est disponible pour l\'inscription',
      body: {
        type: 'object',
        required: ['subdomain'],
        properties: {
          subdomain: { 
            type: 'string', 
            minLength: 3,
            maxLength: 30,
            pattern: '^[a-z0-9-]+$',
            description: 'Le sous-domaine à vérifier (lettres minuscules, chiffres et tirets uniquement)'
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            available: { type: 'boolean' },
            subdomain: { type: 'string' },
            suggestions: { 
              type: 'array',
              items: { type: 'string' },
              description: 'Suggestions alternatives si le sous-domaine n\'est pas disponible'
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const validation = checkSubdomainSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.code(400).send({ error: validation.error });
    }

    const { subdomain } = validation.data;

    // Liste des sous-domaines réservés
    const reservedSubdomains = [
      'www', 'app', 'api', 'admin', 'dashboard', 'blog', 'shop', 'store',
      'help', 'support', 'docs', 'documentation', 'status', 'mail', 'email',
      'ftp', 'ssh', 'vpn', 'test', 'dev', 'staging', 'prod', 'production',
      'demo', 'example', 'sample', 'preview', 'beta', 'alpha', 'auth',
      'login', 'signup', 'register', 'account', 'user', 'users', 'profile',
      'settings', 'config', 'configuration', 'public', 'private', 'secure',
      'villa', 'villasaas', 'villa-saas', 'tenant', 'client', 'customer'
    ];

    // Vérifier si c'est un sous-domaine réservé
    if (reservedSubdomains.includes(subdomain.toLowerCase())) {
      return reply.send({
        available: false,
        subdomain,
        suggestions: generateSuggestions(subdomain),
      });
    }

    // Vérifier dans la table Tenant
    const existingTenant = await fastify.prisma.tenant.findFirst({
      where: {
        subdomain: subdomain.toLowerCase(),
      },
    });

    // Vérifier dans la table PublicSite
    const existingPublicSite = await fastify.prisma.publicSite.findFirst({
      where: {
        subdomain: subdomain.toLowerCase(),
      },
    });

    const available = !existingTenant && !existingPublicSite;

    reply.send({
      available,
      subdomain: subdomain.toLowerCase(),
      suggestions: available ? [] : generateSuggestions(subdomain),
    });
  });

  function generateSuggestions(base: string): string[] {
    const suggestions: string[] = [];
    const cleanBase = base.replace(/[^a-z0-9]/g, '');
    
    // Ajouter des suffixes numériques
    for (let i = 1; i <= 5; i++) {
      suggestions.push(`${cleanBase}${i}`);
    }
    
    // Ajouter des suffixes descriptifs
    const suffixes = ['villa', 'home', 'house', 'place', 'stay'];
    for (const suffix of suffixes) {
      suggestions.push(`${cleanBase}-${suffix}`);
      suggestions.push(`${cleanBase}${suffix}`);
    }
    
    // Ajouter l'année
    const year = new Date().getFullYear();
    suggestions.push(`${cleanBase}-${year}`);
    suggestions.push(`${cleanBase}${year}`);
    
    return suggestions.slice(0, 5); // Retourner seulement 5 suggestions
  }
}