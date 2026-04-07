import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { generateCourse } from "../agent/CourseGenerator.js";
import Course from "./models/Course.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB if MONGODB_URI is provided
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));
} else {
  console.warn("MONGODB_URI not set. Saving courses to the database will not work.");
}

app.post("/api/generate-course", async (req, res) => {
  try {
    const { topic, skillLevel, duration } = req.body;
    
    if (!topic || !skillLevel || !duration) {
      return res.status(400).json({ error: "Missing required fields: topic, skillLevel, duration" });
    }

    const courseData = await generateCourse(topic, skillLevel, duration);
    return res.json(courseData);
  } catch (error) {
    console.error("Error generating course:", error);
    return res.status(500).json({ error: error.message || error.stack || "Failed to generate course" });
  }
});

// Save a generated course
app.post("/api/save-course", async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.status(503).json({ error: "Database not connected. Please add MONGODB_URI to backend/.env and restart server." });
    }
    
    const courseData = req.body;
    const newCourse = new Course(courseData);
    await newCourse.save();
    
    res.status(201).json({ success: true, message: "Course saved successfully!", courseId: newCourse._id });
  } catch (error) {
    console.error("Error saving course:", error);
    res.status(500).json({ error: "Failed to save course to database." });
  }
});

// Fetch all saved courses
app.get("/api/courses", async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.status(503).json({ error: "Database not connected." });
    }
    
    // Sort by newest first
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses from database." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
