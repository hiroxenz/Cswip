import crypto from "crypto";

const captchas = new Map();
const MONITOR = [];
const EXPIRE_TIME = 2*60*1000; // 2 menit

// create captcha
export function createCaptcha(ip, captcha_id, token, target_position, trace_salt, nonce){
    if(captchas.has(captcha_id)) throw new Error("Captcha already exists");
    captchas.set(captcha_id,{
        ip, token, target_position, trace_salt, nonce,
        created: Date.now(),
        expires: Date.now() + EXPIRE_TIME
    });
    MONITOR.push({ type:'create', captcha_id, ip, timestamp:Date.now() });
}

// get captcha
export function getCaptcha(captcha_id){
    const data = captchas.get(captcha_id);
    if(!data) return null;
    if(Date.now() > data.expires){
        captchas.delete(captcha_id);
        return null;
    }
    return data;
}

// delete captcha (after solved)
export function deleteCaptcha(captcha_id){
    captchas.delete(captcha_id);
    MONITOR.push({ type:'verify', captcha_id, timestamp:Date.now() });
}

// monitoring
export function getMonitor(){ return MONITOR; }
