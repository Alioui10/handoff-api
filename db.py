# db.py — Stockage en mémoire pour le MVP
# À remplacer par Supabase/PostgreSQL en production

_store: dict = {}

def save_escalation(escalation: dict):
    _store[escalation["id"]] = escalation

def get_escalation(escalation_id: str) -> dict | None:
    return _store.get(escalation_id)

def resolve_escalation(escalation_id: str, answer: str, resolved_by: str, resolved_at: str):
    if escalation_id in _store:
        _store[escalation_id]["status"] = "resolved"
        _store[escalation_id]["answer"] = answer
        _store[escalation_id]["resolved_by"] = resolved_by
        _store[escalation_id]["resolved_at"] = resolved_at

def list_escalations() -> list:
    all_esc = list(_store.values())
    # pending en premier, puis par date
    return sorted(all_esc, key=lambda x: (x["status"] != "pending", x["created_at"]))
