import json
import os
class UserData:
    def __init__(self):
        self.user_permission_path = "users/permissions.json"

    def load_user_persmissions(self):
        if os.path.exists(self.user_permission_path):
            with open(self.user_permission_path, 'r') as f:
                return json.load(f)
        return {}
    
    def save_data(self, data):
        with open( self.user_permission_path, 'w') as f:
            json.dump(data, f)
