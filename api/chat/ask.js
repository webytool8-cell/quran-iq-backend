import { handleCors } from '../../lib/cors.js';
import { requireAuth } from '../../lib/auth.js';
import { searchQuran } from '../../lib/quran.js';
import { generateResponse } from '../../lib/claude.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, chatHistory = [] } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question required' });
    }

    console.log('Processing question:', question);

    // Step 1: Search Quran for relevant verses
    const verses = await searchQuran(question);
    console.log(`Found ${verses.length} verses`);

    // Step 2: Generate AI response using Claude
    const aiResponse = await generateResponse(question, verses, chatHistory);

    // Step 3: Return combined response
    return res.status(200).json({
      success: true,
      response: aiResponse,
      verses: verses,
      userId: req.user.userId
    });

  } catch (error) {
    console.error('Chat error:', error);

    // Handle specific errors
    if (error.message.includes('AI service is currently busy')) {
      return res.status(429).json({ error: error.message });
    }

    if (error.message.includes('authentication failed')) {
      return res.status(500).json({ error: error.message });
    }

    // Fallback response with verses if AI fails
    if (req.body.verses && req.body.verses.length > 0) {
      return res.status(200).json({
        success: true,
        response: `I found these verses related to your query:\n\n${req.body.verses.map(v => `"${v.text}" (Surah ${v.surah} ${v.surahNum}:${v.ayahNum})`).join('\n\n')}`,
        verses: req.body.verses
      });
    }

    return res.status(500).json({ 
      error: 'Failed to process your question. Please try again.' 
    });
  }
}

export default handleCors(requireAuth(handler));
