const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * @desc    Get AI Chatbot response
 * @route   POST /api/chat
 * @access  Private
 */
exports.getChatResponse = async (req, res, next) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.' 
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Provide context for the AI
    const prompt = `You are the AI Study Buddy for an application called SmartTable AI.
Your goal is to help a student with study tips, scheduling advice, and quick quizzes.
Keep your answers brief, encouraging, and formatted nicely (using emojis where appropriate).
The student asked: "${message}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({
      success: true,
      text: text
    });
  } catch (error) {
    next(error);
  }
};
