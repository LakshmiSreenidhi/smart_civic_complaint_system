import React, { useState, useEffect } from "react";
import "./App.css";

const CATEGORIES = [
  "Road Damage",
  "Drainage / Flooding",
  "Waste / Garbage",
  "Street Lighting",
  "Water Supply",
  "Parks / Greenery",
  "Encroachment",
  "Noise Pollution",
];

const CATEGORY_ICONS = {
  "Road Damage": "🛣️",
  "Drainage / Flooding": "💧",
  "Waste / Garbage": "🗑️",
  "Street Lighting": "💡",
  "Water Supply": "🚰",
  "Parks / Greenery": "🌳",
  "Encroachment": "🚧",
  "Noise Pollution": "📢",
};

const STATUS_COLORS = {
  Pending: "#ffd740",
  "In Progress": "#00b4d8",
  Resolved: "#2ecc71",
  Rejected: "#e74c3c",
};

const SEED_COMPLAINTS = [
  { title: "Street lights not working",  category: "Street Lighting",    status: "Pending",     description: "Dark road at night, unsafe for pedestrians.", location: "Anna Nagar",  upvotes: 10, ts: Date.now() - 86400000 * 2 },
  { title: "Pothole near school",        category: "Road Damage",         status: "In Progress", description: "Dangerous pothole causing accidents.",          location: "Adyar",       upvotes: 20, ts: Date.now() - 86400000 * 3 },
  { title: "Garbage dumping",            category: "Waste / Garbage",     status: "Resolved",    description: "Illegal dumping near residential area.",       location: "T Nagar",     upvotes: 30, ts: Date.now() - 86400000 * 7 },
  { title: "Noise at night",             category: "Noise Pollution",     status: "Rejected",    description: "Loud music from nearby function hall.",        location: "Guindy",      upvotes: 5,  ts: Date.now() - 86400000 * 1 },
  { title: "Water leakage",              category: "Water Supply",        status: "Pending",     description: "Pipe leakage wasting water for weeks.",        location: "Velachery",   upvotes: 8,  ts: Date.now() - 86400000 * 4 },
  { title: "Drainage blocked",           category: "Drainage / Flooding", status: "In Progress", description: "Water clogging every rainy day.",               location: "Tambaram",    upvotes: 15, ts: Date.now() - 86400000 * 5 },
  { title: "Park benches damaged",       category: "Parks / Greenery",    status: "Rejected",    description: "Broken benches and littered pathways.",        location: "Mylapore",    upvotes: 3,  ts: Date.now() - 86400000 * 10 },
  { title: "Encroachment issue",         category: "Encroachment",        status: "Pending",     description: "Illegal shops blocking footpath.",             location: "Porur",       upvotes: 6,  ts: Date.now() - 86400000 * 6 },
  { title: "Garbage bin overflowing",    category: "Waste / Garbage",     status: "Resolved",    description: "Bins overflowing near bus stop.",              location: "Perungudi",   upvotes: 12, ts: Date.now() - 86400000 * 8 },
  { title: "Street light flickering",   category: "Street Lighting",    status: "In Progress", description: "Light blinking on main road.",                  location: "OMR",         upvotes: 9,  ts: Date.now() - 86400000 * 9 },
];

const _KEYWORDS = {
  "Road Damage":         ["pothole","crack","road","tar","bump","broken","surface","asphalt"],
  "Drainage / Flooding": ["drain","flood","waterlog","clog","overflow","sewage","stagnant"],
  "Waste / Garbage":     ["garbage","trash","waste","dump","litter","bin","smell","rubbish"],
  "Street Lighting":     ["light","dark","lamp","pole","bulb","night","street light"],
  "Water Supply":        ["water","tap","pipe","leak","pressure","drinking","shortage"],
  "Parks / Greenery":    ["park","tree","garden","green","playground","bench","grass"],
  "Encroachment":        ["encroach","illegal","occupy","block","footpath","vendors"],
  "Noise Pollution":     ["noise","sound","loud","horn","music","party","construction"],
};

function _Classify(text) {
  if (!text || text.length < 5) return null;
  const lower = text.toLowerCase();
  let best = null, bestScore = 0;
  Object.entries(_KEYWORDS).forEach(([cat, kws]) => {
    const score = kws.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  });
  return bestScore > 0 ? best : null;
}

function timeAgo(ts) {
  if (!ts) return "";
  const d = (Date.now() - ts) / 1000;
  if (d < 60)    return "Just now";
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function App() {

  // AUTH
  const [user,       setUser]       = useState(localStorage.getItem("civic_user") || "");
  const [userEmail,  setUserEmail]  = useState(localStorage.getItem("civic_email") || "");
  const [inputUser,  setInputUser]  = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [page,       setPage]       = useState("home");

  // COMPLAINTS
  const [complaints, setComplaints] = useState(() => {
    try {
      const saved = localStorage.getItem("civic_complaints");
      return saved ? JSON.parse(saved) : SEED_COMPLAINTS;
    } catch { return SEED_COMPLAINTS; }
  });

  useEffect(() => {
    localStorage.setItem("civic_complaints", JSON.stringify(complaints));
  }, [complaints]);

  // FORM
  const [form,      setForm]      = useState({ title: "", category: "", description: "" });
  const [location,  setLocation]  = useState("");
  const [image,     setImage]     = useState(null);
  const [Sug,       setSug]       = useState(null);
  const [Timer,     setTimer]     = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // FILTERS
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("");
  const [statFilter, setStatFilter] = useState("");
  const [sortBy,     setSortBy]     = useState("newest");

  // CONTACT FORM
  const [contact, setContact] = useState({ name: "", email: "", subject: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  // TOAST
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // AUTH
  function login() {
    if (!inputUser.trim()) {
      setEmailError("Please enter your name.");
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(inputEmail.trim())) {
      setEmailError("Please enter a valid @gmail.com email address.");
      return;
    }
    setEmailError("");
    localStorage.setItem("civic_user", inputUser.trim());
    localStorage.setItem("civic_email", inputEmail.trim());
    setUser(inputUser.trim());
    setUserEmail(inputEmail.trim());
  }

  function logout() {
    localStorage.removeItem("civic_user");
    localStorage.removeItem("civic_email");
    setUser("");
    setUserEmail("");
    setPage("home");
  }

  // LOCATION
  function getLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setLocation(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`),
      ()   => showToast("Location access denied.", "error")
    );
  }

  function handleDescChange(val) {
    setForm(f => ({ ...f, description: val }));
    clearTimeout(Timer);
    const t = setTimeout(() => {
      const sug = _Classify(val + " " + form.title);
      setSug(sug);
    }, 600);
    setTimer(t);
  }

  // SUBMIT COMPLAINT
  function submitComplaint() {
    if (!form.title || !form.category || !form.description) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    const newC = {
      ...form, location, image,
      status: "Pending", upvotes: 0,
      ts: Date.now(), reporter: user,
    };
    setComplaints(prev => [newC, ...prev]);
    setForm({ title: "", category: "", description: "" });
    setLocation(""); setImage(null); setSug(null);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    showToast("✅ Complaint submitted successfully!");
    setPage("complaints");
  }

  // SUBMIT CONTACT FORM
  function submitContact() {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!contact.name || !contact.email || !contact.subject || !contact.message) {
      showToast("Please fill all fields in the contact form.", "error");
      return;
    }
    if (!emailRegex.test(contact.email.trim())) {
      showToast("Please enter a valid @gmail.com email.", "error");
      return;
    }
    setContactSent(true);
    setContact({ name: "", email: "", subject: "", message: "" });
    showToast("✅ Message sent! We'll get back to you soon.");
    setTimeout(() => setContactSent(false), 5000);
  }

  // UPVOTE
  function upvote(i) {
    setComplaints(prev => {
      const next = [...prev];
      next[i] = { ...next[i], upvotes: next[i].upvotes + 1 };
      return next;
    });
  }

  // ADMIN STATUS UPDATE
  function updateStatus(i, val) {
    setComplaints(prev => {
      const next = [...prev];
      next[i] = { ...next[i], status: val };
      return next;
    });
  }

  // FILTERED LIST
  let filtered = complaints.filter(c => {
    if (search    && !c.title.toLowerCase().includes(search.toLowerCase()) &&
                     !c.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter  && c.category !== catFilter)  return false;
    if (statFilter && c.status   !== statFilter) return false;
    return true;
  });

  if (sortBy === "newest") filtered = [...filtered].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  if (sortBy === "oldest") filtered = [...filtered].sort((a, b) => (a.ts || 0) - (b.ts || 0));
  if (sortBy === "votes")  filtered = [...filtered].sort((a, b) => b.upvotes - a.upvotes);

  // DASHBOARD
  const total    = complaints.length;
  const pending  = complaints.filter(c => c.status === "Pending").length;
  const progress = complaints.filter(c => c.status === "In Progress").length;
  const resolved = complaints.filter(c => c.status === "Resolved").length;
  const rejected = complaints.filter(c => c.status === "Rejected").length;

  const p1 = (pending  / total) * 100;
  const p2 = (progress / total) * 100;
  const p3 = (resolved / total) * 100;
  const pieStyle = {
    background: `conic-gradient(
      #ffd740 0% ${p1}%,
      #00b4d8 ${p1}% ${p1 + p2}%,
      #2ecc71 ${p1 + p2}% ${p1 + p2 + p3}%,
      #e74c3c ${p1 + p2 + p3}% 100%
    )`,
  };

  // ── LOGIN SCREEN ──────────────────────────────────────
  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo"></div>
          <h2>City Care</h2>
          <p className="login-sub">Smart Civic Complaint System</p>

          <div className="login-field">
            <label>Full Name</label>
            <input
              className="login-input"
              placeholder="Enter your name"
              value={inputUser}
              onChange={e => { setInputUser(e.target.value); setEmailError(""); }}
              onKeyDown={e => e.key === "Enter" && login()}
            />
          </div>

          <div className="login-field">
            <label>Gmail Address</label>
            <input
              className="login-input"
              type="email"
              placeholder="yourname@gmail.com"
              value={inputEmail}
              onChange={e => { setInputEmail(e.target.value); setEmailError(""); }}
              onKeyDown={e => e.key === "Enter" && login()}
            />
            {emailError && <div className="email-error">{emailError}</div>}
          </div>

          <button className="login-btn" onClick={login}>Login →</button>
        </div>
      </div>
    );
  }

  // ── MAIN APP ──────────────────────────────────────────
  return (
    <div className="app">

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}

      <header className="header">
        <div className="header-logo"> City<span>Care</span></div>
        <div className="header-right">
          <div className="header-user-info">
            <span className="header-user">{user}</span>
            <span className="header-email">{userEmail}</span>
          </div>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <nav className="navbar">
        {[
          { id: "home",       label: "Home"         },
          { id: "dashboard",  label: "Dashboard"    },
          { id: "complaints", label: "Complaints"   },
          { id: "form",       label: "Report Issue" },
          { id: "admin",      label: "Admin"        },
          { id: "contact",    label: "Contact"      },
        ].map(n => (
          <button
            key={n.id}
            className={`nav-btn${page === n.id ? " active" : ""}`}
            onClick={() => setPage(n.id)}
          >
            {n.label}
            {n.id === "complaints" && pending > 0 && (
              <span className="nav-badge">{pending}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="container">

        {/* ── HOME ── */}
        {page === "home" && (
          <div className="home-page">
            <div className="home-hero">
              <h2 style={{ color: "white" }}>Welcome back, <span>{user}</span> </h2>
              <p>Report civic issues, track progress, and help build a better city.</p>
              <div className="home-btns">
                <button className="btn-primary" onClick={() => setPage("form")}> Report Issue</button>
                <button className="btn-secondary" onClick={() => setPage("complaints")}> View Complaints</button>
              </div>
            </div>

            <img src="image.png" alt="City Care" style={{ width: "100%", height: "500px", objectFit: "cover", borderRadius: "12px", marginBottom: "1rem" }} />
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {page === "dashboard" && (
          <div className="dashboard-page">
            <h2 className="page-title">📊Dashboard</h2>

            <div className="stat-row">
              {[
                { label: "Total",       val: total,    cls: "blue", },
                { label: "Pending",     val: pending,  cls: "yellow", },
                { label: "In Progress", val: progress, cls: "cyan",  },
                { label: "Resolved",    val: resolved, cls: "green",  },
              ].map(s => (
                <div key={s.label} className={`stat-card ${s.cls}`}>
                  <div className="stat-icon-big">{s.icon}</div>
                  <div className="stat-number">{s.val}</div>
                  <div className="stat-text">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="dash-grid">
              <div className="dash-card">
                <h3>Status Breakdown</h3>
                <div className="donut-wrap">
                  <div className="donut" style={pieStyle}>
                    <div className="donut-hole">
                      <div className="donut-total">{total}</div>
                      <div className="donut-lbl">Total</div>
                    </div>
                  </div>
                </div>
                <div className="legend">
                  {[
                    { label: "Pending",     val: pending,  color: "#ffd740" },
                    { label: "In Progress", val: progress, color: "#00b4d8" },
                    { label: "Resolved",    val: resolved, color: "#2ecc71" },
                    { label: "Rejected",    val: rejected, color: "#e74c3c" },
                  ].map(l => (
                    <div key={l.label} className="legend-row">
                      <div className="legend-dot" style={{ background: l.color }} />
                      <span>{l.label}</span>
                      <span className="legend-val">{l.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPLAINTS ── */}
        {page === "complaints" && (
          <div className="complaints-page">
            <div className="complaints-header">
              <h2 className="page-title">Complaints</h2>
              <span className="result-count">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="filters-row">
              <div className="search-wrap">
                <span className="search-icon"></span>
                <input
                  placeholder="Search complaints…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={statFilter} onChange={e => setStatFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Rejected</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="votes">Most Upvoted</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">📭 No complaints match your filters.</div>
            ) : (
              <div className="complaints-list">
                {filtered.map((c, i) => {
                  const realIndex = complaints.indexOf(c);
                  return (
                    <div className="complaint-card" key={i}>
                      <div className="cc-left">
                        <div className="cc-icon">{CATEGORY_ICONS[c.category] || "📋"}</div>
                      </div>
                      <div className="cc-body">
                        <div className="cc-top">
                          <span className="cc-title">{c.title}</span>
                          <span
                            className="cc-status"
                            style={{ background: STATUS_COLORS[c.status] + "22", color: STATUS_COLORS[c.status], border: `1px solid ${STATUS_COLORS[c.status]}55` }}
                          >
                            {c.status}
                          </span>
                        </div>
                        <div className="cc-meta">
                          <span>{c.category}</span>
                          <span> {c.location || "N/A"}</span>
                          {c.ts && <span>{timeAgo(c.ts)}</span>}
                          {c.reporter && <span>{c.reporter}</span>}
                        </div>
                        <div className="cc-desc">{c.description}</div>

                        <div className="cc-progress">
                          <div
                            className="cc-progress-fill"
                            style={{
                              width: c.status === "Resolved" ? "100%" : c.status === "In Progress" ? "55%" : c.status === "Rejected" ? "100%" : "10%",
                              background: STATUS_COLORS[c.status],
                            }}
                          />
                        </div>

                        {c.image && <img src={c.image} className="cc-img" alt="complaint" />}
                      </div>
                      <div className="cc-right">
                        <button className="upvote-btn" onClick={() => upvote(realIndex)}>
                          ▲<br />{c.upvotes}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── REPORT ISSUE ── */}
        {page === "form" && (
          <div className="form-page">
            <h2 className="page-title">Report an Issue</h2>

            <div className="form-card">
              <div className="form-group">
                <label>Complaint Title *</label>
                <input
                  placeholder="e.g. Large pothole near school gate"
                  value={form.title}
                  onChange={e => {
                    setForm(f => ({ ...f, title: e.target.value }));
                    setSug(_Classify(e.target.value + " " + form.description));
                  }}
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  placeholder="Describe the issue in detail…"
                  value={form.description}
                  onChange={e => handleDescChange(e.target.value)}
                />
                {Sug && (
                  <div className="suggestion">
                    <span className="badge">Suggests</span>
                    <strong>{Sug}</strong>
                    <button className="ai-apply" onClick={() => setForm(f => ({ ...f, category: Sug }))}>Apply</button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Location</label>
                <div className="location-row">
                  <input value={location} readOnly placeholder="Click button to get GPS location" />
                  <button className="loc-btn" onClick={getLocation}> Get Location</button>
                </div>
              </div>

              <div className="form-group">
                <label>Upload Photo (optional)</label>
                <div className="upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) setImage(URL.createObjectURL(file));
                    }}
                  />
                  {image
                    ? <img src={image} className="upload-preview" alt="preview" />
                    : <div className="upload-placeholder">📷 Click to upload a photo</div>
                  }
                </div>
                {image && <button className="remove-img" onClick={() => setImage(null)}>✕ Remove</button>}
              </div>

              <div className="form-actions">
                <button
                  className="btn-clear"
                  onClick={() => { setForm({ title: "", category: "", description: "" }); setLocation(""); setImage(null); setSug(null); }}
                >
                  Clear
                </button>
                <button className="btn-submit" onClick={submitComplaint}>
                   Submit Complaint
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ADMIN ── */}
        {page === "admin" && (
          <div className="admin-page">
            <h2 className="page-title"> Admin Panel</h2>
            <p className="admin-sub">Manage and update complaint statuses</p>

            <div className="admin-list">
              {complaints.map((c, i) => (
                <div className="admin-card" key={i}>
                  <div className="admin-info">
                    <div className="admin-icon">{CATEGORY_ICONS[c.category] ||""}</div>
                    <div>
                      <div className="admin-title">{c.title}</div>
                      <div className="admin-meta">
                        <span>{c.category}</span>
                        <span>{c.location || "N/A"}</span>
                        <span>▲ {c.upvotes}</span>
                      </div>
                    </div>
                  </div>
                  <div className="admin-right">
                    <span
                      className="cc-status"
                      style={{ background: STATUS_COLORS[c.status] + "22", color: STATUS_COLORS[c.status], border: `1px solid ${STATUS_COLORS[c.status]}55` }}
                    >
                      {c.status}
                    </span>
                    <select
                      className="status-select"
                      value={c.status}
                      onChange={e => updateStatus(i, e.target.value)}
                    >
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                      <option>Rejected</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTACT ── */}
        {page === "contact" && (
          <div className="contact-page">
            <h2 className="page-title">📬 Contact Us</h2>

            <div className="contact-layout">

              {/* Left — info */}
              <div className="contact-info-panel">
                <h3>Get in Touch</h3>
                <p className="contact-tagline">
                  Have any questions or need support? Fill out the form and we'll get back to you as soon as possible.
                </p>

                <div className="contact-info-list">
                  <div className="contact-info-item">
                    <div className="ci-icon"></div>
                    <div>
                      <div className="ci-label">Toll-Free Helpline</div>
                      <div className="ci-value">1913</div>
                    </div>
                  </div>
                  <div className="contact-info-item">
                    <div className="ci-icon"></div>
                    <div>
                      <div className="ci-label">Email</div>
                      <div className="ci-value">citycare@chennaicorporation.gov.in</div>
                    </div>
                  </div>
                  <div className="contact-info-item">
                    <div className="ci-icon"></div>
                    <div>
                      <div className="ci-label">Address</div>
                      <div className="ci-value">Ripon Building, Park Town, Chennai – 600 003</div>
                    </div>
                  </div>
                  <div className="contact-info-item">
                    <div className="ci-icon"></div>
                    <div>
                      <div className="ci-label">Working Hours</div>
                      <div className="ci-value">Mon to Sat, 9:00 AM to 6:00 PM</div>
                    </div>
                  </div>
                  <div className="contact-info-item">
                    <div className="ci-icon"></div>
                    <div>
                      <div className="ci-label">Emergency</div>
                      <div className="ci-value">+91 44 2538 3434</div>
                    </div>
                  </div>
                  <div className="contact-info-item">
                    <div className="ci-icon"></div>
                    <div>
                      <div className="ci-label">Website</div>
                      <div className="ci-value">www.chennaicorporation.gov.in</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — form */}
              <div className="contact-form-panel">
                <h3>Send Us a Message</h3>
                <p className="contact-form-sub">
                  Have any questions or need support? Fill out the form below and we'll get back to you as soon as possible.
                </p>

                {contactSent && (
                  <div className="contact-success">
                    ✅ Thank you! Your message has been received. We'll get back to you at your Gmail address shortly.
                  </div>
                )}

                <div className="form-group">
                  <label>Your Name *</label>
                  <input
                    placeholder="Enter your full name"
                    value={contact.name}
                    onChange={e => setContact(c => ({ ...c, name: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Gmail Address *</label>
                  <input
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={contact.email}
                    onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                  />
                  <div className="field-hint">Only @gmail.com addresses accepted</div>
                </div>

                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    placeholder="What is this regarding?"
                    value={contact.subject}
                    onChange={e => setContact(c => ({ ...c, subject: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    placeholder="Write your message here..."
                    value={contact.message}
                    onChange={e => setContact(c => ({ ...c, message: e.target.value }))}
                    style={{ minHeight: "120px" }}
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn-clear"
                    onClick={() => { setContact({ name: "", email: "", subject: "", message: "" }); setContactSent(false); }}
                  >
                    Clear
                  </button>
                  <button className="btn-submit" onClick={submitContact}>
                     Send Message
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;