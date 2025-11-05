# models.py

from dataclasses import dataclass
from typing import Optional, Dict, Any

@dataclass
class User:
    id: int
    username: str
    email: str
    password_hash: str
    first_name: Optional[str]
    last_name: Optional[str]
    status: str
    created_at: str
    updated_at: str

    def to_dict(self, include_password=False) -> Dict[str, Any]:
        user_dict = {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
        if include_password:
            user_dict["password_hash"] = self.password_hash
        return user_dict

