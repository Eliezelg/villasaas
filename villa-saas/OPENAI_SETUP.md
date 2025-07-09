# 🤖 Configuration OpenAI pour Villa SaaS

## 1. Créer un compte OpenAI

1. Aller sur [platform.openai.com](https://platform.openai.com)
2. Se connecter ou créer un compte
3. Aller dans **API Keys** > **Create new secret key**
4. Copier la clé (commence par `sk-`)

## 2. Ajouter du crédit

1. Aller dans **Settings** > **Billing**
2. Ajouter une carte de crédit
3. Ajouter $10-20 de crédit pour commencer

## 3. Configuration dans .env.production

```env
# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
```

## 4. Installation du package

```bash
cd apps/backend
npm install openai
```

## 5. Implémentation du service

Le service PropertyAIService existe déjà, il faut juste implémenter la méthode `generateEmbedding`.

## 💰 Coûts OpenAI

### Embeddings (text-embedding-3-small)
- **Prix** : $0.02 / 1M tokens
- **Estimation** : ~1000 propriétés = $0.02/mois

### Génération de texte (GPT-4o-mini)
- **Prix** : $0.15 / 1M tokens input, $0.60 / 1M tokens output
- **Estimation** : ~$10-20/mois pour usage modéré

## 🎯 Cas d'usage

1. **Recherche sémantique** : Trouver des propriétés par description naturelle
2. **Génération de descriptions** : Créer des descriptions SEO optimisées
3. **Traduction intelligente** : Traduction contextuelle des annonces
4. **Chatbot** : Assistant pour les locataires

## 📊 Monitoring

- Surveiller l'usage dans le dashboard OpenAI
- Mettre des limites de rate limiting
- Logger les appels API pour tracking des coûts