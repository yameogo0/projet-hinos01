// app/api/chat/route.ts
import { NextRequest } from 'next/server'

// 🔑 Ta clé Groq
const GROQ_API_KEY = "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"

// 🔍 Fonction pour détecter automatiquement la langue
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
    pt: `Você é Hinos AI, um assistente especialista em agricultura, pecuária, piscicultura e transformação de alimentos na África. Responda SEMPRE em português. Use emojis. Comece cada resposta com um emoji relevante.`,
    en: `You are Hinos AI, an expert assistant in agriculture, livestock, fish farming and food processing in Africa. Always answer in English. Use emojis. Start each response with a relevant emoji.`
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

    // ✅ Appel à l'API Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: getSystemPrompt(language) },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Erreur Groq:", response.status, error)
      return Response.json({ 
        response: "❌ Désolé, une erreur s'est produite. Veuillez réessayer."
      })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || "Je n'ai pas pu générer de réponse."

    console.log("✅ Réponse générée avec succès")
    return Response.json({ response: reply })

  } catch (error: any) {
    console.error("❌ Erreur:", error.message)
    return Response.json({ 
      response: "❌ Désolé, une erreur s'est produite. Veuillez réessayer."
    })
  }
}