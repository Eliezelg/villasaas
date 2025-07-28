import { FastifyInstance } from 'fastify';
import fetch from 'node-fetch';

export class VercelService {
  private readonly apiUrl = 'https://api.vercel.com';
  private readonly token: string;
  private readonly projectId: string;
  private readonly teamId?: string;

  constructor(private fastify: FastifyInstance) {
    this.token = process.env.VERCEL_API_TOKEN || '';
    this.projectId = process.env.VERCEL_PROJECT_ID || '';
    this.teamId = process.env.VERCEL_TEAM_ID;
    
    if (!this.token || !this.projectId) {
      this.fastify.log.warn('Vercel API configuration missing');
    }
  }

  /**
   * Ajouter un domaine au projet Vercel
   */
  async addDomain(domain: string): Promise<{ success: boolean; error?: string }> {
    if (!this.token || !this.projectId) {
      return { 
        success: false, 
        error: 'Vercel API not configured' 
      };
    }

    try {
      const url = `${this.apiUrl}/v10/projects/${this.projectId}/domains`;
      const queryParams = this.teamId ? `?teamId=${this.teamId}` : '';
      
      const response = await fetch(`${url}${queryParams}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: domain,
          gitBranch: 'main', // ou process.env.VERCEL_GIT_BRANCH
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.fastify.log.info('Domain added to Vercel', { domain, data });
        return { success: true };
      }

      const error = await response.json();
      
      // Si le domaine existe déjà, ce n'est pas une erreur
      if (error.error?.code === 'domain_already_exists') {
        return { success: true };
      }

      this.fastify.log.error('Failed to add domain to Vercel', { domain, error });
      return { 
        success: false, 
        error: error.error?.message || 'Failed to add domain' 
      };
    } catch (error) {
      this.fastify.log.error('Vercel API error', error);
      return { 
        success: false, 
        error: 'Failed to communicate with Vercel API' 
      };
    }
  }

  /**
   * Supprimer un domaine du projet Vercel
   */
  async removeDomain(domain: string): Promise<{ success: boolean; error?: string }> {
    if (!this.token || !this.projectId) {
      return { 
        success: false, 
        error: 'Vercel API not configured' 
      };
    }

    try {
      const url = `${this.apiUrl}/v9/projects/${this.projectId}/domains/${domain}`;
      const queryParams = this.teamId ? `?teamId=${this.teamId}` : '';
      
      const response = await fetch(`${url}${queryParams}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        this.fastify.log.info('Domain removed from Vercel', { domain });
        return { success: true };
      }

      const error = await response.json();
      this.fastify.log.error('Failed to remove domain from Vercel', { domain, error });
      return { 
        success: false, 
        error: error.error?.message || 'Failed to remove domain' 
      };
    } catch (error) {
      this.fastify.log.error('Vercel API error', error);
      return { 
        success: false, 
        error: 'Failed to communicate with Vercel API' 
      };
    }
  }

  /**
   * Vérifier le statut d'un domaine
   */
  async checkDomain(domain: string): Promise<{
    configured: boolean;
    verified: boolean;
    error?: string;
  }> {
    if (!this.token || !this.projectId) {
      return { 
        configured: false, 
        verified: false, 
        error: 'Vercel API not configured' 
      };
    }

    try {
      const url = `${this.apiUrl}/v9/projects/${this.projectId}/domains/${domain}`;
      const queryParams = this.teamId ? `?teamId=${this.teamId}` : '';
      
      const response = await fetch(`${url}${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          configured: true,
          verified: data.verified || false,
        };
      }

      if (response.status === 404) {
        return {
          configured: false,
          verified: false,
        };
      }

      const error = await response.json();
      return {
        configured: false,
        verified: false,
        error: error.error?.message || 'Failed to check domain',
      };
    } catch (error) {
      this.fastify.log.error('Vercel API error', error);
      return {
        configured: false,
        verified: false,
        error: 'Failed to communicate with Vercel API',
      };
    }
  }

  /**
   * Récupérer les informations de configuration DNS
   */
  async getDnsConfiguration(domain: string): Promise<{
    records: Array<{
      type: string;
      name: string;
      value: string;
    }>;
    error?: string;
  }> {
    if (!this.token || !this.projectId) {
      return { 
        records: [], 
        error: 'Vercel API not configured' 
      };
    }

    try {
      const url = `${this.apiUrl}/v6/domains/${domain}/config`;
      const queryParams = this.teamId ? `?teamId=${this.teamId}` : '';
      
      const response = await fetch(`${url}${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          records: data.configuredBy === 'CNAME' ? [
            {
              type: 'CNAME',
              name: domain.startsWith('www.') ? 'www' : '@',
              value: 'cname.vercel-dns.com',
            }
          ] : [
            {
              type: 'A',
              name: '@',
              value: '76.76.21.21',
            },
            {
              type: 'CNAME',
              name: 'www',
              value: 'cname.vercel-dns.com',
            }
          ],
        };
      }

      return {
        records: [
          {
            type: 'A',
            name: '@',
            value: '76.76.21.21',
          },
          {
            type: 'CNAME',
            name: 'www',
            value: 'cname.vercel-dns.com',
          }
        ],
      };
    } catch (error) {
      this.fastify.log.error('Vercel API error', error);
      return {
        records: [],
        error: 'Failed to get DNS configuration',
      };
    }
  }
}