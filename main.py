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
from datetime import datetime

AI_CHARACTER = "Good Friend"

app = FastAPI()


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Frontend URL (React running on port 3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/data", StaticFiles(directory="data/"), name="files")
app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")


@app.post("/upload-photo/")
async def upload_photo(file: UploadFile = File(...)):
    
    file_manager = FileManager(file.filename)

    prompt_generator = PromptGenerator()

    if file_manager.save_image(file):

        tracker = Tracker(file_manager.conversation_data_file_path)
        data = tracker.load_data()
        
        data["count"] += 1
    
        output = prompt_generator.get_prompt(file_manager.new_image_path, data["count"], None)  # No previous content
        question = output["question"]
        
        data["chat"] = AI_CHARACTER + ":" + question
       

        speech = Speech(file_manager.image_name)

        speech_file_path_mp3 = speech.transform_text_to_speech(question, "reply")
        
        audio_url = f"data/{file_manager.image_name}/reply.mp3"

        tracker.save_data(data)
 
        return {"question": question, "audio_url": audio_url}

    else:
        tracker = Tracker(file_manager.conversation_data_file_path)
        data = tracker.load_data()
        
        data["count"] += 1

        previous_memory = data["chat"]

        data["start_time"] = datetime.now().isoformat()

        data["story_generated"] = False


        q_output = prompt_generator.get_prompt(file_manager.new_image_path, data["count"], previous_memory)  # No previous content
        s_output = prompt_generator.get_summary(previous_memory)
        story = s_output["summary"]
        question = q_output["question"]

        #Calculate token
        #data["tokens_used"] = 
        
        data["chat"] += "\n" + AI_CHARACTER + ": " + question

        
        result = story + "\n" + question

        speech = Speech(file_manager.image_name)

        speech_file_path_mp3 = speech.transform_text_to_speech(result, "summary")

        audio_url = f"data/{file_manager.image_name}/summary.mp3"

        tracker.save_data(data)

        return {"question": result, "audio_url": audio_url}
        

    return {"error": "Failed to process the request"}





@app.post("/upload-audio/")
async def upload_audio(image_name: str = Form(...), file: UploadFile = File(...)):
    
    file_manager = FileManager(image_name)

    audio_file_path = file_manager.save_audio(file)

    speech = Speech(file_manager.image_name)

    text = speech.transform_speech_to_text(audio_file_path)

    
    audio_url = f"data/{file_manager.image_name}/reply.mp3"


    prompt_generator = PromptGenerator()

    intent = prompt_generator.get_intent(text)

    if intent["intent"] == "change photo":
        output = prompt_generator.change_photo_message(text)
        message = output["message"]
        speech.transform_text_to_speech(message, "reply")
        return {"question": "photo", "audio_url": audio_url}
    
     
      

    tracker = Tracker(file_manager.conversation_data_file_path)
    data = tracker.load_data()

    data["count"] += 1

    data["chat"] += "\n" + "User: " + text



    previous_memory = data["chat"] 

    
    output = prompt_generator.get_prompt(file_manager.new_image_path, data["count"], previous_memory)
    question = output["question"]
    

    data["chat"] += "\n" + AI_CHARACTER + ": " + text

    speech_file_path_mp3 = speech.transform_text_to_speech(question, "reply")
     
    data["end_time"] = datetime.now().isoformat()
    start_time = datetime.fromisoformat(data["start_time"])
    end_time = datetime.fromisoformat(data["end_time"])
    data["duration"] += (end_time - start_time).total_seconds() / 60  # Convert to minutes
    data["start_time"] = data["end_time"] 
    

    tracker.save_data(data)
    
    return {"question": question, "audio_url": audio_url}


@app.get("/stories")
async def get_stories():
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp'}
    files_paths = []
    
    # Walk through all folders and subfolders in the data folder
    for root, dirs, files in os.walk("data"):
        image_path = ""
        audio_path = ""
        if(root == "data"):
            continue

        tracker = Tracker(f"{root}/conversation_data.json")

        data = tracker.load_data()

        image_name = root.split("/")[1]

        if not data["story_generated"]:
            prompt_generator = PromptGenerator()
            get_story_output = prompt_generator.get_story(data["chat"])
            
            story = get_story_output["story"]
            generate_story_name_output = prompt_generator.generate_story_name(story)
            data["story_name"] = generate_story_name_output["story_name"]

            speech = Speech(image_name)
            speech_file_path_mp3 = speech.transform_text_to_speech(story, "story")
            data["story_generated"] = True
            # print("hello")

        for file in files:
            # Check if the file has one of the valid image extensions
            if os.path.splitext(file)[1].lower() in image_extensions:
                image_path = os.path.join(root, file)
        
        audio_path = f"{root}/story.mp3"   
        image_path =  image_path

        file_path = {"image_path": image_path, "audio_path": audio_path, "story_name": data["story_name"]}

        if file_path["image_path"] != "" and file_path["audio_path"] != "":
            files_paths.append(file_path)

        tracker.save_data(data)    
    
    return files_paths



@app.get("/")
async def read_index(request: Request) -> HTMLResponse:
    with open("frontend/build/index.html", "r") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content, status_code=200)
    
