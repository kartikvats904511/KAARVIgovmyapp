require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto");

let MongoClient = null;
try { ({ MongoClient } = require("mongodb")); } catch (_) {}

let GoogleGenAI = null;
try {
  ({ GoogleGenAI } = require("@google/genai"));
} catch (_) {}

const app = express();
const mongoUri = process.env.MONGODB_URI || "";
const mongoDbName = process.env.MONGODB_DB || "kaarvi";
let mongoClient = null;
let mongoDbPromise = null;

async function getDb() {
  if (!mongoUri || !MongoClient) return null;
  if (!mongoDbPromise) {
    mongoDbPromise = (async () => {
      mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 8000 });
      await mongoClient.connect();
      const db = mongoClient.db(mongoDbName);
      await db.collection("users").createIndex({ email: 1 }, { unique: true });
      await db.collection("orders").createIndex({ createdAt: -1 });
      await db.collection("reviews").createIndex({ createdAt: -1 });
      return db;
    })().catch(error => {
      console.error("MONGODB CONNECTION ERROR:", error?.message || error);
      mongoDbPromise = null;
      mongoClient = null;
      return null;
    });
  }
  return mongoDbPromise;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const actual = crypto.scryptSync(String(password), salt, 64).toString("hex");
  const a = Buffer.from(actual, "hex");
  const b = Buffer.from(expectedHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Live site opens on the Login + Artisan/Buyer role screen first, not the homepage.
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "login.html")));

app.use(express.static(__dirname, { extensions: ["html"] }));

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey && GoogleGenAI ? new GoogleGenAI({ apiKey }) : null;

const languageNames = {
  English: "English", Hindi: "Hindi", Bengali: "Bengali",
  Tamil: "Tamil", Telugu: "Telugu", Marathi: "Marathi"
};

const replies = {
  English: {
    welcome: "Hi! I’m Kaarvi Assistant. I can help with artisan listings, buyers, pricing, languages, orders and the image enhancer.",
    pricing: "Kaarvi’s Dynamic Pricing demo uses material cost, making cost, demand, uniqueness, season and quantity to calculate a suggested selling range. It is a prototype algorithm, not live market pricing.",
    artisan: "Open Artisan Hub to create a product listing, generate multilingual catalogue copy, use the image workflow and try Dynamic Pricing.",
    buyer: "Open Buyers Hub to search Indian crafts, filter categories, add products to the cart and submit a prototype order request.",
    language: "Kaarvi supports English, Hindi, Bengali, Tamil, Telugu and Marathi. Change the language selector in the header; Help can also reply in the selected language.",
    login: "The Login button opens a prototype account flow. The demo stores the session in your browser only; it is not production authentication.",
    order: "Add a product to the cart in Buyers Hub, open View Cart, enter delivery details and submit the prototype order request.",
    default: "I can help with Kaarvi’s Artisan Hub, Buyers Hub, Dynamic Pricing, multilingual catalogue, image enhancer, cart and login. Try asking: “How does dynamic pricing work?”"
  },
  Hindi: {
    welcome: "नमस्ते! मैं Kaarvi Assistant हूँ। मैं आर्टिजन लिस्टिंग, खरीदार, कीमत, भाषा, ऑर्डर और इमेज एन्हांसर में मदद कर सकता हूँ।",
    pricing: "Kaarvi का Dynamic Pricing डेमो material cost, making cost, demand, uniqueness, season और quantity के आधार पर सुझाई गई selling range निकालता है। यह prototype algorithm है, live market price नहीं।",
    artisan: "Artisan Hub खोलकर product listing बनाएं, multilingual catalogue copy तैयार करें, image workflow इस्तेमाल करें और Dynamic Pricing आज़माएं।",
    buyer: "Buyers Hub में Indian crafts खोजें, category filter करें, cart में products जोड़ें और prototype order request भेजें।",
    language: "Kaarvi English, Hindi, Bengali, Tamil, Telugu और Marathi को support करता है। Header का language selector बदलें; Help चुनी हुई भाषा में जवाब दे सकता है।",
    login: "Login button prototype account flow खोलता है। Demo session केवल आपके browser में store होता है; यह production authentication नहीं है।",
    order: "Buyers Hub में product cart में जोड़ें, View Cart खोलें, delivery details भरें और prototype order request submit करें।",
    default: "मैं Kaarvi के Artisan Hub, Buyers Hub, Dynamic Pricing, multilingual catalogue, image enhancer, cart और login में मदद कर सकता हूँ।"
  },
  Bengali: {
    welcome: "নমস্কার! আমি Kaarvi Assistant। artisan listing, buyer, pricing, language, order এবং image enhancer সম্পর্কে সাহায্য করতে পারি।",
    pricing: "Kaarvi Dynamic Pricing demo material cost, making cost, demand, uniqueness, season এবং quantity ব্যবহার করে একটি suggested selling range তৈরি করে। এটি prototype algorithm, live market price নয়।",
    artisan: "Artisan Hub খুলে product listing তৈরি করুন, multilingual catalogue copy বানান, image workflow ব্যবহার করুন এবং Dynamic Pricing চেষ্টা করুন।",
    buyer: "Buyers Hub-এ Indian crafts খুঁজুন, category filter করুন, cart-এ product যোগ করুন এবং prototype order request পাঠান।",
    language: "Kaarvi English, Hindi, Bengali, Tamil, Telugu এবং Marathi support করে। Header-এর language selector বদলান।",
    login: "Login button একটি prototype account flow খোলে। Demo session শুধু আপনার browser-এ থাকে; এটি production authentication নয়।",
    order: "Buyers Hub-এ product cart-এ যোগ করুন, View Cart খুলুন, delivery details দিন এবং prototype order request submit করুন।",
    default: "আমি Kaarvi-এর Artisan Hub, Buyers Hub, Dynamic Pricing, catalogue, image enhancer, cart এবং login নিয়ে সাহায্য করতে পারি।"
  },
  Tamil: {
    welcome: "வணக்கம்! நான் Kaarvi Assistant. artisan listing, buyers, pricing, language, orders மற்றும் image enhancer குறித்து உதவ முடியும்.",
    pricing: "Kaarvi Dynamic Pricing demo, material cost, making cost, demand, uniqueness, season மற்றும் quantity அடிப்படையில் suggested selling range கணக்கிடுகிறது. இது prototype algorithm; live market price அல்ல.",
    artisan: "Artisan Hub-ஐ திறந்து product listing உருவாக்கவும், multilingual catalogue copy உருவாக்கவும், image workflow மற்றும் Dynamic Pricing-ஐ பயன்படுத்தவும்.",
    buyer: "Buyers Hub-ல் Indian crafts தேடவும், category filter செய்யவும், cart-ல் products சேர்க்கவும் மற்றும் prototype order request அனுப்பவும்.",
    language: "Kaarvi English, Hindi, Bengali, Tamil, Telugu மற்றும் Marathi-ஐ ஆதரிக்கிறது. Header language selector-ஐ மாற்றவும்.",
    login: "Login button prototype account flow-ஐ திறக்கும். Demo session உங்கள் browser-ல் மட்டுமே சேமிக்கப்படும்.",
    order: "Buyers Hub-ல் product-ஐ cart-ல் சேர்த்து, View Cart திறந்து delivery details நிரப்பி prototype order request submit செய்யவும்.",
    default: "Kaarvi Artisan Hub, Buyers Hub, Dynamic Pricing, catalogue, image enhancer, cart மற்றும் login குறித்து நான் உதவ முடியும்."
  },
  Telugu: {
    welcome: "నమస్తే! నేను Kaarvi Assistant. artisan listings, buyers, pricing, languages, orders మరియు image enhancer గురించి సహాయం చేయగలను.",
    pricing: "Kaarvi Dynamic Pricing demo material cost, making cost, demand, uniqueness, season మరియు quantity ఆధారంగా suggested selling range లెక్కిస్తుంది. ఇది prototype algorithm; live market price కాదు.",
    artisan: "Artisan Hub తెరిచి product listing తయారు చేయండి, multilingual catalogue copy రూపొందించండి, image workflow మరియు Dynamic Pricing ప్రయత్నించండి.",
    buyer: "Buyers Hubలో Indian crafts వెతకండి, categories filter చేయండి, cartలో products జోడించి prototype order request పంపండి.",
    language: "Kaarvi English, Hindi, Bengali, Tamil, Telugu మరియు Marathiని support చేస్తుంది. Headerలో language selector మార్చండి.",
    login: "Login button prototype account flowని తెరుస్తుంది. Demo session browserలో మాత్రమే store అవుతుంది.",
    order: "Buyers Hubలో productను cartలో add చేసి View Cart తెరిచి delivery details నింపి prototype order request submit చేయండి.",
    default: "Kaarvi Artisan Hub, Buyers Hub, Dynamic Pricing, catalogue, image enhancer, cart మరియు login గురించి నేను సహాయం చేయగలను."
  },
  Marathi: {
    welcome: "नमस्कार! मी Kaarvi Assistant आहे. artisan listing, buyers, pricing, language, orders आणि image enhancer मध्ये मदत करू शकतो.",
    pricing: "Kaarvi Dynamic Pricing demo material cost, making cost, demand, uniqueness, season आणि quantity यांच्या आधारावर suggested selling range तयार करतो. हा prototype algorithm आहे; live market price नाही.",
    artisan: "Artisan Hub उघडून product listing तयार करा, multilingual catalogue copy तयार करा, image workflow आणि Dynamic Pricing वापरा.",
    buyer: "Buyers Hub मध्ये Indian crafts शोधा, categories filter करा, cart मध्ये products जोडा आणि prototype order request पाठवा.",
    language: "Kaarvi English, Hindi, Bengali, Tamil, Telugu आणि Marathi support करतो. Header मधील language selector बदला.",
    login: "Login button prototype account flow उघडतो. Demo session फक्त browser मध्ये store होतो.",
    order: "Buyers Hub मध्ये product cart मध्ये add करा, View Cart उघडा, delivery details भरा आणि prototype order request submit करा.",
    default: "मी Kaarvi Artisan Hub, Buyers Hub, Dynamic Pricing, catalogue, image enhancer, cart आणि login बद्दल मदत करू शकतो."
  }
};

function demoReply(message, language = "English") {
  const L = languageNames[language] ? language : "English";
  const r = replies[L];
  const q = String(message).toLowerCase();
  if (/price|pricing|कीमत|दाम|মূল্য|விலை|ధర|किंमत/.test(q)) return r.pricing;
  if (/artisan|catalog|catalogue|लिस्ट|कारीगर|শিল্প|கைவினை|కళాకార|कारागीर/.test(q)) return r.artisan;
  if (/buyer|buy|product|craft|खरीद|उत्पाद|পণ্য|வாங்க|కొన|खरेदी/.test(q)) return r.buyer;
  if (/language|भाष|ভাষা|மொழி|భాష/.test(q)) return r.language;
  if (/login|sign in|account|लॉग|লগইন/.test(q)) return r.login;
  if (/order|cart|ऑर्डर|आदेश|অর্ডার|ஆர்டர்|ఆర్డర్/.test(q)) return r.order;
  if (/hi|hello|namaste|नमस्ते|नमस्कार|হ্যালো|வணக்கம்|నమస్తే/.test(q)) return r.welcome;
  return r.default;
}

app.get("/api/health", async (_req, res) => {
  const db = await getDb();
  res.json({
    ok: true,
    chatbotConfigured: Boolean(ai),
    mongodbConfigured: Boolean(mongoUri && MongoClient),
    mongodbConnected: Boolean(db),
    message: "KAARVI server is running"
  });
});

// ---------- MongoDB-backed account ----------
app.post("/api/auth/login", async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    const cleanName = String(name || "").trim().slice(0, 120);
    const cleanEmail = String(email || "").trim().toLowerCase().slice(0, 200);
    const cleanPassword = String(password || "");
    const cleanRole = role === "artisan" || role === "buyer" ? role : null;
    if (!cleanName || !/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanPassword.length < 4 || !cleanRole) {
      return res.status(400).json({ error: "Please provide a valid name, email, password and role." });
    }

    const db = await getDb();
    if (!db) return res.status(503).json({ error: "MongoDB is not connected. Add MONGODB_URI in the environment to enable database accounts." });

    const users = db.collection("users");
    const existing = await users.findOne({ email: cleanEmail });
    let user;
    if (!existing) {
      const { salt, hash } = hashPassword(cleanPassword);
      const doc = { name: cleanName, email: cleanEmail, role: cleanRole, passwordHash: hash, passwordSalt: salt, createdAt: new Date(), updatedAt: new Date() };
      const result = await users.insertOne(doc);
      user = { ...doc, _id: result.insertedId };
    } else {
      if (!verifyPassword(cleanPassword, existing.passwordSalt, existing.passwordHash)) {
        return res.status(401).json({ error: "Incorrect email or password." });
      }
      await users.updateOne({ _id: existing._id }, { $set: { name: cleanName, role: cleanRole, updatedAt: new Date() } });
      user = { ...existing, name: cleanName, role: cleanRole };
    }
    res.json({ ok: true, mode: "mongodb", user: publicUser(user) });
  } catch (error) {
    console.error("AUTH ERROR:", error?.message || error);
    res.status(500).json({ error: "Could not complete account login." });
  }
});

// ---------- MongoDB-backed orders ----------
app.post("/api/orders", async (req, res) => {
  try {
    const { user, items, shipping, paymentMethod } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Your cart is empty." });
    if (!shipping || !shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.pin) {
      return res.status(400).json({ error: "Please complete all delivery details." });
    }
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "MongoDB is not connected. Add MONGODB_URI in the environment to save orders." });
    const safeItems = items.slice(0, 50).map(item => ({
      id: String(item.id || "").slice(0, 100), name: String(item.name || "").slice(0, 200),
      price: Number(item.price) || 0, qty: Math.max(1, Math.min(99, Number(item.qty) || 1))
    }));
    const total = safeItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const doc = {
      userId: user?.id ? String(user.id) : null,
      buyerEmail: user?.email ? String(user.email).slice(0, 200) : null,
      items: safeItems, total,
      shipping: { name: String(shipping.name).slice(0, 120), phone: String(shipping.phone).slice(0, 30), address: String(shipping.address).slice(0, 500), city: String(shipping.city).slice(0, 120), pin: String(shipping.pin).slice(0, 12) },
      paymentMethod: paymentMethod === "online" ? "online" : "cod",
      status: "request", createdAt: new Date()
    };
    const result = await db.collection("orders").insertOne(doc);
    res.json({ ok: true, mode: "mongodb", orderId: String(result.insertedId), total });
  } catch (error) {
    console.error("ORDER ERROR:", error?.message || error);
    res.status(500).json({ error: "Could not save the order request." });
  }
});

// ---------- MongoDB-backed reviews ----------
app.post("/api/reviews", async (req, res) => {
  try {
    const { user, product, rating, review } = req.body || {};
    const cleanReview = String(review || "").trim().slice(0, 2000);
    const cleanRating = Number(rating);
    if (!product || !cleanReview || cleanRating < 1 || cleanRating > 5) return res.status(400).json({ error: "Please provide a product, rating and review." });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "MongoDB is not connected. Add MONGODB_URI in the environment to save reviews." });
    const doc = {
      userId: user?.id ? String(user.id) : null, buyerEmail: user?.email ? String(user.email).slice(0, 200) : null,
      product: String(product).slice(0, 200), rating: cleanRating, review: cleanReview, createdAt: new Date()
    };
    const result = await db.collection("reviews").insertOne(doc);
    res.json({ ok: true, mode: "mongodb", reviewId: String(result.insertedId) });
  } catch (error) {
    console.error("REVIEW ERROR:", error?.message || error);
    res.status(500).json({ error: "Could not save the review." });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, language = "English" } = req.body || {};
    if (!message || typeof message !== "string" || message.length > 2000) {
      return res.status(400).json({ error: "Please enter a message (up to 2000 characters)." });
    }
    if (!ai) return res.json({ reply: demoReply(message, language), mode: "demo" });

    const safeLanguage = languageNames[language] ? language : "English";
    const prompt = [
      "You are Kaarvi Assistant, a helpful assistant for an Indian artisan marketplace prototype.",
      `Reply only in ${safeLanguage}.`,
      "Be concise, friendly and practical.",
      "Kaarvi is an SIH prototype, not a live Government of India service.",
      "Do not invent government schemes, prices, stock or order confirmations.",
      `User message: ${message}`
    ].join("\n");

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    const reply = result?.text?.trim() || demoReply(message, safeLanguage);
    res.json({ reply, mode: "gemini" });
  } catch (error) {
    console.error("CHATBOT ERROR:", error?.message || error);
    res.json({ reply: demoReply(req.body?.message || "", req.body?.language || "English"), mode: "demo-fallback" });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  if (req.path.includes(".")) return res.sendFile(path.join(__dirname, req.path));
  res.sendFile(path.join(__dirname, "index.html"));
});

module.exports = app;
