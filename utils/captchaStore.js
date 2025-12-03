import crypto from "crypto";
import { connectDB } from "./db.js";

const EXPIRE_TIME = 2*60*1000; // 2 menit
const RATE_LIMIT_WINDOW = 60*1000;
const RATE_LIMIT_MAX = 5;

// rate limit memory (masih bisa pakai Map)
const rateLimitStore = new Map();

export async function checkRateLimit(ip){
    const now = Date.now();
    const dataRL = rateLimitStore.get(ip) || { count:0, start:now };
    
    if(now - dataRL.start < RATE_LIMIT_WINDOW){
        if(dataRL.count >= RATE_LIMIT_MAX) throw new Error("Too many requests, slow down");
        dataRL.count++;
    } else {
        dataRL.count = 1;
        dataRL.start = now;
    }
    rateLimitStore.set(ip, dataRL);
}

// create captcha
export async function createCaptcha(ip,captcha_id,token,target_position,trace_salt,nonce){
    const db = await connectDB();
    await db.collection("captchas").insertOne({
        captcha_id, token, target_position, trace_salt, nonce, ip,
        created: Date.now(),
        expires: Date.now() + EXPIRE_TIME
    });
}

// get captcha
export async function getCaptcha(captcha_id){
    const db = await connectDB();
    const data = await db.collection("captchas").findOne({ captcha_id });
    if(!data) return null;
    if(Date.now() > data.expires){
        await db.collection("captchas").deleteOne({ captcha_id });
        return null;
    }
    return data;
}

// delete captcha (setelah solved)
export async function deleteCaptcha(captcha_id){
    const db = await connectDB();
    await db.collection("captchas").deleteOne({ captcha_id });
}

// monitoring
export async function getMonitor(){
    const db = await connectDB();
    return await db.collection("captchas").find().sort({created:-1}).limit(50).toArray();
}
