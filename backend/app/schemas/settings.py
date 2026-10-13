from pydantic import BaseModel
from typing import Optional, Dict

class SettingUpdate(BaseModel):
    key: str
    value: str

class UserProfileSchema(BaseModel):
    name: str
    business_name: str
    email: str
    default_currency: str

class StorageInfo(BaseModel):
    database_size_bytes: int
    database_size_formatted: str
    documents_count: int
    transactions_count: int
    uploads_size_bytes: int
    uploads_size_formatted: str
    database_path: str
    uploads_path: str

class PrivacyInfo(BaseModel):
    is_fully_local: bool = True
    remote_apis_used: int = 0
    telemetry_enabled: bool = False
    third_party_cookies: bool = False
    model_host: str
    local_storage_engine: str = "SQLite"
