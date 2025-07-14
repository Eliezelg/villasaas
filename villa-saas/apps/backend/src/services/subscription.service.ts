import { PrismaClient } from '@prisma/client';
import { SUBSCRIPTION_PLANS } from '../config/stripe-prices';

export class SubscriptionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Vérifie si le tenant peut créer une nouvelle propriété selon son plan
   */
  async canCreateProperty(tenantId: string): Promise<{ allowed: boolean; reason?: string; currentCount: number; limit: number | 'unlimited' }> {
    // Récupérer le tenant avec son plan et le nombre de propriétés
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        properties: true,
      },
    });

    if (!tenant) {
      return {
        allowed: false,
        reason: 'Tenant not found',
        currentCount: 0,
        limit: 0,
      };
    }

    const currentPropertyCount = tenant.properties.length;
    const plan = tenant.subscriptionPlan;

    // Si pas d'abonnement actif
    if (!plan || tenant.subscriptionStatus !== 'active') {
      return {
        allowed: false,
        reason: 'No active subscription',
        currentCount: currentPropertyCount,
        limit: 0,
      };
    }

    // Récupérer les limites selon le plan
    const planConfig = SUBSCRIPTION_PLANS[plan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS];
    
    if (!planConfig) {
      console.error(`Invalid subscription plan: ${plan}`);
      return {
        allowed: false,
        reason: 'Invalid subscription plan',
        currentCount: currentPropertyCount,
        limit: 0,
      };
    }

    // Plan Enterprise = illimité
    if (plan === 'enterprise') {
      return {
        allowed: true,
        currentCount: currentPropertyCount,
        limit: 'unlimited',
      };
    }

    // Vérifier la limite
    const propertyLimit = planConfig.features.properties as number;
    
    if (currentPropertyCount >= propertyLimit) {
      // Pour le plan Standard, on peut ajouter des propriétés supplémentaires
      if (plan === 'standard') {
        return {
          allowed: true, // On autorise mais il faudra payer un supplément
          reason: 'Additional property fee required',
          currentCount: currentPropertyCount,
          limit: propertyLimit,
        };
      }
      
      // Pour le plan Starter, limite stricte
      return {
        allowed: false,
        reason: `Property limit reached (${propertyLimit} ${propertyLimit === 1 ? 'property' : 'properties'} maximum)`,
        currentCount: currentPropertyCount,
        limit: propertyLimit,
      };
    }

    return {
      allowed: true,
      currentCount: currentPropertyCount,
      limit: propertyLimit,
    };
  }

  /**
   * Récupère les informations de quota pour un tenant
   */
  async getPropertyQuota(tenantId: string): Promise<{
    used: number;
    included: number | 'unlimited';
    additional: number;
    canAdd: boolean;
    requiresPayment: boolean;
  }> {
    console.log(`Getting property quota for tenant: ${tenantId}`);
    
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        properties: true,
      },
    });

    if (!tenant || !tenant.subscriptionPlan || tenant.subscriptionStatus !== 'active') {
      console.log('Tenant not found or no active subscription:', {
        tenantFound: !!tenant,
        plan: tenant?.subscriptionPlan,
        status: tenant?.subscriptionStatus
      });
      return {
        used: 0,
        included: 0,
        additional: 0,
        canAdd: false,
        requiresPayment: false,
      };
    }

    const plan = tenant.subscriptionPlan;
    const planConfig = SUBSCRIPTION_PLANS[plan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS];
    
    if (!planConfig) {
      console.error(`Invalid subscription plan config for: ${plan}`);
      throw new Error(`Invalid subscription plan: ${plan}`);
    }
    const currentCount = tenant.properties.length;

    if (plan === 'enterprise') {
      return {
        used: currentCount,
        included: 'unlimited',
        additional: 0,
        canAdd: true,
        requiresPayment: false,
      };
    }

    const included = planConfig.features.properties as number;
    const additional = Math.max(0, currentCount - included);

    return {
      used: currentCount,
      included,
      additional,
      canAdd: plan === 'standard' || currentCount < included,
      requiresPayment: plan === 'standard' && currentCount >= included,
    };
  }

  /**
   * Ajoute une propriété supplémentaire à l'abonnement (pour plan Standard)
   */
  async addExtraProperty(_tenantId: string, _stripeSubscriptionId: string) {
    // Cette méthode sera appelée après la création de la propriété
    // pour ajouter l'item de facturation supplémentaire sur Stripe
    
    // TODO: Implémenter l'ajout d'un subscription item sur Stripe
    // pour facturer la propriété supplémentaire
  }
}

export function createSubscriptionService(prisma: PrismaClient) {
  return new SubscriptionService(prisma);
}