"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoResponseService = void 0;
const openai_1 = __importDefault(require("openai"));
class AutoResponseService {
    fastify;
    openai = null;
    constructor(fastify) {
        this.fastify = fastify;
        // Initialiser OpenAI si la clé est disponible
        if (process.env.OPENAI_API_KEY) {
            this.openai = new openai_1.default({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
    }
    /**
     * Traiter un nouveau message et déclencher les réponses automatiques si nécessaire
     */
    async processMessage(context) {
        try {
            // 1. Vérifier s'il y a une session chatbot active
            const chatbotSession = await this.getChatbotSession(context.conversationId);
            if (chatbotSession && !chatbotSession.handedOff) {
                // Traiter avec le chatbot IA
                await this.processChatbotMessage(context, chatbotSession);
                return;
            }
            // 2. Vérifier les règles de réponse automatique
            const rules = await this.getMatchingRules(context);
            if (rules.length > 0) {
                // Appliquer la règle avec la plus haute priorité
                await this.applyRule(rules[0], context);
                return;
            }
            // 3. Vérifier si c'est une nouvelle conversation
            const isNewConversation = await this.isNewConversation(context.conversationId);
            if (isNewConversation) {
                // Envoyer un message de bienvenue ou démarrer le chatbot
                await this.handleNewConversation(context);
            }
        }
        catch (error) {
            this.fastify.log.error(error, 'Error processing auto response');
        }
    }
    /**
     * Obtenir ou créer une session chatbot
     */
    async getChatbotSession(conversationId) {
        return await this.fastify.prisma.chatbotSession.findUnique({
            where: { conversationId },
        });
    }
    /**
     * Traiter un message avec le chatbot IA
     */
    async processChatbotMessage(context, session) {
        if (!this.openai) {
            this.fastify.log.warn('OpenAI not configured, skipping chatbot');
            return;
        }
        try {
            // Construire le contexte pour l'IA
            const systemPrompt = this.buildSystemPrompt(context);
            const history = session.history || [];
            // Ajouter le nouveau message à l'historique
            history.push({ role: 'user', content: context.message });
            // Appeler OpenAI
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history,
                ],
                temperature: 0.7,
                max_tokens: 500,
            });
            const aiResponse = completion.choices[0]?.message?.content;
            if (!aiResponse) {
                throw new Error('No response from AI');
            }
            // Ajouter la réponse à l'historique
            history.push({ role: 'assistant', content: aiResponse });
            // Mettre à jour la session
            await this.fastify.prisma.chatbotSession.update({
                where: { id: session.id },
                data: {
                    history,
                    messagesCount: { increment: 1 },
                    state: this.determineNewState(aiResponse, session.state),
                },
            });
            // Envoyer la réponse
            await this.sendAutoResponse(context.conversationId, aiResponse, 'CHATBOT');
        }
        catch (error) {
            this.fastify.log.error(error, 'Error processing chatbot message');
            // En cas d'erreur, transférer à un humain
            await this.handOffToHuman(session.id, context.conversationId);
        }
    }
    /**
     * Construire le prompt système pour l'IA
     */
    buildSystemPrompt(context) {
        let prompt = `Tu es un assistant virtuel pour ${context.property?.name || 'notre propriété de location'}.
Tu dois aider les clients potentiels avec leurs questions sur la propriété, les disponibilités et les réservations.

Informations sur la propriété:
- Nom: ${context.property?.name || 'Non spécifié'}
- Adresse: ${context.property?.address || 'Non spécifié'}, ${context.property?.city || ''}
- Langue préférée: ${context.language === 'fr' ? 'Français' : 'English'}

Instructions:
1. Sois amical, professionnel et utile
2. Réponds dans la langue du client
3. Si tu ne connais pas une information, propose de transférer à un agent humain
4. Ne révèle jamais que tu es une IA, présente-toi comme un assistant
5. Pour les questions complexes ou les réservations, propose toujours de transférer à un humain
6. Sois concis mais informatif

Si le client demande:
- Des disponibilités: Demande les dates souhaitées et le nombre de personnes
- Les prix: Indique que les tarifs varient selon la saison et propose de vérifier pour des dates spécifiques
- Une réservation: Propose de transférer à un agent pour finaliser
- Des informations générales: Réponds avec les informations disponibles`;
        if (context.booking) {
            prompt += `\n\nRéservation existante:
- Check-in: ${context.booking.checkIn}
- Check-out: ${context.booking.checkOut}
- Nombre de personnes: ${context.booking.guests}`;
        }
        return prompt;
    }
    /**
     * Déterminer le nouvel état du chatbot
     */
    determineNewState(response, currentState) {
        // Logique simple pour déterminer l'état
        if (response.toLowerCase().includes('transférer') || response.toLowerCase().includes('agent')) {
            return 'WAITING_HUMAN';
        }
        if (response.toLowerCase().includes('réservation') || response.toLowerCase().includes('booking')) {
            return 'BOOKING_ASSIST';
        }
        if (response.toLowerCase().includes('disponibilité') || response.toLowerCase().includes('availability')) {
            return 'CHECKING_AVAILABILITY';
        }
        return 'PROVIDING_INFO';
    }
    /**
     * Obtenir les règles correspondantes
     */
    async getMatchingRules(context) {
        const rules = await this.fastify.prisma.autoResponseRule.findMany({
            where: {
                tenantId: context.tenantId,
                isActive: true,
                OR: [
                    { propertyId: null },
                    { propertyId: context.propertyId },
                ],
            },
            orderBy: { priority: 'desc' },
        });
        // Filtrer les règles qui correspondent
        return rules.filter(rule => {
            const triggers = rule.triggers;
            // Vérifier les mots-clés
            if (triggers.keywords) {
                const messageWords = context.message.toLowerCase().split(' ');
                const hasKeyword = triggers.keywords.some((keyword) => messageWords.includes(keyword.toLowerCase()));
                if (!hasKeyword)
                    return false;
            }
            // Vérifier l'heure
            if (triggers.time) {
                const now = new Date();
                const currentTime = `${now.getHours()}:${now.getMinutes()}`;
                if (triggers.time.from && triggers.time.to) {
                    // TODO: Implémenter la logique de comparaison d'heures
                }
            }
            return true;
        });
    }
    /**
     * Appliquer une règle
     */
    async applyRule(rule, context) {
        const actions = rule.actions;
        if (actions.type === 'send_template' && actions.templateId) {
            const template = await this.fastify.prisma.autoResponseTemplate.findUnique({
                where: { id: actions.templateId },
            });
            if (template) {
                const content = this.processTemplate(template, context);
                const delay = actions.delay || 0;
                if (delay > 0) {
                    // Envoyer avec délai
                    setTimeout(() => {
                        this.sendAutoResponse(context.conversationId, content, 'TEMPLATE');
                    }, delay * 1000);
                }
                else {
                    await this.sendAutoResponse(context.conversationId, content, 'TEMPLATE');
                }
                // Mettre à jour les stats
                await this.fastify.prisma.autoResponseTemplate.update({
                    where: { id: template.id },
                    data: {
                        usageCount: { increment: 1 },
                        lastUsedAt: new Date(),
                    },
                });
            }
        }
    }
    /**
     * Vérifier si c'est une nouvelle conversation
     */
    async isNewConversation(conversationId) {
        const messageCount = await this.fastify.prisma.message.count({
            where: { conversationId },
        });
        return messageCount <= 1;
    }
    /**
     * Gérer une nouvelle conversation
     */
    async handleNewConversation(context) {
        // Chercher un template de bienvenue
        const template = await this.fastify.prisma.autoResponseTemplate.findFirst({
            where: {
                tenantId: context.tenantId,
                category: 'GREETING',
                trigger: 'NEW_CONVERSATION',
                isActive: true,
            },
            orderBy: { priority: 'desc' },
        });
        if (template) {
            const content = this.processTemplate(template, context);
            await this.sendAutoResponse(context.conversationId, content, 'TEMPLATE');
        }
        else if (this.openai) {
            // Créer une session chatbot
            await this.fastify.prisma.chatbotSession.create({
                data: {
                    conversationId: context.conversationId,
                    context: {
                        propertyId: context.propertyId,
                        property: context.property,
                        language: context.language,
                    },
                    state: 'GREETING',
                    language: context.language,
                },
            });
            // Envoyer un message de bienvenue généré par l'IA
            await this.processChatbotMessage(context, {
                id: 'new',
                history: [],
                state: 'GREETING',
            });
        }
    }
    /**
     * Traiter un template avec les variables
     */
    processTemplate(template, context) {
        const content = template.content;
        let text = content[context.language] || content.fr || content.en || '';
        // Remplacer les variables
        const variables = {
            '{property_name}': context.property?.name || '',
            '{guest_name}': context.guestName || 'cher client',
            '{property_address}': context.property?.address || '',
            '{property_city}': context.property?.city || '',
            '{check_in}': context.booking?.checkIn ?
                new Date(context.booking.checkIn).toLocaleDateString(context.language) : '',
            '{check_out}': context.booking?.checkOut ?
                new Date(context.booking.checkOut).toLocaleDateString(context.language) : '',
            '{guests}': context.booking?.guests?.toString() || '',
        };
        for (const [key, value] of Object.entries(variables)) {
            text = text.replace(new RegExp(key, 'g'), value);
        }
        return text;
    }
    /**
     * Envoyer une réponse automatique
     */
    async sendAutoResponse(conversationId, content, source) {
        await this.fastify.prisma.message.create({
            data: {
                conversationId,
                content,
                type: 'TEXT',
                metadata: {
                    isAutoResponse: true,
                    source,
                },
            },
        });
        // Mettre à jour la conversation
        await this.fastify.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessage: content,
                lastMessageAt: new Date(),
            },
        });
        // Émettre via WebSocket
        if (this.fastify.io) {
            const message = await this.fastify.prisma.message.findFirst({
                where: {
                    conversationId,
                    content,
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    attachments: true,
                },
            });
            if (message) {
                this.fastify.io.to(`conversation:${conversationId}`).emit('message:new', message);
            }
        }
    }
    /**
     * Transférer à un humain
     */
    async handOffToHuman(sessionId, conversationId) {
        await this.fastify.prisma.chatbotSession.update({
            where: { id: sessionId },
            data: {
                handedOff: true,
                state: 'WAITING_HUMAN',
            },
        });
        await this.sendAutoResponse(conversationId, "Je vais transférer votre demande à un de nos agents qui pourra mieux vous aider. Ils vous répondront dans les plus brefs délais.", 'CHATBOT');
    }
    /**
     * Créer les templates par défaut pour un nouveau tenant
     */
    async createDefaultTemplates(tenantId) {
        const defaultTemplates = [
            {
                name: 'Message de bienvenue',
                category: 'GREETING',
                trigger: 'NEW_CONVERSATION',
                content: {
                    fr: "Bonjour {guest_name} ! 👋\n\nMerci pour votre intérêt pour {property_name}. Je suis là pour répondre à toutes vos questions sur notre propriété.\n\nComment puis-je vous aider aujourd'hui ?",
                    en: "Hello {guest_name}! 👋\n\nThank you for your interest in {property_name}. I'm here to answer any questions you may have about our property.\n\nHow can I help you today?",
                },
                variables: ['{guest_name}', '{property_name}'],
                priority: 100,
            },
            {
                name: 'Disponibilité - Réponse',
                category: 'AVAILABILITY',
                trigger: 'KEYWORD',
                content: {
                    fr: "Je vais vérifier les disponibilités pour vous. Pourriez-vous me préciser :\n- Vos dates d'arrivée et de départ souhaitées ?\n- Le nombre de personnes ?\n\nJe vous donnerai une réponse rapidement.",
                    en: "I'll check availability for you. Could you please let me know:\n- Your desired check-in and check-out dates?\n- Number of guests?\n\nI'll get back to you quickly.",
                },
                conditions: {
                    keywords: ['disponible', 'disponibilité', 'libre', 'available', 'availability'],
                },
                priority: 90,
            },
            {
                name: 'Prix - Réponse',
                category: 'PRICING',
                trigger: 'KEYWORD',
                content: {
                    fr: "Nos tarifs varient selon la saison et la durée du séjour. Pour vous donner un prix précis, j'aurais besoin de connaître :\n- Vos dates de séjour\n- Le nombre de personnes\n\nNos prix commencent généralement à partir de [PRIX] € par nuit.",
                    en: "Our rates vary by season and length of stay. To give you an accurate price, I would need to know:\n- Your stay dates\n- Number of guests\n\nOur prices generally start from [PRICE] € per night.",
                },
                conditions: {
                    keywords: ['prix', 'tarif', 'coût', 'price', 'cost', 'rate'],
                },
                priority: 90,
            },
            {
                name: 'Check-in/out - Information',
                category: 'CHECK_IN_OUT',
                trigger: 'KEYWORD',
                content: {
                    fr: "Voici nos horaires :\n🏠 Check-in : à partir de 15h00\n🚪 Check-out : jusqu'à 11h00\n\nNous sommes flexibles selon les disponibilités. N'hésitez pas à nous demander si vous avez besoin d'horaires spécifiques.",
                    en: "Here are our times:\n🏠 Check-in: from 3:00 PM\n🚪 Check-out: until 11:00 AM\n\nWe're flexible based on availability. Feel free to ask if you need specific times.",
                },
                conditions: {
                    keywords: ['check-in', 'checkin', 'arrivée', 'check-out', 'checkout', 'départ'],
                },
                priority: 80,
            },
            {
                name: 'Hors bureau',
                category: 'OUT_OF_OFFICE',
                trigger: 'TIME_BASED',
                content: {
                    fr: "Merci pour votre message ! 🌙\n\nNos bureaux sont actuellement fermés. Nous vous répondrons dès que possible pendant nos heures d'ouverture (9h-18h).\n\nPour toute urgence, vous pouvez nous appeler au [TÉLÉPHONE].",
                    en: "Thank you for your message! 🌙\n\nOur office is currently closed. We'll respond as soon as possible during business hours (9 AM - 6 PM).\n\nFor emergencies, you can call us at [PHONE].",
                },
                conditions: {
                    time: { from: '18:00', to: '09:00' },
                },
                priority: 70,
            },
            {
                name: 'Confirmation de réservation',
                category: 'BOOKING_CONFIRM',
                trigger: 'BOOKING_CREATED',
                content: {
                    fr: "Félicitations {guest_name} ! 🎉\n\nVotre réservation pour {property_name} est confirmée :\n📅 Check-in : {check_in}\n📅 Check-out : {check_out}\n👥 Nombre de personnes : {guests}\n\nVous recevrez bientôt un email avec tous les détails.",
                    en: "Congratulations {guest_name}! 🎉\n\nYour booking for {property_name} is confirmed:\n📅 Check-in: {check_in}\n📅 Check-out: {check_out}\n👥 Number of guests: {guests}\n\nYou'll receive an email shortly with all the details.",
                },
                variables: ['{guest_name}', '{property_name}', '{check_in}', '{check_out}', '{guests}'],
                priority: 100,
            },
            {
                name: 'Rappel check-in',
                category: 'BOOKING_REMINDER',
                trigger: 'BOOKING_UPCOMING',
                content: {
                    fr: "Bonjour {guest_name} ! 😊\n\nVotre séjour à {property_name} approche ! Voici un rappel :\n📅 Check-in : {check_in} à partir de 15h00\n📍 Adresse : {property_address}, {property_city}\n\nN'hésitez pas si vous avez des questions !",
                    en: "Hello {guest_name}! 😊\n\nYour stay at {property_name} is coming up! Here's a reminder:\n📅 Check-in: {check_in} from 3:00 PM\n📍 Address: {property_address}, {property_city}\n\nFeel free to reach out if you have any questions!",
                },
                variables: ['{guest_name}', '{property_name}', '{check_in}', '{property_address}', '{property_city}'],
                priority: 100,
            },
        ];
        // Créer tous les templates
        for (const template of defaultTemplates) {
            await this.fastify.prisma.autoResponseTemplate.create({
                data: {
                    ...template,
                    tenantId,
                    isActive: true,
                },
            });
        }
    }
}
exports.AutoResponseService = AutoResponseService;
//# sourceMappingURL=auto-response.service.js.map