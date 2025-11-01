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
  results: [], // ✅ add this
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
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Resume Filter Dashboard
      </h1>

      {/* Upload Resumes */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold mb-3">Upload Resumes</h2>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="border border-gray-300 rounded-lg p-2 w-full"
        />
      {filters.results && (
          <p className="text-sm text-gray-500 mt-2">
            {resumes.length} file(s) selected
          </p>
        )}
      </div>

      {/* Filter Section */}
      <form
        onSubmit={handleFilter}
        className="bg-white rounded-2xl shadow-md p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold mb-4">Filter Options</h2>

        {/* CGPA */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">CGPA</label>
          <input
            type="number"
            name="cgpa"
            step="0.01"
            min="0"
            max="10"
            value={filters.cgpa}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 w-full"
          />
        </div>

        {/* 10th and 12th percentage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-1 font-medium">
              10th Percentage
            </label>
            <input
              type="number"
              name="tenth"
              value={filters.tenth}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 w-full"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-medium">
              12th Percentage
            </label>
            <input
              type="number"
              name="twelfth"
              value={filters.twelfth}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 w-full"
            />
          </div>
        </div>

        {/* Skills Input */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">Skills</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="currentSkill"
              value={filters.currentSkill}
              onChange={handleChange}
              placeholder="Type a skill and press +"
              className="border border-gray-300 rounded-lg p-2 flex-grow"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <PlusCircle size={20} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {filters.skills.map((skill, idx) => (
              <span
                key={idx}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1"
              >
                {skill}
                <X
                  size={14}
                  onClick={() => removeSkill(skill)}
                  className="cursor-pointer"
                />
              </span>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">
            Human Language
          </label>
          <input
            type="text"
            name="language"
            value={filters.language}
            onChange={handleChange}
            placeholder="e.g., English, Tamil"
            className="border border-gray-300 rounded-lg p-2 w-full"
          />
        </div>

        {/* ATS Score */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">
            Minimum ATS Score
          </label>
          <input
            type="number"
            name="ats"
            value={filters.ats}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 w-full"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">
            Department
          </label>
          <input
            type="text"
            name="department"
            value={filters.department}
            onChange={handleChange}
            placeholder="e.g., CSE, ECE"
            className="border border-gray-300 rounded-lg p-2 w-full"
          />
        </div>

        {/* Degree */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">Degree</label>
          <select
            name="degree"
            value={filters.degree}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 w-full"
          >
            <option value="">Select</option>
            <option value="B.E">B.E</option>
            <option value="B.Tech">B.Tech</option>
          </select>
        </div>
<div className="flex justify-center gap-4 pt-4">
  <button
    type="submit"
    className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
  >
    Apply Filters
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
    className="px-6 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
  >
    Clear Filters
  </button>
</div>

      </form>{/* Results Section */}
{resumes.length > 0 && (
  <div className="bg-white rounded-2xl shadow-md p-6 mt-8">
    <h2 className="text-lg font-semibold mb-3">Filtered Results</h2>
    {filters.results && filters.results.length > 0 ? (
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-3 py-2 text-left">Name</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Filename</th>
            <th className="border border-gray-300 px-3 py-2 text-left">CGPA</th>
            <th className="border border-gray-300 px-3 py-2 text-left">ATS Score</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Languages</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Key Skills</th>
          </tr>
        </thead>
        <tbody>
          {filters.results.map((res, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2">{res.name || "N/A"}</td>
              <td className="border border-gray-300 px-3 py-2">{res.filename}</td>
              <td className="border border-gray-300 px-3 py-2">
                {res.education?.cgpa || "-"}
              </td>
              <td className="border border-gray-300 px-3 py-2">{res.ats_score}</td>
              <td className="border border-gray-300 px-3 py-2">
                {res.languages?.join(", ") || "-"}
              </td>
              <td className="border border-gray-300 px-3 py-2">
                {res.skills?.technical?.join(", ") || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="text-gray-500">No resumes matched your filters.</p>
    )}
  </div>
)}

    </div>
  );
};

export default Admin_Resume_Filter;
