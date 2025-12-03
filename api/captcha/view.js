import { getCaptcha } from "../../utils/captchaStore.js";

export default function handler(req,res){
    const { id, token } = req.query;
    if(!id || !token) return res.status(400).send("Missing parameters");

    const data = getCaptcha(id);
    if(!data || data.token!==token) return res.status(400).send("Invalid or expired");

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Swipe CAPTCHA</title>
<style>
#slider {width:100%;max-width:320px;height:50px;background:#eee;position:relative;border-radius:8px;touch-action:none;margin-top:20px;}
#knob {width:50px;height:50px;background:#333;position:absolute;left:0;top:0;cursor:pointer;border-radius:8px;transition:left 0.05s linear;}
#verify {margin-top:20px;padding:10px 20px;background:green;color:white;border-radius:6px;border:none;cursor:pointer;}
</style>
</head>
<body>

<div id="slider"><div id="knob"></div></div>
<button id="verify">Verify</button>

<script>
(function(){
  const slider = document.getElementById("slider");
  const knob = document.getElementById("knob");
  const btn = document.getElementById("verify");
  let dragging=false, startX=0, movement=[];

  function getX(e){ return e.touches? e.touches[0].clientX : e.clientX; }

  function startDrag(e){ dragging=true; startX=getX(e)-knob.offsetLeft; e.preventDefault(); }
  function onDrag(e){ 
    if(!dragging) return;
    let pos = getX(e)-startX;
    pos = Math.max(0, Math.min(pos, slider.clientWidth-knob.clientWidth));
    knob.style.left = pos + 'px';
    movement.push(Math.round(pos));
    e.preventDefault();
  }
  function endDrag(e){ dragging=false; }

  knob.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', endDrag);

  knob.addEventListener('touchstart', startDrag, {passive:false});
  document.addEventListener('touchmove', onDrag, {passive:false});
  document.addEventListener('touchend', endDrag);

  btn.addEventListener('click', async ()=>{
    const res = await fetch("/api/captcha/verify", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ captcha_id:"${id}", token:"${token}", movement_trace:movement })
    });
    const data = await res.json();
    alert(JSON.stringify(data));
  });

})();
</script>

</body>
</html>
`;

    res.setHeader("Content-Type","text/html");
    res.send(html);
}
