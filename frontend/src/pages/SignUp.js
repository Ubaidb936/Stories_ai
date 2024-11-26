import React, { useState } from 'react';
import '../App.css'; // Assuming your CSS is in App.css
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./Firebase.js";

const SignUp = () => {
  const [role, setRole] = useState('');  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // New loading state
  const navigate = useNavigate();
  
  async function signup(email, password, role) {
    try {
      setLoading(true); // Start loading
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const idToken = await user.getIdToken();
      
      const response = await fetch("/signUp", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json", // Specify JSON content type
        },
        body: JSON.stringify({
          email: email,
          role: role,
        }),
      });

      setMessage("Thanks for Signing Up! 🙌  Your request is currently under review. You’ll be able to log in as soon as it’s approved.");
    } catch (error) {
      if (error.message === "Firebase: Error (auth/email-already-in-use).") {
        error.message = "Email is already in use. Please sign in.";
      }
      setErrorMessage(error.message);
    } finally {
      setLoading(false); // Stop loading
    }
  }

  const handleSignUp = (e) => {
    e.preventDefault();
    if (role === '') {
      setErrorMessage('Please select a role.');
      return;
    }
    if (!email.includes("@")) {
      setErrorMessage('Please enter a valid email.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password should be at least 8 characters.');
      return;
    }

    setErrorMessage('');
    signup(email, password, role);
  };

  return (
    <div className="login-container">
      <div className="header">
        <h1 className="product-name">kitchentable.ai</h1>
      </div>
      
      {!message ? (
        <div className="login-box">
          <h2 className="login-header">SignUp</h2>
          <form onSubmit={handleSignUp}>
            <div className="input-group">
              <label htmlFor="role">Select Role</label>
              <select 
                id="role" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                className="input-field"
              >
                <option value="">Select...</option>
                <option value="user">User</option>
                <option value="family">Family</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter your email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="input-field"
                placeholder="Enter your password"
              />
            </div>
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Signing Up..." : "SignUp"}
            </button>
          </form>
          {loading && <div className="spinner"></div>} {/* Spinner */}
          <p className="login-prompt">
            Already have an account?{" "}
            <span
              className="login-link"
              onClick={() => navigate("/login")} // Redirect to login page
            >
              Login
            </span>
          </p>
        </div>
      ) : (
        <div className="waitlist-message">
          {message}
        </div>
      )}
    </div>
  );
};

export default SignUp;