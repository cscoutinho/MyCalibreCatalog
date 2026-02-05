import { GoogleGenAI } from "@google/genai";
import { Book } from "../types";

// NOTE: In a real production app, you would proxy these requests through a backend
// to avoid exposing API keys. For this client-side demo, we rely on the environment variable.

let ai: GoogleGenAI | null = null;

const initializeAI = () => {
    if (!ai) {
        // Fallback for demo purposes if process.env.API_KEY is missing, 
        // normally we would strictly require it.
        const apiKey = process.env.API_KEY || ''; 
        if (apiKey) {
            ai = new GoogleGenAI({ apiKey });
        }
    }
    return ai;
};

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export const generateLibrarianResponse = async (
    query: string, 
    contextBooks: Book[],
    history: ChatMessage[]
): Promise<string> => {
    const client = initializeAI();
    if (!client) {
        return "I'm sorry, I cannot connect to the brain (API Key missing). Please check your configuration.";
    }

    try {
        // We can't send 42k books. We'll send a very small sample or just metadata about the library structure.
        // For this demo, we'll send a random selection of 20 books to give "flavor" to the answer,
        // or rely on general knowledge if the query is general.
        
        // Pick 20 random books for context
        const sampleSize = Math.min(contextBooks.length, 20);
        const shuffled = [...contextBooks].sort(() => 0.5 - Math.random());
        const sample = shuffled.slice(0, sampleSize).map(b => `${b.title} by ${b.authors} (Tags: ${b.tags.join(', ')})`).join('\n');

        const systemPrompt = `
        You are a sophisticated and helpful Librarian AI for a private Calibre digital library.
        The user has ${contextBooks.length} books in their collection.
        
        Here is a random sample of what is in the library to give you an idea of the user's taste:
        ${sample}
        
        Your goal is to help the user find books, suggest reading ideas based on their collection, or answer general literary questions.
        If the user asks for a specific book, explain that you can only see the sample, but you can suggest how to search for it.
        
        Keep answers concise, witty, and elegant.
        `;

        const model = 'gemini-3-flash-preview';
        
        // Construct history for context
        // Note: Actual chat history management with the SDK works via chats.create
        // but for a single turn stateless functional approach (simplified here), we'll append to prompt or use chat.
        
        const chat = client.chats.create({
            model,
            config: {
                systemInstruction: systemPrompt,
            }
        });

        // Replay history (simplified)
        for (const msg of history) {
            if (msg.role === 'user') {
                await chat.sendMessage({ message: msg.text });
            }
            // Model responses are implicitly tracked by the chat object session usually, 
            // but for a robust restore we'd need to send history properly. 
            // For this lightweight demo, we just send the new message.
        }

        const result = await chat.sendMessage({ message: query });
        return result.text || "I pondered your question but found no words.";

    } catch (error) {
        console.error("Gemini Error:", error);
        return "I seem to be having trouble accessing the archives right now. Please try again later.";
    }
};

export const suggestSearchFilters = async (query: string): Promise<any> => {
     // This would be a more advanced feature:
     // User: "Show me sci-fi from the 80s"
     // Gemini -> JSON { tag: "sci-fi", year_start: 1980, year_end: 1989 }
     // Not fully implemented in UI but this is where it would go.
     return {};
}
