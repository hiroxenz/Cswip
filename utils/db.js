import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
let client;
let db;

export async function connectDB(){
    if(db) return db;
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("captchaDB"); // nama database
    return db;
}

