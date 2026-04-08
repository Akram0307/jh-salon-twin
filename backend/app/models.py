from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    type = Column(String, index=True)  # CUT, WASH, FACIAL, PEDI
    is_active = Column(Boolean, default=True)

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, index=True)
    service_name = Column(String)
    resource_ids = Column(String)  # JSON string of IDs
    start_time = Column(String)    # ISO String
    end_time = Column(String)      # ISO String
    status = Column(String, default="PENDING")

class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    category = Column(String)
    duration_minutes = Column(Integer)
    price = Column(Float)
    sale_price = Column(Float, nullable=True)
