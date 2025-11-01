import React, { useState } from "react";
import { X, PlusCircle } from "lucide-react";

const Admin_Resume_Filter = () => {
    
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
    setResumes(files);
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
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #e3f2fd 0%, #e8f5e9 50%, #fce4ec 100%)",
      padding: "24px"
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <header style={{ marginBottom: "24px" }}>
          <h1 style={{ 
            fontSize: "28px", 
            fontWeight: "700", 
            color: "#1a237e",
            marginBottom: "8px"
          }}>
            📊 Resume Filter Dashboard
          </h1>
          <p style={{ color: "#4b5563", fontSize: "15px" }}>
            Upload multiple resumes and apply intelligent filters to find the best candidates
          </p>
        </header>

        {/* Upload Resumes */}
        <div style={{
          background: "linear-gradient(90deg, #1e90ff, #3a7bd5)",
          color: "#fff",
          padding: "24px",
          borderRadius: "14px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
          marginBottom: "24px"
        }}>
          <h2 style={{ 
            fontSize: "18px", 
            fontWeight: "700",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            📤 Upload Resumes
          </h2>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "2px dashed rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              width: "100%",
              cursor: "pointer"
            }}
          />
          {resumes.length > 0 && (
            <p style={{
              marginTop: "12px",
              fontSize: "13px",
              fontWeight: "600",
              background: "rgba(255,255,255,0.2)",
              padding: "8px 12px",
              borderRadius: "6px",
              display: "inline-block"
            }}>
              ✓ {resumes.length} file(s) selected
            </p>
          )}
        </div>

        {/* Filter Section */}
        <form
          onSubmit={handleFilter}
          style={{
            background: "#fff",
            borderRadius: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            padding: "24px"
          }}
        >
          <h2 style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#1f2937",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            🎯 Filter Options
          </h2>

          <div style={{ display: "grid", gap: "20px" }}>
            {/* CGPA */}
            <div>
              <label style={{
                display: "block",
                color: "#374151",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px"
              }}>
                📊 CGPA (Minimum)
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
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  width: "100%",
                  fontSize: "14px"
                }}
                placeholder="e.g., 7.5"
              />
            </div>

            {/* 10th and 12th percentage */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{
                  display: "block",
                  color: "#374151",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px"
                }}>
                  📈 10th Percentage (Minimum)
                </label>
                <input
                  type="number"
                  name="tenth"
                  value={filters.tenth}
                  onChange={handleChange}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    width: "100%",
                    fontSize: "14px"
                  }}
                  placeholder="e.g., 85"
                />
              </div>
              <div>
                <label style={{
                  display: "block",
                  color: "#374151",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px"
                }}>
                  📈 12th Percentage (Minimum)
                </label>
                <input
                  type="number"
                  name="twelfth"
                  value={filters.twelfth}
                  onChange={handleChange}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    width: "100%",
                    fontSize: "14px"
                  }}
                  placeholder="e.g., 90"
                />
              </div>
            </div>

            {/* Skills Input */}
            <div>
              <label style={{
                display: "block",
                color: "#374151",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px"
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
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    flex: 1,
                    fontSize: "14px"
                  }}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  style={{
                    padding: "10px 14px",
                    background: "#3b82f6",
                    color: "#fff",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.target.style.background = "#2563eb"}
                  onMouseOut={(e) => e.target.style.background = "#3b82f6"}
                >
                  <PlusCircle size={20} />
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                {filters.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "#dbeafe",
                      color: "#1e40af",
                      padding: "6px 14px",
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
            </div>

            {/* Language */}
            <div>
              <label style={{
                display: "block",
                color: "#374151",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px"
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
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  width: "100%",
                  fontSize: "14px"
                }}
              />
            </div>

            {/* ATS Score */}
            <div>
              <label style={{
                display: "block",
                color: "#374151",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px"
              }}>
                🎯 Minimum ATS Score
              </label>
              <input
                type="number"
                name="ats"
                value={filters.ats}
                onChange={handleChange}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  width: "100%",
                  fontSize: "14px"
                }}
                placeholder="e.g., 75"
              />
            </div>

            {/* Department and Degree */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{
                  display: "block",
                  color: "#374151",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px"
                }}>
                  🏫 Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={filters.department}
                  onChange={handleChange}
                  placeholder="e.g., CSE, ECE"
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    width: "100%",
                    fontSize: "14px"
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: "block",
                  color: "#374151",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px"
                }}>
                  🎓 Degree
                </label>
                <select
                  name="degree"
                  value={filters.degree}
                  onChange={handleChange}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    width: "100%",
                    fontSize: "14px",
                    background: "#fff"
                  }}
                >
                  <option value="">Select Degree</option>
                  <option value="B.E">B.E</option>
                  <option value="B.Tech">B.Tech</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid #e5e7eb"
          }}>
            <button
              type="submit"
              style={{
                padding: "12px 24px",
                background: "#10b981",
                color: "#fff",
                borderRadius: "8px",
                border: "none",
                fontWeight: "700",
                cursor: "pointer",
                fontSize: "14px",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.target.style.background = "#059669"}
              onMouseOut={(e) => e.target.style.background = "#10b981"}
            >
              ✅ Apply Filters
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
                padding: "12px 24px",
                background: "#6b7280",
                color: "#fff",
                borderRadius: "8px",
                border: "none",
                fontWeight: "700",
                cursor: "pointer",
                fontSize: "14px",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.target.style.background = "#4b5563"}
              onMouseOut={(e) => e.target.style.background = "#6b7280"}
            >
              🔄 Clear Filters
            </button>
          </div>
        </form>

        {/* Results Section */}
        {resumes.length > 0 && (
          <div style={{
            background: "#fff",
            borderRadius: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            padding: "24px",
            marginTop: "24px"
          }}>
            <h2 style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              📋 Filtered Results
            </h2>
            {filters.results && filters.results.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px"
                }}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      <th style={{
                        border: "1px solid #e5e7eb",
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#374151"
                      }}>Name</th>
                      <th style={{
                        border: "1px solid #e5e7eb",
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#374151"
                      }}>Filename</th>
                      <th style={{
                        border: "1px solid #e5e7eb",
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#374151"
                      }}>CGPA</th>
                      <th style={{
                        border: "1px solid #e5e7eb",
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#374151"
                      }}>ATS Score</th>
                      <th style={{
                        border: "1px solid #e5e7eb",
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#374151"
                      }}>Languages</th>
                      <th style={{
                        border: "1px solid #e5e7eb",
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#374151"
                      }}>Key Skills</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filters.results.map((res, idx) => (
                      <tr key={idx} style={{
                        transition: "background 0.2s"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = "#f9fafb"}
                      onMouseOut={(e) => e.currentTarget.style.background = "#fff"}>
                        <td style={{
                          border: "1px solid #e5e7eb",
                          padding: "12px",
                          color: "#1f2937"
                        }}>{res.name || "N/A"}</td>
                        <td style={{
                          border: "1px solid #e5e7eb",
                          padding: "12px",
                          color: "#1f2937"
                        }}>{res.filename}</td>
                        <td style={{
                          border: "1px solid #e5e7eb",
                          padding: "12px",
                          color: "#1f2937"
                        }}>
                          {res.education?.cgpa || "-"}
                        </td>
                        <td style={{
                          border: "1px solid #e5e7eb",
                          padding: "12px"
                        }}>
                          <span style={{
                            background: res.ats_score >= 75 ? "#d1fae5" : res.ats_score >= 50 ? "#fef3c7" : "#fee2e2",
                            color: res.ats_score >= 75 ? "#065f46" : res.ats_score >= 50 ? "#92400e" : "#991b1b",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontWeight: "600",
                            fontSize: "12px"
                          }}>
                            {res.ats_score}%
                          </span>
                        </td>
                        <td style={{
                          border: "1px solid #e5e7eb",
                          padding: "12px",
                          color: "#4b5563"
                        }}>
                          {res.languages?.join(", ") || "-"}
                        </td>
                        <td style={{
                          border: "1px solid #e5e7eb",
                          padding: "12px",
                          color: "#4b5563"
                        }}>
                          {res.skills?.technical?.slice(0, 3).join(", ") || "-"}
                          {res.skills?.technical?.length > 3 && "..."}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#9ca3af",
                fontSize: "14px"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
                <p>No resumes matched your filters.</p>
                <p style={{ fontSize: "13px", marginTop: "8px" }}>Try adjusting your filter criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin_Resume_Filter;