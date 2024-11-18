import React, { useState, useEffect, useRef } from 'react';
import '../App.css'; // Ensure this imports your main CSS file
import '@fortawesome/fontawesome-free/css/all.min.css'; // FontAwesome for icons
import {useNavigate } from "react-router-dom";

const StoryCard = ({ story, onClick }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [recording, setRecording] = useState(false);
    const navigate = useNavigate();

    const togglePlayPause = (e) => {
        e.stopPropagation(); // Prevent triggering the `onClick` event
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch((error) => {
                console.error("Error playing audio:", error);
            });
        }
    };

    const handleTimeUpdate = () => {
        const currentTime = audioRef.current.currentTime;
        const duration = audioRef.current.duration;
        setProgress((currentTime / duration) * 100);
        setDuration(duration);
    };

    const handleProgressClick = (e) => {
        const { offsetWidth } = e.currentTarget;
        const clickX = e.nativeEvent.offsetX;
        const newTime = (clickX / offsetWidth) * duration;
        audioRef.current.currentTime = newTime;
        setProgress((newTime / duration) * 100);
    };

    const handleClick = () => {
        // console.log()
        navigate('/familyfeedback', { state: { story } });
    };

    return (
        <div
            className="story-card"
            onClick={handleClick} // Trigger the callback for card click
            role="button"
            tabIndex={0}
        >
            <div className="image-container">
                <img
                    src={story.image_path}
                    alt={story.description || 'Story'}
                    className="story-image"
                />
            </div>
            <div className="text-container">
                {story.story_name}
            </div>
            <div className="audio-container">
                <audio
                    ref={audioRef}
                    src={story.audio_path}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                />
                <div className="audio-player">
                    <button className="play-button" onClick={togglePlayPause}>
                        <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
                    </button>
                    <div className="audio-progress" onClick={handleProgressClick}>
                        <div
                            className="progress-bar"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="audio-time">
                        {duration ? `${Math.floor(duration)}s` : '0s'}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FamilyView = () => {
    const [stories, setStories] = useState([]); // To store the images and audio paths
    const [loading, setLoading] = useState(true); // To manage loading state
    const [error, setError] = useState(null); // To manage errors

    // Fetch stories from the backend
    useEffect(() => {
        const fetchStories = async () => {
            setLoading(true); // Set loading to true before fetching
            try {
                const response = await fetch("/stories");
                if (!response.ok) {
                    throw new Error("Failed to fetch stories");
                }
                const data = await response.json();
                // console.log(data);
                setStories(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStories();

    }, []);

    // Render the stories on the page
    if (loading) {
        return (

        <div className="loading">  
          <div className="loading-text">
             Loading stories
            <div className="dots">
                
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        </div>
        );
    }

    <div className="loading-container">
          <div className="loading-text">
            <div className="dots">
                 Loading stories
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        </div>

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    return (
        <div className="stories-container">
            {stories.length > 0 ? (
                
                stories.map((story, index) => (
                    <StoryCard key={index} story={story} />
                ))
                
            ) : (
                <div className="no-stories">No stories available.</div>
            )}
        </div>
    );
};

export default FamilyView;