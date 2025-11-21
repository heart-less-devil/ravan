import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function checkKey() {
  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: "Only say 'pong'."
    });
    console.log("✅ Success:", response.output_text);
  } catch (err) {
    console.error("❌ Failed:", err.status || err.message, err.response?.data || err.stack);
  }
}

checkKey();
