/// app/api/chat/route.ts
import { NextRequest } from 'next/server'

// 🔑 Utilise ta clé AI Gateway existante
const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || "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"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    console.log("📩 Message reçu:", message)

    // Détection simple de la langue
    let lang = 'fr'
    if (message.toLowerCase().includes('bom dia') || message.toLowerCase().includes('obrigado')) lang = 'pt'
    else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('thank you')) lang = 'en'

    // Prompt système selon la langue
    const systemPrompt = lang === 'pt' 
      ? 'Você é Hinos AI, especialista em agricultura na África. Responda em português com emojis. Dê conselhos práticos.'
      : lang === 'en'
      ? 'You are Hinos AI, expert in African agriculture. Answer in English with emojis. Give practical advice.'
      : 'Tu es Hinos AI, expert en agriculture africaine. Réponds en français avec des emojis. Donne des conseils pratiques.'

    // Appel à AI Gateway (ou Groq direct)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AI_GATEWAY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Erreur API:", response.status, errorText)
      return Response.json({ 
        response: "❌ Service temporairement indisponible. Veuillez réessayer."
      })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || "Je n'ai pas pu générer de réponse."

    console.log("✅ Réponse envoyée")
    return Response.json({ response: reply })

  } catch (error: any) {
    console.error("❌ Erreur:", error.message)
    return Response.json({ 
      response: "❌ Erreur de connexion. Veuillez réessayer."
    })
  }
}