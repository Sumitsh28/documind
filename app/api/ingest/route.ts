import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { supabaseAdmin } from "@/lib/supabase";
import PDFParser from "pdf2json";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const text = await new Promise<string>((resolve, reject) => {
      const pdfParser = new (PDFParser as any)(null, 1);

      pdfParser.on("pdfParser_dataError", (errData: any) =>
        reject(errData.parserError)
      );

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          if (!pdfData) {
            reject(new Error("PDF parser returned empty data."));
            return;
          }

          const root = pdfData.formImage || pdfData;

          if (!root || !root.Pages) {
            console.error(
              "Unexpected PDF JSON structure:",
              Object.keys(pdfData)
            );
            reject(
              new Error(
                "Could not find text pages in PDF. Is it an image scan?"
              )
            );
            return;
          }

          let extractedText = "";

          root.Pages.forEach((page: any, pageIndex: number) => {
            if (!page.Texts) return;

            page.Texts.forEach((textItem: any) => {
              if (!textItem.R) return;

              textItem.R.forEach((t: any) => {
                const str = decodeURIComponent(t.T);
                extractedText += str + " ";
              });
            });
            extractedText += "\n";
          });

          if (!extractedText.trim()) {
            reject(
              new Error(
                "PDF text is empty. The document might be a scanned image."
              )
            );
            return;
          }

          resolve(extractedText);
        } catch (err) {
          reject(err);
        }
      });

      pdfParser.parseBuffer(buffer);
    });

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1200,
      chunkOverlap: 200,
    });

    const output = await splitter.createDocuments([text]);

    const BATCH_SIZE = 10;
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    let processedChunks = 0;

    for (let i = 0; i < output.length; i += BATCH_SIZE) {
      const batch = output.slice(i, i + BATCH_SIZE);

      const batchVectors = await Promise.all(
        batch.map(async (chunk) => {
          const embedding = await embeddings.embedQuery(chunk.pageContent);
          return {
            content: chunk.pageContent,
            embedding,
            metadata: { filename: file.name },
          };
        })
      );

      const { error } = await supabaseAdmin
        .from("documents")
        .insert(batchVectors);

      if (error) {
        console.error("Supabase Batch Error:", error);
        throw error;
      }

      processedChunks += batchVectors.length;
    }

    return NextResponse.json({ success: true, chunks: processedChunks });
  } catch (error: any) {
    console.error("Ingestion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
