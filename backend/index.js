require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.get("/", (req, res) => res.send("NutriSnap Backend is Live!"));

app.post("/api/chat", async (req, res) => {
    try {
        // 1. Get history from the frontend
        const { history } = req.body; 
        
        console.log(`📩 Received request with ${history.length} messages in history.`);

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: `You are NutriSnap AI, a specialized clinical nutritionist. 
                        ALWAYS format your responses using professional Markdown:
                        1. Use ### for section headers.
                        2. Use **bold** for important keywords, food names, or calorie counts.
                        3. Use bullet points for all lists or diet plans.
                        4. Keep paragraphs short and concise.
                        5. Only answer health and nutrition-related questions.`
                    },
                    // 2. Unpack the history array into the messages
                    ...history 
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const reply = response.data.choices[0].message.content;
        console.log("✅ Groq AI Replied with context!");
        res.json({ reply: reply });

    } catch (error) {
        console.error("❌ ERROR:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "AI is busy. Try again." });
    }
});

app.listen(5000, '0.0.0.0', () => {
    console.log("🚀 NutriSnap Stable Backend Live on Port 5000");
});