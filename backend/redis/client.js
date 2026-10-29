import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, "../db/cache.json");

function readCache() {
    try {
        if (!fs.existsSync(CACHE_FILE)) return {};
        return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8") || "{}");
    } catch {
        return {};
    }
}

function writeCache(cache) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
    } catch (err) {
        console.error("Error writing local cache:", err);
    }
}

class LocalCacheClient {
    async get(key) {
        const cache = readCache();
        const entry = cache[key];
        if (!entry) return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            delete cache[key];
            writeCache(cache);
            return null;
        }
        return entry.value;
    }

    async set(key, value) {
        const cache = readCache();
        cache[key] = {
            value: String(value),
            expiresAt: null
        };
        writeCache(cache);
        return "OK";
    }

    async expire(key, seconds) {
        const cache = readCache();
        if (cache[key]) {
            cache[key].expiresAt = Date.now() + Number(seconds) * 1000;
            writeCache(cache);
            return 1;
        }
        return 0;
    }

    async del(key) {
        const cache = readCache();
        if (key in cache) {
            delete cache[key];
            writeCache(cache);
            return 1;
        }
        return 0;
    }

    async exists(key) {
        const val = await this.get(key);
        return val !== null ? 1 : 0;
    }
}

const client = new LocalCacheClient();

export { client };