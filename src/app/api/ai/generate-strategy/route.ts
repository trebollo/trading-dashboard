import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are an expert algorithmic trading strategy developer specializing in PineScript v5 for TradingView. You have deep knowledge of:
- Technical analysis indicators (EMA, SMA, RSI, MACD, Bollinger Bands, ATR, ADX, SuperTrend, VWAP, Stochastic, etc.)
- Trading strategy design (momentum, mean reversion, trend following, breakout, scalping)
- Risk management (stop loss, take profit, position sizing, Kelly criterion)
- Futures trading (MNQ, MES, NQ, ES, YM, RTY)
- Market microstructure and order flow

When the user describes a trading strategy, you MUST respond in the following JSON format:
{
  "analysis": "A detailed analysis of the strategy request, explaining what you understood and the approach you're taking",
  "strategyName": "Name of the strategy",
  "description": "Brief description of how the strategy works",
  "indicators": ["List of indicators used"],
  "entryRules": ["List of entry rules"],
  "exitRules": ["List of exit rules"],
  "riskManagement": {
    "stopLoss": "Stop loss description",
    "takeProfit": "Take profit description",
    "positionSizing": "Position sizing approach"
  },
  "suggestions": ["Improvement suggestions"],
  "pineScript": "The complete PineScript v5 code for the strategy"
}

IMPORTANT RULES:
1. Always generate VALID PineScript v5 code that can be directly pasted into TradingView
2. Include proper strategy declarations with initial_capital and position sizing
3. Include stop loss and take profit logic
4. Add meaningful comments in the code
5. Use proper ta.* namespace for all technical analysis functions
6. Respond ONLY with the JSON object, no additional text before or after
7. The pineScript field must contain the complete, working strategy code
8. If the user speaks Spanish, write the analysis, suggestions, and descriptions in Spanish, but keep the PineScript code and variable names in English
9. Always include plot statements for visual indicators on the chart`

export async function POST(request: NextRequest) {
  try {
    const { prompt, conversationHistory } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt provided' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API_KEY_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    // Build messages from conversation history
    const messages: { role: 'user' | 'assistant'; content: string }[] = []

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg.role === 'user') {
          messages.push({ role: 'user', content: msg.content })
        } else if (msg.role === 'agent' && msg.content) {
          messages.push({ role: 'assistant', content: msg.content })
        }
      }
    }

    // Add current prompt
    messages.push({ role: 'user', content: prompt })

    // Call Anthropic API directly (without SDK to avoid dependency issues)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', response.status, errorData)

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your ANTHROPIC_API_KEY environment variable.' },
          { status: 401 }
        )
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a few seconds.' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: 502 }
      )
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''

    // Try to parse the JSON response from Claude
    try {
      // Extract JSON from the response (Claude might wrap it in markdown code blocks)
      let jsonStr = content
      const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1]
      }

      const parsed = JSON.parse(jsonStr)

      return NextResponse.json({
        success: true,
        data: {
          analysis: parsed.analysis || '',
          strategyName: parsed.strategyName || 'AI Generated Strategy',
          description: parsed.description || '',
          indicators: parsed.indicators || [],
          entryRules: parsed.entryRules || [],
          exitRules: parsed.exitRules || [],
          riskManagement: parsed.riskManagement || {},
          suggestions: parsed.suggestions || [],
          pineScript: parsed.pineScript || '',
        },
      })
    } catch {
      // If JSON parsing fails, return the raw content as analysis with an attempt to extract PineScript
      const pineMatch = content.match(/\/\/@version=5[\s\S]*/)
      return NextResponse.json({
        success: true,
        data: {
          analysis: content,
          strategyName: 'AI Generated Strategy',
          description: '',
          indicators: [],
          entryRules: [],
          exitRules: [],
          riskManagement: {},
          suggestions: [],
          pineScript: pineMatch ? pineMatch[0] : '',
        },
      })
    }
  } catch (error) {
    console.error('Strategy generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
