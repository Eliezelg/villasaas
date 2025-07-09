// Script de test pour OpenAI
require('dotenv').config({ path: '../apps/backend/.env.production' });
const OpenAI = require('openai');

async function testOpenAI() {
  console.log('🤖 Test de connexion OpenAI...\n');

  // Vérifier la clé API
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY non configurée dans .env.production');
    return;
  }

  console.log('📋 Configuration:');
  console.log(`- API Key: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`);
  console.log(`- Model: text-embedding-3-small`);

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    // Test 1: Générer un embedding
    console.log('\n1️⃣ Test de génération d\'embedding...');
    const testText = "Villa moderne avec vue mer, 4 chambres, piscine privée, proche plage";
    
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: testText,
    });
    
    const embedding = response.data[0].embedding;
    console.log('✅ Embedding généré!');
    console.log(`   Dimensions: ${embedding.length}`);
    console.log(`   Premiers valeurs: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log(`   Usage tokens: ${response.usage?.total_tokens || 'N/A'}`);

    // Test 2: Calculer le coût estimé
    const tokensUsed = response.usage?.total_tokens || 0;
    const costPer1M = 0.02; // $0.02 per 1M tokens
    const estimatedCost = (tokensUsed / 1000000) * costPer1M;
    console.log(`   Coût estimé: $${estimatedCost.toFixed(6)}`);

    // Test 3: Test de similarité (optionnel)
    console.log('\n2️⃣ Test de similarité sémantique...');
    const similarText = "Maison de vacances 4 chambres avec piscine près de la mer";
    const differentText = "Studio urbain moderne en centre-ville pour affaires";
    
    const [similar, different] = await Promise.all([
      openai.embeddings.create({ model: "text-embedding-3-small", input: similarText }),
      openai.embeddings.create({ model: "text-embedding-3-small", input: differentText })
    ]);

    // Calculer la similarité cosinus
    const cosineSimilarity = (a, b) => {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    };

    const sim1 = cosineSimilarity(embedding, similar.data[0].embedding);
    const sim2 = cosineSimilarity(embedding, different.data[0].embedding);

    console.log('✅ Scores de similarité:');
    console.log(`   Texte similaire: ${(sim1 * 100).toFixed(1)}%`);
    console.log(`   Texte différent: ${(sim2 * 100).toFixed(1)}%`);

    console.log('\n✅ Tous les tests sont passés!');
    console.log('🚀 OpenAI est prêt pour la recherche sémantique.');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.response) {
      console.error('Détails:', error.response.data);
    }
  }
}

testOpenAI();