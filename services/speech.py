import os
import subprocess
from pathlib import Path 
from openai import OpenAI
import moviepy.editor as mp  # For converting webm to wav
import soundfile as sf       # For saving the audio in wav format  # Assuming you're using OpenAI's Whisper
import moviepy.editor as mp  # For converting webm to wav
import soundfile as sf
from pathlib import Path


# os.environ["OPENAI_API_KEY"] 
client = OpenAI(api_key="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")


class Speech:
    def __init__(self, image_name):
        self.image_name = image_name

    def transform_speech_to_text(self, audio_file_path):
        if isinstance(audio_file_path, Path):
            audio_file_path = str(audio_file_path)
    
        # Define paths
        wav_file_path = Path.cwd() / f"data/{self.image_name}/input-audio.wav"
        
        try:
            # Convert .webm to .wav using ffmpeg
            command = [
                'ffmpeg', 
                '-i', audio_file_path,  # Input file
                '-acodec', 'pcm_s16le',  # Audio codec
                '-ar', '16000',           # Audio sample rate
                '-ac', '1', 
                '-y',             # Audio channels
                wav_file_path            # Output file
            ]
            subprocess.run(command, check=True)
            
            # Transcribe the saved .wav audio using Whisper
            with open(wav_file_path, "rb") as wav_audio:
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",  # Model name
                    file=wav_audio
                )
            return transcription.text

        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error: {e}")
            return None
        except Exception as e:
            print(f"Error processing the audio file: {e}")
            return None

        except Exception as e:
            print(f"Error processing the audio file: {e}")
            return None

    def transform_text_to_speech(self, text: str):
        # Define file paths for saving audio
        speech_file_path_mp3 = Path.cwd() / f"data/{self.image_name}/output-speech.mp3"
 
        # Generate speech from text (using your TTS service)
        response = client.audio.speech.create(
            model="tts-1",
            voice="onyx",
            input=text
        )

        # Save the MP3 file
        with open(speech_file_path_mp3, "wb") as f:
            f.write(response.content)

        # Return the URL of the generated audio
        return speech_file_path_mp3   