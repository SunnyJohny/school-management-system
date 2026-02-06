import { useEffect, useState } from "react";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { useMyContext } from "../Context/MyContext";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function SignIn() {
  const { state, setState, updateSelectedSchool } = useMyContext();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    schoolName: "",
    schoolId: "",
  });

  const { email, password, schoolName, schoolId } = formData;
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent back navigation by redirecting to the home page
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = () => {
      navigate("/", { replace: true });
    };
  }, [navigate]);

  function onChange(e) {
    const { id, value } = e.target;

    setFormData((prevState) => ({
      ...prevState,
      [id]: value,
    }));

    if (id === "schoolName") {
      const selectedSchool = (state.schools || []).find(
        (school) => school.schoolName === value
      );

      if (selectedSchool) {
        updateSelectedSchool(value, selectedSchool.id);

        setFormData((prevState) => ({
          ...prevState,
          schoolId: selectedSchool.id,
        }));
      }
    }
  }

  async function onSubmit(e) {
    e.preventDefault();

    try {
      if (!schoolId) {
        toast.error("Please select a school before signing in.");
        return;
      }

      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        // ✅ IMPORTANT FIX:
        // Try (1) UID-doc lookup (new correct format)
        // If not found, fallback to (2) query by authUid/email (for old docs saved with Date.now ids)
        const userData = await getUserData(userCredential.user);

        if (userData) {
          setState((prevState) => ({
            ...prevState,
            user: userData,
          }));

          // normalize role checks (some are Admin/admin)
          const roleLower = (userData.role || "").toLowerCase();

          if (roleLower === "admin") {
            navigate("/posscreen");
          } else {
            navigate("/posscreen");
          }
        } else {
          toast.warning(
            "Signed in, but your staff record was not found for this school. Contact admin to add you to the school users list."
          );
        }
      }
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        toast.error("No user found with this email. Please check your email or sign up.");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password. Please try again.");
      } else if (error.code === "auth/invalid-credential") {
        toast.error("Invalid login details. Please check email and password.");
      } else {
        toast.error("Failed to sign in. Please try again later.");
      }
    }
  }

  // ✅ FIXED: supports BOTH storage styles:
  // A) docId == auth.uid  (recommended)
  // B) docId == Date.now  (old) => query by authUid or email
  async function getUserData(authUser) {
    try {
      if (!schoolId) return null;

      // (1) New recommended: doc id is auth.uid
      const userDocRef = doc(db, "schools", schoolId, "users", authUser.uid);
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        return { id: userDocSnapshot.id, ...userDocSnapshot.data() };
      }

      // (2) Fallback for old records where docId is random: query by authUid
      const usersCol = collection(db, "schools", schoolId, "users");
      const q1 = query(usersCol, where("authUid", "==", authUser.uid));
      const snap1 = await getDocs(q1);

      if (!snap1.empty) {
        const d = snap1.docs[0];
        return { id: d.id, ...d.data() };
      }

      // (3) Fallback: query by email (last resort)
      const q2 = query(usersCol, where("email", "==", authUser.email || ""));
      const snap2 = await getDocs(q2);

      if (!snap2.empty) {
        const d = snap2.docs[0];
        return { id: d.id, ...d.data() };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mt-6">
        <h1 className="text-3xl font-bold text-center flex-1">Sign In</h1>
      </div>

      <div className="flex justify-center flex-wrap items-center px-6 py-12 max-w-6xl mx-auto">
        <div className="md:w-[67%] lg:w-[50%] mb-12 md:mb-6">
          <img
            src="https://images.unsplash.com/flagged/photo-1564767609342-620cb19b2357?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1373&q=80"
            alt="key"
            className="w-full rounded-2xl"
          />
        </div>

        <div className="w-full md:w-[67%] lg:w-[40%] lg:ml-20">
          <form onSubmit={onSubmit}>
            <input
              type="email"
              id="email"
              value={email}
              onChange={onChange}
              placeholder="Email address"
              className="mb-6 w-full px-4 py-2 text-xl text-gray-700 bg-white border-gray-300 rounded transition ease-in-out"
              required
            />

            <div className="relative mb-6">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={onChange}
                placeholder="Password"
                className="w-full px-4 py-2 text-xl text-gray-700 bg-white border-gray-300 rounded transition ease-in-out"
                required
              />
              {showPassword ? (
                <AiFillEyeInvisible
                  className="absolute right-3 top-3 text-xl cursor-pointer"
                  onClick={() => setShowPassword((prev) => !prev)}
                />
              ) : (
                <AiFillEye
                  className="absolute right-3 top-3 text-xl cursor-pointer"
                  onClick={() => setShowPassword((prev) => !prev)}
                />
              )}
            </div>

            <select
              id="schoolName"
              value={schoolName}
              onChange={onChange}
              className="mb-6 w-full px-4 py-2 text-xl text-gray-700 bg-white border-gray-300 rounded transition ease-in-out"
              required
            >
              <option value="">Select School</option>
              {(state.schools || []).map((school) => (
                <option
                  key={school.id}
                  value={school.schoolName}
                  disabled={schoolName && school.schoolName !== schoolName}
                >
                  {school.schoolName}
                </option>
              ))}
            </select>

            <div className="flex justify-between whitespace-nowrap text-sm sm:text-lg">
              <p className="mb-6">
                Don't have an account?
                <button
                  type="button"
                  className="text-red-600 hover:text-red-700 transition duration-200 ease-in-out ml-1 underline"
                  onClick={() => {
                    const pass = prompt("Enter authorization password to proceed:");
                    if (pass === "deancoonz28@john") {
                      navigate("/school-sign-up");
                    } else {
                      alert("Wrong authorization password. Access denied.");
                    }
                  }}
                >
                  Register
                </button>
              </p>

              <p>
                <Link
                  to="/forgot-password"
                  className="text-blue-600 hover:text-blue-800 transition duration-200 ease-in-out"
                >
                  Forgot password?
                </Link>
              </p>
            </div>

            <button
              className="w-full bg-blue-600 text-white px-7 py-3 text-sm font-medium uppercase rounded shadow-md hover:bg-blue-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-blue-800"
              type="submit"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
