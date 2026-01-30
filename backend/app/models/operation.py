from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from backend.app.db.session import Base

class Operation(Base):
    __tablename__ = "operations"

    id = Column(Integer, primary_key=True, index=True)
    command = Column(String)  
    intent = Column(String)   
    status = Column(String)   
    response_data = Column(JSON) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())