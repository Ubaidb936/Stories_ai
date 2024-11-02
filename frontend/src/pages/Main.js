import React, { useState, useRef, useEffect } from 'react';
import '../App.css';
import '@fortawesome/fontawesome-free/css/all.min.css'; // FontAwesome for icons
import heic2any from 'heic2any';
import {useNavigate } from "react-router-dom";

const Main = () =>  {
  const [image, setImage] = useState(null);  // State for current image
  const [audio, setAudio] = useState(null);  // State for current audio
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false); // State for loading
  const [uploadedImageName, setUploadedImageName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false); // State for audio play/pause
  const [progress, setProgress] = useState(0); // State for audio progress
  const [remainingTime, setRemainingTime] = useState('00:00'); // State for remaining time
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const [processingState, setProcessingState] = useState("");
  
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
    if (audio && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true); // Set state to playing
    }
  }, [audio]);

  // Function to convert the file to JPG using a Canvas
  // Function to convert the file to JPG using a Canvas
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const allowedFormats = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  
    if (file && file.type.startsWith('image/')) {
       // Start loading animation
      setProcessingState("Thinking");
      setUploading(true);
  
      // Clear the audio state to remove the previous audio element
      setAudio(null);
  
      let fileToUpload;
       
      try {
        // Check if the file type is HEIC
        if (file.type === 'image/heic') {
          console.log('File type is HEIC. Converting to JPG...');
          fileToUpload = await convertHeicToJpg(file);
        } else if (!allowedFormats.includes(file.type)) {
          console.log(`File type is ${file.type}. Converting to JPG...`);
          fileToUpload = await convertToJpg(file);
        } else {
          console.log('File type is allowed. Proceeding without conversion.');
          fileToUpload = file;
        }

        
  
        console.log('File to upload:', fileToUpload.name);
        setImage(URL.createObjectURL(fileToUpload));
        setUploadedImageName(fileToUpload.name);
  
        const formData = new FormData();
        formData.append('file', fileToUpload);
  
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload-photo/', true);
  
        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            setUploading(false);
            setAudio(data.audio_url);
          } else {
            console.error('Failed to upload file. Server responded with status:', xhr.status);
            setUploading(false);
          }
        };
  
        xhr.onerror = () => {
          console.error('Error uploading file');
          setUploading(false);
        };
  
        xhr.send(formData);
      } catch (error) {
        console.error('Image conversion failed:', error);
        setUploading(false);
      }
    }
  };
  
  // Function to convert HEIC to JPG
  const convertHeicToJpg = (file) => {
    return heic2any({ 
      blob: file,
      toType: 'image/jpeg',
      quality: 1 
    }).then((convertedBlob) => {
      return new File([convertedBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' });
    }).catch((error) => {
      throw new Error('HEIC conversion failed: ' + error.message);
    });
  };
  
  // Function to convert the file to JPG using a Canvas (for non-HEIC files)
  const convertToJpg = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
  
        img.onerror = () => {
          reject(new Error('Image loading failed. Make sure the file is a valid image.'));
        };
  
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
  
          ctx.drawImage(img, 0, 0);
  
          canvas.toBlob((blob) => {
            if (!blob) {
              return reject(new Error('Canvas conversion failed. Blob is null.'));
            }
            const convertedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' });
            resolve(convertedFile);
          }, 'image/jpeg');
        };
  
        img.src = event.target.result;
      };
  
      reader.onerror = (error) => {
        reject(new Error('FileReader failed: ' + error.message));
      };
  
      reader.readAsDataURL(file);
    });
  };

  // let stream;
  useEffect(() => {
    const getAudioStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Do something with the audio stream, e.g., set it to a state or use it directly
            console.log('Audio stream:', stream);
        } catch (error) {
            console.error('Error accessing audio stream:', error);
        }
    };

    getAudioStream();
   }, [])
  
  const startRecording = async () => {
    try {
      // Request microphone access and start audio recording
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudio(null);
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
          setProcessingState("Thinking");
          setUploading(true);
  
          const audioBlob = new Blob(audioChunks);
          const formData = new FormData();
          formData.append('image_name', uploadedImageName);
          formData.append('file', audioBlob, 'audio.webm');
  
          try {
            const response = await fetch('/upload-audio/', {
              method: 'POST',
              body: formData,
            });
  
            if (response.ok) {
              const data = await response.json();
              setAudio(null);
              if (data.signal === "change photo") {
                setImage(null);
                setUploadedImageName('');
              }
              if (data.signal === "fetch story") {
                setImage(null);
                setImage(data.image_url);
                setUploadedImageName(data.image_name);
              }
  
              setAudio(data.audio_url);
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
    console.log("Hello, world"); // Log message
    navigate('/Stories');
   };

  return (
    <div className="app-container">
      <div className="media-container">
      <button class="stories-button" onClick={handleClick} >Stories</button>
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
      
      <div className="controls-container">
        <div className="tooltip">
          <label htmlFor="file-upload" className="icon-button">
            <i className="fas fa-paperclip"></i>
            <span className="tooltiptext">Load New Photo</span>
          </label>
          <input
            type="file"
            id="file-upload"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
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
}
export default Main;