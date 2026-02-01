import { applyCors } from "../../lib/cors.js";
import { getUser } from "../../lib/db.js";
import { signToken } from "../../lib/auth.js";

export default function handler(req, res) {
  if (applyCors(req, res)) return;

  const { email, password } = req.body;
  const user = getUser(email);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ token: signToken({ email }) });
}
