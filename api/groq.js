import { Groq } from "groq-sdk";



export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const { userInput, userBooks } = req.body;

  if (!userInput && (!userBooks || userBooks.length === 0)) {
    return res.status(400).json({ error: "User input is required." });
  }

  try {
    // ------ START PROMPT --------
    let fullPrompt = "";
    if (userBooks.length > 0) {
      fullPrompt += `Here are books I’ve enjoyed: ${userBooks.join(", ")}.\n`;
    }
    if (userInput) {
      fullPrompt += `Additional preferences: ${userInput}\n`;
    }
    fullPrompt += "Based on this, recommend 5 new books I haven't read yet. Format your response ONLY as a valid JSON object like this:\n";
    fullPrompt += `{
      "books": [
        { "title": "Book Title 1", "author": "Author Name 1", "description": "A brief description of the book." },
        { "title": "Book Title 2", "author": "Author Name 2", "description": "Another brief description." }
      ]
    }
    Return ONLY the JSON and nothing else.`;
    // ------ END PROMPT --------



    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192", 
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