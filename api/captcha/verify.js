import { getCaptcha, deleteCaptcha, checkRateLimit } from "../../utils/captchaStore.js";

export default async function handler(req,res){
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try{ await checkRateLimit(ip); }
    catch(e){ return res.status(429).json({ ok:false, msg:e.message }); }

    const { captcha_id, token, movement_trace } = req.body;
    const data = await getCaptcha(captcha_id);

    if(!data) return res.status(400).json({ ok:false, msg:"Invalid or expired" });
    if(data.token!==token) return res.status(400).json({ ok:false, msg:"Invalid token" });

    const finalPos = movement_trace[movement_trace.length-1];
    const tolerance = 10;
    if(Math.abs(finalPos - data.target_position) > tolerance)
        return res.json({ ok:false, msg:"Failed slider validation" });

    await deleteCaptcha(captcha_id);
    return res.json({ ok:true, msg:"Captcha solved successfully" });
}
