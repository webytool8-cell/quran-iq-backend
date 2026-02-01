import { applyCors } from "../../lib/cors.js";
import { createUser } from "../../lib/db.js";
import { signToken } from "../../lib/auth.js";

export default function handler(req, res) {
  if (applyCors(req, res)) return;

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  createUser(email, password);
  const token = signToken({ email });

  res.json({ token });
}
