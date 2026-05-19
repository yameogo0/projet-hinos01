// app/api/chat/route.ts
import { generateText } from 'ai'
import { groq } from '@ai-sdk/groq'
import { NextRequest } from 'next/server'

function detectLanguage(text: string): string {
  const textLower = text.toLowerCase()
  
  const portugueseKeywords = ['obrigado', 'obrigada', 'por favor', 'oi', 'olá', 'tudo bem', 'como vai', 'obg', 'bom dia', 'boa tarde', 'boa noite', 'legal', 'amigo']
  const englishKeywords = ['hello', 'hi', 'thank you', 'please', 'good morning', 'good afternoon', 'good evening', 'how are you', 'thanks', 'hey']
  const frenchKeywords = ['bonjour', 'merci', 's\'il vous plaît', 'stp', 'svp', 'salut', 'coucou', 'bonsoir', 'comment ça va', 'ça va']
  
  for (const word of portugueseKeywords) if (textLower.includes(word)) return 'pt'
  for (const word of englishKeywords) if (textLower.includes(word)) return 'en'
  for (const word of frenchKeywords) if (textLower.includes(word)) return 'fr'
  return 'fr'
}

function getSystemPrompt(lang: string): string {
  const prompts: Record<string, string> = {
    fr: `Tu es Hinos AI, un assistant expert en agriculture, élevage, pisciculture et transformation alimentaire en Afrique.

**DONNÉES SPÉCIFIQUES :**

🇧🇫 **BURKINA FASO (BAMA) :**
- Barrage de Bama : riz irrigué, maraîchage (oignon, tomate), pisciculture (tilapia, poisson-chat)
- Cultures : sorgho, millet, maïs, coton (1er producteur Afrique Ouest), karité, mangue
- Élevage : bovins Zébu, ovins, caprins
- Techniques anti-sécheresse : Zaï, cordons pierreux, demi-lunes

🇦🇴 **ANGOLA :**
- Hauts Plateaux (Huambo, Bié) : soja, maïs, pomme de terre
- Nord : café (reprise), manioc, banane
- Élevage : bovins Humbe (Cunene)
- Pisciculture : tilapia, poisson-chat (fleuves Kwanza, Cunene)

**RÈGLES :**
- Réponds TOUJOURS en français
- Utilise des emojis (🇧🇫, 🇦🇴, 🌾, 🐄, 🐟, 🏭)
- Donne des conseils pratiques avec des chiffres précis
- Cite les localités comme Bama, Bagré, Kompienga, Huambo, Cunene

Commence chaque réponse par un emoji pertinent.`,
    pt: `Você é Hinos AI, um assistente especialista em agricultura, pecuária, piscicultura e transformação de alimentos na África.

**REGRAS:**
- Responda SEMPRE em português
- Use emojis (🇧🇫, 🇦🇴, 🌾, 🐄, 🐟, 🏭)
- Dê conselhos práticos com números precisos
- Cite localidades como Bama, Bagré, Huambo, Cunene

Comece cada resposta com um emoji relevante.`,
    en: `You are Hinos AI, an expert assistant in agriculture, livestock, fish farming and food processing in Africa.

**RULES:**
- Always answer in English
- Use emojis (🇧🇫, 🇦🇴, 🌾, 🐄, 🐟, 🏭)
- Give practical advice with precise numbers
- Mention localities like Bama, Bagré, Huambo, Cunene

Start each response with a relevant emoji.`
  }
  return prompts[lang] || prompts.fr
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    const language = detectLanguage(message)
    
    console.log("📩 Message reçu:", message)
    console.log("🔍 Langue détectée:", language)

    if (!message) {
      return Response.json({ error: "Message requis" }, { status: 400 })
    }

    // ✅ SDK AI Vercel avec Groq - authentification automatique via AI Gateway
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: getSystemPrompt(language),
      prompt: message,
      temperature: 0.7,
      maxTokens: 800,
    })

    console.log("✅ Réponse générée avec succès")
    return Response.json({ response: text })

  } catch (error: any) {
    console.error("❌ Erreur:", error.message)
    return Response.json({ 
      response: "❌ Désolé, une erreur s'est produite. Veuillez réessayer."
    })
  }
}