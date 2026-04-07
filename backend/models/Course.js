import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  modules: [{
    module_title: { type: String, required: true },
    youtube_search_query: { type: String },
    lessons: [{
      lesson_title: { type: String, required: true },
      objectives: [{ type: String }],
      content_summary: { type: String }
    }],
    assignment: { type: String },
    quiz: [{
      question: { type: String, required: true },
      options: [{ type: String }],
      answer: { type: String }
    }]
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Course', courseSchema);
