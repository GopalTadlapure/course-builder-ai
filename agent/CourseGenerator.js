import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

export async function generateCourse(topic, skillLevel, duration) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set. Please add it to your backend/.env file.");
  }
  
  const openai = new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
  });

  const schema = `{
  "title": "",
  "description": "",
  "modules": [
    {
      "module_title": "",
      "module_overview": "",
      "youtube_video_id": "",
      "youtube_search_query": "",
      "lessons": [
        {
          "lesson_title": "",
          "objectives": [],
          "content_summary": "",
          "key_concepts": [],
          "real_world_example": "",
          "tools_used": []
        }
      ],
      "assignment": "",
      "assignment_hints": [],
      "quiz": [
        {
          "question": "",
          "options": [],
          "answer": "",
          "explanation": ""
        }
      ]
    }
  ]
}`;

  const prompt = `You are an expert curriculum designer and AI educator. Your task is to generate a comprehensive, richly-detailed course.

Create a highly structured course with the following parameters:
- Course Topic: ${topic}
- Skill Level: ${skillLevel}
- Duration: ${duration}

Requirements:
1. Logical progression from foundational to advanced concepts.
2. EXACTLY 3 modules, EXACTLY 3 lessons per module, EXACTLY 3 quiz questions per module.
3. For each MODULE provide:
   - module_overview: 2-3 sentences summarizing what learners will master.
   - youtube_video_id: a REAL, valid YouTube video ID (11 characters, e.g. "dQw4w9WgXcQ") for a highly relevant educational video on this module's topic. Research and provide an accurate ID.
   - youtube_search_query: a precise search string to find the best tutorial video.
4. For each LESSON provide:
   - content_summary: 2-3 sentences explaining the core concept in depth.
   - objectives: 3-4 specific, measurable learning outcomes.
   - key_concepts: 3-5 important terms or ideas with brief definitions (each as a string "term: definition").
   - real_world_example: A concrete, specific real-world scenario where this lesson applies.
   - tools_used: list of specific tools, frameworks, languages, or platforms used.
5. For each QUIZ QUESTION provide an explanation of why the answer is correct.
6. For each MODULE ASSIGNMENT provide assignment_hints: 3 practical hints to guide learners.

Respond ONLY with valid JSON strictly matching the following schema. Do not include markdown codeblocks or any backticks.
${schema}`;

  const response = await openai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 8000
  });

  try {
    const content = response.choices[0].message.content.trim();
    // In case the model still outputs markdown blocks, we strip them
    const jsonStr = content.replace(/^```json\n?/i, '').replace(/```$/i, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Failed to parse AI response", response.choices[0]?.message?.content);
    throw new Error("Invalid output format from AI");
  }
}
