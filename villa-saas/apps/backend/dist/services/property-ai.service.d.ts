import { Property } from '@prisma/client';
export declare class PropertyAIService {
    /**
     * Génère le contenu searchable à partir des données de la propriété
     */
    static generateSearchableContent(property: Partial<Property>): string;
    /**
     * Prépare les données pour la génération d'embeddings
     */
    static prepareEmbeddingContent(property: Partial<Property>): string;
    /**
     * Génère un embedding vectoriel avec OpenAI
     */
    static generateEmbedding(text: string): Promise<number[]>;
    private static translatePropertyType;
    private static translateAmenity;
    private static translateAtmosphere;
    private static translateProximity;
}
//# sourceMappingURL=property-ai.service.d.ts.map