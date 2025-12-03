import crypto from "crypto";
import { createCaptcha } from "../../utils/captchaStore.js";

const SECRET = process.env.CAPTCHA_SECRET || "super-secret";

export default async function handler(req,res){
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const captcha_id = crypto.randomBytes(6).toString("hex");
    const target_position = Math.floor(Math.random()*100); // 0-100%
    const trace_salt = crypto.randomBytes(8).toString("hex");
    const nonce = crypto.randomBytes(6).toString("hex");

    const token = crypto.createHmac("sha256", SECRET)
        .update(captcha_id + target_position + trace_salt + nonce)
        .digest("hex");

    await createCaptcha(ip,captcha_id,token,target_position,trace_salt,nonce);

    res.json({ ok:true, captcha_id, token });
}
