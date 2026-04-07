import React, { useState } from 'react';
import {
  BookOpen, CheckCircle, HelpCircle, Target, PlayCircle,
  Send, Award, XCircle, Lightbulb, Globe, Wrench, Info,
  Lock, ChevronDown, ChevronUp, Trophy, AlertTriangle, RotateCcw
} from 'lucide-react';

const PASS_THRESHOLD = 0.7; // 70%

const CourseViewer = ({ courseData, contentRef }) => {
  const [submittedAssignments, setSubmittedAssignments] = useState({});
  const [quizSelections, setQuizSelections]   = useState({});
  const [quizResults, setQuizResults]         = useState({}); // { [mIdx]: { score, total, passed } }
  const [unlockedModules, setUnlockedModules] = useState({ 0: true });
  const [expandedModules, setExpandedModules] = useState({ 0: true });

  if (!courseData || !courseData.modules) return null;

  /* ── helpers ── */
  const toggleExpand = (idx) => {
    if (!unlockedModules[idx]) return;
    setExpandedModules(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleOptionSelect = (mIdx, qIdx, opt) => {
    if (quizResults[mIdx]) return; // locked after grading
    setQuizSelections(prev => ({
      ...prev,
      [mIdx]: { ...(prev[mIdx] || {}), [qIdx]: opt }
    }));
  };

  const handleQuizSubmit = (mIdx, module) => {
    let score = 0;
    module.quiz.forEach((q, qIdx) => {
      if (quizSelections[mIdx]?.[qIdx] === q.answer) score++;
    });
    const total  = module.quiz.length;
    const passed = score / total >= PASS_THRESHOLD;
    setQuizResults(prev => ({ ...prev, [mIdx]: { score, total, passed } }));
    if (passed) {
      const next = mIdx + 1;
      if (next < courseData.modules.length) {
        setUnlockedModules(prev => ({ ...prev, [next]: true }));
        setExpandedModules(prev => ({ ...prev, [next]: true }));
        // Smooth scroll to next module after short delay
        setTimeout(() => {
          const el = document.getElementById(`module-${next}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 400);
      }
    }
  };

  const handleRetryQuiz = (mIdx) => {
    setQuizResults(prev => { const n = { ...prev }; delete n[mIdx]; return n; });
    setQuizSelections(prev => { const n = { ...prev }; delete n[mIdx]; return n; });
  };

  const handleAssignmentSubmit = (idx) =>
    setSubmittedAssignments(prev => ({ ...prev, [idx]: true }));

  const allPassed = courseData.modules.every((_, i) => quizResults[i]?.passed);

  /* ── render ── */
  return (
    <div className="course-viewer panel" ref={contentRef}>
      {/* Course Header */}
      <header className="course-header">
        <div>
          <h1 className="course-title">{courseData.title}</h1>
          <p className="course-description">{courseData.description}</p>
        </div>

        {/* Overall progress badges */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: '180px' }}>
          {courseData.modules.map((_, i) => {
            const r = quizResults[i];
            const locked = !unlockedModules[i];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.8rem', padding: '0.3rem 0.75rem',
                borderRadius: '50px',
                background: locked ? 'rgba(255,255,255,0.03)'
                  : r?.passed ? 'rgba(16,185,129,0.12)'
                  : r ? 'rgba(239,68,68,0.12)'
                  : 'rgba(99,102,241,0.1)',
                border: `1px solid ${locked ? 'rgba(255,255,255,0.08)' : r?.passed ? '#10b981' : r ? '#ef4444' : 'var(--accent-color)'}`,
                color: locked ? 'var(--text-secondary)' : r?.passed ? '#10b981' : r ? '#ef4444' : 'var(--accent-color)'
              }}>
                {locked ? <Lock size={12} /> : r?.passed ? <CheckCircle size={12} /> : r ? <XCircle size={12} /> : <BookOpen size={12} />}
                Module {i + 1} {locked ? 'Locked' : r?.passed ? 'Passed' : r ? 'Failed' : 'In Progress'}
              </div>
            );
          })}
        </div>
      </header>

      {/* Course Completion Banner */}
      {allPassed && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(99,102,241,0.15))',
          border: '1px solid rgba(16,185,129,0.35)', marginBottom: '1.5rem'
        }}>
          <Trophy size={32} color="#f59e0b" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f59e0b' }}>🎉 Course Complete!</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You passed all modules. Congratulations!</div>
          </div>
        </div>
      )}

      {/* Modules */}
      <div className="modules-container">
        {courseData.modules.map((module, mIdx) => {
          const locked    = !unlockedModules[mIdx];
          const expanded  = !!expandedModules[mIdx];
          const result    = quizResults[mIdx];
          const allAnswered = Object.keys(quizSelections[mIdx] || {}).length === module.quiz.length;

          return (
            <div
              key={mIdx}
              id={`module-${mIdx}`}
              className="module-card"
              style={{
                opacity: locked ? 0.45 : 1,
                pointerEvents: locked ? 'none' : 'auto',
                border: result?.passed ? '1px solid rgba(16,185,129,0.4)'
                  : result ? '1px solid rgba(239,68,68,0.3)'
                  : undefined,
                transition: 'all 0.35s ease'
              }}
            >
              {/* Module header row */}
              <div
                onClick={() => toggleExpand(mIdx)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: locked ? 'default' : 'pointer', marginBottom: expanded ? '1.5rem' : 0 }}
              >
                <h2 className="module-title" style={{ margin: 0, color: locked ? 'var(--text-secondary)' : result?.passed ? '#10b981' : 'var(--accent-color)' }}>
                  {locked ? <Lock size={22} /> : result?.passed ? <CheckCircle size={22} /> : <BookOpen size={22} />}
                  Module {mIdx + 1}: {module.module_title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {locked && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      Pass previous module to unlock
                    </span>
                  )}
                  {!locked && (expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
                </div>
              </div>

              {!expanded || locked ? null : (
                <>
                  {/* Module Overview */}
                  {module.module_overview && (
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem', padding: '1rem', background: 'rgba(99,102,241,0.07)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-color)' }}>
                      {module.module_overview}
                    </p>
                  )}

                  {/* YouTube Link Button */}
                  {(module.youtube_video_id || module.youtube_search_query) && (
                    <div style={{ marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#ff4b4b', fontWeight: 600, fontSize: '0.95rem' }}>
                        <PlayCircle size={18} /> Visual Learning — YouTube
                      </div>
                      <a
                        href={
                          module.youtube_video_id
                            ? `https://www.youtube.com/watch?v=${module.youtube_video_id}`
                            : `https://www.youtube.com/results?search_query=${encodeURIComponent(module.youtube_search_query)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                          padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)',
                          background: 'rgba(255,75,75,0.12)', border: '1px solid rgba(255,75,75,0.35)',
                          color: '#ff4b4b', fontWeight: 600, fontSize: '0.9rem',
                          textDecoration: 'none', transition: 'all 0.2s ease'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,75,75,0.22)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,75,75,0.12)'}
                      >
                        <PlayCircle size={16} />
                        {module.youtube_video_id ? 'Watch Video on YouTube' : 'Search Tutorial on YouTube'}
                        <span style={{ marginLeft: '0.25rem', opacity: 0.7 }}>↗</span>
                      </a>

                      {module.youtube_search_query && (
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(module.youtube_search_query)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.82rem', textDecoration: 'none' }}
                        >
                          <Globe size={12} /> More results →
                        </a>
                      )}
                    </div>
                  )}

                  {/* Lessons */}
                  <div className="lesson-list">
                    {module.lessons.map((lesson, lIdx) => (
                      <div key={lIdx} className="lesson-item">
                        <h3 className="lesson-title">{lesson.lesson_title}</h3>
                        <p className="lesson-content">{lesson.content_summary}</p>

                        <div className="objectives">
                          <strong style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Target size={13} /> Learning Objectives:
                          </strong>
                          <ul className="objectives-list">
                            {lesson.objectives?.map((obj, oIdx) => <li key={oIdx}>{obj}</li>)}
                          </ul>
                        </div>

                        {lesson.key_concepts?.length > 0 && (
                          <div style={{ marginTop: '0.85rem' }}>
                            <strong style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem' }}>
                              <Lightbulb size={13} /> Key Concepts:
                            </strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {lesson.key_concepts.map((concept, cIdx) => {
                                const [term, ...def] = concept.split(':');
                                return (
                                  <div key={cIdx} title={def.join(':').trim()} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                    <strong>{term.trim()}</strong>
                                    {def.length > 0 && <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>→ {def.join(':').trim()}</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {lesson.real_world_example && (
                          <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.65rem', padding: '0.75rem', background: 'rgba(16,185,129,0.07)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #10b981' }}>
                            <Globe size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong style={{ color: '#10b981', fontSize: '0.82rem' }}>Real-World Example</strong>
                              <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{lesson.real_world_example}</p>
                            </div>
                          </div>
                        )}

                        {lesson.tools_used?.length > 0 && (
                          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <Wrench size={13} style={{ color: 'var(--text-secondary)' }} />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Tools:</span>
                            {lesson.tools_used.map((tool, tIdx) => (
                              <span key={tIdx} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', borderRadius: '4px', padding: '0.12rem 0.45rem', fontSize: '0.78rem' }}>{tool}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Assignment */}
                  <div className="assignment-section">
                    <h3 className="section-title"><CheckCircle size={18} /> Interactive Assignment</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>{module.assignment}</p>

                    {module.assignment_hints?.length > 0 && (
                      <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.07)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #f59e0b' }}>
                        <strong style={{ color: '#f59e0b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.4rem' }}><Info size={13} /> Hints:</strong>
                        <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>
                          {module.assignment_hints.map((h, hIdx) => <li key={hIdx}>{h}</li>)}
                        </ol>
                      </div>
                    )}

                    <textarea
                      placeholder="Write your assignment solution here..."
                      disabled={submittedAssignments[mIdx]}
                      className={`assignment-textarea ${submittedAssignments[mIdx] ? 'submitted' : ''}`}
                      rows={4}
                    />
                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className={`btn ${submittedAssignments[mIdx] ? 'btn-success' : 'btn-primary'}`}
                        style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem', width: 'auto' }}
                        onClick={() => handleAssignmentSubmit(mIdx)}
                        disabled={submittedAssignments[mIdx]}
                      >
                        {submittedAssignments[mIdx] ? <><CheckCircle size={15} /> Submitted</> : <><Send size={15} /> Submit Assignment</>}
                      </button>
                    </div>
                  </div>

                  {/* ── QUIZ ── */}
                  <div className="quiz-section" style={{ marginTop: '1.5rem', borderColor: result?.passed ? 'rgba(16,185,129,0.3)' : result ? 'rgba(239,68,68,0.3)' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 className="section-title" style={{ marginBottom: 0 }}>
                        <HelpCircle size={18} /> Knowledge Check
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '50px' }}>
                          Pass mark: 70%
                        </span>
                      </h3>
                    </div>

                    {/* Questions */}
                    <div className="quiz-list">
                      {module.quiz.map((q, qIdx) => {
                        const submitted = !!result;
                        return (
                          <div key={qIdx} className="quiz-question">
                            <p className="question-text">{qIdx + 1}. {q.question}</p>
                            <ul className="options-list">
                              {q.options.map((opt, optIdx) => {
                                const isSelected = quizSelections[mIdx]?.[qIdx] === opt;
                                const isCorrect  = q.answer === opt;
                                let cls = 'option-item interactive-option';
                                if (submitted) {
                                  if (isCorrect)              cls += ' correct-answer';
                                  else if (isSelected)        cls += ' wrong-answer';
                                  else                        cls += ' disabled-option';
                                } else {
                                  if (isSelected)             cls += ' selected-answer';
                                }
                                return (
                                  <li key={optIdx} className={cls} onClick={() => handleOptionSelect(mIdx, qIdx, opt)}
                                    style={{ cursor: submitted ? 'default' : 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span>{opt}</span>
                                      {submitted && isSelected && !isCorrect && <XCircle size={16} color="var(--error-color, #ef4444)" />}
                                      {submitted && isCorrect && <CheckCircle size={16} color="var(--success-color)" />}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                            {result && q.explanation && (
                              <div style={{ marginTop: '0.5rem', padding: '0.55rem 0.85rem', background: 'rgba(99,102,241,0.07)', borderRadius: '6px', fontSize: '0.83rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent-color)' }}>
                                <strong style={{ color: 'var(--accent-color)' }}>Explanation: </strong>{q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Grade button */}
                    {!result && (
                      <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-primary"
                          style={{ width: 'auto', padding: '0.65rem 1.4rem', fontSize: '0.95rem' }}
                          onClick={() => handleQuizSubmit(mIdx, module)}
                          disabled={!allAnswered}
                          title={allAnswered ? 'Submit quiz' : 'Answer all questions first'}
                        >
                          <Award size={16} /> Submit Quiz
                        </button>
                      </div>
                    )}

                    {/* Result card */}
                    {result && (
                      <div style={{
                        marginTop: '1.5rem', padding: '1.25rem 1.5rem',
                        borderRadius: 'var(--radius-md)', textAlign: 'center',
                        background: result.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${result.passed ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.35)'}`
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                          {result.passed ? '🎉' : '😔'}
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: result.passed ? '#10b981' : '#ef4444', marginBottom: '0.25rem' }}>
                          {result.passed ? 'PASSED' : 'FAILED'}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                          You scored <strong style={{ color: 'var(--text-primary)' }}>{result.score}/{result.total}</strong> &nbsp;({Math.round((result.score / result.total) * 100)}%)
                          &nbsp;—&nbsp; Pass mark is 70%
                        </div>

                        {/* Score bar */}
                        <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '1rem' }}>
                          <div style={{
                            height: '100%', borderRadius: '4px',
                            width: `${(result.score / result.total) * 100}%`,
                            background: result.passed ? '#10b981' : '#ef4444',
                            transition: 'width 0.6s ease'
                          }} />
                        </div>

                        {result.passed ? (
                          mIdx < courseData.modules.length - 1 ? (
                            <p style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 500 }}>
                              ✅ Module {mIdx + 2} is now unlocked! Scroll down to continue.
                            </p>
                          ) : (
                            <p style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: 600 }}>
                              🏆 You've completed the entire course!
                            </p>
                          )
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ width: 'auto', padding: '0.55rem 1.25rem', fontSize: '0.88rem', display: 'inline-flex' }}
                            onClick={() => handleRetryQuiz(mIdx)}
                          >
                            <RotateCcw size={15} /> Retry Quiz
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseViewer;
