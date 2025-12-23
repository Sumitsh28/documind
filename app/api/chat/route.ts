import { OpenAI } from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { supabaseAdmin } from "@/lib/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";

export async function POST(req: Request) {
  try {
    const { messages, filename } = await req.json();
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || lastMessage.role !== "user") {
      return new Response("Invalid request", { status: 400 });
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
    });

    const queryEmbedding = await embeddings.embedQuery(lastMessage.content);

    const { data: searchResults } = await supabaseAdmin.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 5,
      filter: { filename: filename },
    });

    const hasContext = searchResults && searchResults.length > 0;

    const contextBlock = hasContext
      ? searchResults
          .map(
            (doc: any) => `Source: ${doc.metadata?.filename}\n${doc.content}`
          )
          .join("\n\n")
      : "";

    const systemPrompt = `
You are DocuMind, an expert AI assistant.
You have two modes:
1. **Chat Mode:** If the user greets you (hi, hello) or asks general questions, be polite and helpful.
2. **Analysis Mode:** If the user asks about the document, use the CONTEXT below.

RULES:
- If the answer is in the CONTEXT, cite the source filename.
- If the user asks a specific document question but the CONTEXT is empty, say: "I couldn't find that in the document."
- Do not make up facts about the document.

<context>
${contextBlock}
</context>
    `.trim();

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    });

    const stream = OpenAIStream(response as any);
    return new StreamingTextResponse(stream);
  } catch (err) {
    console.error("Chat error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
