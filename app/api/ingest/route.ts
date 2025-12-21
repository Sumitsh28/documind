import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { supabaseAdmin } from "@/lib/supabase";
import PDFParser from "pdf2json";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const text = await new Promise<string>((resolve, reject) => {
      const pdfParser = new (PDFParser as any)(null, 1);

      pdfParser.on("pdfParser_dataError", (errData: any) =>
        reject(errData.parserError)
      );

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        const rawText = (pdfParser as any).getRawTextContent();
        resolve(rawText);
      });

      pdfParser.parseBuffer(buffer);
    });

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const output = await splitter.createDocuments([text]);

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const vectors = await Promise.all(
      output.map(async (chunk) => {
        const embedding = await embeddings.embedQuery(chunk.pageContent);

        return {
          content: chunk.pageContent,
          embedding,
          metadata: { filename: file.name },
        };
      })
    );

    const { error } = await supabaseAdmin.from("documents").insert(vectors);

    if (error) throw error;

    return NextResponse.json({ success: true, chunks: vectors.length });
  } catch (error: any) {
    console.error("Ingestion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
