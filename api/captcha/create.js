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
<div id="captcha-slider" style="width:100%;max-width:320px;height:50px;background:#eee;position:relative;border-radius:8px;touch-action:none;">
  <div id="knob" style="width:50px;height:50px;background:#333;position:absolute;left:0;top:0;cursor:pointer;border-radius:8px;"></div>
</div>
<button id="btn-verify" class="mt-2 px-3 py-1 bg-green-500 text-white rounded">Verify</button>

<script>
(function(){
  const slider = document.getElementById("captcha-slider");
  const knob = document.getElementById("knob");
  const btn = document.getElementById("btn-verify");
  let dragging = false;
  let movement = [];
  let startX = 0;

  const maxPos = () => slider.clientWidth - knob.clientWidth;

  // Helper: get pointer X
  function getX(e){
    if(e.touches) return e.touches[0].clientX;
    return e.clientX;
  }

  function startDrag(e){
    dragging = true;
    startX = getX(e) - knob.offsetLeft;
    e.preventDefault();
  }

  function onDrag(e){
    if(!dragging) return;
    let pos = getX(e) - startX;
    pos = Math.max(0, Math.min(pos, maxPos()));
    knob.style.left = pos + 'px';
    movement.push(Math.round(pos));
    e.preventDefault();
  }

  function endDrag(e){
    dragging = false;
    e.preventDefault();
  }

  // Mouse events
  knob.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', endDrag);

  // Touch events
  knob.addEventListener('touchstart', startDrag, {passive:false});
  document.addEventListener('touchmove', onDrag, {passive:false});
  document.addEventListener('touchend', endDrag);

  btn.addEventListener('click', async ()=>{
    const captcha_id = 'REPLACE_WITH_ID';
    const token = 'REPLACE_WITH_TOKEN';
    const res = await fetch("/api/captcha/verify", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({captcha_id, movement_trace: movement, token})
    });
    const data = await res.json();
    alert(JSON.stringify(data));
  });
})();
</script>
`;


    res.json({ captcha_id, token, html });
}
