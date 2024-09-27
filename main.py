import os
from fastapi import FastAPI, Request, File, UploadFile, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from services.file_manager import FileManager
from services.tracker import Tracker
from services.prompt_generator import PromptGenerator
from services.speech import Speech
from services.conversation_manager import ConversationManager
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import multipart 
import shutil
import subprocess

AI_CHARACTER = "Good Friend"

app = FastAPI()


# Configure CORS
app.add_middleware( CORSMiddleware, 
                    allow_origins=["*"],
                    allow_credentials=True, 
                    allow_methods=["*"], 
                    allow_headers=["*"], 
                    )

app.mount("/data", StaticFiles(directory="data/"), name="audio")
app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")


@app.post("/upload-photo/")
async def upload_photo(file: UploadFile = File(...)):
    
    file_manager = FileManager(file.filename)

    if file_manager.save_image(file):
        # New image
        tracker = Tracker(file_manager.count_file_path, file_manager.duration_file_path)
        iter_count = tracker.increment_counts()
        tracker.handle_duration()
    
        prompt_generator = PromptGenerator()
        output = prompt_generator.get_prompt(file_manager.new_image_path, iter_count, None)  # No previous content
        question = output["question"]
        
        conversation_manager = ConversationManager(file_manager.input_filepath)
        conversation_manager.save_conversation(AI_CHARACTER, question)



        speech = Speech(file_manager.image_name)
        # Generate speech and save the audio file
        speech_file_path_mp3 = speech.transform_text_to_speech(question)
        
        # Ensure speech_file_path_mp3 is properly formatted
        # Adjust the URL path based on your file serving directory
        audio_url = f"data/{file_manager.image_name}/output-speech.mp3"
 
        return {"question": question, "audio_url": audio_url}

    else:
        # Image already exists
        conversation_manager = ConversationManager(file_manager.input_filepath)
        previous_memory = conversation_manager.retrieve_memory()

        tracker = Tracker(file_manager.count_file_path, file_manager.duration_file_path)
        iter_count = tracker.increment_counts()
        tracker.handle_duration()

        prompt_generator = PromptGenerator()

        q_output = prompt_generator.get_prompt(file_manager.new_image_path, iter_count, previous_memory)  # No previous content
        s_output = prompt_generator.get_story(previous_memory)
        story = s_output["story"]
        question = q_output["question"]

        conversation_manager.append_conversation(AI_CHARACTER, question)
        
        result = story + "\n" + question

        speech = Speech(file_manager.image_name)
        # Generate speech and save the audio file
        speech_file_path_mp3 = speech.transform_text_to_speech(result)

        audio_url = f"data/{file_manager.image_name}/output-speech.mp3"

        return {"question": result, "audio_url": audio_url}
        

    return {"error": "Failed to process the request"}





@app.post("/upload-audio/")
async def upload_audio(image_name: str = Form(...), file: UploadFile = File(...)):
    
    

    # file_name = Path(file.filename).stem  # Extract file name without extension

    # file_location = f"data/{file_manager.image_name}/input-{file.filename}"
    # Save the audio file
    # with open(file_location, "wb") as f:
    #     shutil.copyfileobj(file.file, f)


    # audio_file_path = Path.cwd() / f"{file_location}" 
    
    file_manager = FileManager(image_name)

    audio_file_path = file_manager.save_audio(file)

    speech = Speech(file_manager.image_name)

    text = speech.transform_speech_to_text(audio_file_path)

    
    audio_url = f"data/{file_manager.image_name}/output-speech.mp3"


    prompt_generator = PromptGenerator()

    intent = prompt_generator.get_intent(text)

    if intent["intent"] == "change photo":
        output = prompt_generator.change_photo_message(text)
        message = output["message"]
        speech.transform_text_to_speech(message)
        return {"question": "photo", "audio_url": audio_url}
    

    tracker = Tracker(file_manager.count_file_path, file_manager.duration_file_path)
    iter_count = tracker.increment_counts()
    tracker.handle_duration()


    conversation_manager = ConversationManager(file_manager.input_filepath)
    conversation_manager.append_conversation("User", text)
    previous_memory = conversation_manager.retrieve_memory()

    
    output = prompt_generator.get_prompt(file_manager.new_image_path, iter_count, previous_memory)  # No previous content
    question = output["question"]
    
    conversation_manager.append_conversation(AI_CHARACTER, question)

    speech_file_path_mp3 = speech.transform_text_to_speech(question)
    
    
    
    
    return {"question": question, "audio_url": audio_url}



@app.get("/")
async def read_index(request: Request) -> HTMLResponse:
    with open("frontend/build/index.html", "r") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content, status_code=200)
    
