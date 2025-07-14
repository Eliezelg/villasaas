# Implémentation OAuth Connect (Optionnelle)

Si vous souhaitez ajouter l'option OAuth Connect en plus de l'approche Express actuelle :

## 1. Configuration Stripe

1. Activez OAuth dans votre dashboard Stripe :
   - https://dashboard.stripe.com/test/settings/connect
   - Dans "Platform settings" → "OAuth settings"
   - Ajoutez votre redirect URI : `http://localhost:3000/api/stripe/connect/callback`

2. Récupérez votre Client ID (ca_...)

## 2. Modification du backend

### Ajouter les nouvelles routes dans payments.routes.ts :

```typescript
// Route pour initier OAuth Connect
fastify.get('/stripe/connect/oauth', {
  preHandler: [fastify.authenticate],
}, async (request, reply) => {
  const { tenantId } = request;
  
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  if (!clientId) {
    return reply.code(500).send({ error: 'OAuth not configured' });
  }
  
  // Créer l'URL OAuth
  const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64');
  const redirectUri = `${process.env.FRONTEND_URL}/api/stripe/connect/callback`;
  
  const oauthUrl = `https://connect.stripe.com/oauth/authorize?` +
    `response_type=code&` +
    `client_id=${clientId}&` +
    `scope=read_write&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}`;
  
  return { url: oauthUrl };
});

// Route callback OAuth
fastify.get('/stripe/connect/callback', async (request, reply) => {
  const { code, state } = request.query as { code: string; state: string };
  
  if (!code) {
    return reply.redirect(`${process.env.FRONTEND_URL}/admin/dashboard/payment-configuration?error=denied`);
  }
  
  try {
    // Décoder le state pour récupérer le tenantId
    const { tenantId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    // Échanger le code contre un account ID
    const response = await fastify.stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });
    
    // Sauvegarder l'account ID
    await fastify.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        stripeAccountId: response.stripe_user_id,
        stripeAccountStatus: 'active',
      }
    });
    
    return reply.redirect(`${process.env.FRONTEND_URL}/admin/dashboard/payment-configuration?success=true`);
  } catch (error) {
    fastify.log.error('OAuth callback error:', error);
    return reply.redirect(`${process.env.FRONTEND_URL}/admin/dashboard/payment-configuration?error=failed`);
  }
});
```

## 3. Modification du frontend

Dans l'onboarding, ajouter un choix :

```tsx
const [connectMethod, setConnectMethod] = useState<'express' | 'oauth'>('express');

// Dans le rendu de l'étape Stripe :
<div className="space-y-4">
  <RadioGroup value={connectMethod} onValueChange={setConnectMethod}>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="express" id="express" />
      <Label htmlFor="express">
        Créer un nouveau compte Stripe (recommandé)
      </Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="oauth" id="oauth" />
      <Label htmlFor="oauth">
        Connecter mon compte Stripe existant
      </Label>
    </div>
  </RadioGroup>
</div>

// Modifier setupStripeConnect :
const setupStripeConnect = async () => {
  const endpoint = connectMethod === 'oauth' 
    ? '/api/stripe/connect/oauth'
    : '/api/stripe/connect/onboarding';
    
  const { data, error } = await apiClient.get<{ url: string }>(endpoint);
  // ... reste du code
};
```

## 4. Avantages de cette approche hybride

- Les nouveaux utilisateurs peuvent créer un compte facilement (Express)
- Les utilisateurs existants peuvent connecter leur compte (OAuth)
- Meilleure flexibilité pour tous les cas d'usage