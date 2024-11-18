import React, { useState, useRef, useEffect } from 'react';
import '../App.css';
import '@fortawesome/fontawesome-free/css/all.min.css'; // FontAwesome for icons
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';

const FamilyFeedback = () => {
  const location = useLocation();
  const { story } = location.state || {};
  const [image, setImage] = useState(story?.image_path || '');
  const [audio, setAudio] = useState(story?.audio_path || '');
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageName, setUploadedImageName] = useState(story?.image_path.split("/").at(-1) || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState('00:00');
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const [processingState, setProcessingState] = useState("");
  const [successMessage, setSuccessMessage] = useState(''); // Success message state
  const navigate = useNavigate();

  useEffect(() => {
    const audioElement = audioRef.current;

    if (audioElement) {
      const handleTimeUpdate = () => {
        const progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
        setProgress(progressPercent);

        const remaining = audioElement.duration - audioElement.currentTime;
        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60);
        setRemainingTime(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setProgress(100);
        setRemainingTime('00:00');
      };

      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      audioElement.addEventListener('ended', handleEnded);

      return () => {
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [audio]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 2000); // Clear after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setProcessingState("Listening");
      setUploading(true);

      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if (audioChunks.length > 0) {
          setProcessingState("Uploading");
          setUploading(true);

          const audioBlob = new Blob(audioChunks);
          const formData = new FormData();
          formData.append('image_name', uploadedImageName);
          formData.append('file', audioBlob, 'audio.webm');

          try {
            const response = await fetch('/family_feedback', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              setSuccessMessage('Feedback uploaded successfully!'); // Set success message
              setUploading(false);
            } else {
              console.error('Failed to upload audio');
              setUploading(false);
              alert('Failed to upload audio. Please try again.');
            }
          } catch (error) {
            console.error('Error uploading audio:', error);
            setUploading(false);
            alert('Error uploading audio. Please check your connection and try again.');
          }
        } else {
          console.error('No audio data available to upload');
          alert('No audio data available. Please try recording again.');
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        alert('Microphone access was denied. Please allow microphone access to start recording.');
      } else {
        console.error('Error starting recording:', error);
        alert('Unable to access microphone. Please check your settings and try again.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handlePlayPauseAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleClick = () => {
    navigate(-1);
  };

  return (
    <div className="app-container">
      <div className="media-container">
        <button className="stories-button" onClick={handleClick}>Stories</button>
        <div className="image-area">
          {image ? (
            <img src={image} alt="uploaded" className="uploaded-image" />
          ) : (
            <div className="image-placeholder">
              <p>Your photo will be displayed here</p>
            </div>
          )}
        </div>
        <div className="audio-area">
          {audio && (
            <div className="audio-player">
              <button className="play-button" onClick={handlePlayPauseAudio}>
                <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
              </button>
              <audio ref={audioRef} src={audio} />
              <div className="audio-progress">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="audio-time">
                <span>{remainingTime}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {uploading && (
        <div className="loading-container">
          <div className="loading-text">
            <div className="dots">
              {processingState}
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <div className="controls-container" style={{ maxWidth: '60px' }}>
        <div className="tooltip">
          {!recording ? (
            <button className="icon-button" onClick={startRecording}>
              <i className="fas fa-microphone"></i>
              <span className="tooltiptext">I want to talk</span>
            </button>
          ) : (
            <button className="icon-button" onClick={stopRecording}>
              <i className="fas fa-stop"></i>
              <span className="tooltiptext">I want to stop</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamilyFeedback;