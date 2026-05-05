# Handoff API — MVP

Le pont entre un agent IA et un humain.

## Lancer en local

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

L'API tourne sur http://localhost:8000
Documentation auto : http://localhost:8000/docs

## Les 4 endpoints

| Méthode | Route | Qui l'appelle | Quoi |
|--------|-------|---------------|------|
| POST | /escalate | Agent IA | Demande de l'aide humaine |
| GET | /escalate/{id} | Agent IA | Vérifie si c'est résolu |
| POST | /escalate/{id}/resolve | Humain (dashboard) | Soumet la réponse |
| GET | /escalations | Humain (dashboard) | Liste toutes les demandes |

## Header requis

Tous les appels nécessitent :
```
x-api-key: ta-clé-secrète
```

## Exemple — ce qu'un agent envoie

```bash
curl -X POST http://localhost:8000/escalate \
  -H "x-api-key: sk-test-123" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent-commandes",
    "task": "Valider une commande B2B",
    "question": "Montant dépasse le seuil. Valider ?",
    "context": { "order_id": "ORD-8821", "amount": 8000 },
    "webhook_url": "https://monagent.io/resume/441"
  }'
```

## Prochaines étapes

- [ ] Remplacer db.py par Supabase
- [ ] Vraie validation des API keys
- [ ] Notifications email (Resend) ou Slack
- [ ] Dashboard web pour les humains
