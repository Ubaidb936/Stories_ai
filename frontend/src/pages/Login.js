import React, { useState } from 'react';
import '../App.css'; // Assuming your CSS is in App.css
import {useNavigate } from "react-router-dom";

const Login = () => {
  
  const [role, setRole] = useState('');  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (role === '') {
      setErrorMessage('Please select a role.');
      return;
    }
    setErrorMessage('');
    if (role == 'user'){
       navigate('/main') 
    }else{
      navigate('/familyview') 
    }
    
  };

  return (
    <div className="login-container">
      <div className="header">
        <h1 className="product-name">kitchentable.ai</h1>
      </div>
      <div className="login-box">
        <h2 className="login-header">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="username">Select Role</label>
            <select 
              id="username" 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              className="input-field"
            >
              <option value="">Select...</option>
              <option value="user">User</option>
              <option value="family">Family</option>
            </select>
          </div>

          {/* <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="input-field"
              placeholder="Enter your password"
            />
          </div> */}
          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <button type="submit" className="login-button">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
