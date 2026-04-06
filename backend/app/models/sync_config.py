"""
SyncConfig — persistent key-value configuration for the image sync workflow.
"""

from sqlalchemy import Column, String
from app.database import Base


class SyncConfig(Base):
    """Simple key-value store for sync-related settings."""
    __tablename__ = "SyncConfig"
    Key = Column(String, primary_key=True)
    Value = Column(String, nullable=False)
