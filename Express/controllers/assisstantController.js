const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini client with the secure environment API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

exports.chatWithAssistant = async (req, res) => {
  try {
    const { message, chatHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message query is required' });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: "You are Antigravity, a friendly MERN Travel Guide assistant. Answer queries regarding Indian tourist places, entry fees, optimal travel periods, weather, and route planning. Keep your answers brief, engaging, and structured. Do not use any markdown formatting except bullet points, bold text, and clickable link structures."
    });

    // Format chat history for Google Gemini SDK specifications
    const formattedHistory = (chatHistory || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Start Chat session and send message
    const chat = model.startChat({
      history: formattedHistory
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({ reply: responseText });
  } catch (error) {
    console.error("Gemini Assistant Controller Error:", error);
    res.status(500).json({ error: "Failed to communicate with AI Assistant. Please check backend environment configurations." });
  }
};
