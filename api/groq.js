import { Groq } from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const { userInput } = req.body;

  if (!userInput) {
    return res.status(400).json({ error: "User input is required." });
  }

  try {
    // --- IMPORTANT CHANGE HERE ---
    const fullPrompt = `I like these books or genres: ${userInput}. Please recommend 5 books.
    Format your response ONLY as a valid JSON object like this:
    {
      "books": [
        { "title": "Book Title 1", "author": "Author Name 1", "description": "A brief description of the book." },
        { "title": "Book Title 2", "author": "Author Name 2", "description": "Another brief description." }
      ]
    }
    Return ONLY the JSON and nothing else.`;
    // --- END OF IMPORTANT CHANGE ---

    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192", // Still a good choice, or llama3-70b-8192 if you prefer
      messages: [
        { role: "system", content: "You are a helpful book recommender. Your task is to provide book recommendations based on user preferences, formatted strictly as a JSON object containing an array of books under the 'books' key." },
        { role: "user", content: fullPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }, // This is now consistent with the prompt!
    });

    res.status(200).json(response);

  } catch (error) {
    console.error("Error communicating with Groq API:", error);
    res.status(500).json({ error: "Internal server error during recommendation process." });
  }
}