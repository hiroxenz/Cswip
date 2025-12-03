import { getCaptcha, deleteCaptcha, checkRateLimit } from "../../utils/captchaStore.js";
import crypto from "crypto";

const SECRET = process.env.CAPTCHA_SECRET || "super-secret";

export default async function handler(req,res){
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try{ await checkRateLimit(ip); }
  catch(e){ return res.status(429).json({ ok:false, msg:e.message }); }

  const { captcha_id, movement_trace } = req.body;
  const data = await getCaptcha(captcha_id);

  if(!data) return res.status(400).json({ ok:false, msg:"Invalid or expired" });

  // verify token internal dari data DB
  const expectedToken = crypto.createHmac("sha256", SECRET)
      .update(data.captcha_id + data.target_position + data.trace_salt + data.nonce)
      .digest("hex");

  if(data.token !== expectedToken) return res.status(400).json({ ok:false, msg:"Invalid token" });

  // finalPos sudah 0-100%
  const finalPos = movement_trace[movement_trace.length-1];
  const tolerance = 5; // ±5%
  if(Math.abs(finalPos - data.target_position) > tolerance)
      return res.json({ ok:false, msg:"Failed slider validation" });

  await deleteCaptcha(captcha_id); // sekali pakai
  return res.json({ ok:true, msg:"Captcha solved successfully" });
}
