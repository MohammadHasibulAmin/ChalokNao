const dns = require("dns");
const { MongoClient, ServerApiVersion } = require("mongodb");

// DNS override (ok)
dns.setServers(
    process.env.DNS_SERVERS?.split(",").map(s => s.trim()) || ["8.8.8.8", "1.1.1.1"]
);

let client;
let db;

async function connectDB() {
    if (db) return db;

    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is not set");

    if (!client) {
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true
            }
        });

        await client.connect();
        console.log("MongoDB connected");
    }

    db = client.db(process.env.DB_NAME || "test");
    return db;
}

module.exports = connectDB;