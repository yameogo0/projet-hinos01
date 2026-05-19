import { NextRequest } from 'next/server'
import { callGroqAPI } from '@/lib/pi-ai-config'

// 🔍 Fonction pour détecter automatiquement la langue
function detectLanguage(text: string): string {
  const textLower = text.toLowerCase()
  
  const portugueseKeywords = ['obrigado', 'obrigada', 'por favor', 'oi', 'olá', 'tudo bem', 'como vai', 'obg', 'bom dia', 'boa tarde', 'boa noite', 'legal', 'amigo']
  const englishKeywords = ['hello', 'hi', 'thank you', 'please', 'good morning', 'good afternoon', 'good evening', 'how are you', 'thanks', 'hey']
  const frenchKeywords = ['bonjour', 'merci', 's\'il vous plaît', 'stp', 'svp', 'salut', 'coucou', 'bonsoir', 'comment ça va', 'ça va']
  
  for (const word of portugueseKeywords) {
    if (textLower.includes(word)) return 'pt'
  }
  for (const word of englishKeywords) {
    if (textLower.includes(word)) return 'en'
  }
  for (const word of frenchKeywords) {
    if (textLower.includes(word)) return 'fr'
  }
  return 'fr'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body
    
    const detectedLanguage = detectLanguage(message)
    
    console.log("📩 Message reçu:", message)
    console.log("🔍 Langue détectée:", detectedLanguage)

    if (!message) {
      return Response.json({ error: "Message requis" }, { status: 400 })
    }

    // ✅ IMPORTANT: Utilise callGroqAPI, PAS openai()
    const responseText = await callGroqAPI(message)

    console.log("✅ Réponse générée avec succès")
    return Response.json({ response: responseText })

  } catch (error: any) {
    console.error("❌ Erreur:", error.message)
    return Response.json({ 
      response: "❌ Désolé, une erreur s'est produite. Veuillez réessayer."
    })
  }
}