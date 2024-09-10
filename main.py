from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os

app = FastAPI()

# Configure CORS
app.add_middleware( CORSMiddleware, 
                    allow_origins=["*"],
                    allow_credentials=True, 
                    allow_methods=["*"], 
                    allow_headers=["*"], 
                    )

UPLOAD_DIRECTORY = "uploads"

# Create the uploads directory if it doesn't exist
Path(UPLOAD_DIRECTORY).mkdir(parents=True, exist_ok=True)

@app.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...)):
    file_location = f"{UPLOAD_DIRECTORY}/{file.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())
    return {"info": f"file '{file.filename}' saved at '{file_location}'"}