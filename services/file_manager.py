import os
import shutil
from datetime import datetime
from pathlib import Path

class FileManager:
    def __init__(self, image_name: str):
        self.image_name = Path(image_name).stem
        self.base_dir = self.create_base_dir()
        self.new_image_path = os.path.join(self.base_dir, image_name)
        self.conversation_data_file_path = os.path.join(self.base_dir, "conversation_data.json")
        
    def create_base_dir(self):
        base_dir = f"data/{self.image_name}"
        os.makedirs(base_dir, exist_ok=True)
        return base_dir
    
    def save_image(self, file):
        if not os.path.exists(self.new_image_path):
            with open(self.new_image_path, "wb+") as file_object:
                file_object.write(file.file.read())
            return True
        return False
        
    def save_audio(self, file, type):
        input_audio_location = f"data/{self.image_name}/{type}"
        with open(input_audio_location, "wb") as f:
            shutil.copyfileobj(file.file, f)
        return input_audio_location   

    
    def copy_image(self, image_path: str):
        if not os.path.exists(self.new_image_path):
            shutil.copy(image_path, self.new_image_path)