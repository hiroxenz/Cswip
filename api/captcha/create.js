import crypto from "crypto";
import { createCaptcha } from "../../utils/captchaStore.js";

const SECRET = process.env.CAPTCHA_SECRET || "super-secret";

export default function handler(req,res){
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const captcha_id = crypto.randomBytes(6).toString("hex");
    const target_position = Math.floor(Math.random()*100)+120;
    const trace_salt = crypto.randomBytes(8).toString("hex");

    const token = crypto.createHmac("sha256", SECRET)
        .update(captcha_id + target_position + trace_salt)
        .digest("hex");

    try{
        createCaptcha(ip, captcha_id, token, target_position, trace_salt);
    }catch(e){
        return res.status(429).json({ ok:false, msg:e.message });
    }

    const html = `
<div style="width:300px;height:50px;background:#eee;position:relative;">
  <div id="knob-${captcha_id}" style="width:50px;height:50px;background:#333;position:absolute;left:0;top:0;cursor:pointer;"></div>
</div>
<button id="btn-${captcha_id}">Verify</button>
<script>
(function(){
let movement=[],dragging=false,offsetX=0;
const knob=document.getElementById("knob-${captcha_id}");
const btn=document.getElementById("btn-${captcha_id}");
knob.onmousedown=e=>{dragging=true;offsetX=e.clientX-knob.offsetLeft;};
document.onmousemove=e=>{if(!dragging)return;let pos=e.clientX-offsetX;pos=Math.max(0,Math.min(pos,250));knob.style.left=pos+'px';movement.push(pos);};
document.onmouseup=()=>dragging=false;
btn.onclick=async()=>{
  const res=await fetch("/api/captcha/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({captcha_id:"${captcha_id}",movement_trace:movement,token:"${token}"})});
  const data=await res.json();
  alert(JSON.stringify(data));
};
})();
</script>
    `;
    res.json({ captcha_id, token, html });
}
