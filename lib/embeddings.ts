//import fetch from "node-fetch";

//const GROQ_API_KEY = process.env.GROQ_API_KEY!;
//const EMBED_MODEL = "text-embedding-3-small";

//export async function embedText(text: string): Promise<number[]> {
//  const res = await fetch("https://api.groq.com/openai/v1/embeddings", {
  //  method: "POST",
    //headers: {
      //Authorization: `Bearer ${GROQ_API_KEY}`,
      //"Content-Type": "application/json",
    //},
    //body: JSON.stringify({
      //model: EMBED_MODEL,
      //input: text,
   // }),
  //});

  //const json = await res.json();
  //return json.data[0].embedding;
//}