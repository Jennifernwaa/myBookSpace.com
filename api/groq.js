import { Groq } from "groq-sdk";

export default async function handler(req, res) {
  // Ensure only POST requests are processed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Initialize Groq SDK with the API key from environment variables
  // IMPORTANT: Ensure process.env.GROQ_API_KEY is set in your Vercel project settings
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Extract userInput from the request body
  const { userInput } = req.body;

  // Basic validation for userInput
  if (!userInput) {
    return res.status(400).json({ error: "User input is required." });
  }

  try {
    // Construct the full prompt for Groq
    const fullPrompt = `I like these books or genres: ${userInput}. Please recommend 5 books.
    Format your response ONLY as a valid JSON array like this:
    [
      { "title": "Book Title 1", "author": "Author Name 1", "description": "A brief description of the book." },
      { "title": "Book Title 2", "author": "Author Name 2", "description": "Another brief description." }
    ]
    Return ONLY the JSON and nothing else.`;

    // Make the call to the Groq API
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192", // Changed to a more commonly available and faster model for general use.
                               // You can switch back to "llama-3.3-70b-versatile" if you have access and prefer it.
      messages: [
        { role: "system", content: "You are a helpful book recommender. Your task is to provide book recommendations based on user preferences, formatted strictly as a JSON array." },
        { role: "user", content: fullPrompt },
      ],
      temperature: 0.7, // Slightly increased temperature for more creative recommendations
      max_tokens: 1500, // Reduced max_tokens, 2000 is often too high for 5 brief recommendations
      response_format: { type: "json_object" }, // Explicitly tell Groq to return a JSON object
    });

    // Send the Groq API response back to the frontend
    res.status(200).json(response);

  } catch (error) {
    console.error("Error communicating with Groq API:", error);
    // Provide a more generic error message to the client for security
    res.status(500).json({ error: "Internal server error during recommendation process." });
  }
}