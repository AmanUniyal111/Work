import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import { api, tokenStore } from "./services/api";

function ModuleCard({ title, subtitle, children }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, hint, onClick }) {
  const inner = (
    <>
      <p>{label}</p>
      <h2>{value}</h2>
      <small>{hint}</small>
    </>
  );
  if (onClick) {
    return (
      <button type="button" className="stat-card stat-card--clickable" onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <div className="stat-card">{inner}</div>;
}

function QuestionModal({ question, user, onClose, onGoToQA, onAnswer }) {
  const [answerText, setAnswerText] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!question) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, onClose]);

  useEffect(() => {
    setAnswerText("");
  }, [question?._id]);

  if (!question) return null;

  const canAnswer = Boolean(user && ["mentor", "admin"].includes(user.role));


  const handleAnswerSubmit = async (e) => {
    e.preventDefault();

    if (!answerText.trim()) return;

    try {
      await onAnswer(question._id, answerText.trim());

      setMessage("Answer has been posted ");
      setAnswerText("");
    } catch (error) {
      setMessage("Failed to post answer ");
    }

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const answerCount = Array.isArray(question.answers) ? question.answers.length : 0;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-panel card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3 id="question-modal-title">{question.title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="modal-meta">Q&amp;A is anonymous — names are not shown.</p>
        <div className="modal-body">{question.body}</div>
        <div className="modal-answers">
          <h4>Answers ({answerCount})</h4>
          {answerCount === 0 ? (
            <p className="modal-empty-answers">No answers yet — be the first to help.</p>
          ) : (
            <ul>
              {question.answers.map((a, idx) => (
                <li key={idx}>
                  <p>{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        {message && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: message.toLowerCase().includes("fail")
                ? "#ff4d4f"
                : "#4caf50",
              color: "#fff",
              padding: "12px 18px",
              borderRadius: "8px",
              fontWeight: "bold",
              zIndex: 1000
            }}
          >
            {message}
          </div>
        )}
        {canAnswer ? (
          <form className="answer-form" onSubmit={handleAnswerSubmit}>
            <label htmlFor="answer-body">
              Write a reply (shown without your name)
            </label>

            <textarea
              id="answer-body"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Share a clear, helpful response..."
              rows={4}
              required
            />

            <button type="submit">Post answer</button>
          </form>
        ) : (
          <p style={{ color: "red", fontWeight: "bold" }}>
            Only mentors can reply to questions
          </p>
        )}
        {onGoToQA ? (
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onGoToQA}>
              Open Q&amp;A tab
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionBanner({ eyebrow, title, description }) {
  return (
    <div className="section-banner">
      <p>{eyebrow}</p>
      <h3>{title}</h3>
      <small>{description}</small>
    </div>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [user, setUser] = useState(null);
  const [data, setData] = useState({
    questions: [],
    teams: [],
    events: [],
    notifications: []
  });

  const [joinedTeams, setJoinedTeams] = useState(new Set());
  const [teams, setTeams] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const selectedQuestion = useMemo(() => {
    if (!selectedQuestionId) return null;
    return data.questions.find((q) => q._id === selectedQuestionId) ?? null;
  }, [data.questions, selectedQuestionId]);
  const [forms, setForms] = useState({
    questionTitle: "",
    questionBody: "",
    teamName: "",
    teamDescription: "",
    teamSkills: "",
    eventTitle: "",
    eventCategory: "Workshop",
    eventDescription: "",
    eventDate: "",
    eventSeats: 50
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [questions, teams, events, notifications] = await Promise.all([
        api("/qa"),
        api("/squad/teams"),
        api("/events"),
        api("/notifications")
      ]);

      setData({ questions, teams, events, notifications });

      if (user?._id) {
        const joined = new Set();

        teams.forEach((team) => {
          if (
            Array.isArray(team.members) &&
            team.members.some((m) => {
              const memberId = typeof m === "object" ? m._id : m;
              //  Safely grab the ID whether it is labeled 'id' or '_id'
              const currentUserId = user?.id || user?._id;
              return memberId?.toString() === currentUserId?.toString();
            })
          ) {
            joined.add(team._id);
          }
        });

        setJoinedTeams(joined);
      }

    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const setField = (name, value) => {
    setForms((prev) => ({ ...prev, [name]: value }));
  };

  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2200);
  };

  const submitQuestion = async (event) => {
    event.preventDefault();
    try {
      await api("/qa", {
        method: "POST",
        body: JSON.stringify({
          title: forms.questionTitle,
          body: forms.questionBody,
          isAnonymous: true
        })
      });
      setField("questionTitle", "");
      setField("questionBody", "");
      flash("Question posted");
      loadAll();
    } catch (error) {
      flash(error.message);
    }
  };

  const createTeam = async (event) => {
    event.preventDefault();
    try {
      await api("/squad/teams", {
        method: "POST",
        body: JSON.stringify({
          name: forms.teamName,
          description: forms.teamDescription,
          requiredSkills: forms.teamSkills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        })
      });
      setField("teamName", "");
      setField("teamDescription", "");
      setField("teamSkills", "");
      flash("Team created");


      await loadAll();
    } catch (error) {
      flash(error.message);
    }
  };
  const joinTeam = async (teamId) => {
    try {
      const team = data.teams.find((t) => t._id === teamId);

      if (!team) {
        flash("Team not found");
        return;
      }

      const alreadyJoined = (team.members || []).some((m) => {
        if (!m) return false;
        const memberId = typeof m === "object" ? m._id : m;
        const currentUserId = user?.id || user?._id;
        return memberId?.toString() === currentUserId?.toString();
      });

      if (alreadyJoined) {
        flash("You have already joined this team");
        return;
      }

      await api(`/squad/teams/${teamId}/join`, { method: "POST" });
      flash("Joined team");
      await loadAll();

    } catch (error) {
      flash(error.message || "Something went wrong");
    }
  };
  const createEvent = async (event) => {
    event.preventDefault();
    try {
      await api("/events", {
        method: "POST",
        body: JSON.stringify({
          title: forms.eventTitle,
          category: forms.eventCategory,
          description: forms.eventDescription,
          date: new Date(forms.eventDate).toISOString(),
          totalSeats: Number(forms.eventSeats)
        })
      });
      setField("eventTitle", "");
      setField("eventDescription", "");
      setField("eventDate", "");
      setField("eventSeats", 50);
      flash("Event created");
      loadAll();
    } catch (error) {
      flash(error.message);
    }
  };

  const registerEvent = async (eventId) => {
    try {
      const event = data.events.find((e) => e._id === eventId);

      if (!event) {
        flash("Event not found");
        return;
      }

      const currentUserId = user?.id || user?._id;
      const isOwner = event.createdBy?.toString() === currentUserId?.toString();
      const isExpired = event.date
        ? new Date().getTime() > new Date(event.date).getTime()
        : false;

      if (isOwner) {
        flash("You cannot register for your own event");
        return;
      }

      if (isExpired) {
        flash("Registration closed");
        return;
      }

      const res = await api(`/events/${eventId}/register`, {
        method: "POST",
      });

      flash(res.message || "Registered for event");
      loadAll();
    } catch (error) {
      flash(error.message || "Something went wrong");
    }
  };

  const markRead = async (id) => {
    try {
      await api(`/notifications/${id}/read`, { method: "PATCH" });
      loadAll();
    } catch (error) {
      flash(error.message);
    }
  };

  const filteredQuestions = data.questions.filter((q) => {
    if (!query.trim()) return true;
    const searchable = `${q.title} ${q.body}`.toLowerCase();
    return searchable.includes(query.toLowerCase());
  });

  useEffect(() => {
    if (!tokenStore.get()) return;
    api("/auth/me")
      .then((me) => {
        setUser(me);
      })
      .catch(() => tokenStore.clear());
  }, []);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  const onLogin = (payload) => {
    tokenStore.set(payload.token);
    setJoinedTeams(new Set());
    setUser(payload.user);
    setActive("Dashboard");
  };

  const onLogout = () => {
    tokenStore.clear();
    setJoinedTeams(new Set());
    setUser(null);
  };

  const scrollToDashboardQuestions = () => {
    document.getElementById("dashboard-questions")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAnswer = async (questionId, body) => {
    try {
      await api(`/qa/${questionId}/answer`, {
        method: "POST",
        body: JSON.stringify({ body })
      });
      flash("Answer posted");
      await loadAll();
    } catch (error) {
      flash(error.message);
    }
  };
  console.log("Full User Object:", user);
  if (!user) return <LoginPage onLogin={onLogin} />;

  return (

    <div className="page">
      <Navbar active={active} setActive={setActive} user={user} onLogout={onLogout} />
      {notice && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            maxWidth: "90%",
            background: notice.toLowerCase().includes("fail")
              ? "#ff4d4f"
              : "#4caf50",
            color: "#fff",
            padding: "20px 28px",
            borderRadius: "12px",
            fontWeight: "600",
            fontSize: "18px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            zIndex: 9999,
            textAlign: "center"
          }}
        >
          {notice}
        </div>
      )}
      <div className="container">
        {loading && <p className="loading">Loading modules...</p>}
        {active === "Dashboard" && (
          <>
            <div className="hero card">
              <h2>Welcome back, {user.name}</h2>
              <p>
                CampusSync now has interactive sections for asking questions, building squads, creating
                events, and tracking notifications.
              </p>
              <div className="hero-actions">
                <button onClick={loadAll}>Refresh Data</button>
              </div>
            </div>
            <div className="quick-grid">
              <div className="quick-card">
                <p>Today's focus</p>
                <h4>Build your campus network</h4>
                <small>Ask one question, join one squad, register one event.</small>
              </div>
              <div className="quick-card">
                <p>Active role</p>
                <h4>{user.role || "Student"}</h4>
                <small>Use modules on the top navigation to stay productive.</small>
              </div>
              <div className="quick-card">
                <p>Momentum</p>
                <h4>{data.questions.length + data.events.length + data.teams.length} activities</h4>
                <small>Combined total across questions, teams, and events.</small>
              </div>
            </div>
            <div className="stats-grid">
              <StatCard
                label="Questions"
                value={data.questions.length}
                hint="Tap to jump to recent questions"
                onClick={scrollToDashboardQuestions}
              />
              <StatCard label="Teams" value={data.teams.length} hint="Project squads active" />
              <StatCard label="Events" value={data.events.length} hint="Campus programs listed" />
              <StatCard
                label="Unread Alerts"
                value={data.notifications.filter((n) => !n.read).length}
                hint="Personal updates"
              />
            </div>
            <div id="dashboard-questions" className="card dashboard-questions">
              <div className="card-head">
                <h3>Recent questions</h3>
                <p>Click any row to read the full question and answers</p>
              </div>
              {data.questions.length === 0 ? (
                <EmptyState
                  icon="💬"
                  title="No questions yet"
                  description="Post from the Q&A tab — they will show up here."
                />
              ) : (
                <div className="dashboard-q-list">
                  {data.questions.slice(0, 8).map((q) => (
                    <button
                      key={q._id}
                      type="button"
                      className="dashboard-q-row"
                      onClick={() => setSelectedQuestionId(q._id)}
                    >
                      <span className="dashboard-q-title">{q.title}</span>
                      <span className="pill">{q.answers?.length || 0} answers</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {active === "Q&A" && (
          <div className="split">
            <ModuleCard title="Ask a Question" subtitle="Your name is never shown to others">
              <SectionBanner
                eyebrow="Q&A"
                title="Start a helpful discussion"
                description="Questions appear without your username. Be clear so others can help."
              />
              <form className="stack" onSubmit={submitQuestion}>
                <input
                  placeholder="Question title"
                  value={forms.questionTitle}
                  onChange={(e) => setField("questionTitle", e.target.value)}
                  required
                />
                <textarea
                  placeholder="Describe your question"
                  value={forms.questionBody}
                  onChange={(e) => setField("questionBody", e.target.value)}
                  required
                />
                <button type="submit">Post Question</button>
              </form>
            </ModuleCard>
            <ModuleCard title="Browse Questions" subtitle="Search by keyword">
              <SectionBanner
                eyebrow="Discover"
                title="Find similar questions quickly"
                description="Use search to avoid duplicate posts and learn faster."
              />
              <input
                placeholder="Search questions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="list">
                {filteredQuestions.length === 0 ? (
                  <EmptyState
                    icon="💬"
                    title="No questions found"
                    description="Try a different search or post the first question for your batch."
                  />
                ) : (
                  filteredQuestions.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      className="list-item list-item--clickable"
                      onClick={() => setSelectedQuestionId(item._id)}
                    >
                      <div className="list-item-text">
                        <h4>{item.title}</h4>
                        <p>{item.body}</p>
                      </div>
                      <span className="pill">{item.answers?.length || 0} answers</span>
                    </button>
                  ))
                )}
              </div>
            </ModuleCard>
          </div>
        )}
        {active === "Squad Finder" && (
          <div className="split">
            <ModuleCard title="Create Team" subtitle="Define skills required">
              <SectionBanner
                eyebrow="Squad Finder"
                title="Create a project squad"
                description="Mention goals and skills to attract the right teammates."
              />
              <form className="stack" onSubmit={createTeam}>
                <input
                  placeholder="Team name"
                  value={forms.teamName}
                  onChange={(e) => setField("teamName", e.target.value)}
                  required
                />
                <textarea
                  placeholder="Team description"
                  value={forms.teamDescription}
                  onChange={(e) => setField("teamDescription", e.target.value)}
                  required
                />
                <input
                  placeholder="Required skills (comma separated)"
                  value={forms.teamSkills}
                  onChange={(e) => setField("teamSkills", e.target.value)}
                />
                <button type="submit">Create Team</button>
              </form>
            </ModuleCard>
            <ModuleCard title="Available Teams" subtitle="Join squads quickly">
              <SectionBanner
                eyebrow="Collaborate"
                title="Join and contribute"
                description="Pick squads where your skills can create impact."
              />
              <div className="list">
                {data.teams.length === 0 ? (
                  <EmptyState
                    icon="🤝"
                    title="No teams yet"
                    description="Create your first team and invite classmates to join."
                  />
                ) : (
                  data.teams.map((team) => {
                    console.log("TEAM MEMBERS:", team.members);
                    console.log("USER:", user._id);
                    const isMember = joinedTeams.has(team._id);

                    return (
                      <div key={team._id} className="list-item">
                        <div>
                          <h4>{team.name}</h4>
                          <p>{team.description}</p>
                        </div>

                        <button
                          onClick={() => joinTeam(team._id)}
                          style={isMember ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                        >
                          {isMember ? "Already Joined" : "Join"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </ModuleCard>
          </div>
        )}
        {active === "Events" && (
          <div className="split">
            <ModuleCard title="Create Event" subtitle="Mentor/Admin can publish">
              <SectionBanner
                eyebrow="Events"
                title="Host a useful session"
                description="Workshops and hackathons keep your campus community active."
              />
              <form className="stack" onSubmit={createEvent}>
                <input
                  placeholder="Event title"
                  value={forms.eventTitle}
                  onChange={(e) => setField("eventTitle", e.target.value)}
                  required
                />
                <select
                  value={forms.eventCategory}
                  onChange={(e) => setField("eventCategory", e.target.value)}
                >
                  <option>Workshop</option>
                  <option>Seminar</option>
                  <option>Hackathon</option>
                  <option>Competition</option>
                </select>
                <textarea
                  placeholder="Event description"
                  value={forms.eventDescription}
                  onChange={(e) => setField("eventDescription", e.target.value)}
                  required
                />
                <input
                  type="datetime-local"
                  value={forms.eventDate}
                  onChange={(e) => setField("eventDate", e.target.value)}
                  required
                />
                <input
                  type="number"
                  min="1"
                  value={forms.eventSeats}
                  onChange={(e) => setField("eventSeats", e.target.value)}
                />
                <button type="submit">Create Event</button>
              </form>
            </ModuleCard>
            <ModuleCard title="Upcoming Events" subtitle="Register with one click">
              <SectionBanner
                eyebrow="Campus Calendar"
                title="Plan your week"
                description="Explore upcoming events and reserve your seat early."
              />

              <div className="list">
                {data.events.length === 0 ? (
                  <EmptyState
                    icon="📅"
                    title="No events listed"
                    description="Publish an event to help students discover opportunities."
                  />
                ) : (
                  data.events.map((event) => {
                    const isExpired = new Date() > new Date(event.date);

                    return (
                      <div key={event._id} className="list-item">
                        <div style={{ maxWidth: "70%" }}>
                          <h4 style={{ marginBottom: "4px" }}>{event.title}</h4>

                          <p style={{ margin: "2px 0", color: "#666" }}>
                            {event.category}
                          </p>

                          <p
                            style={{
                              margin: "6px 0",
                              color: "#444",
                              lineHeight: "1.6",
                              fontSize: "14px",
                            }}
                            dangerouslySetInnerHTML={{
                              __html: event.description
                                ? event.description
                                  .slice(0, 10000)
                                  .replace(/\n/g, "<br/>")
                                : "No description available",
                            }}
                          ></p>

                          <p style={{ margin: "4px 0", fontSize: "13px", color: "#888" }}>
                            🕒{" "}
                            {event.date
                              ? new Date(event.date).toLocaleString("en-IN", {
                                timeZone: "Asia/Kolkata"
                              })
                              : "Last date not specified"}
                          </p>

                          <small>
                            Seats left: <strong>{event.availableSeats}</strong>
                          </small>
                        </div>

                        <button
                          onClick={() => registerEvent(event._id)}
                          disabled={isExpired}
                        >
                          {isExpired ? "Registration Closed" : "Register"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </ModuleCard>
          </div>
        )}
        {active === "Notifications" && (
          <ModuleCard title="Notification Center" subtitle="Mark alerts as read">
            <SectionBanner
              eyebrow="Inbox"
              title="Stay on top of updates"
              description="Track joins, answers, and event-related announcements."
            />
            <div className="list">
              {data.notifications.length === 0 ? (
                <EmptyState
                  icon="🔔"
                  title="No notifications yet"
                  description="You will see updates here as soon as activity starts."
                />
              ) : (
                data.notifications.map((n) => (
                  <div key={n._id} className={`list-item ${n.read ? "muted" : ""}`}>
                    <div>
                      <h4>{n.title}</h4>
                      <p>{n.message}</p>
                    </div>
                    {!n.read ? <button onClick={() => markRead(n._id)}>Mark read</button> : null}
                  </div>
                ))
              )}
            </div>
          </ModuleCard>
        )}
      </div>
      <QuestionModal
        question={selectedQuestion}
        user={user}
        onClose={() => setSelectedQuestionId(null)}
        onGoToQA={() => {
          setActive("Q&A");
          setSelectedQuestionId(null);
        }}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
