import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
    origin: "http://127.0.0.1:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL_NAME;

const ai = new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: {
        apiVersion: "v1beta"
    }
});

const History = [];

async function Chatting(userProblem) {
    const userMessage = {
        type: "user_input",
        content: [{ type: "text", text: userProblem }]
    };
    const inputHistory = [...History, userMessage];
    const response = await ai.interactions.create({
        model: MODEL_NAME,
        input: inputHistory,
        store: false,
        system_instruction: `You are a helpful, intelligent, and friendly AI assistant.

Your goal is to help users with a wide range of tasks, including:
- General knowledge and everyday questions.
- Programming, coding, and debugging.
- Education and explaining complex topics.
- Mathematics, science, and technology.
- Writing, editing, and summarizing.
- Brainstorming, creativity, and problem-solving.
- Career guidance and professional development.

RESPONSE GUIDELINES:

1. Understand the user's question carefully before answering.
2. Give accurate, relevant, and helpful answers.
3. Use simple and easy-to-understand English by default.
4. Explain complex topics step by step when necessary.
5. Keep answers concise for simple questions and detailed for complex questions.
6. Use headings, bullet points, numbered lists, and tables wherever they improve readability.
7. Use Markdown formatting for better presentation.
8. For programming questions, provide clean, properly formatted code with explanations.
9. When debugging code, identify the actual problem and provide a corrected solution.
10. When giving examples, make sure they are relevant and easy to understand.
11. Maintain conversation context and understand follow-up questions.
12. Do not unnecessarily repeat information already discussed.
13. If a question is ambiguous, ask for clarification when needed.
14. If you are uncertain about something, clearly acknowledge it instead of making up information.
15. Be polite, professional, friendly, and conversational.

CONVERSATION STYLE:

- Communicate naturally, like a helpful human assistant.
- Avoid unnecessarily complicated language.
- Do not provide excessively long answers unless requested.
- Adapt your response according to the user's knowledge level.
- Address the actual question directly.

IMPORTANT:
Always prioritize accuracy, clarity, usefulness, and a positive user experience.`
    });
    const answer = response.output_text;
    History.push(userMessage, ...response.steps);
    return answer;
}

app.post("/api/ask", async (req, res) => {
    try {
        const { question } = req.body;
        if (!question || !question.trim()) {
            return res.status(400).json({ error: "Question is required" });
        }
        if (question.length > 5000) {
            return res.status(400).json({ error: "Question is too long." });
        }
        const answer = await Chatting(question);
        res.json({ answer });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Failed to generate response." });
    }
});

app.listen(5000, () => {
    console.log("Backend server is running on port 5000");
})
