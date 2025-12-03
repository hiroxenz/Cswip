import crypto from "crypto";
import { getCaptcha, deleteCaptcha } from "../../utils/captchaStore.js";

const SECRET = process.env.CAPTCHA_SECRET || "super-secret";

export default function handler(req,res){
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { captcha_id, movement_trace, token } = req.body;
    const data = getCaptcha(captcha_id);
    if(!data) return res.status(400).json({ ok:false, msg:"Invalid or expired" });

    const serverToken = crypto.createHmac("sha256", SECRET)
        .update(captcha_id + data.target_position + data.trace_salt)
        .digest("hex");
    if(serverToken !== token) return res.status(400).json({ ok:false, msg:"Bad token" });

    const finalPos = movement_trace[movement_trace.length-1];

    if(movement_trace.length < 8) return res.json({ ok:false, msg:"Trace too short" });
    let bad=false;
    for(let i=1;i<movement_trace.length;i++){
        if(movement_trace[i]-movement_trace[i-1]>25) bad=true;
    }
    if(bad) return res.json({ ok:false, msg:"Unnatural movement" });

    if(Math.abs(finalPos - data.target_position) > 6)
        return res.json({ ok:false, msg:"Wrong position" });

    deleteCaptcha(captcha_id, ip);
    res.json({ ok:true });
}
