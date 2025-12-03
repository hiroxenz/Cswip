import { getMonitor } from "../utils/captchaStore.js";

export default function handler(req,res){
    res.json({ ok:true, monitor:getMonitor() });
}
