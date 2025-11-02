import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Card, CardContent } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import {
  Loader2,
  Upload,
  LogOut,
  Bot,
  Send,
  BarChart,
  Github,
  Code,
  FileText,
  User,
} from "lucide-react";

// ============================
// 🌟 USER DASHBOARD COMPONENT
// ============================
export default function UserDashboard() {
  // -----------------------------
  // STATES
  // -----------------------------
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ats, setAts] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  const [github, setGithub] = useState(null);
  const [leetcode, setLeetcode] = useState(null);
  const [codechef, setCodechef] = useState(null);

  const email = localStorage.getItem("email");

  // -----------------------------
  // 🧠 FETCH USER INFO
  // -----------------------------
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/user/info/${email}`);
        setUser(res.data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [email]);

  // -----------------------------
  // 💾 FETCH DASHBOARD DATA (GitHub / LeetCode / CodeChef)
  // -----------------------------
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [g, l, c] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/github/${email}`),
          axios.get(`http://127.0.0.1:8000/leetcode/${email}`),
          axios.get(`http://127.0.0.1:8000/codechef/${email}`),
        ]);
        setGithub(g.data);
        setLeetcode(l.data);
        setCodechef(c.data);
      } catch (err) {
        console.warn("Profile data not found yet — skipping...");
      }
    };
    fetchAll();
  }, [email]);

  // -----------------------------
  // 📄 RESUME UPLOAD HANDLER
  // -----------------------------
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }
    const formData = new FormData();
    formData.append("email", email);
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await axios.post(
        "http://127.0.0.1:8000/user/upload_resume",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setAts(res.data.ats_score);
    } catch (error) {
      console.error("Error uploading resume:", error);
      alert("Upload failed. Check backend logs.");
    } finally {
      setUploading(false);
    }
  };

  // -----------------------------
  // 🤖 CHATBOT HANDLER
  // -----------------------------
  const sendMessage = async () => {
    if (!message.trim()) return;

    const newChat = [
      ...chatHistory,
      { sender: "user", text: message },
      { sender: "bot", text: "Typing..." },
    ];
    setChatHistory(newChat);
    setMessage("");
    setSending(true);

    try {
      const res = await axios.post("http://127.0.0.1:8000/chat/ai", {
        email,
        message,
      });
      const updated = [...chatHistory, { sender: "user", text: message }];
      updated.push({ sender: "bot", text: res.data.reply });
      setChatHistory(updated);
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory([
        ...chatHistory,
        { sender: "user", text: message },
        {
          sender: "bot",
          text: "⚠️ Error reaching AI. Check backend or API key setup.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // -----------------------------
  // 🚪 LOGOUT HANDLER
  // -----------------------------
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // -----------------------------
  // ⏳ LOADING SCREEN
  // -----------------------------
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );

  // ============================
  // 🖥️ DASHBOARD UI
  // ============================
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6"
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {user.name || "User"} 👋
        </h1>
        <Button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
        >
          <LogOut size={18} /> Logout
        </Button>
      </div>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL */}
        <div className="col-span-1 space-y-6">
          {/* Profile */}
          <Card className="bg-gray-800 border border-gray-700">
            <CardContent className="p-5">
              <h2 className="text-xl font-semibold mb-3 text-blue-400 flex items-center gap-2">
                <User size={18} /> Profile
              </h2>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role || "Student"}</p>
              <p><strong>Register Number:</strong> {user.register_number}</p>
              <p><strong>Phone:</strong> {user.phone}</p>
            </CardContent>
          </Card>

          {/* Resume Upload */}
          <Card className="bg-gray-800 border border-gray-700">
            <CardContent className="p-5">
              <h2 className="text-xl font-semibold mb-4 text-green-400 flex items-center gap-2">
                <FileText size={18} /> Resume Analyzer
              </h2>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setFile(e.target.files[0])}
                className="text-sm text-gray-300 border border-gray-600 p-2 rounded-lg w-full mb-3"
              />
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} /> Upload Resume
                  </>
                )}
              </Button>

              {ats && (
                <div className="mt-4 bg-gray-700 p-3 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-400">
                    ATS Score: {ats.score}%
                  </h3>
                  <p className="text-green-400 mt-2">
                    ✅ Matched: {ats.matched.join(", ") || "None"}
                  </p>
                  <p className="text-red-400">
                    ❌ Missing: {ats.missing.join(", ") || "None"}
                  </p>
                  <ul className="list-disc ml-5 text-sm text-gray-300 mt-2">
                    {ats.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL - Insights + Chat */}
        <div className="col-span-2 space-y-6">
          {/* CODING INSIGHTS */}
          <Card className="bg-gray-800 border border-gray-700">
            <CardContent className="p-5">
              <h2 className="text-xl font-semibold mb-4 text-purple-400 flex items-center gap-2">
                <BarChart size={18} /> Coding Insights
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1 text-gray-300">
                    <Github size={16} /> GitHub
                  </div>
                  {github ? (
                    <>
                      <p>Repos: {github.repos}</p>
                      <p>Followers: {github.followers}</p>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">Not connected</p>
                  )}
                </div>

                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1 text-gray-300">
                    <Code size={16} /> LeetCode
                  </div>
                  {leetcode ? (
                    <>
                      <p>Problems Solved: {leetcode.solved}</p>
                      <p>Rank: {leetcode.rank}</p>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">Not connected</p>
                  )}
                </div>

                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1 text-gray-300">
                    <Code size={16} /> CodeChef
                  </div>
                  {codechef ? (
                    <>
                      <p>Rating: {codechef.rating}</p>
                      <p>Stars: {codechef.stars}</p>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">Not connected</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI CHATBOT */}
          <Card className="bg-gray-800 border border-gray-700">
            <CardContent className="p-5 h-[400px] flex flex-col">
              <h2 className="text-xl font-semibold mb-3 text-pink-400 flex items-center gap-2">
                <Bot size={18} /> AI Career Assistant
              </h2>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-gray-700 p-3 rounded-lg">
                {chatHistory.length === 0 ? (
                  <p className="text-gray-400 text-center text-sm mt-20">
                    👋 Ask anything about resume, placements, or interview prep!
                  </p>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg max-w-[70%] text-sm ${
                          msg.sender === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-600 text-gray-100"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 p-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none"
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending}
                  className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700"
                >
                  {sending ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <Send size={18} />
                  )}
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
