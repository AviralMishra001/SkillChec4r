// app/api/recommend/route.ts
import { NextResponse } from "next/server";
import { searchAssessments,getInitStatus } from "@/lib/assessmentStore";
import OpenAI from "openai";

/* -------------------- OpenRouter Client -------------------- */
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000", // change after deploy
    "X-Title": "SHL Assessment Engine",
  },
});

/* -------------------- Helpers -------------------- */
function isURL(text: string) {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

async function fetchPageText(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SHLAssessmentBot/1.0; +https://yourdomain.com)",
    },
  });

  const html = await res.text();

  // Strip HTML safely
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 8000); // limit tokens
}

async function extractJDFromPage(pageText: string) {
  const completion = await client.chat.completions.create({
    model: "meta-llama/llama-3.1-8b-instruct",
    messages: [
      {
        role: "system",
        content:
          "Extract ONLY the job description text from the following webpage content.",
      },
      {
        role: "user",
        content: pageText,
      },
    ],
    temperature: 0,
  });

  return completion.choices[0].message.content || "";
}

/* -------------------- API Handler -------------------- */
export async function POST(req: Request) {
  try {
    let { jobDescription } = await req.json();

    if (!jobDescription) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }
    const wasInitialized = getInitStatus().initialized;


    /* ---- If input is URL, extract JD ---- */
    if (isURL(jobDescription)) {
      const pageText = await fetchPageText(jobDescription);
      jobDescription = await extractJDFromPage(pageText);
    }

    /* ---- Step 1: Vector search (fast, full dataset) ---- */
    const candidates = await searchAssessments(jobDescription, 15);

    /* ---- Step 2: LLM reranking (max 7) ---- */
    const prompt = `
You are an expert SHL assessment recommender.

Given a job description and a list of assessments,
select the MOST relevant ones.

Rules:
- Return AT MOST 7 assessments
- Return ONLY a JSON array of indexes (example: [1,3,5])
- Do NOT explain anything

Job Description:
${jobDescription}

Assessments:
${candidates
  .map(
    (a, i) =>
      `${i + 1}. ${a["Assessment Name"]}: ${a.Description}`
  )
  .join("\n")}
`;

    const completion = await client.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    /* ---- Parse indexes safely ---- */
    const content = completion.choices[0].message.content || "";
    const indexes = [...content.matchAll(/\d+/g)]
      .map((m) => Number(m[0]) - 1)
      .filter((i) => i >= 0 && i < candidates.length)
      .slice(0, 7);

    const finalResults =
      indexes.length > 0
        ? indexes.map((i) => candidates[i])
        : candidates.slice(0, 7);

    return NextResponse.json({ recommendations: finalResults, wasFirstLoad: !wasInitialized });
  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { 
        error: "Internal error",
        message: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
