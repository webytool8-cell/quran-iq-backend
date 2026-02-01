/**
 * Claude AI Integration
 * Handles communication with Anthropic's Claude API
 */

import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.warn('⚠️  ANTHROPIC_API_KEY not set! AI features will fail.');
}

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1024;

/**
 * Generate AI response for Islamic query
 */
export async function generateResponse(question, verses = [], chatHistory = []) {
  try {
    // Build source context from verses
    let sourceContext = '';
    if (verses.length > 0) {
      sourceContext = 'Here are authentic Quran verses found related to the query:\n' + 
        verses.map(v => `- [Surah ${v.surah} ${v.surahNum}:${v.ayahNum}]: "${v.text}"`).join('\n');
    } else {
      sourceContext = 'No direct keyword matches found in the Quran. Rely on general Islamic knowledge and broader themes.';
    }

    // Build conversation context
    const contextSummary = chatHistory
      .slice(-2)
      .map(msg => msg.content)
      .join(' -> ');

    // System prompt (Islamic companion guidelines)
    const systemPrompt = `You are "QuranIQ", an intelligent Islamic knowledge companion.

Current Date: ${new Date().toISOString().split('T')[0]}

ROLE: You are a humble student of Islam, NOT a mufti or religious authority.

CORE PRINCIPLES:
1. PRIORITIZE provided Quranic verses - cite them explicitly
2. If verses provided, weave them into coherent, comforting answers
3. If NO verses provided, answer using general Islamic wisdom with humility
4. NEVER issue fatwas or definitive rulings on halal/haram
5. For religious rulings, ALWAYS say "scholars differ" and recommend consulting qualified scholars
6. Remain respectful (adab), measured, and transparent about sources

FORMAT YOUR RESPONSE:
- Direct Answer (2-3 paragraphs)
- Supporting Verses (if available, with citations)
- Practical Reflection (how to apply this wisdom)

TONE: Serene, Intellectual, Concise (under 400 words unless complexity requires more)

FORBIDDEN:
- Issuing fatwas
- Claiming definitive knowledge on disputed matters
- Sectarian bias
- Disrespecting any madhab or scholarly opinion`;

    const userPrompt = `User Inquiry: "${question}"

${sourceContext}

${contextSummary ? `Conversation Context: ${contextSummary}` : ''}

Provide your response now.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
      system: systemPrompt
    });

    const response = message.content[0]?.text || '';

    if (!response || response.trim().length === 0) {
      throw new Error('Empty response from Claude');
    }

    return response;
  } catch (error) {
    console.error('Claude API error:', error);
    
    // Return user-friendly error
    if (error.status === 429) {
      throw new Error('AI service is currently busy. Please try again in a moment.');
    }
    
    if (error.status === 401) {
      throw new Error('AI service authentication failed. Please contact support.');
    }
    
    throw new Error('Failed to generate response. Please try again.');
  }
}

/**
 * Check if Claude API is healthy
 */
export async function healthCheck() {
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }]
    });
    
    return { healthy: true, model: MODEL };
  } catch (error) {
    console.error('Claude health check failed:', error);
    return { healthy: false, error: error.message };
  }
}
