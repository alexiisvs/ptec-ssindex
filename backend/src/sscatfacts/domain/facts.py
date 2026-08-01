import hashlib
import unicodedata


def normalize_fact_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text)
    return " ".join(normalized.split())


def fact_content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()
