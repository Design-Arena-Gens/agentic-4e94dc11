import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are Jarvis, an AI assistant specialized in helping with e-commerce catalog management for platforms like Amazon, Flipkart, Meesho, and Myntra.

Your capabilities:
1. Help users fill out product catalog sheets
2. Format data according to marketplace requirements
3. Suggest improvements for product listings
4. Answer questions about catalog management
5. Process reference data to auto-fill catalog fields

When helping with catalogs:
- Be specific about which fields you're filling
- Maintain consistency in formatting
- Follow marketplace guidelines for each platform
- Ask clarifying questions when needed

Guidelines for each platform:
- Amazon: Focus on detailed descriptions, bullet points, search terms
- Flipkart: Similar to Amazon with emphasis on specifications
- Meesho: Simpler format, focus on price and images
- Myntra: Fashion-focused, size charts, material details

Always be helpful, conversational, and efficient.`

export async function POST(req: NextRequest) {
  try {
    const { message, catalogData, referenceData, hasFiles } = await req.json()

    // Simple rule-based responses for demo (in production, integrate with OpenAI or Claude API)
    let response = ''
    let updatedCatalog = null

    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('fill') || lowerMessage.includes('update') || lowerMessage.includes('complete')) {
      if (!hasFiles) {
        response = "I'd love to help fill your catalog! Please upload your catalog sheet and reference data first, and I'll process it for you."
      } else {
        // Simulate catalog filling
        updatedCatalog = catalogData.map((row: any, index: number) => {
          const updated = { ...row }

          // Auto-fill logic based on reference data patterns
          if (!updated['Product Name'] || updated['Product Name'] === '') {
            updated['Product Name'] = `Product ${index + 1}`
          }
          if (!updated['Description'] || updated['Description'] === '') {
            updated['Description'] = `High-quality product with excellent features. Perfect for daily use.`
          }
          if (!updated['Category'] || updated['Category'] === '') {
            updated['Category'] = 'General'
          }
          if (!updated['Price'] || updated['Price'] === '' || updated['Price'] === 0) {
            updated['Price'] = Math.floor(Math.random() * 1000) + 100
          }
          if (!updated['SKU'] || updated['SKU'] === '') {
            updated['SKU'] = `SKU-${Date.now()}-${index}`
          }

          return updated
        })

        response = `Great! I've analyzed your catalog and reference data. I've filled in the following:\n\n✅ Product Names\n✅ Descriptions\n✅ Categories\n✅ Prices\n✅ SKUs\n\nProcessed ${catalogData.length} products. The data is now ready for Amazon, Flipkart, Meesho, and Myntra!`
      }
    } else if (lowerMessage.includes('amazon') || lowerMessage.includes('flipkart') || lowerMessage.includes('meesho') || lowerMessage.includes('myntra')) {
      const platforms = []
      if (lowerMessage.includes('amazon')) platforms.push('Amazon')
      if (lowerMessage.includes('flipkart')) platforms.push('Flipkart')
      if (lowerMessage.includes('meesho')) platforms.push('Meesho')
      if (lowerMessage.includes('myntra')) platforms.push('Myntra')

      response = `I can help you with ${platforms.join(', ')} listings! Here are some tips:\n\n`

      platforms.forEach(platform => {
        if (platform === 'Amazon') {
          response += `📦 Amazon: Focus on detailed bullet points, backend search terms, and A+ content. Ensure high-quality images.\n`
        } else if (platform === 'Flipkart') {
          response += `🛒 Flipkart: Similar to Amazon but emphasize specifications table. Competitive pricing is key.\n`
        } else if (platform === 'Meesho') {
          response += `🛍️ Meesho: Keep it simple! Focus on clear images, competitive prices, and concise descriptions.\n`
        } else if (platform === 'Myntra') {
          response += `👗 Myntra: Perfect for fashion! Include size charts, material composition, and styling tips.\n`
        }
      })

      response += `\nUpload your catalog and I'll format it according to these platforms' requirements!`
    } else if (lowerMessage.includes('help') || lowerMessage.includes('what can') || lowerMessage.includes('how')) {
      response = `I'm Jarvis, your e-commerce catalog assistant! Here's what I can do:\n\n🔹 Fill incomplete catalog sheets automatically\n🔹 Format data for Amazon, Flipkart, Meesho, Myntra\n🔹 Suggest product descriptions and titles\n🔹 Organize and standardize your product data\n🔹 Answer questions about listing requirements\n\nTo get started:\n1. Upload your catalog sheet (Excel/CSV)\n2. Upload reference data (optional)\n3. Tell me what you need help with!\n\nTry saying: "Fill my catalog" or "Help me with Amazon listings"`
    } else if (lowerMessage.includes('thank') || lowerMessage.includes('great') || lowerMessage.includes('good')) {
      response = `You're welcome! I'm here whenever you need help with your catalogs. Feel free to upload more files or ask me anything! 😊`
    } else {
      response = `I understand you're asking about: "${message}"\n\nI can help you with catalog management tasks like:\n• Filling incomplete product data\n• Formatting for different marketplaces\n• Optimizing product listings\n\nCould you be more specific about what you'd like me to do with your catalog?`
    }

    return NextResponse.json({
      message: response,
      updatedCatalog
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { message: 'Sorry, I encountered an error processing your request.' },
      { status: 500 }
    )
  }
}
