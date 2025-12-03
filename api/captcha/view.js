export default function handler(req, res) {
  const { id, token } = req.query;

  if (!id || !token)
    return res.status(400).send("Missing captcha parameters");

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Swipe CAPTCHA</title>
<style>
#slider {width:100%;max-width:320px;height:50px;background:#eee;position:relative;border-radius:8px;touch-action:none;margin-top:20px;}
#knob {width:50px;height:50px;background:#333;position:absolute;left:0;top:0;cursor:pointer;border-radius:8px;}
</style>
</head>
<body>

<div id="slider">
  <div id="knob"></div>
</div>

<button id="verify" style="margin-top:20px;padding:10px 20px;background:green;color:white;border-radius:6px;">
  Verify
</button>

<script>
(function(){
  const slider = document.getElementById("slider");
  const knob = document.getElementById("knob");
  const btn = document.getElementById("verify");

  let dragging = false;
  let startX = 0;
  let movement = [];

  function getX(e){
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function startDrag(e){
    dragging = true;
    startX = getX(e) - knob.offsetLeft;
    e.preventDefault();
  }

  function onDrag(e){
    if(!dragging) return;
    let pos = getX(e) - startX;
    const max = slider.clientWidth - knob.clientWidth;

    pos = Math.max(0, Math.min(pos, max));
    knob.style.left = pos + 'px';

    movement.push(Math.round(pos));
    e.preventDefault();
  }

  function endDrag(e){
    dragging = false;
  }

  knob.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", endDrag);

  knob.addEventListener("touchstart", startDrag, {passive:false});
  document.addEventListener("touchmove", onDrag, {passive:false});
  document.addEventListener("touchend", endDrag);

  btn.onclick = async () => {
    const res = await fetch("/api/captcha/verify", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        captcha_id: "${id}",
        token: "${token}",
        movement_trace: movement
      })
    });

    alert(await res.text());
  };
})();
</script>

</body>
</html>
`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
}
