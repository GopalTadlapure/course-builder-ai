import { generateCourse } from "../agent/CourseGenerator.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { topic, skillLevel, duration } = req.body;
    if (!topic || !skillLevel || !duration) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const courseData = await generateCourse(topic, skillLevel, duration);
    return res.json(courseData);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to generate course" });
  }
}