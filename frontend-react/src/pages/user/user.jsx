import React, { useState, useRef } from "react";

// ResumeAnalyzerPage.jsx
// Single-file React component for the requested page.
// - Uses Tailwind CSS for styling (no import needed in this file)
// - Uses shadcn/ui and lucide-react components if available (optional)
// - Produces these sections: Personal Info, ATS Score (with tips), Skill Matcher,
//   Improvement Suggestion (Llama3 integration notes + trigger), Analytiq Chat (LLM),
//   Download Report option

export default function user() {
  const [personal, setPersonal] = useState({
    name: "Mathan S.",
    email: "mathan@example.com",
    phone: "+91 98xxxxxxx",
    headline: "Aspiring Full Stack Developer",
  });

  // ATS score & tips (mocked). In a real app you'd calculate this from resume text
  const [atsResult, setAtsResult] = useState({
    score: 67,
    highlights: [
      "Has relevant keywords for Full Stack Developer",
      "Missing quantifiable metrics",
      "Some skills listed in separate images or headers (not machine-readable)",
    ],
    tips: [
      "Add 2–3 quantifiable achievements per project (percent, time saved, users)",
      "Move important keywords (React, Node.js, SQL) into bullet points under experience",
      "Avoid embedding important text inside images — ATS can't read them",
    ],
  });

  // Skill matcher: user selects role and the matcher shows matches
  const roles = [
    { id: "fsd", title: "Full Stack Developer", mustHave: ["React", "Node.js", "SQL"] },
    { id: "be", title: "Backend Engineer", mustHave: ["Node.js", "Express", "Databases"] },
    { id: "fe", title: "Frontend Engineer", mustHave: ["React", "HTML", "CSS"] },
  ];
  const [selectedRole, setSelectedRole] = useState(roles[0].id);

  const mockSkills = ["React", "Node.js", "Express", "SQL", "Docker"];

  // Improvement suggestion - shows how we'd call Llama3 (placeholder)
  const [improvement, setImprovement] = useState({
    status: "idle",
    suggestions: [],
  });

  // Analytiq chat state (simple chatbot UI that calls Llama3 behind the scenes)
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hello! Ask me about your resume or role alignment." },
  ]);
  const messageRef = useRef();

  // Download report refs
  const reportRef = useRef();

  function computeSkillMatch(roleId) {
    const role = roles.find((r) => r.id === roleId);
    const matches = role.mustHave.filter((m) => mockSkills.includes(m));
    const missing = role.mustHave.filter((m) => !mockSkills.includes(m));
    const matchRate = Math.round((matches.length / role.mustHave.length) * 100);
    return { matches, missing, matchRate, roleTitle: role.title };
  }

  function triggerLlama3Improvement() {
    // Placeholder: in production, call your server which proxies to Llama3 with auth.
    // Here we simulate an async call and populate suggestions.
    setImprovement((s) => ({ ...s, status: "loading" }));
    setTimeout(() => {
      setImprovement({
        status: "done",
        suggestions: [
          "Rewrite your headline to include 'Full Stack Developer' + 1 specialty (e.g., React/Node.js).",
          "Add quantifiable metrics to 3 experience bullets (e.g., improved load time by 32%).",
          "Move technical skills into a dedicated skills section at top for ATS parsing.",
        ],
      });
    }, 600);
  }

  function sendMessageToAnalytiq() {
    const text = messageRef.current.value?.trim();
    if (!text) return;
    const userMsg = { from: "you", text };
    setMessages((m) => [...m, userMsg]);
    messageRef.current.value = "";

    // Simulate Llama3 reply. In real app: POST to /api/llama3 with prompt & resume context
    setTimeout(() => {
      const botReply = {
        from: "bot",
        text: `Quick tip: emphasize technical depth in projects. (auto-response to: ${text.slice(0,40)})`,
      };
      setMessages((m) => [...m, botReply]);
    }, 500);
  }

  function downloadReport() {
    // Create a printable HTML report blob and trigger download
    const reportHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Resume Report</title></head><body>` +
      `<h1>Resume Report - ${personal.name}</h1>` +
      `<h2>ATS Score: ${atsResult.score}</h2>` +
      `<h3>ATS Highlights</h3><ul>` + atsResult.highlights.map(h => `<li>${h}</li>`).join('') + `</ul>` +
      `<h3>Tips</h3><ul>` + atsResult.tips.map(t => `<li>${t}</li>`).join('') + `</ul>` +
      `<h3>Skill Match for ${computeSkillMatch(selectedRole).roleTitle}</h3>` +
      `<p>Match Rate: ${computeSkillMatch(selectedRole).matchRate}%</p>` +
      `</body></html>`;

    const blob = new Blob([reportHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${personal.name.replace(/\s+/g, '_')}_resume_report.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const skillMatch = computeSkillMatch(selectedRole);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Personal Info + ATS */}
        <div className="col-span-1 space-y-6">
          <section className="bg-white p-4 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-3">1. Personal Info</h2>
            <div className="space-y-2">
              <label className="block text-sm">Full name</label>
              <input className="w-full p-2 rounded border" value={personal.name} onChange={(e)=>setPersonal({...personal, name:e.target.value})} />

              <label className="block text-sm mt-2">Email</label>
              <input className="w-full p-2 rounded border" value={personal.email} onChange={(e)=>setPersonal({...personal, email:e.target.value})} />

              <label className="block text-sm mt-2">Phone</label>
              <input className="w-full p-2 rounded border" value={personal.phone} onChange={(e)=>setPersonal({...personal, phone:e.target.value})} />

              <label className="block text-sm mt-2">Headline</label>
              <input className="w-full p-2 rounded border" value={personal.headline} onChange={(e)=>setPersonal({...personal, headline:e.target.value})} />
            </div>
          </section>

          <section className="bg-white p-4 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-3">2. ATS Score</h2>
            <div className="flex items-center gap-4">
              <div className="rounded-full w-24 h-24 flex items-center justify-center bg-slate-100 text-2xl font-bold">{atsResult.score}%</div>
              <div>
                <h3 className="font-medium">Quick diagnosis</h3>
                <ul className="list-disc ml-5 mt-2 text-sm text-slate-700">
                  {atsResult.highlights.map((h,i)=> <li key={i}>{h}</li>)}
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium">Improvement tips</h4>
              <ol className="list-decimal ml-5 mt-2 text-sm">
                {atsResult.tips.map((t,i)=> <li key={i}>{t}</li>)}
              </ol>
            </div>
          </section>

          <section className="bg-white p-4 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-3">6. Download Report</h2>
            <p className="text-sm text-slate-600">Download a quick HTML report of the current analysis.</p>
            <div className="mt-3 flex gap-2">
              <button onClick={downloadReport} className="px-4 py-2 rounded-2xl border">Download report</button>
              <button onClick={()=>window.print()} className="px-4 py-2 rounded-2xl border">Print</button>
            </div>
          </section>
        </div>

        {/* Middle column - Skill matcher + Improvement suggestion */}
        <div className="col-span-1 lg:col-span-1 space-y-6">
          <section className="bg-white p-4 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-3">3. Skill Matcher for selected role</h2>
            <div className="flex gap-3 items-center">
              <select className="p-2 rounded border" value={selectedRole} onChange={(e)=>setSelectedRole(e.target.value)}>
                {roles.map(r=> <option value={r.id} key={r.id}>{r.title}</option>)}
              </select>
              <div className="ml-auto text-sm">Match Rate: <strong>{skillMatch.matchRate}%</strong></div>
            </div>
            <div className="mt-3">
              <h4 className="font-medium">Matched skills</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {skillMatch.matches.map((s,i)=> <span key={i} className="px-3 py-1 rounded-full border text-sm">{s}</span>)}
                {skillMatch.missing.map((s,i)=> <span key={i} className="px-3 py-1 rounded-full border text-sm bg-rose-50">Missing: {s}</span>)}
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium">Your skill list (editable)</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {mockSkills.map((s,i)=> <span key={i} className="px-3 py-1 rounded-full border text-sm">{s}</span>)}
              </div>
            </div>
          </section>

          <section className="bg-white p-4 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-3">4. Improvement Suggestion (integrate with Llama3)</h2>
            <p className="text-sm text-slate-600">Click the button to request targeted improvements generated by Llama3. In production, this button should call your backend which proxies requests to Llama3 with secure credentials.</p>
            <div className="mt-3 flex gap-2">
              <button disabled={improvement.status === 'loading'} onClick={triggerLlama3Improvement} className="px-4 py-2 rounded-2xl border">Get Llama3 suggestions</button>
              <button onClick={()=>{navigator.clipboard?.writeText('POST /api/llama3 -> {prompt,resume_text}')}} className="px-4 py-2 rounded-2xl border">Copy API snippet</button>
            </div>
            <div className="mt-3">
              {improvement.status === 'loading' && <div className="text-sm text-slate-500">Generating suggestions...</div>}
              {improvement.status === 'done' && (
                <ul className="list-disc ml-5 mt-2 text-sm">
                  {improvement.suggestions.map((s,i)=> <li key={i}>{s}</li>)}
                </ul>
              )}
            </div>
          </section>

        </div>

        {/* Right column - Analytiq chat (5) and extras */}
        <div className="col-span-1 space-y-6">
          <section className="bg-white p-4 rounded-2xl shadow flex flex-col h-[44rem]">
            <h2 className="text-xl font-semibold mb-3">5. Analytiq (chatbot — can use Llama3)</h2>
            <div className="flex-1 overflow-auto p-2 border rounded mb-3 bg-slate-50">
              {messages.map((m,i)=> (
                <div key={i} className={`my-2 p-2 rounded max-w-[80%] ${m.from === 'you' ? 'ml-auto bg-white border' : 'bg-slate-100'}`}>
                  <div className="text-sm text-slate-800">{m.text}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input ref={messageRef} placeholder="Ask the assistant..." className="flex-1 p-2 rounded border" />
              <button onClick={sendMessageToAnalytiq} className="px-4 py-2 rounded-2xl border">Send</button>
            </div>
            <div className="text-xs text-slate-500 mt-2">Note: For production use, send messages to your server which calls Llama3 with user prompt and sanitized resume context.</div>
          </section>

          <section className="bg-white p-4 rounded-2xl shadow">
            <h3 className="text-lg font-medium">Quick integration notes</h3>
            <ul className="ml-5 list-disc text-sm mt-2">
              <li>Proxy all Llama3 requests through your backend with API key storage.</li>
              <li>Rate-limit and sanitize prompts to avoid leaking PII.</li>
              <li>Use short system prompt templates and attach resume-context as user message for focused answers.</li>
              <li>Store suggestions and improvements in DB to version suggestions per resume upload.</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}

