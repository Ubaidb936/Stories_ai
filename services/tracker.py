import json
import os
from datetime import datetime

class Tracker:
    def __init__(self, count_file_path: str, duration_file_path: str):
        self.count_file_path = count_file_path
        self.duration_file_path = duration_file_path

    def load_counts(self):
        if os.path.exists(self.count_file_path):
            with open(self.count_file_path, 'r') as f:
                return json.load(f)
        return {"count": 0}

    def save_counts(self, counts):
        with open(self.count_file_path, 'w') as f:
            json.dump(counts, f)

    def increment_counts(self):
        counts = self.load_counts()
        counts["count"] += 1
        self.save_counts(counts)
        return counts["count"]

    def handle_duration(self):
        data = {
            "starttime": datetime.now().isoformat(),
            "endtime": None,  # End time will be set when the conversation ends
            "duration": 0
        }
        with open(self.duration_file_path, 'w') as json_file:
            json.dump(data, json_file, indent=4)

    def calculate_duration(self):
        with open(self.duration_file_path, 'r') as json_file:
            data = json.load(json_file)
        data['endtime'] = datetime.now().isoformat()
        starttime = datetime.fromisoformat(data['starttime'])
        endtime = datetime.fromisoformat(data['endtime'])
        data['duration'] = (endtime - starttime).total_seconds() / 60  # Convert to minutes
        with open(self.duration_file_path, 'w') as json_file:
            json.dump(data, json_file, indent=4)
        return data['duration']