const captchas = new Map();
const RATE_LIMIT = new Map();
const MONITOR = []; // log create/verify
const MAX_REQ = 5;
const WINDOW_MS = 60000;

export function createCaptcha(ip, captcha_id, token, target_position, trace_salt) {
    const now = Date.now();
    const times = RATE_LIMIT.get(ip) || [];
    const filtered = times.filter(t => now - t < WINDOW_MS);
    if (filtered.length >= MAX_REQ) throw new Error("Rate limit exceeded");
    filtered.push(now);
    RATE_LIMIT.set(ip, filtered);

    captchas.set(captcha_id, { token, target_position, trace_salt, expires: now + 120000 });

    MONITOR.push({ type: 'create', captcha_id, ip, timestamp: now });
}

export function getCaptcha(captcha_id) {
    const data = captchas.get(captcha_id);
    if(!data) return null;
    if(Date.now() > data.expires){
        captchas.delete(captcha_id);
        return null;
    }
    return data;
}

export function deleteCaptcha(captcha_id, ip) {
    captchas.delete(captcha_id);
    MONITOR.push({ type: 'verify', captcha_id, ip, timestamp: Date.now() });
}

export function getMonitor() {
    return MONITOR.slice(-100); // terakhir 100 record
}
