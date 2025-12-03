const captchas = new Map();
const MONITOR = [];

// Expire default 2 menit
const EXPIRE_TIME = 2*60*1000;

export function createCaptcha(ip, captcha_id, token, target_position, trace_salt){
    if(captchas.has(captcha_id)) throw new Error("Captcha already exists");
    captchas.set(captcha_id, {
        ip,
        token,
        target_position,
        trace_salt,
        created: Date.now(),
        expires: Date.now() + EXPIRE_TIME
    });
    MONITOR.push({ type:'create', captcha_id, ip, timestamp:Date.now() });
}

// Ambil captcha, hapus jika expired
export function getCaptcha(captcha_id){
    const data = captchas.get(captcha_id);
    if(!data) return null;
    if(Date.now() > data.expires){
        captchas.delete(captcha_id);
        return null;
    }
    return data;
}

// Hapus captcha setelah solve
export function deleteCaptcha(captcha_id){
    captchas.delete(captcha_id);
    MONITOR.push({ type:'verify', captcha_id, timestamp:Date.now() });
}

// Monitoring (dashboard)
export function getMonitor(){ return MONITOR; }
