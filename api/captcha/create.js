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
<div id="captcha-slider" style="width:100%;max-width:320px;height:50px;background:#eee;position:relative;border-radius:8px;">
  <div id="knob-${captcha_id}" style="width:50px;height:50px;background:#333;position:absolute;left:0;top:0;cursor:pointer;border-radius:8px;transition:left 0.05s linear;"></div>
</div>
<button id="btn-${captcha_id}" class="mt-2 px-3 py-1 bg-green-500 text-white rounded">Verify</button>

<script>
(function(){
  const slider = document.getElementById("captcha-slider");
  const knob = document.getElementById("knob-${captcha_id}");
  const btn = document.getElementById("btn-${captcha_id}");
  let movement = [], dragging = false, offsetX = 0;

  const maxPos = slider.clientWidth - knob.clientWidth;

  // ==== Mouse / Touch Events ====
  const startDrag = e => {
    dragging = true;
    offsetX = (e.type==='touchstart'? e.touches[0].clientX : e.clientX) - knob.offsetLeft;
    e.preventDefault();
  };

  const drag = e => {
    if(!dragging) return;
    const clientX = (e.type==='touchmove'? e.touches[0].clientX : e.clientX);
    let pos = clientX - offsetX;
    pos = Math.max(0, Math.min(pos, maxPos));
    
    // Smooth interpolation
    const prev = parseFloat(knob.style.left) || 0;
    knob.style.left = (prev + (pos - prev)*0.3) + "px";

    movement.push(Math.round(pos));
    e.preventDefault();
  };

  const endDrag = e => { dragging = false; e.preventDefault(); };

  knob.addEventListener("mousedown", startDrag);
  knob.addEventListener("touchstart", startDrag);

  document.addEventListener("mousemove", drag);
  document.addEventListener("touchmove", drag);

  document.addEventListener("mouseup", endDrag);
  document.addEventListener("touchend", endDrag);

  btn.onclick = async () => {
    const res = await fetch("/api/captcha/verify", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({captcha_id:"${captcha_id}",movement_trace:movement,token:"${token}"})
    });
    const data = await res.json();
    alert(JSON.stringify(data));
  };
})();
</script>
`;

    res.json({ captcha_id, token, html });
}
