import Cloudflare from 'cloudflare';

export interface CloudflareDNSRecord {
  id?: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'SRV';
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
}

export class CloudflareService {
  private client: Cloudflare;
  private zoneId: string;

  constructor() {
    if (!process.env.CLOUDFLARE_API_TOKEN) {
      throw new Error('CLOUDFLARE_API_TOKEN is not configured');
    }
    if (!process.env.CLOUDFLARE_ZONE_ID) {
      throw new Error('CLOUDFLARE_ZONE_ID is not configured');
    }

    this.client = new Cloudflare({
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
    });
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID;
  }

  /**
   * Créer un enregistrement DNS pour un sous-domaine
   */
  async createSubdomainRecord(subdomain: string, target?: string): Promise<any> {
    try {
      // Par défaut, pointer vers l'enregistrement principal (@)
      const response = await this.client.dns.records.create({
        zone_id: this.zoneId,
        type: 'CNAME',
        name: subdomain,
        content: target || '@',
        ttl: 1, // Auto TTL
        proxied: true, // Activer le proxy Cloudflare pour HTTPS
      } as any);

      console.log(`DNS record created for ${subdomain}:`, response);
      return response;
    } catch (error: any) {
      // Si l'enregistrement existe déjà, ce n'est pas une erreur critique
      if (error?.response?.status === 409) {
        console.log(`DNS record already exists for ${subdomain}`);
        return await this.getSubdomainRecord(subdomain);
      }
      throw error;
    }
  }

  /**
   * Obtenir un enregistrement DNS
   */
  async getSubdomainRecord(subdomain: string): Promise<any> {
    try {
      const response = await this.client.dns.records.list({
        zone_id: this.zoneId,
        search: `${subdomain}.${process.env.CLOUDFLARE_DOMAIN || 'webpro200.fr'}`,
      } as any);

      return response.result?.[0];
    } catch (error) {
      console.error('Error getting DNS record:', error);
      return null;
    }
  }

  /**
   * Mettre à jour un enregistrement DNS
   */
  async updateSubdomainRecord(recordId: string, updates: Partial<CloudflareDNSRecord>): Promise<any> {
    try {
      const response = await this.client.dns.records.update(recordId, {
        zone_id: this.zoneId,
        ...updates,
      } as any);

      console.log(`DNS record updated:`, response);
      return response;
    } catch (error) {
      console.error('Error updating DNS record:', error);
      throw error;
    }
  }

  /**
   * Supprimer un enregistrement DNS
   */
  async deleteSubdomainRecord(recordId: string): Promise<void> {
    try {
      await this.client.dns.records.delete(recordId, {
        zone_id: this.zoneId,
      });

      console.log(`DNS record deleted: ${recordId}`);
    } catch (error) {
      console.error('Error deleting DNS record:', error);
      throw error;
    }
  }

  /**
   * Vérifier le certificat SSL pour un domaine
   */
  async checkSSLStatus(hostname: string): Promise<any> {
    try {
      const response = await this.client.ssl.certificatePacks.list({
        zone_id: this.zoneId,
      });

      // Vérifier si le certificat couvre le sous-domaine
      const certificates = response.result || [];
      for (const cert of certificates as any[]) {
        if (cert.hosts?.includes(hostname) || cert.hosts?.includes(`*.${process.env.CLOUDFLARE_DOMAIN}`)) {
          return {
            covered: true,
            certificate: cert,
          };
        }
      }

      return {
        covered: false,
        message: 'Subdomain not covered by SSL certificate',
      };
    } catch (error) {
      console.error('Error checking SSL status:', error);
      return {
        covered: false,
        error: error,
      };
    }
  }

  /**
   * Purger le cache pour un sous-domaine
   */
  async purgeCache(subdomain: string): Promise<void> {
    try {
      await this.client.cache.purge({
        zone_id: this.zoneId,
        hosts: [`${subdomain}.${process.env.CLOUDFLARE_DOMAIN || 'webpro200.fr'}`],
      });

      console.log(`Cache purged for ${subdomain}`);
    } catch (error) {
      console.error('Error purging cache:', error);
    }
  }
}

// Export singleton instance
let cloudflareService: CloudflareService | null = null;

export function getCloudflareService(): CloudflareService {
  if (!cloudflareService) {
    cloudflareService = new CloudflareService();
  }
  return cloudflareService;
}