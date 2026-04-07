import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, ArrowRight, Save, Database, Plus } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CourseViewer from './components/CourseViewer';

function App() {
  const [view, setView] = useState('generate'); // 'generate' | 'saved'
  const [savedCourses, setSavedCourses] = useState([]);
  
  const [topic, setTopic] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [duration, setDuration] = useState('4 weeks');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const [error, setError] = useState('');
  const contentRef = useRef(null);

  useEffect(() => {
    if (view === 'saved') {
      fetchSavedCourses();
    }
  }, [view]);

  const fetchSavedCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/courses');
      if (!res.ok) throw new Error('Failed to fetch courses (Is MongoDB connected?)');
      const data = await res.json();
      setSavedCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCourseData(null);

    try {
      const response = await fetch('http://localhost:3001/api/generate-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, skillLevel, duration }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate course.');
      }

      const data = await response.json();
      setCourseData(data);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = async () => {
    if (!courseData) return;
    setSaveLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/save-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save course.');
      }
      alert('Course securely saved to database!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!contentRef.current) return;
    try {
      const canvas = await html2canvas(contentRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${courseData.title.replace(/\s+/g, '-').toLowerCase()}-course.pdf`);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Could not generate PDF.');
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1 className="gradient-text">Agentic Course Builder</h1>
        <p className="subtitle">Harness AI to instantly generate comprehensive, logically structured courses tailored precisely to your needs.</p>
        
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            className={`btn ${view === 'generate' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ width: 'auto', padding: '0.5rem 1rem' }}
            onClick={() => setView('generate')}
          >
            <Plus size={18} /> Generate New
          </button>
          <button 
            className={`btn ${view === 'saved' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ width: 'auto', padding: '0.5rem 1rem' }}
            onClick={() => setView('saved')}
          >
            <Database size={18} /> My Saved Courses
          </button>
        </div>
      </header>

      {error && (
        <div className="panel" style={{ color: '#ef4444', borderColor: '#ef4444', marginBottom: '1rem' }}>
          <strong>Error: </strong> {error}
        </div>
      )}

      {view === 'generate' && (
        <>
          <main className="panel">
            <form onSubmit={generateCourse}>
              <div className="form-group">
                <label htmlFor="topic">What do you want to learn?</label>
                <input 
                  type="text" 
                  id="topic" 
                  className="form-control" 
                  placeholder="e.g., AWS for Beginners, Advanced React, Machine Learning"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="skillLevel">Skill Level</label>
                  <select 
                    id="skillLevel" 
                    className="form-control"
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="duration">Estimated Duration</label>
                  <input 
                    type="text" 
                    id="duration" 
                    className="form-control" 
                    placeholder="e.g., 4 weeks, 10 hours"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading || !topic}>
                <Sparkles size={20} />
                {loading ? 'Thinking...' : 'Generate Course Plan'}
              </button>
            </form>
          </main>

          {loading && (
            <div className="loader-container">
              <div className="spinner"></div>
              <p className="pulse-text">Structuring curriculum... this takes 10-20 seconds.</p>
            </div>
          )}

          {courseData && !loading && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '1rem' }}>
                <button className="btn btn-secondary" onClick={saveCourse} disabled={saveLoading} style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.5)' }}>
                  <Save size={18} />
                  {saveLoading ? 'Saving...' : 'Save to DB'}
                </button>
                <button className="btn btn-secondary" onClick={downloadPDF}>
                  <Download size={18} />
                  Export to PDF
                </button>
              </div>
              <CourseViewer courseData={courseData} contentRef={contentRef} />
            </div>
          )}
        </>
      )}

      {view === 'saved' && (
        <div className="panel">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={24} color="var(--accent-color)" /> Database Repository
          </h2>
          {loading ? (
             <div className="loader-container">
               <div className="spinner"></div>
               <p className="pulse-text">Fetching your courses...</p>
             </div>
          ) : savedCourses.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No courses saved yet. Go generate one and save it to the database!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {savedCourses.map(course => (
                 <div key={course._id} style={{ padding: '1rem', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{course.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{course.description}</p>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                   </div>
                   <button 
                     className="btn btn-secondary" 
                     style={{ marginTop: '1rem', padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                     onClick={() => {
                        setCourseData(course);
                        setView('generate');
                     }}
                   >
                     View Course Plan
                   </button>
                 </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
