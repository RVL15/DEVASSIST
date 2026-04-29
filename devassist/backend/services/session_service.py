from collections import deque, defaultdict
from typing import List, Dict
from core.config import settings


class SessionMemory:
    def __init__(self):
        self._sessions: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=settings.SESSION_MAX_HISTORY)
        )

    def add(self, session_id: str, role: str, content: str):
        self._sessions[session_id].append({"role": role, "content": content})

    def get(self, session_id: str) -> List[Dict]:
        return list(self._sessions[session_id])

    def clear(self, session_id: str):
        self._sessions.pop(session_id, None)

    def sessions(self) -> List[str]:
        return list(self._sessions.keys())


memory = SessionMemory()
