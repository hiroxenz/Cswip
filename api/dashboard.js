import { getMonitor } from "../../utils/captchaStore.js";

export default function handler(req,res){
    const records = getMonitor();
    res.json({ ok:true, records });
}
