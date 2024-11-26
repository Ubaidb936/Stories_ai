import React, { useState } from 'react';
import '../App.css'; // Assuming your CSS is in App.css
import {useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./Firebase.js";

const Login = () => {
   
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  

  async function login(email, password) {
    try {
      setLoading(true)
      // Authenticate user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Get the Firebase ID token
      const idToken = await userCredential.user.getIdToken();
  
      // Send the ID token to the server
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
  
      const data = await response.json();

      if (data.message == "Request under review."){
        setMessage("Your request is under review");
        return;
      }
      setLoading(false)
      if (data.role == "user"){
          navigate("/main");
      }else{
          navigate("/familyview");
      }

    } catch (error) {
      if (error.message === "Firebase: Error (auth/invalid-credential)."){
         error.message = "Invalid User Credentials."
      }
      setErrorMessage(error.message);
    }finally {
      setLoading(false); // Stop loading
    }
  }

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email.includes("@")){
      setErrorMessage('Please enter a valid email.');
      return;
    }

    if (password.length < 8){
      setErrorMessage('Password should be atleast 8 characters.');
      return;
    }

    setErrorMessage('');
    login(email, password)

   
    
  };

  return (
    <div className="login-container">
      <div className="header">
        <h1 className="product-name">kitchentable.ai</h1>
      </div>

      {!message ? ( 
      <div className="login-box">
        <h2 className="login-header">Login</h2>
        <form onSubmit={handleLogin}>

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
              {loading ? "Logging in..." : "Login"}
          </button> 
        </form>
        {loading && <div className="spinner"></div>} {/* Spinner */}
          <p className="login-prompt">
            Don't have an account?{" "}
            <span
              className="login-link"
              onClick={() => navigate(-1)} // Redirect to login page
            >
                SignUp
            </span>
        </p>
      </div>

      ): (
          <div className="waitlist-message">
            {message}
          </div>
        )}
      
      
    </div>
  );
};

export default Login;
