from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import uuid, datetime, httpx
from db import save_escalation, get_escalation, resolve_escalation, list_escalations

app = FastAPI(title="Handoff API", version="0.1.0")

# ─────────────────────────────────────────────
# MODÈLES
# ─────────────────────────────────────────────

class EscalationRequest(BaseModel):
    agent_id: str                   # identifiant de l'agent qui demande
    task: str                       # description courte de la tâche
    question: str                   # la question précise pour l'humain
    context: Optional[dict] = {}    # données utiles (montant, client, etc.)
    webhook_url: Optional[str] = None  # URL pour notifier l'agent quand c'est résolu

class ResolutionRequest(BaseModel):
    answer: str          # réponse de l'humain
    resolved_by: str     # identifiant de l'humain qui répond


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

@app.post("/escalate", status_code=201)
async def escalate(payload: EscalationRequest, x_api_key: str = Header(...)):
    """
    L'agent appelle cet endpoint quand il est bloqué.
    Retourne un escalation_id que l'agent peut utiliser pour vérifier le statut.
    """
    # TODO: valider l'api_key en base
    escalation_id = f"esc_{uuid.uuid4().hex[:10]}"
    now = datetime.datetime.utcnow().isoformat()

    escalation = {
        "id": escalation_id,
        "agent_id": payload.agent_id,
        "task": payload.task,
        "question": payload.question,
        "context": payload.context,
        "webhook_url": payload.webhook_url,
        "status": "pending",        # pending → resolved
        "created_at": now,
        "resolved_at": None,
        "answer": None,
        "resolved_by": None,
    }

    save_escalation(escalation)

    # Ici tu peux brancher une notif email/Slack (voir notifications.py)

    return {
        "escalation_id": escalation_id,
        "status": "pending",
        "message": "Escalation reçue. Un humain va répondre.",
        "created_at": now,
    }


@app.get("/escalate/{escalation_id}")
async def get_status(escalation_id: str, x_api_key: str = Header(...)):
    """
    L'agent poll cet endpoint pour savoir si l'humain a répondu.
    """
    esc = get_escalation(escalation_id)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation introuvable")

    return {
        "escalation_id": esc["id"],
        "status": esc["status"],
        "answer": esc["answer"],        # None si pas encore résolu
        "resolved_at": esc["resolved_at"],
    }


@app.post("/escalate/{escalation_id}/resolve")
async def resolve(escalation_id: str, payload: ResolutionRequest, x_api_key: str = Header(...)):
    """
    L'humain soumet sa réponse via le tableau de bord.
    Déclenche le webhook vers l'agent si configuré.
    """
    esc = get_escalation(escalation_id)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation introuvable")
    if esc["status"] == "resolved":
        raise HTTPException(status_code=400, detail="Déjà résolu")

    now = datetime.datetime.utcnow().isoformat()
    resolve_escalation(escalation_id, payload.answer, payload.resolved_by, now)

    # Notifier l'agent via webhook
    if esc.get("webhook_url"):
        await notify_agent(esc["webhook_url"], escalation_id, payload.answer)

    return {
        "escalation_id": escalation_id,
        "status": "resolved",
        "answer": payload.answer,
        "resolved_at": now,
    }


@app.get("/escalations")
async def list_all(x_api_key: str = Header(...)):
    """
    Tableau de bord : liste toutes les escalations (pending en premier).
    """
    return list_escalations()


# ─────────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────────

async def notify_agent(webhook_url: str, escalation_id: str, answer: str):
    """Envoie la réponse à l'agent via son webhook."""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(webhook_url, json={
                "escalation_id": escalation_id,
                "status": "resolved",
                "answer": answer,
            }, timeout=5)
    except Exception as e:
        print(f"Webhook échoué : {e}")  # log mais on ne bloque pas
