
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateTravelPlan } from "@/actions/trip/ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_CHAT_APIKEY);

const generationConfig = {
  temperature: 0.8,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 512
};

/**
 * POST /api/ai/gemini-chat
 *
 * Conversational travel planning assistant powered by Gemini.
 * - Progressively collects: destination, source, days, budget, currency, persons
 * - Gemini emits __FIELDS_JSON__{...}__READY_TO_GENERATE__ when all fields are known
 * - We parse that JSON directly (no regex on conversation) then call generateTravelPlan
 */

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function sendWithRetry(chat, msg, retries = 3) {
  try {
    return await chat.sendMessage(msg);
  } catch (err) {
    if (err.status === 429 && retries > 0) {
      console.log("Retrying due to rate limit...");
      await delay(2000);
      return sendWithRetry(chat, msg, retries - 1);
    }
    throw err;
  }
}


export async function POST(req) {
  try {
    const body = await req.json();
    const { messages = [], userPreferences = [] } = body;

    const apiKey = process.env.GOOGLE_GEMINI_CHAT_APIKEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
    }

    // ── System prompt ─────────────────────────────────────────────────────────
    const systemInstruction = `You are an expert AI Travel Assistant powered by Gemini.

User Preferences: ${JSON.stringify(userPreferences || [])}

Your job is to collect travel details through friendly conversation, then signal when you are ready.

REQUIRED FIELDS to collect:
1. destination  – Where they want to go (city, country) e.g. "Bali, Indonesia"
2. source       – Where they are travelling FROM (city, country) e.g. "Mumbai, India"
3. days         – Number of days as an integer e.g. 5
4. budget       – Total budget as a plain number e.g. 50000
5. currency     – Exactly one of: INR, USD, EUR, GBP, AUD, JPY
6. persons      – Number of travellers as an integer e.g. 2

OPTIONAL FIELDS (only ask if user brings them up):
interests, accommodation, transportation, dietaryRestrictions, specialRequests

PROTOCOL:
- Greet the user warmly on the first message.
- Ask for missing required fields naturally — do NOT dump a checklist at once.
- If the user's message implies a required field, extract it silently.
- When you have collected ALL 6 required fields, write a brief friendly confirmation
  summary to the user, then on a NEW LINE at the very END of your message ONLY,
  output EXACTLY this machine-readable block (single line, no spaces inside JSON):

__FIELDS_JSON__{"destination":"Bali, Indonesia","source":"Mumbai, India","days":5,"budget":50000,"currency":"INR","persons":2}__READY_TO_GENERATE__

  Rules for this block:
  - destination and source must be full place names as the user provided them
  - days and persons must be plain integers
  - budget must be a plain number (no symbols, no commas)
  - currency must be exactly one of: INR, USD, EUR, GBP, AUD, JPY
  - Do NOT add any text after __READY_TO_GENERATE__
  - Do NOT produce a travel plan or itinerary yourself — the system handles that

- If the user says "go ahead" / "yes" / "generate" but fields are still missing,
  ask for the remaining ones politely.
- Be conversational, friendly, and concise.`;

    // ── Build Gemini chat history ─────────────────────────────────────────────
    // Gemini requires history to start with role 'user'.
    // Exclude the last message (sent via sendMessage) and drop leading model turns.
    const rawHistory = messages.slice(-6, -1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content || "" }],
    }));

    const firstUserIdx = rawHistory.findIndex((m) => m.role === "user");
    const history = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig,
      systemInstruction,
    });

    const chat = model.startChat({ history });

    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const result = await sendWithRetry(chat, lastUserMsg);
    const rawReply =
      typeof result.response?.text === "function"
        ? await result.response.text()
        : result.response?.text || "";

    // ── Check if Gemini emitted the structured fields token ───────────────────
    const fieldsMatch = rawReply.match(/__FIELDS_JSON__(\{[\s\S]*?\})__READY_TO_GENERATE__/);

    if (fieldsMatch) {
      let collectedFields;
      try {
        collectedFields = JSON.parse(fieldsMatch[1]);
      } catch (parseErr) {
        console.error("Failed to parse __FIELDS_JSON__:", fieldsMatch[1], parseErr);
        return NextResponse.json({
          reply:
            "I have your details but there was a formatting issue. Could you confirm: destination, origin city, number of days, total budget, currency (INR/USD/etc.), and number of travellers?",
        });
      }

      const {
        destination = "",
        source = "",
        days = 5,
        budget = 50000,
        currency = "INR",
        persons = 1,
      } = collectedFields;

      const formData = {
        title: `${days}-Day Trip to ${destination}`,
        category: "City Break",
        description: "",
        destination,
        source,
        budget: parseFloat(budget) || 50000,
        currency: String(currency).toUpperCase(),
        days: parseInt(days) || 5,
        persons: parseInt(persons) || 1,
        startDate: new Date().toISOString().split("T")[0],
        interests: userPreferences || [],
        accommodation: "",
        transportation: "",
        activities: "",
        dietaryRestrictions: "",
        specialRequests: "",
      };

      try {
        const travelPlan = await generateTravelPlan(formData);

        // Remove the machine token from the visible message
        const confirmationText = rawReply
          .replace(/__FIELDS_JSON__[\s\S]*?__READY_TO_GENERATE__/, "")
          .trim();

        const finalReply =
          `${confirmationText}\n\n` +
          `✨ **Your personalised travel plan is ready!** Review it below and click **Save Trip** to add it to your trips.\n\n` +
          "```json\n" +
          JSON.stringify(travelPlan, null, 2) +
          "\n```";

        return NextResponse.json({ reply: finalReply });
      } catch (planErr) {
        console.error("generateTravelPlan error:", planErr);
        return NextResponse.json({
          reply:
            "I have all your details! Unfortunately I ran into an error generating the plan. Please try again in a moment. 🙏",
        });
      }
    }

    // ── Normal conversational reply ───────────────────────────────────────────
    return NextResponse.json({ reply: rawReply });
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
