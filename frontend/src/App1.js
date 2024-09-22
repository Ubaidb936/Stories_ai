import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css'; // FontAwesome for icons

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // State for progress bar
  const [uploadedImageName, setUploadedImageName] = useState('');
  const [recordingProgress, setRecordingProgress] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chatEndRef = useRef(null); // Ref for the end of the chat window
  const audioRef = useRef(null); // Ref for the audio element
  const welcomeMessage = "Welcome, Ubaid! Upload a photo, and we’ll ask a few simple questions to help you share the story behind it. Let’s get started!;"
  
  useEffect(() => {
    // Streaming welcome message
    let currentText = '';
    let index = 0;

    const streamMessage = () => {
      if (index < welcomeMessage.length) {
        currentText += welcomeMessage[index];
        setMessages([{ text: currentText, sender: 'bot' }]);
        index++;
        setTimeout(streamMessage, 50); // Adjust the speed by changing the timeout duration
      } else {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); // Scroll to the end of chat when message is fully streamed
      }
    };

    streamMessage();
  }, []); // Only runs once when component mounts

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, sender: 'user' }]);
      setInput('');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setMessages([]);
      const reader = new FileReader();
      reader.onloadend = async () => {
        // Update the state to display the image immediately
        setMessages((prevMessages) => [
          ...prevMessages,
          { image: reader.result, sender: 'user' } // Image is treated as sent by user
        ]);

        // Store the uploaded image name globally
        setUploadedImageName(file.name); // Update global image name state

        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://127.0.0.1:8000/upload-photo/', true);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress); // Update progress state
          }
        };

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);

            // Reset progress state after successful upload
            setUploadProgress(0);

            // Add additional messages from the bot after the API call
            setMessages((prevMessages) => [
              ...prevMessages,
              { text: data.question, sender: 'bot' }, // Message from bot
              { audio: data.audio_url, sender: 'bot' } // Audio message from bot
            ]);
            
          } else {
            console.error('Failed to upload file');
            setUploadProgress(0); // Reset progress state
          }
        };

        xhr.onerror = () => {
          console.error('Error uploading file');
          setUploadProgress(0); // Reset progress state
        };

        xhr.send(formData);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      // Request access to the user's microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
      // Create a MediaRecorder instance with default MIME type 'audio/webm'
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const audioChunks = []; // Array to hold audio data chunks
  
      // Store the mediaRecorder instance for stopping later
      mediaRecorderRef.current = mediaRecorder;
  
      // On receiving data, push it to the audioChunks array
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      // When recording stops, handle the Blob creation and uploading
      mediaRecorder.onstop = async () => {
        // Ensure there is data before creating the blob
        if (audioChunks.length > 0) {
          setUploadProgress(100);
          // Create an audio Blob from the collected chunks
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  
          // Prepare form data for uploading
          const formData = new FormData();
          formData.append('image_name', uploadedImageName)
          formData.append('file', audioBlob, 'audio.webm'); // 'audio.webm' is a safe default

  
  
          // Send the Blob to the backend
          try {
            const response = await fetch('http://127.0.0.1:8000/upload-audio/', {
              method: 'POST',
              body: formData,
            });
  
            if (response.ok) {
              const data = await response.json();
  
              // Once uploaded, process the backend response
              setMessages((prevMessages) => {
                // Filter out previous bot messages
                // const updatedMessages = prevMessages.filter(
                //   message => message.sender !== 'bot'
                // );
                // const updatedMessages = prevMessages.slice(0, -2);
                
                // Add new bot messages
                return [
                  ...prevMessages,
                  // { text: data.question, sender: 'bot' }, // New text message from bot
                  { audio: data.audio_url, sender: 'bot' } // New audio message from bot
                ];
              });

              
              setUploadProgress(0); 

            } else {
              console.error('Failed to upload audio');
              alert('Failed to upload audio. Please try again.');
            }
          } catch (error) {
            console.error('Error uploading audio:', error);
            alert('Error uploading audio. Please check your connection and try again.');
          }
        } else {
          console.error('No audio data available to upload');
          alert('No audio data available. Please try recording again.');
        }
      };
  
      // Start recording
      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please try again.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      // Stop the recording and trigger the onstop handler
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Play the latest audio if present
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.audio && audioRef.current) {
      audioRef.current.play();
    }
  }, [messages]); // Runs whenever messages change

  return (
    <div className="chatgpt-container">
      <div className="chat-window">
        {recording && <div className="recording-popup">Recording...</div>}
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.text && <p>{message.text}</p>}
            {message.image && <img src={message.image} alt="uploaded" className="uploaded-image" />}
            {message.audio && <audio ref={audioRef} controls src={message.audio} />}
          </div>
        ))}
        <div ref={chatEndRef} /> {/* Empty div to scroll into view */}
      </div>

      {/* Progress bar */}
      {uploadProgress > 0 && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
        </div>
      )}

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