import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css'; // FontAwesome for icons

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chatEndRef = useRef(null); // Ref for the end of the chat window

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, sender: 'user' }]);
      setInput('');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        // Send the image to the FastAPI backend
        const response = await fetch('http://127.0.0.1:8000/upload-photo', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data.info); // Output: file upload confirmation

          // Display the uploaded image in the chat
          const reader = new FileReader();
          reader.onloadend = () => {
            setMessages([...messages, { image: reader.result, sender: 'user' }]);
          };
          reader.readAsDataURL(file);
        } else {
          console.error('Failed to upload file');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunks);
      const audioURL = URL.createObjectURL(audioBlob);
      setMessages([...messages, { text: 'Audio recorded', sender: 'user', audio: audioURL }]);
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  useEffect(() => {
    // Scroll to the bottom of the chat window
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]); // Runs whenever messages change

  return (
    <div className="chatgpt-container">
      <div className="chat-window">
        {recording && <div className="recording-popup">Recording...</div>}
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.text && <p>{message.text}</p>}
            {message.image && <img src={message.image} alt="uploaded" className="uploaded-image" />}
            {message.audio && <audio controls src={message.audio} />}
          </div>
        ))}
        <div ref={chatEndRef} /> {/* Empty div to scroll into view */}
      </div>

      <div className="input-container">
        {/* File Upload Icon */}
        <div className="tooltip">
          <label htmlFor="file-upload" className="icon-button">
            <i className="fas fa-paperclip"></i>
            <span className="tooltiptext">Attach Image</span>
          </label>
          <input
            type="file"
            id="file-upload"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Audio Recording Icon */}
        <div className="tooltip">
          {!recording ? (
            <button className="icon-button" onClick={startRecording}>
              <i className="fas fa-microphone"></i>
              <span className="tooltiptext">Record Audio</span>
            </button>
          ) : (
            <button className="icon-button" onClick={stopRecording}>
              <i className="fas fa-stop"></i>
              <span className="tooltiptext">Stop Recording</span>
            </button>
          )}
        </div>

        {/* Input for Text Message */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your input..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;