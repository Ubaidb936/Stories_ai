import os

class ConversationManager:
    def __init__(self, input_filepath: str):
        self.input_filepath = input_filepath

    def retrieve_memory(self):
        if os.path.exists(self.input_filepath):
            with open(self.input_filepath, 'r') as f:
                content = f.read()
            return content
        return None

    def append_conversation(self, speaker: str, message: str):
        with open(self.input_filepath, 'a') as f:
            f.write(f"\n{speaker}: {message}")

    def save_conversation(self, speaker: str, message: str):
        with open(self.input_filepath, 'w') as f:
            f.write(f"{speaker}: {message}")