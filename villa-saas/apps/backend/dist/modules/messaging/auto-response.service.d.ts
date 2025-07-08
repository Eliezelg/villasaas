import type { FastifyInstance } from 'fastify';
interface AutoResponseContext {
    conversationId: string;
    message: string;
    propertyId?: string;
    tenantId: string;
    language: string;
    guestName?: string;
    property?: {
        name: string;
        address: string;
        city: string;
    };
    booking?: {
        checkIn: Date;
        checkOut: Date;
        guests: number;
    };
}
export declare class AutoResponseService {
    private fastify;
    private openai;
    constructor(fastify: FastifyInstance);
    /**
     * Traiter un nouveau message et déclencher les réponses automatiques si nécessaire
     */
    processMessage(context: AutoResponseContext): Promise<void>;
    /**
     * Obtenir ou créer une session chatbot
     */
    private getChatbotSession;
    /**
     * Traiter un message avec le chatbot IA
     */
    private processChatbotMessage;
    /**
     * Construire le prompt système pour l'IA
     */
    private buildSystemPrompt;
    /**
     * Déterminer le nouvel état du chatbot
     */
    private determineNewState;
    /**
     * Obtenir les règles correspondantes
     */
    private getMatchingRules;
    /**
     * Appliquer une règle
     */
    private applyRule;
    /**
     * Vérifier si c'est une nouvelle conversation
     */
    private isNewConversation;
    /**
     * Gérer une nouvelle conversation
     */
    private handleNewConversation;
    /**
     * Traiter un template avec les variables
     */
    private processTemplate;
    /**
     * Envoyer une réponse automatique
     */
    private sendAutoResponse;
    /**
     * Transférer à un humain
     */
    private handOffToHuman;
    /**
     * Créer les templates par défaut pour un nouveau tenant
     */
    createDefaultTemplates(tenantId: string): Promise<void>;
}
export {};
//# sourceMappingURL=auto-response.service.d.ts.map