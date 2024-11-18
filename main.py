import os
from fastapi import FastAPI, Request, File, UploadFile, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from services.file_manager import FileManager
from services.tracker import Tracker
from services.prompt_generator import PromptGenerator
from services.speech import Speech
from services.chroma import VectorDB
from services.conversation_manager import ConversationManager
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
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

app.mount("/data", StaticFiles(directory="data/", html=False), name="files")
app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")


@app.post("/upload-photo")
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
       
        vectordb = VectorDB("conversations")
        doc_id = vectordb.add_document(data["chat"], file_manager.new_image_path)
        data["doc_id"] = doc_id

        speech = Speech(file_manager.image_name)
        speech_file_path_mp3 = speech.transform_text_to_speech(question, "reply")
        # speech_file_path_mp3 = "http://127.0.0.1:8000/" + speech_file_path_mp3 
        
        tracker.save_data(data)
 
        return {"question": question, "audio_url": speech_file_path_mp3}

    else:
        tracker = Tracker(file_manager.conversation_data_file_path)
        data = tracker.load_data()

        if data["summary_generated"]:
            data["summary_generated"] = False
            tracker.save_data(data)
            return {"question": "", "audio_url": data["summary_file_path"]}
            
    
        previous_memory = data["chat"]
        data["start_time"] = datetime.now().isoformat()
        data["story_generated"] = False


        s_output = prompt_generator.get_summary(previous_memory)
        summary = s_output["summary"]

        speech = Speech(file_manager.image_name)
        speech_file_path_mp3 = speech.transform_text_to_speech(summary, "summary")
        # speech_file_path_mp3 = "http://127.0.0.1:8000/" + speech_file_path_mp3 
        
        tracker.save_data(data)

        return {"question": summary, "audio_url": speech_file_path_mp3}





@app.post("/upload-audio")
async def upload_audio(image_name: str = Form(...), file: UploadFile = File(...)):
    
    file_manager = FileManager(image_name)

    audio_file_path = file_manager.save_audio(file,  "user_input")
    speech = Speech(file_manager.image_name)
    text = speech.transform_speech_to_text(audio_file_path)
    
    
    prompt_generator = PromptGenerator()
    intent = prompt_generator.get_intent(text)
    
  
    

    if intent["intent"] == "change photo":
        output = prompt_generator.change_photo_message(text)
        message = output["message"]
        speech_file_path_mp3 = speech.transform_text_to_speech(message, "reply")
        # speech_file_path_mp3 = "http://127.0.0.1:8000/" + speech_file_path_mp3 
        return {"signal": "change photo", "question": "", "audio_url": speech_file_path_mp3, "image_url": ""}
    
    if intent["intent"] == "fetch story" and image_name == "":
        vectordb = VectorDB("conversations")
        search_res =  vectordb.search(text)

        if(search_res["image_path"] == ""):
            speech_file_path_mp3=speech.transform_text_to_speech("No Story Found", "reply")
            # speech_file_path_mp3 = "http://127.0.0.1:8000/" + speech_file_path_mp3 
            return {"signal": "fetch story", "question": "", "audio_url": speech_file_path_mp3, "image_url": ""}
        
        previous_memory = search_res["conversation"]
        image_path = search_res["image_path"]
        image_name = image_path.split("/")[2]
        # image_path = "http://127.0.0.1:8000/" + image_path
        file_manager = FileManager(image_name)
        tracker = Tracker(file_manager.conversation_data_file_path)
        data = tracker.load_data()

        if data["summary_generated"]:
            data["summary_generated"] = False
            data["story_generated"] = False
            tracker.save_data(data)
            return {"signal": "fetch story", "question": "", "audio_url": data["summary_file_path"], "image_url": image_path, "image_name": image_name}
        
        
        s_output = prompt_generator.get_summary(previous_memory)
        summary = s_output["summary"]
        data["story_generated"] = False
        tracker.save_data(data)

        speech_file_path_mp3=speech.transform_text_to_speech(summary, "summary")
        # speech_file_path_mp3 = "http://127.0.0.1:8000/" + speech_file_path_mp3 
    
        return {"signal": "fetch story", "question": "", "audio_url": speech_file_path_mp3, "image_url": image_path, "image_name": image_name}


    if image_name == "":
        speech_file_path_mp3=speech.transform_text_to_speech("Please upload an Image", "reply")
        # speech_file_path_mp3 = "http://127.0.0.1:8000/" + speech_file_path_mp3 
        return {"signal": "no photo", "question": "", "audio_url": speech_file_path_mp3, "image_url": ""}

      

    tracker = Tracker(file_manager.conversation_data_file_path)
    data = tracker.load_data()

    data["count"] += 1
    data["chat"] += "\n" + "User: " + text
    previous_memory = data["chat"] 

    
    output = prompt_generator.get_prompt(file_manager.new_image_path, data["count"], previous_memory)
    question = output["question"]
    

    data["chat"] += "\n" + AI_CHARACTER + ": " + question

    vectordb = VectorDB("conversations")
    doc_id = vectordb.update_document(data["chat"], file_manager.new_image_path, data["doc_id"])
    data["doc_id"] = doc_id

    speech_file_path_mp3 = speech.transform_text_to_speech(question, "reply")
    # speech_file_path_mp3 = "http://127.0.0.1:8000/" + speech_file_path_mp3 
     
    data["end_time"] = datetime.now().isoformat()
    start_time = datetime.fromisoformat(data["start_time"])
    end_time = datetime.fromisoformat(data["end_time"])
    data["duration"] += (end_time - start_time).total_seconds() / 60  # Convert to minutes
    data["start_time"] = data["end_time"] 
    

    tracker.save_data(data)
    
    return {"signal": "continue", "question": question, "audio_url": speech_file_path_mp3, "image_url": ""}


@app.get("/stories")
async def get_stories():
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp'}
    files_paths = []
    
    # Walk through all folders and subfolders in the data folder
    for root, dir, files in os.walk("data"):
        image_path = ""
        if root == "data" or "data/chroma_langchain_db" in root:
            continue

        tracker = Tracker(f"{root}/conversation_data.json")

        data = tracker.load_data()

        image_name = root.split("/")[1]

        for file in files:
            if os.path.splitext(file)[1].lower() in image_extensions:
                image_path = os.path.join(root, file)
        

        if not data["story_generated"] and image_path != "":
  
            prompt_generator = PromptGenerator()
            get_story_output = prompt_generator.get_story(image_path, data["chat"])
            
            story = get_story_output["story"]
            data["story_name"] =  get_story_output["story_name"]

            speech = Speech(image_name)
            speech_file_path_mp3 = speech.transform_text_to_speech(story, "story")
            # speech_file_path_mp3 = "http://127.0.0.1:8000/" + speech_file_path_mp3 
            data["story_file_path"] = speech_file_path_mp3
            data["story_generated"] = True
        
        # image_path = f"http://127.0.0.1:8000/{image_path}"

        file_path = {"image_path": image_path, "audio_path": data["story_file_path"], "story_name": data["story_name"]}

        if file_path["image_path"] != "" and file_path["audio_path"] != "":
            files_paths.append(file_path)

        tracker.save_data(data)    
    
    return files_paths


@app.post("/family_feedback")
async def family_feedback(image_name: str = Form(...), file: UploadFile = File(...)):
    file_manager = FileManager(image_name)

    audio_file_path = file_manager.save_audio(file, "family_input")
    speech = Speech(file_manager.image_name)
    text = speech.transform_speech_to_text(audio_file_path)

    tracker = Tracker(file_manager.conversation_data_file_path)
    data = tracker.load_data()
    

    # previous_memory = data["chat"]
    # data["start_time"] = datetime.now().isoformat()
    # data["story_generated"] = False
    
    
    prompt_generator = PromptGenerator()
    s_output = prompt_generator.get_summary_with_family_feedback(data["chat"], text)
    summary = s_output["summary"]

    data["chat"] += "\n" + "Family Member" + ": " + text

    speech = Speech(file_manager.image_name)
    speech_file_path_mp3 = speech.transform_text_to_speech(summary, "summary")
    # speech_file_path_mp3 = "http://127.0.0.1:8000/" + speech_file_path_mp3 

    data["summary_file_path"] = speech_file_path_mp3
    data["summary_generated"] = True
    
    tracker.save_data(data)

    
    return {"message": "Feedback Sent"}




@app.get("/")
async def read_index(request: Request) -> HTMLResponse:
    with open("frontend/build/index.html", "r") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content, status_code=200)