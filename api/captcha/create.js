import crypto from "crypto";
import { createCaptcha } from "../../../utils/captchaStore.js";

const SECRET = process.env.CAPTCHA_SECRET || "super-secret";

export default function handler(req, res) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  const captcha_id = crypto.randomBytes(6).toString("hex");
  const target_position = Math.floor(Math.random() * 100) + 120;
  const trace_salt = crypto.randomBytes(8).toString("hex");

  const token = crypto
    .createHmac("sha256", SECRET)
    .update(captcha_id + target_position + trace_salt)
    .digest("hex");

  try {
    createCaptcha(ip, captcha_id, token, target_position, trace_salt);
  } catch (e) {
    return res.status(429).json({ ok: false, msg: e.message });
  }

  // Return ONLY essential data
  return res.json({
    ok: true,
    captcha_id,
    token
  });
}
