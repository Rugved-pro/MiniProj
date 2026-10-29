import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "database.json");

const DEFAULT_SEED_DATA = {
    users: [],
    deletedUsers: [],
    predictions: [],
    products: [
        {
            _id: "660000000000000000000101",
            product_name: "Mancozeb 75% WP Fungicide",
            image_url: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=600&q=80",
            seller: "660000000000000000000001",
            seller_name: "Kisan Agro Store",
            seller_type: "retailer",
            price: 380,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
            _id: "660000000000000000000102",
            product_name: "Propiconazole 25% EC Systemic Fungicide",
            image_url: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=600&q=80",
            seller: "660000000000000000000001",
            seller_name: "Kisan Agro Store",
            seller_type: "retailer",
            price: 520,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
            _id: "660000000000000000000103",
            product_name: "Azoxystrobin & Tebuconazole Crop Shield",
            image_url: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80",
            seller: "660000000000000000000001",
            seller_name: "GreenField Retailers",
            seller_type: "retailer",
            price: 640,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
            _id: "660000000000000000000104",
            product_name: "Carbendazim & Tricyclazole Blast Guard",
            image_url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80",
            seller: "660000000000000000000001",
            seller_name: "Bharat Krishi Kendra",
            seller_type: "retailer",
            price: 450,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
            _id: "660000000000000000000105",
            product_name: "Chlorothalonil & Metalaxyl Blight Care",
            image_url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=80",
            seller: "660000000000000000000001",
            seller_name: "Krishi Sevak Supplies",
            seller_type: "retailer",
            price: 490,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
            _id: "660000000000000000000106",
            product_name: "Copper Oxychloride & Streptomycin Pack",
            image_url: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=600&q=80",
            seller: "660000000000000000000001",
            seller_name: "AgriCare India",
            seller_type: "retailer",
            price: 410,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
            _id: "660000000000000000000107",
            product_name: "Organic Sharbati Wheat Seeds (10kg)",
            image_url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80",
            seller: "660000000000000000000001",
            seller_name: "Ramesh Patil",
            seller_type: "farmer",
            price: 320,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
            _id: "660000000000000000000108",
            product_name: "Premium Basmati Rice Seeds (5kg)",
            image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
            seller: "660000000000000000000001",
            seller_name: "Suresh Deshmukh",
            seller_type: "farmer",
            price: 290,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        }
    ],
    orders: [],
    payments: [],
    metadata: [],
    images: [
        {
            _id: "660000000000000000000201",
            image_url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80",
            crop: "Wheat",
            disease: "Brown_Rust"
        },
        {
            _id: "660000000000000000000202",
            image_url: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80",
            crop: "Rice",
            disease: "Leaf_Blast"
        },
        {
            _id: "660000000000000000000203",
            image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80",
            crop: "Potato",
            disease: "Early_Blight"
        },
        {
            _id: "660000000000000000000204",
            image_url: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80",
            crop: "Corn",
            disease: "Common_Rust"
        },
        {
            _id: "660000000000000000000205",
            image_url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
            crop: "Sugarcane",
            disease: "Red_Rot"
        },
        {
            _id: "660000000000000000000206",
            image_url: "https://images.unsplash.com/photo-1437252611977-07f74518abd7?auto=format&fit=crop&w=600&q=80",
            crop: "Wheat",
            disease: "Yellow_Rust"
        },
        {
            _id: "660000000000000000000207",
            image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
            crop: "Rice",
            disease: "Brown_Spot"
        },
        {
            _id: "660000000000000000000208",
            image_url: "https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&w=600&q=80",
            crop: "Potato",
            disease: "Late_Blight"
        },
        {
            _id: "660000000000000000000209",
            image_url: "https://images.unsplash.com/photo-1601593768799-76d6d8281e04?auto=format&fit=crop&w=600&q=80",
            crop: "Corn",
            disease: "Northern_Leaf_Blight"
        },
        {
            _id: "660000000000000000000210",
            image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80",
            crop: "Wheat",
            disease: "Healthy"
        }
    ]
};

export function initLocalDB() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_SEED_DATA, null, 2), "utf-8");
        } else {
            const raw = fs.readFileSync(DB_FILE, "utf-8");
            const parsed = JSON.parse(raw || "{}");
            let updated = false;
            for (const [key, defaultVal] of Object.entries(DEFAULT_SEED_DATA)) {
                if (!Array.isArray(parsed[key])) {
                    parsed[key] = defaultVal;
                    updated = true;
                } else if ((key === "products" || key === "images") && parsed[key].length === 0) {
                    parsed[key] = defaultVal;
                    updated = true;
                }
            }
            if (updated) {
                fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
            }
        }
        return true;
    } catch (error) {
        console.error("Error initializing local JSON database:", error);
        return false;
    }
}

function readDB() {
    initLocalDB();
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function generateId() {
    return crypto.randomBytes(12).toString("hex");
}

function matchesFilter(doc, filter = {}) {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const [key, condition] of Object.entries(filter)) {
        const docVal = doc[key];
        if (condition && typeof condition === "object" && !Array.isArray(condition)) {
            if ("$ne" in condition) {
                if (String(docVal) === String(condition.$ne)) return false;
            }
            if ("$in" in condition && Array.isArray(condition.$in)) {
                const strList = condition.$in.map(String);
                if (!strList.includes(String(docVal))) return false;
            }
        } else {
            if (String(docVal) !== String(condition)) return false;
        }
    }
    return true;
}

function applySelect(doc, selectStr) {
    if (!doc || !selectStr) return doc;
    const copy = { ...doc };
    const fields = selectStr.trim().split(/\s+/);
    const exclusions = fields.filter((f) => f.startsWith("-")).map((f) => f.slice(1));
    const inclusions = fields.filter((f) => !f.startsWith("-")).map((f) => f.replace(/^\+/, ""));

    if (exclusions.length > 0) {
        for (const ex of exclusions) {
            delete copy[ex];
        }
        return copy;
    }
    if (inclusions.length > 0) {
        const picked = { _id: copy._id };
        for (const inc of inclusions) {
            if (inc in copy) picked[inc] = copy[inc];
        }
        return picked;
    }
    return copy;
}

class LocalQuery {
    constructor(executor, isSingle = false) {
        this._executor = executor;
        this._isSingle = isSingle;
        this._sort = null;
        this._skip = 0;
        this._limit = null;
        this._select = null;
    }

    sort(sortSpec) {
        this._sort = sortSpec;
        return this;
    }

    skip(n) {
        this._skip = Number(n) || 0;
        return this;
    }

    limit(n) {
        this._limit = Number(n);
        return this;
    }

    select(selectStr) {
        this._select = selectStr;
        return this;
    }

    async exec() {
        const results = await this._executor();
        if (this._isSingle) {
            const single = results[0] || null;
            return single ? applySelect(single, this._select) : null;
        }

        let list = [...results];
        if (this._sort) {
            const entries = Object.entries(this._sort);
            list.sort((a, b) => {
                for (const [field, dir] of entries) {
                    const va = a[field] ?? "";
                    const vb = b[field] ?? "";
                    if (va < vb) return dir === -1 ? 1 : -1;
                    if (va > vb) return dir === -1 ? -1 : 1;
                }
                return 0;
            });
        }

        if (this._skip > 0) {
            list = list.slice(this._skip);
        }
        if (this._limit !== null && !Number.isNaN(this._limit)) {
            list = list.slice(0, this._limit);
        }
        if (this._select) {
            list = list.map((item) => applySelect(item, this._select));
        }
        return list;
    }

    then(resolve, reject) {
        return this.exec().then(resolve, reject);
    }

    catch(reject) {
        return this.exec().catch(reject);
    }
}

export function createLocalModel(collectionName, defaults = {}, timestamps = true) {
    function createDocumentInstance(data = {}) {
        const now = new Date().toISOString();
        const doc = {
            _id: data._id ? String(data._id) : generateId(),
            ... structuredClone(defaults),
            ...data
        };
        if (timestamps) {
            doc.createdAt = data.createdAt || now;
            doc.updatedAt = data.updatedAt || now;
        }

        Object.defineProperty(doc, "save", {
            enumerable: false,
            writable: true,
            value: async function () {
                const db = readDB();
                if (!Array.isArray(db[collectionName])) {
                    db[collectionName] = [];
                }
                if (timestamps) {
                    this.updatedAt = new Date().toISOString();
                }
                const plain = {};
                for (const key of Object.keys(this)) {
                    plain[key] = this[key];
                }
                const existingIndex = db[collectionName].findIndex(
                    (item) => String(item._id) === String(this._id)
                );
                if (existingIndex >= 0) {
                    db[collectionName][existingIndex] = plain;
                } else {
                    db[collectionName].push(plain);
                }
                writeDB(db);
                return this;
            }
        });

        return doc;
    }

    function Model(data = {}) {
        return createDocumentInstance(data);
    }

    Model.find = function (filter = {}) {
        return new LocalQuery(async () => {
            const db = readDB();
            const col = db[collectionName] || [];
            return col
                .filter((item) => matchesFilter(item, filter))
                .map((item) => createDocumentInstance(item));
        }, false);
    };

    Model.findOne = function (filter = {}) {
        return new LocalQuery(async () => {
            const db = readDB();
            const col = db[collectionName] || [];
            const found = col.find((item) => matchesFilter(item, filter));
            return found ? [createDocumentInstance(found)] : [];
        }, true);
    };

    Model.findById = function (id) {
        return Model.findOne({ _id: String(id) });
    };

    Model.create = async function (data = {}) {
        const instance = createDocumentInstance(data);
        await instance.save();
        return instance;
    };

    Model.findByIdAndUpdate = async function (id, update = {}, options = {}) {
        const db = readDB();
        const col = db[collectionName] || [];
        const idx = col.findIndex((item) => String(item._id) === String(id));
        if (idx === -1) return null;

        const updateFields = update.$set ? update.$set : update;
        const updated = {
            ...col[idx],
            ...updateFields,
            _id: col[idx]._id
        };
        if (timestamps) {
            updated.updatedAt = new Date().toISOString();
        }
        col[idx] = updated;
        writeDB(db);
        return createDocumentInstance(options.new === false ? col[idx] : updated);
    };

    Model.findByIdAndDelete = async function (id) {
        const db = readDB();
        const col = db[collectionName] || [];
        const idx = col.findIndex((item) => String(item._id) === String(id));
        if (idx === -1) return null;
        const [removed] = col.splice(idx, 1);
        writeDB(db);
        return createDocumentInstance(removed);
    };

    Model.deleteOne = async function (filter = {}) {
        const db = readDB();
        const col = db[collectionName] || [];
        const idx = col.findIndex((item) => matchesFilter(item, filter));
        if (idx === -1) return { acknowledged: true, deletedCount: 0 };
        col.splice(idx, 1);
        writeDB(db);
        return { acknowledged: true, deletedCount: 1 };
    };

    Model.countDocuments = async function (filter = {}) {
        const db = readDB();
        const col = db[collectionName] || [];
        return col.filter((item) => matchesFilter(item, filter)).length;
    };

    return Model;
}
