import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import PdfParse from "pdf-parse";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Google Gemini API Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const storage = multer.diskStorage({
  destination: "Uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// ✅ Resume Analysis Rout
app.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    const jobUrl = req.body.jobUrl;
    console.log(req.body);
    if (!jobUrl) return res.status(400).json({ error: "Job URL is required" });

    const resumePath = req.file?.path;
    if (!resumePath || !fs.existsSync(resumePath)) {
      return res.status(400).json({ error: "Resume file not found" });
    }


    const pdffile = fs.readFileSync(req.file.path);
  

    async function parsePdf(pdffile) {
        try {
            const data = await PdfParse(pdffile);
            return data.text;
        } catch (error) {
            console.error("Error parsing PDF:", error);
        }
    }
    
   
    const data  = await parsePdf(pdffile);

    console.log(data);


    // ✅ Fetch job description dynamically (replace this with real job scraping logic)
    const jobDescription = `Extracted job description from: ${jobUrl}`;

    // ✅ Gemini API Request
    const chatSession = model.startChat({ generationConfig, history: [] });

    const prompt =  `Analyze the suitability of the following resume:\n\n${data}\n\nagainst this job description:\n\n${jobDescription}\n\nProvide a suitability score (0-100%) and key improvements in a clear, structured format using bullet points. Separate strengths, weaknesses, and suggestions into distinct sections.`;

    console.log("this is the prompt",prompt);

    const result = await chatSession.sendMessage(prompt);

    // ✅ Extract AI Response Correctly
    const aiResponse =
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response received";

    // ✅ Parse Response for Score & Suggestions
    const scoreMatch = aiResponse.match(/(\d{1,3})%/);
    const score = scoreMatch ? scoreMatch[1] : "Unknown";
    const suggestions = aiResponse.replace(/.*%/, "").trim();

    // ✅ Delete file after processing
    fs.unlink(resumePath, (err) => {
      if (err) console.error("Failed to delete file:", err);
    });

    res.json({ score, suggestions });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Start Server
app.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
);
