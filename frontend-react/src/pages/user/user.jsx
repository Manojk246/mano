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
  BarChart,
  Github,
  Code,
  FileText,
  User,
} from "lucide-react";

export default function UserDashboard() {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ats, setAts] = useState(null);
  const [atsBreakdown, setAtsBreakdown] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [github, setGithub] = useState(null);
  const [leetcode, setLeetcode] = useState(null);
  const [codechef, setCodechef] = useState(null);

  const email = localStorage.getItem("email");

  // 🧠 Fetch user info
  useEffect(() => {
    const fetchUserData = async () => {
      const storedEmail = localStorage.getItem("email");
      if (!storedEmail) return setLoading(false);
      try {
        const res = await axios.get(`http://127.0.0.1:8000/user/info/${storedEmail}`);
        setUser(res.data.user);
      } catch (err) {
        console.error("User fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // 💾 Fetch GitHub, LeetCode, CodeChef
  useEffect(() => {
    if (!email) return;
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
        console.warn("Profile fetch error:", err);
      }
    };
    fetchAll();
  }, [email]);

  // 📄 Resume Upload Handler
  const handleUpload = async () => {
    if (!file) return alert("Please select a file!");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await axios.post("http://127.0.0.1:8000/user/upload_resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // 🧠 Update states
      setAts(res.data.ats_score);
      setAtsBreakdown(res.data.ats_breakdown);
      setParsed(res.data.structured_info);
      setWordCount(res.data.word_count);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Resume upload failed!");
    } finally {
      setUploading(false);
    }
  };

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // 🧹 Safe helper
  const safeJoin = (arr, label = "None") => {
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.join(", ");
    }
    return label;
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user.name || "User"} 👋</h1>
        <Button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
        >
          <LogOut size={18} /> Logout
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-1 space-y-6">
          {/* Profile */}
          <Card className="bg-gray-800 border border-gray-700">
            <CardContent className="p-5">
              <h2 className="text-xl font-semibold mb-3 text-blue-400 flex items-center gap-2">
                <User size={18} /> Profile
              </h2>
              <p><b>Name:</b> {user.name || "N/A"}</p>
              <p><b>Email:</b> {user.email || "N/A"}</p>
              <p><b>Role:</b> {user.role || "N/A"}</p>
              <p><b>Register No:</b> {user.register_number || "N/A"}</p>
              <p><b>Phone:</b> {user.phone || "N/A"}</p>
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
                    ATS Score: {ats || 0}%
                  </h3>
                  <p className="text-gray-300 mt-1 text-sm">
                    Word Count: {wordCount || 0}
                  </p>
                  {atsBreakdown && (
                    <div className="mt-3 text-sm">
                      <h4 className="font-semibold text-green-400">✅ ATS Breakdown:</h4>
                      <ul className="list-disc ml-5 text-gray-200">
                        {Object.entries(atsBreakdown).map(([key, val]) => (
                          <li key={key}>
                            <b className="capitalize">{key}:</b> {val}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coding Profiles */}
          
        </div>

        {/* Right Column */}
        <div className="col-span-2 space-y-6">
          {parsed && (
            <Card className="bg-gray-800 border border-gray-700">
              <CardContent className="p-5">
                <h2 className="text-xl font-semibold mb-4 text-yellow-400">
                  🎓 Extracted Resume Info
                </h2>

                <div className="space-y-2">
                  <p><b>Technical Skills:</b> {safeJoin(parsed?.skills?.technical)}</p>
                  <p><b>Soft Skills:</b> {safeJoin(parsed?.skills?.soft)}</p>
                  <p><b>Languages:</b> {safeJoin(parsed?.languages)}</p>
                  <p><b>Certificates:</b> {safeJoin(parsed?.certificates)}</p>
                  <p><b>Summary:</b> {parsed?.summary || "No summary available"}</p>
                </div>

                <pre className="bg-gray-900 text-gray-200 p-3 rounded-lg overflow-x-auto text-sm mt-4">
                  {JSON.stringify(parsed, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
