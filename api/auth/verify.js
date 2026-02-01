import { applyCors } from "../../lib/cors.js";
import { verifyToken } from "../../lib/auth.js";

export default function handler(req, res) {
  if (applyCors(req, res)) return;

  const token = req.headers.authorization?.split(" ")[1];
  const user = token && verifyToken(token);

  if (!user) {
    return res.status(401).json({ valid: false });
  }

  res.json({ valid: true, user });
}
