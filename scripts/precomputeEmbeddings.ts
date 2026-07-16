// scripts/precomputeEmbeddings.ts
// Run once at build time: npx tsx scripts/precomputeEmbeddings.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { pipeline } from "@xenova/transformers";

type Assessment = { "Assessment Name": string; Description: string; [k: string]: string };

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

async function main() {
  const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const assessments = await loadCSV();

  const embeddings: number[][] = [];
  const BATCH = 10;
  const texts = assessments.map((a) => `${a["Assessment Name"]}. ${a.Description}`);

  for (let i = 0; i < texts.length; i += BATCH) {
    const chunk = texts.slice(i, i + BATCH);
    const results = await Promise.all(
      chunk.map((t) => embedder(t, { pooling: "mean", normalize: true }))
    );
    for (const r of results) embeddings.push(Array.from(r.data));
    console.log(`Embedded ${Math.min(i + BATCH, texts.length)}/${texts.length}`);
  }

  const outPath = path.join(process.cwd(), "data", "embeddings.json");
  fs.writeFileSync(outPath, JSON.stringify({ assessments, embeddings }));
  console.log(`Saved ${embeddings.length} embeddings to ${outPath}`);
}

main();
