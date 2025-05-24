"use server"

import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

export async function generateAIInsights(symptomData: any[], medicationData: any[], symptomTypes: string[]) {
  try {
    // Generate the prompt for the AI
    const prompt = `
      You are a medical AI assistant specializing in inflammatory conditions. 
      Analyze the following patient data and provide 5 personalized insights about their condition.
      
      SYMPTOM DATA (last 30 entries):
      ${JSON.stringify(symptomData, null, 2)}
      
      MEDICATION DATA:
      ${JSON.stringify(medicationData, null, 2)}
      
      TRACKED SYMPTOM TYPES:
      ${JSON.stringify(symptomTypes, null, 2)}
      
      Provide 5 specific, actionable insights based on this data. Each insight should:
      1. Identify a pattern, correlation, or observation
      2. Explain why it matters for inflammatory conditions
      3. Suggest a specific action the patient could take
      
      For each insight, also provide a confidence score from 1-100 indicating how confident you are in this insight based on the available data.
      
      Format your response as a JSON array with objects containing "insight" and "confidence" properties.
      Example: [{"insight": "Your symptoms tend to worsen on days with high humidity...", "confidence": 85}, {...}]
      
      Be specific, evidence-based, and compassionate.
      Do not include generic advice that isn't based on the patient's specific data.
      Focus on correlations between symptoms, medications, weather, and timing.
    `

    // Initialize Groq with API key
    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    })

    // Call Groq API
    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      system:
        "You are a medical AI assistant specializing in inflammatory conditions. Provide evidence-based insights for patients tracking their symptoms.",
    })

    return { success: true, data: text }
  } catch (error) {
    console.error("Error generating AI insights:", error)
    return { success: false, error: "Failed to generate insights. Please try again later." }
  }
}

export async function generatePatternVisualizations(
  symptomData: any[],
  medicationData: any[],
  symptomTypes: string[],
  timeRange: number,
) {
  try {
    // Generate the prompt for the AI
    const prompt = `
        You are an AI specializing in medical data analysis and visualization. Analyze the following patient symptom data and generate visualizations that reveal patterns over time.
        
        SYMPTOM DATA (last ${timeRange} months):
        ${JSON.stringify(symptomData, null, 2)}
        
        MEDICATION DATA:
        ${JSON.stringify(medicationData, null, 2)}
        
        TRACKED SYMPTOM TYPES:
        ${JSON.stringify(symptomTypes, null, 2)}
        
        Generate 4 different visualizations that reveal different patterns in the data:
        1. Weekly patterns (day of week correlations)
        2. Monthly/seasonal patterns
        3. Weather correlation patterns
        4. Medication impact patterns
        
        For each visualization, provide:
        1. A title
        2. A brief description of what the visualization shows
        3. The chart type that would best display this pattern (choose from: line, bar, scatter, radar, composed)
        4. The processed data for the visualization in JSON format
        5. 2-3 key insights revealed by this pattern
        6. A confidence score (0-100) indicating how strong this pattern is in the data
        
        Format your response as a valid JSON array with objects for each visualization. Example:
        [
          {
            "type": "weekly",
            "title": "Weekly Symptom Pattern",
            "description": "Shows how symptoms vary by day of the week",
            "chartType": "bar",
            "data": [{"day": "Monday", "severity": 2.1, ...}, ...],
            "insights": ["Symptoms tend to be worse on Mondays", "Weekends show lower severity scores"],
            "confidence": 75
          },
          ...
        ]
        
        IMPORTANT: Your response MUST be a valid JSON array that can be parsed with JSON.parse(). Do not include any text before or after the JSON array.
        
        Focus on finding real patterns in the data. If a pattern is weak or not present, assign a lower confidence score.
        Ensure the data is properly formatted for direct use in charts.
      `

    // Initialize Groq with API key
    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    })

    // Call Groq API
    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      system:
        "You are a medical data analysis AI specializing in finding patterns in symptom data. You always return valid JSON that can be parsed directly. Never include explanatory text outside the JSON structure.",
    })

    return { success: true, data: text }
  } catch (error) {
    console.error("Error generating pattern visualizations:", error)
    return { success: false, error: "Failed to generate visualizations. Please try again later." }
  }
}
