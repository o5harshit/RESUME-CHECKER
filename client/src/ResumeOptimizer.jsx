import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "./supbase/supbaseClient";

const ResumeOptimizer = () => {
  const [file, setFile] = useState(null);
  const [jobUrl, setJobUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);

  // Check session on mount
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) console.error("Google Sign-In Error:", error);
  };

  // Handle Logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout Error:", error);
    else setUser(null);
  };

  const handleFileChange = (event) => {
    if (event.target.files.length) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !jobUrl) {
      alert("Please upload a resume and enter a job URL.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobUrl", jobUrl);

    try {
      const response = await axios.post(
        import.meta.env.VITE_BACKEND_URL,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setResult(response.data);
    } catch (error) {
      console.error("Error analyzing resume:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-10">
      {/* Navbar */}
      <header className="flex justify-between items-center w-full px-6 py-4 bg-black text-white">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Resume Optimizer</h1>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <p className="text-gray-300">
              Welcome, <span className="font-bold">{user.email}</span>
            </p>
          )}
          <button
            onClick={user ? handleLogout : handleGoogleSignIn}
            className={`px-4 py-2 rounded-md ${
              user ? "bg-red-500" : "bg-blue-600"
            }`}
          >
            {user ? "Logout" : "Sign in with Google"}
          </button>
        </div>
      </header>
      <hr className="w-full border-gray-700 border-t-2 my-4" />
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mt-8"
      >
        <h1 className="text-4xl font-bold">Resume Optimizer</h1>
        <p className="text-gray-400 mt-2">
          Enhance your resume for job applications
        </p>
      </motion.div>

      {/* Flex Container for Form & Analysis */}
      <div className="mt-6 w-full px-6 lg:flex lg:justify-center lg:space-x-8">
        {/* Upload Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <Card className="bg-gray-900 border border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-white cursor-pointer">
                Upload Resume & Job URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-white font-bold py-3 cursor-pointer">
                    Upload Your Resume
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="bg-gray-800 border-gray-600 text-white  px-3 py-2  rounded-md cursor-pointer"
                  />
                </div>
                <div>
                  <Label className="text-white text-xl font-bold py-3">
                    Job Posting URL
                  </Label>
                  <Input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="Enter job listing URL"
                    className="bg-gray-800 border-gray-600 text-white px-3 py-2  rounded-md cursor-pointer"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  disabled={loading}
                >
                  {loading ? "Analyzing..." : "Analyze Resume"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analysis Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-3xl mt-8 lg:mt-0"
          >
            <Card className="bg-gray-900 border border-gray-700 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  Analysis Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-white">
                    <strong>Suitability Score:</strong>{" "}
                    <span className="text-blue-400">{result.score}%</span>
                  </p>
                  <p className="text-white">
                    <strong>Suggestions:</strong>
                  </p>
                  <div className="bg-gray-800 p-4 rounded-md border border-gray-600">
                    {result.suggestions.split("\n").map((suggestion, index) => (
                      <p key={index} className="text-gray-300">
                        • {suggestion}
                      </p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ResumeOptimizer;
