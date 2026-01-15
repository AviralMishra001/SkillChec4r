import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { pipeline } from "@xenova/transformers";

export type Assessment = {
  "Assessment Name": string;
  "Test Type": string;
  "Duration": string;
  "Remote Testing": string;
  "Adaptive/IRT": string;
  "Description": string;
  "URL": string;
};

let assessments: Assessment[] = [];
let embeddings: number[][] = [];
let embedder: any = null;
let initialized = false;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function loadCSV(): Promise<Assessment[]> {
  const results: Assessment[] = [];
  const filePath = path.join(process.cwd(), "data", "shl.csv");

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

export function getInitStatus() {
  return { 
    initialized,
    assessmentCount: assessments.length 
  };
}

export async function initAssessmentStore() {
  if (initialized) return;

  console.log("🔹 Loading embedding model...");
  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  console.log("🔹 Reading CSV...");
  assessments = await loadCSV();
  console.log(`🔹 Loaded ${assessments.length} assessments`);

  console.log("🔹 Generating embeddings (one-time)...");
  embeddings = [];

  for (const item of assessments) {
    const text = `${item["Assessment Name"]}. ${item.Description}`;
    const output = await embedder(text, { pooling: "mean", normalize: true });
    embeddings.push(Array.from(output.data));
  }

  initialized = true;
  console.log("✅ Assessment store ready");
}

export async function searchAssessments(query: string, topK = 15) {
  if (!initialized) await initAssessmentStore();

  const qEmbeddingOutput = await embedder(query, {
    pooling: "mean",
    normalize: true,
  });

  const qEmbedding: number[] = Array.from(qEmbeddingOutput.data) as number[];

  const scored = embeddings.map((vec, idx) => ({
    score: cosineSimilarity(qEmbedding, vec),
    item: assessments[idx],
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((x) => x.item);
}
