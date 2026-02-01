import { applyCors } from "../../lib/cors.js";
import { askClaude } from "../../lib/claude.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { question, verse } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Missing question" });
    }

    const answer = await askClaude({ question, verse });

    res.json({
      answer,
      disclaimer:
        "This response is for informational purposes only and is not a religious ruling."
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate response" });
  }
}
