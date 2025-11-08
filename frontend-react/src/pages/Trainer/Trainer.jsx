import React, { useState } from "react";
import { X, PlusCircle, Upload, Filter, FileText, TrendingUp, Users, Award } from "lucide-react";

const Trainer = () => {
    
  const [loading, setLoading] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [filters, setFilters] = useState({
    cgpa: "",
    tenth: "",
    twelfth: "",
    skills: [],
    currentSkill: "",
    language: "",
    ats: "",
    department: "",
    degree: "",
    results: [],
  });

  // handle file upload
const handleFileChange = (e) => {
  const files = Array.from(e.target.files);

  // Append new files instead of replacing
  setResumes((prev) => {
    // prevent duplicates (based on name + size)
    const newFiles = files.filter(
      (file) => !prev.some((f) => f.name === file.name && f.size === file.size)
    );
    return [...prev, ...newFiles];
  });
};
const removeFile = (filename) => {
  setResumes((prev) => prev.filter((file) => file.name !== filename));
};


  // handle input filter change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // handle skill add
  const addSkill = () => {
    if (filters.currentSkill.trim() !== "") {
      setFilters((prev) => ({
        ...prev,
        skills: [...prev.skills, prev.currentSkill.trim()],
        currentSkill: "",
      }));
    }
  };

  // handle skill remove
  const removeSkill = (skill) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  // handle form submit
  const handleFilter = async (e) => {
  e.preventDefault();
  setLoading(true);
  setFilters((prev) => ({ ...prev, results: [] }));

  const formData = new FormData();
  resumes.forEach((file) => formData.append("files", file));

  Object.entries(filters).forEach(([key, value]) => {
    if (key !== "skills" && key !== "currentSkill" && value)
      formData.append(key, value);
  });

  if (filters.skills.length > 0)
    formData.append("skills", filters.skills.join(","));

  try {
    const res = await fetch("http://127.0.0.1:8000/admin/filter_uploaded_resumes", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data && data.results) {
  setFilters((prev) => ({ ...prev, results: data.results }));
  alert(`✅ Found ${data.count} matching resumes`);
  setResumes([]);
  setTimeout(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }, 300);
} else {
  alert("❌ No matching resumes found");
}

  } catch (err) {
    console.error("Error filtering resumes:", err);
    alert("⚠️ Error filtering resumes. Check console for details.");
  } finally {
    setLoading(false);
  }
};

const downloadReport = async () => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Resume Filter Report", 14, 20);
  doc.setFontSize(10);

  let y = 30;
  filters.results.forEach((res, index) => {
    doc.text(`${index + 1}. ${res.name || "N/A"} (${res.filename || "-"})`, 14, y);
    y += 6;
    doc.text(
      `CGPA: ${res.education?.bachelor?.cgpa || "-"} | ATS: ${res.ats_score}%`,
      14,
      y
    );
    y += 6;
    doc.text(
      `Skills: ${res.skills?.technical?.slice(0, 4).join(", ") || "-"}`,
      14,
      y
    );
    y += 10;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("Filtered_Resume_Report.pdf");
};

  const activeFiltersCount = [
    filters.cgpa,
    filters.tenth,
    filters.twelfth,
    filters.skills.length > 0,
    filters.language,
    filters.ats,
    filters.department,
    filters.degree
  ].filter(Boolean).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      padding: "0"
    }}>
      {/* Top Navigation Bar */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px 32px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => window.history.back()}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: "600",
                backdropFilter: "blur(10px)"
              }}
            >
              ⬅ Back
            </button>
            <div>
              <h1 style={{ 
                fontSize: "28px", 
                fontWeight: "700", 
                color: "#fff",
                margin: 0
              }}>
                Resume Filter Dashboard
              </h1>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", margin: "4px 0 0 0" }}>
                Upload, filter, and analyze candidate resumes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px" }}>
        
        {/* Stats Cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
          gap: "20px",
          marginBottom: "32px"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "24px",
            borderRadius: "16px",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <Upload size={32} />
              <span style={{ fontSize: "32px", fontWeight: "700" }}>{resumes.length}</span>
            </div>
            <p style={{ fontSize: "14px", opacity: 0.9, margin: 0 }}>Uploaded Resumes</p>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            padding: "24px",
            borderRadius: "16px",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(240, 147, 251, 0.3)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <Filter size={32} />
              <span style={{ fontSize: "32px", fontWeight: "700" }}>{activeFiltersCount}</span>
            </div>
            <p style={{ fontSize: "14px", opacity: 0.9, margin: 0 }}>Active Filters</p>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            padding: "24px",
            borderRadius: "16px",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(79, 172, 254, 0.3)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <Users size={32} />
              <span style={{ fontSize: "32px", fontWeight: "700" }}>{filters.results.length}</span>
            </div>
            <p style={{ fontSize: "14px", opacity: 0.9, margin: 0 }}>Matched Candidates</p>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            padding: "24px",
            borderRadius: "16px",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(67, 233, 123, 0.3)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <Award size={32} />
              <span style={{ fontSize: "32px", fontWeight: "700" }}>
                {filters.results.length > 0 
                  ? Math.round(filters.results.reduce((sum, r) => sum + (r.ats_score || 0), 0) / filters.results.length)
                  : 0}%
              </span>
            </div>
            <p style={{ fontSize: "14px", opacity: 0.9, margin: 0 }}>Avg ATS Score</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", marginBottom: "32px" }}>
          
          {/* Upload Section - Left Sidebar */}
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            height: "fit-content"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "10px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Upload size={20} color="#fff" />
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "#1f2937" }}>
                Upload Files
              </h2>
            </div>

            <div style={{
              border: "2px dashed #cbd5e1",
              borderRadius: "12px",
              padding: "32px 20px",
              textAlign: "center",
              background: "#f8fafc",
              cursor: "pointer",
              transition: "all 0.3s",
              position: "relative"
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = "#667eea"}
            onMouseOut={(e) => e.currentTarget.style.borderColor = "#cbd5e1"}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer"
                }}
              />
              <FileText size={48} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", color: "#64748b", margin: "8px 0" }}>
                <strong style={{ color: "#667eea" }}>Click to upload</strong> or drag and drop
              </p>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                PDF, DOC, DOCX files
              </p>
            </div>

            {resumes.length > 0 && (
              <>
                <div style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "#f0fdf4",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <span style={{ fontSize: "14px", color: "#166534", fontWeight: "600" }}>
                    ✓ {resumes.length} file{resumes.length > 1 ? 's' : ''} selected
                  </span>
                  {resumes.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm("Remove all selected files?"))
                          setResumes([]);
                      }}
                      style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div style={{
                  marginTop: "12px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  {resumes.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        fontSize: "13px",
                        border: "1px solid #e2e8f0"
                      }}
                    >
                      <span style={{ color: "#475569", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📄 {file.name}
                      </span>
                      <X
                        size={16}
                        style={{ cursor: "pointer", color: "#94a3b8", flexShrink: 0, marginLeft: "8px" }}
                        onClick={() => removeFile(file.name)}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filter Panel - Right Side */}
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                padding: "10px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Filter size={20} color="#fff" />
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "#1f2937" }}>
                Filter Criteria
              </h2>
            </div>

            <form onSubmit={handleFilter}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                
                {/* CGPA */}
                <div>
                  <label style={{
                    display: "block",
                    color: "#475569",
                    marginBottom: "8px",
                    fontWeight: "600",
                    fontSize: "13px"
                  }}>
                    📊 Minimum CGPA
                  </label>
                  <input
                    type="number"
                    name="cgpa"
                    step="0.01"
                    min="0"
                    max="10"
                    value={filters.cgpa}
                    onChange={handleChange}
                    style={{
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      width: "100%",
                      fontSize: "14px",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                    placeholder="e.g., 7.5"
                  />
                </div>

                {/* 10th */}
                <div>
                  <label style={{
                    display: "block",
                    color: "#475569",
                    marginBottom: "8px",
                    fontWeight: "600",
                    fontSize: "13px"
                  }}>
                    📈 10th Percentage
                  </label>
                  <input
                    type="number"
                    name="tenth"
                    value={filters.tenth}
                    onChange={handleChange}
                    style={{
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      width: "100%",
                      fontSize: "14px",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                    placeholder="e.g., 85"
                  />
                </div>

                {/* 12th */}
                <div>
                  <label style={{
                    display: "block",
                    color: "#475569",
                    marginBottom: "8px",
                    fontWeight: "600",
                    fontSize: "13px"
                  }}>
                    📈 12th Percentage
                  </label>
                  <input
                    type="number"
                    name="twelfth"
                    value={filters.twelfth}
                    onChange={handleChange}
                    style={{
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      width: "100%",
                      fontSize: "14px",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                    placeholder="e.g., 90"
                  />
                </div>

                {/* ATS Score */}
                <div>
                  <label style={{
                    display: "block",
                    color: "#475569",
                    marginBottom: "8px",
                    fontWeight: "600",
                    fontSize: "13px"
                  }}>
                    🎯 Minimum ATS Score
                  </label>
                  <input
                    type="number"
                    name="ats"
                    value={filters.ats}
                    onChange={handleChange}
                    style={{
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      width: "100%",
                      fontSize: "14px",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                    placeholder="e.g., 75"
                  />
                </div>

                {/* Department */}
                <div>
                  <label style={{
                    display: "block",
                    color: "#475569",
                    marginBottom: "8px",
                    fontWeight: "600",
                    fontSize: "13px"
                  }}>
                    🏫 Department
                  </label>
                  <input
                    list="departments"
                    name="department"
                    value={filters.department}
                    onChange={handleChange}
                    placeholder="Select or type"
                    style={{
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      width: "100%",
                      fontSize: "14px",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  />
                  <datalist id="departments">
                    <option value="Computer Science and Engineering">CSE</option>
                    <option value="Artificial Intelligence and Data Science">AIDS</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics and Communication Engineering">ECE</option>
                    <option value="Electrical and Electronics Engineering">EEE</option>
                    <option value="Electronics and Instrumentation Engineering">EIE</option>
                    <option value="Mechanical Engineering">MECH</option>
                    <option value="Mechatronics Engineering">MCT</option>
                    <option value="Automobile Engineering">AUTO</option>
                    <option value="Civil Engineering">CIVIL</option>
                    <option value="Agricultural Engineering">AGRI</option>
                    <option value="Chemical Engineering">CHEM</option>
                    <option value="Bio-Technology">BT</option>
                    <option value="Textile Technology">TEXTILE</option>
                    <option value="Fashion Technology">FT</option>
                    <option value="Food Technology">FOOD</option>
                    <option value="Robotics and Automation">RA</option>
                    <option value="Computer Science and Business Systems">CSBS</option>
                  </datalist>
                </div>

                {/* Degree */}
                <div>
                  <label style={{
                    display: "block",
                    color: "#475569",
                    marginBottom: "8px",
                    fontWeight: "600",
                    fontSize: "13px"
                  }}>
                    🎓 Degree
                  </label>
                  <select
                    name="degree"
                    value={filters.degree}
                    onChange={handleChange}
                    style={{
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      width: "100%",
                      fontSize: "14px",
                      background: "#fff",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  >
                    <option value="">Select Degree</option>
                    <option value="B.E">B.E</option>
                    <option value="B.Tech">B.Tech</option>
                  </select>
                </div>
              </div>

              {/* Skills - Full Width */}
              <div style={{ marginTop: "20px" }}>
                <label style={{
                  display: "block",
                  color: "#475569",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "13px"
                }}>
                  🛠️ Required Skills
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    name="currentSkill"
                    value={filters.currentSkill}
                    onChange={handleChange}
                    placeholder="Type a skill and press +"
                    style={{
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      flex: 1,
                      fontSize: "14px"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    style={{
                      padding: "10px 16px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "#fff",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>

                {filters.skills.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                    {filters.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "#fff",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        {skill}
                        <X
                          size={14}
                          onClick={() => removeSkill(skill)}
                          style={{ cursor: "pointer" }}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Language */}
              <div style={{ marginTop: "20px" }}>
                <label style={{
                  display: "block",
                  color: "#475569",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "13px"
                }}>
                  🗣️ Human Language
                </label>
                <input
                  type="text"
                  name="language"
                  value={filters.language}
                  onChange={handleChange}
                  placeholder="e.g., English, Tamil"
                  style={{
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    width: "100%",
                    fontSize: "14px"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>

              {/* Action Buttons */}
              <div style={{
                display: "flex",
                gap: "12px",
                marginTop: "28px",
                paddingTop: "24px",
                borderTop: "2px solid #f1f5f9"
              }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "14px 24px",
                    background: loading ? "#cbd5e1" : "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                    color: "#fff",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: "700",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "15px",
                    boxShadow: loading ? "none" : "0 4px 12px rgba(67, 233, 123, 0.3)"
                  }}
                >
                  {loading ? "⏳ Filtering..." : "✅ Apply Filters"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilters({
                      cgpa: "",
                      tenth: "",
                      twelfth: "",
                      skills: [],
                      currentSkill: "",
                      language: "",
                      ats: "",
                      department: "",
                      degree: "",
                      results: [],
                    });
                    setResumes([]);
                  }}
                  style={{
                    padding: "14px 24px",
                    background: "#fff",
                    color: "#64748b",
                    borderRadius: "10px",
                    border: "2px solid #e2e8f0",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "15px"
                  }}
                >
                  🔄 Clear All
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results Section */}
        {filters.results && filters.results.length > 0 ? (
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            padding: "24px"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  padding: "10px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Users size={20} color="#fff" />
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "#1f2937" }}>
                  Filtered Results ({filters.results.length})
                </h2>
              </div>
              <button
                onClick={downloadReport}
                style={{   
                  background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  boxShadow: "0 4px 12px rgba(67, 233, 123, 0.3)"
                }}
              >
                💾 Save as PDF
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th
                      style={{
                        border: "1px solid #e2e8f0",
                        padding: "14px",
                        textAlign: "left",
                        fontWeight: "700",
                        color: "#1f2937",
                        fontSize: "13px"
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        border: "1px solid #e2e8f0",
                        padding: "14px",
                        textAlign: "left",
                        fontWeight: "700",
                        color: "#1f2937",
                        fontSize: "13px"
                      }}
                    >
                      Filename
                    </th>
                    <th
                      style={{
                        border: "1px solid #e2e8f0",
                        padding: "14px",
                        textAlign: "left",
                        fontWeight: "700",
                        color: "#1f2937",
                        fontSize: "13px"
                      }}
                    >
                      Department
                    </th>
                    <th
                      style={{
                        border: "1px solid #e2e8f0",
                        padding: "14px",
                        textAlign: "left",
                        fontWeight: "700",
                        color: "#1f2937",
                        fontSize: "13px"
                      }}
                    >
                      CGPA
                    </th>
                    <th
                      style={{
                        border: "1px solid #e2e8f0",
                        padding: "14px",
                        textAlign: "left",
                        fontWeight: "700",
                        color: "#1f2937",
                        fontSize: "13px"
                      }}
                    >
                      ATS Score
                    </th>
                    <th
                      style={{
                        border: "1px solid #e2e8f0",
                        padding: "14px",
                        textAlign: "left",
                        fontWeight: "700",
                        color: "#1f2937",
                        fontSize: "13px"
                      }}
                    >
                      Languages
                    </th>
                    <th
                      style={{
                        border: "1px solid #e2e8f0",
                        padding: "14px",
                        textAlign: "left",
                        fontWeight: "700",
                        color: "#1f2937",
                        fontSize: "13px"
                      }}
                    >
                      Key Skills
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filters.results.map((res, idx) => (
                    <tr
                      key={idx}
                      style={{
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#f8fafc")
                      }
                      onMouseOut={(e) => (e.currentTarget.style.background = "#fff")}
                    >
                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          padding: "14px",
                          color: "#1f2937",
                        }}
                      >
                        <a
                          href={res.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#667eea",
                            textDecoration: "none",
                            fontWeight: "600",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                          onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
                        >
                          {res.name || "N/A"}
                        </a>
                      </td>

                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          padding: "14px",
                        }}
                      >
                        {res.file_url ? (
                          <a
                            href={res.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#667eea",
                              fontWeight: "600",
                              textDecoration: "none",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.textDecoration = "underline")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.textDecoration = "none")
                            }
                          >
                            {res.filename}
                          </a>
                        ) : (
                          res.filename || "N/A"
                        )}
                      </td>

                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          padding: "14px",
                          color: "#64748b",
                        }}
                      >
                        {res.education?.bachelor?.degree || "-"}
                      </td>

                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          padding: "14px",
                          color: "#1f2937",
                          fontWeight: "600"
                        }}
                      >
                        {res.education?.bachelor?.cgpa || "-"}
                      </td>

                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          padding: "14px",
                        }}
                      >
                        <span
                          style={{
                            background:
                              res.ats_score >= 75
                                ? "#d1fae5"
                                : res.ats_score >= 50
                                ? "#fef3c7"
                                : "#fee2e2",
                            color:
                              res.ats_score >= 75
                                ? "#065f46"
                                : res.ats_score >= 50
                                ? "#92400e"
                                : "#991b1b",
                            padding: "6px 12px",
                            borderRadius: "16px",
                            fontWeight: "700",
                            fontSize: "12px",
                            display: "inline-block"
                          }}
                        >
                          {res.ats_score}%
                        </span>
                      </td>

                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          padding: "14px",
                          color: "#64748b",
                        }}
                      >
                        {res.languages?.join(", ") || "-"}
                      </td>

                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          padding: "14px",
                          color: "#64748b",
                        }}
                      >
                        {res.skills?.technical?.slice(0, 4).join(", ") || "-"}
                        {res.skills?.technical?.length > 4 && "..."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: "20px",
                borderTop: "2px solid #f1f5f9",
                paddingTop: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "14px",
                color: "#64748b",
              }}
            >
              <span>
                📄 Total Results:{" "}
                <strong style={{ color: "#1f2937", fontWeight: "700" }}>{filters.results.length}</strong>
              </span>                
            </div>
          </div>
        ) : (
          !loading && (
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                textAlign: "center",
                padding: "60px 20px",
                color: "#94a3b8",
                fontSize: "14px",
              }}
            >
              <div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.5 }}>📭</div>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#475569", margin: "0 0 8px 0" }}>
                No Results Found
              </h3>
              <p style={{ margin: "0 0 4px 0" }}>No resumes matched your filter criteria.</p>
              <p style={{ fontSize: "13px", margin: 0, color: "#94a3b8" }}>
                Try adjusting your filters or upload new resumes to get started.
              </p>
            </div>
          )
        )}

      </div>
    </div>
  );
};

export default Trainer;