from abc import ABC, abstractmethod
from typing import Any, Dict

class BaseFunction(ABC):
    @abstractmethod
    async def execute(self, **kwargs) -> Dict[str, Any]:
        pass