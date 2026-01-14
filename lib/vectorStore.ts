//import { loadAssessments, Assessment } from "./loadAssessments";
import { embedText } from "./embeddings";

//let cached:
  //| {
      //assessment: Assessment;
      //embedding: number[];
    //}[]
  //| null = null;

//export async function getVectorStore() {
  //if (cached) return cached;

  //console.log("🔹 Loading SHL assessments...");
  //const assessments = await loadAssessments();

  //console.log("🔹 Generating embeddings (one-time)...");
  //cached = [];

  //for (const a of assessments) {
  //  const text = `${a["Assessment Name"]}. ${a.Description}`;
    //const embedding = await embedText(text);
    //cached.push({ assessment: a, embedding });
  //}

 // console.log("✅ Vector store ready");
  //return cached;
//}
