"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { CURRENCY_OPTIONS, SYSTEM_HISTORY, thresholds } from "@/lib/constants";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_TEXT_APIKEY);

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};



/** Resolve currency symbol from shared CURRENCY_OPTIONS constant */
function getCurrencySymbol(currency) {
  return CURRENCY_OPTIONS.find((c) => c.value === currency)?.symbol ?? currency;
}

/** Determine budget category based on per-person spend and currency */
function resolveBudgetCategory(budgetPerPerson, currency) {

  const t = thresholds[currency] ?? thresholds.INR;
  if (budgetPerPerson > t.luxury) return "Luxury";
  if (budgetPerPerson > t.moderate) return "Moderate";
  return "Cheap";
}

/** Determine travel type from headcount */
function resolveTravelType(persons) {
  if (persons === 1) return "Solo";
  if (persons === 2) return "Couple";
  if (persons <= 4) return "Family";
  return "Friends";
}

/** Create a fresh chat session per request (stateless server action) */
function createChatSession() {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig,
  });
  return model.startChat({ history: SYSTEM_HISTORY });
}

export async function generateTravelPlan(formData) {
  const {
    title,
    category,
    description,
    destination,
    source,
    budget,
    currency = "INR",
    days,
    persons,
    startDate,
    interests,
    accommodation,
    transportation,
    activities,
    dietaryRestrictions,
    specialRequests,
  } = formData;

  const currencySymbol = getCurrencySymbol(currency);
  const budgetCategory = resolveBudgetCategory(budget / persons, currency);
  const travelType = resolveTravelType(persons);

  const prompt = `Generate a comprehensive travel plan with the following details:

**Trip Overview:**
- Title: ${title}
- Category: ${category}
- Description: ${description || "Not specified"}
- Starting From: ${source}
- Destination: ${destination}
- Duration: ${days} days
- Start Date: ${startDate}
- Number of Travelers: ${persons}
- Total Budget: ${currencySymbol}${budget} (${currency})
- Budget Category: ${budgetCategory}
- Travel Type: ${travelType}
- Currency: ${currency}

**Preferences:**
- Interests: ${interests?.length > 0 ? interests.join(", ") : "General sightseeing"}
- Accommodation Preferences: ${accommodation || "Standard hotels"}
- Transportation: ${transportation || "Local transport and taxis"}
- Specific Activities: ${activities || "Popular tourist attractions"}
- Dietary Restrictions: ${dietaryRestrictions || "None"}
- Special Requests: ${specialRequests || "None"}

**Requirements:**
1. Provide 3-5 hotel options matching the ${budgetCategory} budget category
2. ALL PRICES MUST BE IN ${currency} (${currencySymbol}). Use realistic local prices for ${destination}.
3. Create a detailed ${days}-day itinerary with 3-4 activities per day
4. Include activities aligned with: ${interests?.join(", ") || "general tourism"}
5. Consider dietary restrictions: ${dietaryRestrictions || "None"}
6. Factor in starting location (${source}) for transportation planning
7. Keep total estimated cost within ${currencySymbol}${budget} ${currency}
8. Include specific activities if mentioned: ${activities || "None"}
9. Consider special requests: ${specialRequests || "None"}
10. CRITICAL: All monetary values must be realistic amounts in ${currency}

Provide everything in the specified JSON format with geo-coordinates, ${currency} pricing, ratings, and travel times.`;

  try {
    const chatSession = createChatSession();
    const result = await chatSession.sendMessage(prompt);
    const response = result.response;

    const responseText =
      typeof response === "string"
        ? response
        : typeof response?.text === "function"
          ? await response.text()
          : JSON.stringify(response);

    const travelPlan = JSON.parse(responseText);

    return {
      ...travelPlan,
      currency,
      tripDetails: {
        title,
        category,
        description,
        source,
        startDate,
        interests,
        accommodation,
        transportation,
        activities,
        dietaryRestrictions,
        specialRequests,
      },
    };
  } catch (error) {
    console.error("Error generating travel plan:", error);
    throw new Error("Failed to generate travel plan. Please try again.");
  }
}