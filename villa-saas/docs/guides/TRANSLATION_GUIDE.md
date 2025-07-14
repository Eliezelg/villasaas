# Guide de Traduction - Villa SaaS

## Vue d'ensemble

Le projet Villa SaaS supporte maintenant 15 langues principales. Les fichiers de traduction sont organisés dans le package `@villa-saas/i18n`.

## Langues supportées

1. 🇫🇷 Français (fr) - ✅ Complet
2. 🇬🇧 Anglais (en) - ✅ Complet
3. 🇪🇸 Espagnol (es) - 🔄 À traduire
4. 🇩🇪 Allemand (de) - 🔄 À traduire
5. 🇮🇹 Italien (it) - 🔄 À traduire
6. 🇵🇹 Portugais (pt) - 🔄 À traduire
7. 🇳🇱 Néerlandais (nl) - 🔄 À traduire
8. 🇷🇺 Russe (ru) - 🔄 À traduire
9. 🇨🇳 Chinois (zh) - 🔄 À traduire
10. 🇯🇵 Japonais (ja) - 🔄 À traduire
11. 🇸🇦 Arabe (ar) - 🔄 À traduire
12. 🇮🇱 Hébreu (he) - 🔄 À traduire
13. 🇮🇳 Hindi (hi) - 🔄 À traduire
14. 🇹🇷 Turc (tr) - 🔄 À traduire
15. 🇵🇱 Polonais (pl) - 🔄 À traduire

## Structure des fichiers

Les fichiers de traduction se trouvent dans : `packages/i18n/src/locales/[langue]/`

Chaque langue contient 4 fichiers :
- `common.json` - Traductions communes (navigation, actions, labels)
- `booking.json` - Traductions pour le site de réservation
- `admin.json` - Traductions pour le dashboard administrateur
- `emails.json` - Traductions pour les emails

## Comment traduire

### Étape 1 : Choisir une langue

Les fichiers pour toutes les langues ont déjà été créés avec le contenu français par défaut. Il vous suffit de remplacer les textes français par la traduction appropriée.

### Étape 2 : Traduire les fichiers

Pour chaque langue, traduisez les 4 fichiers JSON :

```bash
# Exemple pour l'espagnol
packages/i18n/src/locales/es/common.json
packages/i18n/src/locales/es/booking.json
packages/i18n/src/locales/es/admin.json
packages/i18n/src/locales/es/emails.json
```

### Étape 3 : Points d'attention

#### Formatage et variables
- Conservez les placeholders comme `{count}`, `{name}`, etc.
- Respectez la structure JSON (guillemets, virgules)
- N'ajoutez pas de caractères spéciaux non échappés

#### Pluralisation
Pour les textes avec pluriel, utilisez le pattern :
```json
{
  "guestsSingular": "voyageur",
  "guestsPlural": "voyageurs"
}
```

#### Directions de lecture
Pour l'arabe et l'hébreu, n'oubliez pas que l'interface devra supporter RTL (Right-To-Left).

### Étape 4 : Validation

Après traduction, vérifiez que le JSON est valide :
```bash
cd packages/i18n
npm run build
```

## Priorités de traduction

### 🔴 Haute priorité
1. `booking.json` - Interface publique de réservation
2. `common.json` - Éléments d'interface communs

### 🟡 Priorité moyenne
3. `emails.json` - Templates d'emails
4. `admin.json` - Dashboard administrateur

## Services de traduction recommandés

Pour des traductions professionnelles, nous recommandons :

1. **DeepL API** - Pour ES, DE, IT, PT, NL, PL
2. **Google Translate API** - Pour toutes les langues
3. **Services professionnels** - Pour AR, HE, HI, JA, ZH (nécessitent une expertise culturelle)

## Script de traduction automatique (exemple)

```javascript
// Exemple avec DeepL API
const deepl = require('deepl-node');
const fs = require('fs');

async function translateFile(sourceLang, targetLang, filename) {
  const translator = new deepl.Translator(process.env.DEEPL_API_KEY);
  
  const sourceFile = `./locales/${sourceLang}/${filename}`;
  const targetFile = `./locales/${targetLang}/${filename}`;
  
  const sourceContent = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  const targetContent = {};
  
  for (const [key, value] of Object.entries(sourceContent)) {
    if (typeof value === 'string') {
      const result = await translator.translateText(value, sourceLang, targetLang);
      targetContent[key] = result.text;
    } else if (typeof value === 'object') {
      // Gérer les objets imbriqués récursivement
      targetContent[key] = await translateObject(value, sourceLang, targetLang);
    }
  }
  
  fs.writeFileSync(targetFile, JSON.stringify(targetContent, null, 2));
}
```

## Tester les traductions

Pour tester une langue spécifique :

1. Démarrez l'application : `npm run dev`
2. Accédez à l'URL avec le préfixe de langue : `http://localhost:3000/es`
3. Vérifiez que tous les textes sont correctement traduits

## Contribution

Si vous souhaitez contribuer des traductions :

1. Fork le projet
2. Créez une branche : `feature/translate-[langue]`
3. Traduisez les 4 fichiers pour votre langue
4. Testez l'application dans votre langue
5. Soumettez une Pull Request

## Questions fréquentes

### Comment gérer les formats de date/monnaie ?
Les fonctions de formatage sont déjà implémentées dans `packages/i18n/src/index.ts` et s'adaptent automatiquement à la locale.

### Faut-il traduire les noms de propriétés ?
Non, les contenus dynamiques (noms de propriétés, descriptions, etc.) restent dans la langue d'origine.

### Comment ajouter une nouvelle langue ?
Contactez l'équipe de développement. Le système est conçu pour supporter facilement de nouvelles langues.

## Support

Pour toute question sur les traductions, contactez : support@villa-saas.com