import ovh from 'ovh';
import { FastifyInstance } from 'fastify';

export interface DomainCheckResult {
  available: boolean;
  price?: number;
  currency?: string;
  message?: string;
}

export interface DomainRegistrationResult {
  success: boolean;
  orderId?: string;
  message?: string;
}

export class DomainRegistrarService {
  private ovhClient: any;
  private isConfigured: boolean = false;
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    
    // Vérifier si les credentials OVH sont configurés
    if (
      process.env.OVH_APP_KEY &&
      process.env.OVH_APP_SECRET &&
      process.env.OVH_CONSUMER_KEY
    ) {
      this.ovhClient = ovh({
        endpoint: process.env.OVH_ENDPOINT || 'ovh-eu',
        appKey: process.env.OVH_APP_KEY,
        appSecret: process.env.OVH_APP_SECRET,
        consumerKey: process.env.OVH_CONSUMER_KEY,
      });
      this.isConfigured = true;
    } else {
      this.fastify.log.warn('OVH credentials not configured - domain registration will be simulated');
    }
  }

  /**
   * Vérifier la disponibilité d'un domaine
   */
  async checkAvailability(domain: string): Promise<DomainCheckResult> {
    // Validation basique du format
    if (!this.isValidDomain(domain)) {
      return {
        available: false,
        message: 'Format de domaine invalide',
      };
    }

    // Si OVH n'est pas configuré, simuler
    if (!this.isConfigured) {
      return this.simulateAvailability(domain);
    }

    try {
      // Vérifier la disponibilité via l'API OVH
      const result = await this.ovhClient.request('GET', `/domain/check`, {
        domain: domain,
      });

      if (result.available) {
        // Obtenir le prix
        const priceResult = await this.ovhClient.request('GET', `/order/cart/new`);
        const cartId = priceResult.cartId;

        await this.ovhClient.request('POST', `/order/cart/${cartId}/domain`, {
          domain: domain,
          duration: 'P1Y', // 1 an
        });

        const pricing = await this.ovhClient.request('GET', `/order/cart/${cartId}`);
        
        // Nettoyer le cart
        await this.ovhClient.request('DELETE', `/order/cart/${cartId}`);

        const price = pricing.prices?.[0]?.price?.value || 24;

        return {
          available: true,
          price: Math.round(price),
          currency: 'EUR',
          message: 'Domaine disponible',
        };
      } else {
        return {
          available: false,
          message: 'Domaine non disponible',
        };
      }
    } catch (error) {
      this.fastify.log.error('OVH availability check error:', error);
      
      // En cas d'erreur, utiliser la simulation
      return this.simulateAvailability(domain);
    }
  }

  /**
   * Enregistrer un domaine
   */
  async registerDomain(
    domain: string,
    ownerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
      organization?: string;
    }
  ): Promise<DomainRegistrationResult> {
    if (!this.isConfigured) {
      return {
        success: true,
        orderId: 'SIMULATED-' + Date.now(),
        message: 'Domaine enregistré (simulation)',
      };
    }

    try {
      // 1. Créer un nouveau cart
      const cartResult = await this.ovhClient.request('POST', `/order/cart`, {
        ovhSubsidiary: 'FR',
      });
      const cartId = cartResult.cartId;

      // 2. Ajouter le domaine au cart
      await this.ovhClient.request('POST', `/order/cart/${cartId}/domain`, {
        domain: domain,
        duration: 'P1Y', // 1 an
      });

      // 3. Configurer les informations du propriétaire
      const ownerContact = {
        legalForm: ownerInfo.organization ? 'corporation' : 'individual',
        firstName: ownerInfo.firstName,
        lastName: ownerInfo.lastName,
        email: ownerInfo.email,
        phone: ownerInfo.phone,
        address: {
          line1: ownerInfo.address,
          city: ownerInfo.city,
          zip: ownerInfo.postalCode,
          country: ownerInfo.country,
        },
        organisation: ownerInfo.organization || '',
      };

      // 4. Assigner les contacts
      await this.ovhClient.request('POST', `/order/cart/${cartId}/assign`, {
        contacts: {
          owner: ownerContact,
          admin: ownerContact,
          tech: ownerContact,
          billing: ownerContact,
        },
      });

      // 5. Valider et passer la commande
      const checkoutResult = await this.ovhClient.request('POST', `/order/cart/${cartId}/checkout`, {
        autoPayWithPreferredPaymentMethod: true,
      });

      return {
        success: true,
        orderId: checkoutResult.orderId,
        message: 'Domaine enregistré avec succès',
      };
    } catch (error) {
      this.fastify.log.error('OVH registration error:', error);
      
      return {
        success: false,
        message: 'Erreur lors de l\'enregistrement du domaine',
      };
    }
  }

  /**
   * Configurer les DNS pour pointer vers notre infrastructure
   */
  async configureDNS(domain: string, targetSubdomain: string): Promise<boolean> {
    if (!this.isConfigured) {
      return true; // Simulation
    }

    try {
      // Vérifier que la zone DNS existe
      await this.ovhClient.request('GET', `/domain/zone/${domain}`);

      // Supprimer les anciens enregistrements A et CNAME pour @ et www
      const records = await this.ovhClient.request('GET', `/domain/zone/${domain}/record`, {
        fieldType: ['A', 'CNAME'],
        subDomain: ['', 'www'],
      });

      for (const recordId of records) {
        await this.ovhClient.request('DELETE', `/domain/zone/${domain}/record/${recordId}`);
      }

      // Ajouter les nouveaux enregistrements
      // CNAME pour la racine (si supporté) ou A record
      await this.ovhClient.request('POST', `/domain/zone/${domain}/record`, {
        fieldType: 'CNAME',
        subDomain: '',
        target: `${targetSubdomain}.villasaas.com.`,
        ttl: 3600,
      });

      // CNAME pour www
      await this.ovhClient.request('POST', `/domain/zone/${domain}/record`, {
        fieldType: 'CNAME',
        subDomain: 'www',
        target: `${targetSubdomain}.villasaas.com.`,
        ttl: 3600,
      });

      // Rafraîchir la zone
      await this.ovhClient.request('POST', `/domain/zone/${domain}/refresh`);

      return true;
    } catch (error) {
      this.fastify.log.error('OVH DNS configuration error:', error);
      return false;
    }
  }

  /**
   * Obtenir le statut d'un domaine
   */
  async getDomainStatus(domain: string): Promise<string> {
    if (!this.isConfigured) {
      return 'active';
    }

    try {
      const info = await this.ovhClient.request('GET', `/domain/${domain}`);
      return info.state || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Renouveler un domaine
   */
  async renewDomain(domain: string, years: number = 1): Promise<DomainRegistrationResult> {
    if (!this.isConfigured) {
      return {
        success: true,
        orderId: 'SIMULATED-RENEWAL-' + Date.now(),
        message: 'Domaine renouvelé (simulation)',
      };
    }

    try {
      const renewal = await this.ovhClient.request('POST', `/domain/${domain}/renew`, {
        duration: `P${years}Y`,
      });

      return {
        success: true,
        orderId: renewal.orderId,
        message: 'Domaine renouvelé avec succès',
      };
    } catch (error) {
      this.fastify.log.error('OVH renewal error:', error);
      
      return {
        success: false,
        message: 'Erreur lors du renouvellement',
      };
    }
  }

  /**
   * Validation du format de domaine
   */
  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    return domainRegex.test(domain);
  }

  /**
   * Simuler la disponibilité pour les tests
   */
  private simulateAvailability(domain: string): DomainCheckResult {
    // Liste de domaines "non disponibles" pour la simulation
    const unavailableDomains = [
      'google.com',
      'facebook.com',
      'amazon.com',
      'apple.com',
      'microsoft.com',
      'example.com',
      'test.com',
    ];

    const isUnavailable = unavailableDomains.includes(domain.toLowerCase());

    if (isUnavailable) {
      return {
        available: false,
        message: 'Domaine non disponible (simulation)',
      };
    }

    // Simuler des prix selon l'extension
    let price = 24; // Prix par défaut
    
    if (domain.endsWith('.com')) {
      price = 12;
    } else if (domain.endsWith('.fr')) {
      price = 8;
    } else if (domain.endsWith('.io')) {
      price = 35;
    } else if (domain.endsWith('.ai')) {
      price = 90;
    }

    return {
      available: true,
      price,
      currency: 'EUR',
      message: 'Domaine disponible (simulation)',
    };
  }
}