import asyncio
import json
import os
import uuid
import copy
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
import motor.motor_asyncio
from app.core.config import settings

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_FILE = os.path.join(DATA_DIR, "erp_database.json")

def generate_object_id() -> str:
    """Generate a 24-character hexadecimal string similar to MongoDB ObjectId."""
    return uuid.uuid4().hex[:24]

class AsyncCursor:
    def __init__(self, items: List[Dict[str, Any]]):
        self._items = items
        self._index = 0

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            for k, d in reversed(key_or_list):
                reverse = (d == -1)
                self._items.sort(key=lambda x: str(x.get(k, "")), reverse=reverse)
        elif isinstance(key_or_list, str):
            reverse = (direction == -1)
            self._items.sort(key=lambda x: str(x.get(key_or_list, "")), reverse=reverse)
        return self

    def limit(self, n: int):
        self._items = self._items[:n]
        return self

    def skip(self, n: int):
        self._items = self._items[n:]
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        if length is not None:
            return copy.deepcopy(self._items[:length])
        return copy.deepcopy(self._items)

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self._index < len(self._items):
            item = self._items[self._index]
            self._index += 1
            return copy.deepcopy(item)
        raise StopAsyncIteration

class InsertOneResult:
    def __init__(self, inserted_id: str):
        self.inserted_id = inserted_id

class LocalCollection:
    def __init__(self, name: str, db: "LocalDatabase"):
        self.name = name
        self.db = db

    def _match(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for k, v in query.items():
            if k == "$or":
                if not any(self._match(doc, sub_q) for sub_q in v):
                    return False
                continue
            if k == "$and":
                if not all(self._match(doc, sub_q) for sub_q in v):
                    return False
                continue
            
            doc_val = doc.get(k)
            if isinstance(v, dict):
                for op, op_val in v.items():
                    if op == "$in":
                        # Support both scalar and list doc values
                        if isinstance(doc_val, list):
                            if not any(item in op_val for item in doc_val):
                                return False
                        else:
                            if doc_val not in op_val:
                                return False
                    elif op == "$nin":
                        if isinstance(doc_val, list):
                            if any(item in op_val for item in doc_val):
                                return False
                        else:
                            if doc_val in op_val:
                                return False
                    elif op == "$ne":
                        if doc_val == op_val:
                            return False
                    elif op == "$gt":
                        if doc_val is None or doc_val <= op_val:
                            return False
                    elif op == "$gte":
                        if doc_val is None or doc_val < op_val:
                            return False
                    elif op == "$lt":
                        if doc_val is None or doc_val >= op_val:
                            return False
                    elif op == "$lte":
                        if doc_val is None or doc_val > op_val:
                            return False
                    elif op == "$regex":
                        import re
                        if doc_val is None or not re.search(op_val, str(doc_val), re.IGNORECASE):
                            return False
            else:
                if str(doc_val) != str(v):
                    return False
        return True

    async def find(self, query: Optional[Dict[str, Any]] = None) -> AsyncCursor:
        query = query or {}
        docs = self.db.data.get(self.name, [])
        matched = [d for d in docs if self._match(d, query)]
        return AsyncCursor(matched)

    async def find_one(self, query: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        query = query or {}
        docs = self.db.data.get(self.name, [])
        for d in docs:
            if self._match(d, query):
                return copy.deepcopy(d)
        return None

    async def insert_one(self, document: Dict[str, Any]) -> InsertOneResult:
        doc = copy.deepcopy(document)
        if "_id" not in doc or not doc["_id"]:
            doc["_id"] = generate_object_id()
        else:
            doc["_id"] = str(doc["_id"])
        
        if "created_at" not in doc:
            doc["created_at"] = datetime.utcnow().isoformat()
        if "updated_at" not in doc:
            doc["updated_at"] = datetime.utcnow().isoformat()

        if self.name not in self.db.data:
            self.db.data[self.name] = []
        self.db.data[self.name].append(doc)
        await self.db.save()
        return InsertOneResult(doc["_id"])

    async def insert_many(self, documents: List[Dict[str, Any]]) -> List[str]:
        ids = []
        for d in documents:
            res = await self.insert_one(d)
            ids.append(res.inserted_id)
        return ids

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False) -> bool:
        docs = self.db.data.get(self.name, [])
        for doc in docs:
            if self._match(doc, query):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        doc[k] = copy.deepcopy(v)
                if "$inc" in update:
                    for k, v in update["$inc"].items():
                        doc[k] = doc.get(k, 0) + v
                if "$push" in update:
                    for k, v in update["$push"].items():
                        if k not in doc or not isinstance(doc[k], list):
                            doc[k] = []
                        doc[k].append(copy.deepcopy(v))
                if "$pull" in update:
                    for k, v in update["$pull"].items():
                        if k in doc and isinstance(doc[k], list):
                            doc[k] = [x for x in doc[k] if x != v]
                doc["updated_at"] = datetime.utcnow().isoformat()
                await self.db.save()
                return True
        if upsert:
            new_doc = copy.deepcopy(query)
            if "$set" in update:
                new_doc.update(update["$set"])
            await self.insert_one(new_doc)
            return True
        return False

    async def update_many(self, query: Dict[str, Any], update: Dict[str, Any]) -> int:
        docs = self.db.data.get(self.name, [])
        count = 0
        for doc in docs:
            if self._match(doc, query):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        doc[k] = copy.deepcopy(v)
                if "$inc" in update:
                    for k, v in update["$inc"].items():
                        doc[k] = doc.get(k, 0) + v
                doc["updated_at"] = datetime.utcnow().isoformat()
                count += 1
        if count > 0:
            await self.db.save()
        return count

    async def delete_one(self, query: Dict[str, Any]) -> bool:
        docs = self.db.data.get(self.name, [])
        for i, doc in enumerate(docs):
            if self._match(doc, query):
                docs.pop(i)
                await self.db.save()
                return True
        return False

    async def delete_many(self, query: Dict[str, Any]) -> int:
        docs = self.db.data.get(self.name, [])
        initial_len = len(docs)
        self.db.data[self.name] = [d for d in docs if not self._match(d, query)]
        removed = initial_len - len(self.db.data[self.name])
        if removed > 0:
            await self.db.save()
        return removed

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        query = query or {}
        docs = self.db.data.get(self.name, [])
        return sum(1 for d in docs if self._match(d, query))

class LocalDatabase:
    def __init__(self, file_path: str = DB_FILE):
        self.file_path = file_path
        self.data: Dict[str, List[Dict[str, Any]]] = {}
        self._lock = asyncio.Lock()
        self.load()

    def load(self):
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
            except Exception:
                self.data = {}
        else:
            self.data = {}

    async def save(self):
        async with self._lock:
            try:
                with open(self.file_path, "w", encoding="utf-8") as f:
                    json.dump(self.data, f, indent=2, default=str)
            except Exception as e:
                print(f"Error saving database to {self.file_path}: {e}")

    def __getitem__(self, name: str) -> LocalCollection:
        return LocalCollection(name, self)

    def get_collection(self, name: str) -> LocalCollection:
        return LocalCollection(name, self)

class DatabaseWrapper:
    def __init__(self):
        self._motor_client = None
        self._motor_db = None
        self._local_db = None
        self._is_native_mongo = False

    async def init(self):
        # Try native MongoDB if configured
        if not settings.USE_LOCAL_STORAGE_FALLBACK:
            try:
                self._motor_client = motor.motor_asyncio.AsyncIOMotorClient(
                    settings.MONGO_URI,
                    serverSelectionTimeoutMS=2000
                )
                await self._motor_client.server_info()
                self._motor_db = self._motor_client[settings.DATABASE_NAME]
                self._is_native_mongo = True
                print("Connected to Native MongoDB successfully.")
                return
            except Exception as e:
                print(f"Native MongoDB connection failed ({e}). Falling back to Local Embedded JSON Database Engine.")

        # Local High-Performance Document Engine
        self._local_db = LocalDatabase()
        print(f"TextilePro local document database initialized at {DB_FILE}")

    def get_collection(self, name: str):
        if self._is_native_mongo and self._motor_db is not None:
            return self._motor_db[name]
        if self._local_db is None:
            self._local_db = LocalDatabase()
        return self._local_db[name]

    def __getitem__(self, name: str):
        return self.get_collection(name)

db_wrapper = DatabaseWrapper()

def get_database():
    return db_wrapper
