import { generateText } from 'ai'
import { NextRequest } from 'next/server'
import { callAIGatewayAPI } from '@/lib/pi-ai-config'

// 🔍 Fonction pour détecter automatiquement la langue
function detectLanguage(text: string): string {
  const textLower = text.toLowerCase()
  
  // Mots-clés portugais
  const portugueseKeywords = ['obrigado', 'obrigada', 'por favor', 'oi', 'olá', 'tudo bem', 'como vai', 'obg', 'bom dia', 'boa tarde', 'boa noite', 'legal', 'amigo']
  
  // Mots-clés anglais
  const englishKeywords = ['hello', 'hi', 'thank you', 'please', 'good morning', 'good afternoon', 'good evening', 'how are you', 'thanks', 'hey']
  
  // Mots-clés français
  const frenchKeywords = ['bonjour', 'merci', 's\'il vous plaît', 'stp', 'svp', 'salut', 'coucou', 'bonsoir', 'comment ça va', 'ça va', 'bonsoir']
  
  for (const word of portugueseKeywords) {
    if (textLower.includes(word)) return 'pt'
  }
  
  for (const word of englishKeywords) {
    if (textLower.includes(word)) return 'en'
  }
  
  for (const word of frenchKeywords) {
    if (textLower.includes(word)) return 'fr'
  }
  
  return 'fr' // Par défaut
}

export async function POST(request: NextRequest) {
  let language = 'fr'

  try {
    const body = await request.json()
    let { message } = body
    
    // Détection automatique de la langue
    const detectedLanguage = detectLanguage(message)
    
    // Si l'utilisateur a choisi une langue manuellement, on utilise celle-ci
    // Sinon on utilise la langue détectée
    language = body.language || detectedLanguage
    
    console.log("📩 Message reçu:", message)
    console.log("🔍 Langue détectée automatiquement:", detectedLanguage)
    console.log("🌍 Langue utilisée pour la réponse:", language)

    if (!message) {
      return Response.json({ error: "Message requis" }, { status: 400 })
    }

    // ✅ Utilisation de AI Gateway (Groq) au lieu d'OpenAI
    const responseText = await callAIGatewayAPI(message)

    console.log("✅ Réponse générée avec succès")
    return Response.json({ response: responseText })

  } catch (error: any) {
    console.error("❌ Erreur:", error.message)
    return Response.json({ 
      response: getErrorMessage(language)
    })
  }
}

function getErrorMessage(lang: string): string {
  const errors: Record<string, string> = {
    fr: "❌ Désolé, une erreur s'est produite. Veuillez réessayer.",
    pt: "❌ Desculpe, ocorreu um erro. Por favor, tente novamente.",
    en: "❌ Sorry, an error occurred. Please try again."
  }
  return errors[lang] || errors.fr
}