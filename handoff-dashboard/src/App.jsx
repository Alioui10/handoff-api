import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

const timeAgo = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
};

export default function HandoffDashboard() {
  const [escalations, setEscalations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answer, setAnswer] = useState("");
  const [filter, setFilter] = useState("all");
  const [resolvedBy] = useState("ilyasse");
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const headers = { "x-api-key": API_KEY, "Content-Type": "application/json" };

  // Charger les escalations depuis l'API
  const fetchEscalations = async () => {
    try {
      const res = await fetch(`${API_URL}/escalations`, { headers });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setEscalations(data);
      setError(null);
    } catch (e) {
      setError("Impossible de contacter l'API : " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Charger au démarrage + toutes les 10 secondes
  useEffect(() => {
    fetchEscalations();
    const interval = setInterval(fetchEscalations, 10000);
    return () => clearInterval(interval);
  }, []);

  const pending = escalations.filter(e => e.status === "pending");
  const resolved = escalations.filter(e => e.status === "resolved");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleResolve = async (id) => {
    if (!answer.trim()) return;
    try {
      const res = await fetch(`${API_URL}/escalate/${id}/resolve`, {
        method: "POST",
        headers,
        body: JSON.stringify({ answer, resolved_by: resolvedBy }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      await fetchEscalations();
      setSelected(null);
      setAnswer("");
      showToast("Réponse envoyée à l'agent ✓");
    } catch (e) {
      showToast("Erreur : " + e.message, "error");
    }
  };

  const selectedEsc = escalations.find(e => e.id === selected);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F5F2EC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#999", fontSize: "14px" }}>
      Connexion à l'API...
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#F5F2EC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", flexDirection: "column", gap: "16px" }}>
      <div style={{ color: "#c0392b", fontSize: "14px" }}>{error}</div>
      <button onClick={fetchEscalations} style={{ background: "#1a1a1a", color: "#F5F2EC", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
        Réessayer
      </button>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F5F2EC",
      fontFamily: "'Georgia', serif",
      color: "#1a1a1a",
    }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "24px", right: "24px", zIndex: 100,
          background: "#1a1a1a", color: "#F5F2EC",
          padding: "12px 20px", borderRadius: "6px",
          fontSize: "13px", letterSpacing: "0.5px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          animation: "slideIn 0.3s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0,
        width: "220px",
        background: "#1a1a1a",
        display: "flex", flexDirection: "column",
        padding: "32px 0",
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: "0 24px 40px" }}>
          <div style={{ fontSize: "22px", color: "#F5F2EC", letterSpacing: "-0.5px" }}>
            Hand<span style={{ color: "#C9A84C" }}>off</span>
          </div>
          <div style={{ fontSize: "10px", color: "#555", letterSpacing: "3px", marginTop: "4px" }}>
            DASHBOARD
          </div>
        </div>

        {/* Nav */}
        {[
          { id: "dashboard", label: "Vue d'ensemble", icon: "◈" },
          { id: "pending", label: "En attente", icon: "◉", badge: pending.length },
          { id: "resolved", label: "Résolues", icon: "◎" },
          { id: "api", label: "Clé API", icon: "⌘" },
        ].map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "12px 24px",
            background: tab === item.id ? "#2a2a2a" : "transparent",
            border: "none",
            borderLeft: tab === item.id ? "2px solid #C9A84C" : "2px solid transparent",
            color: tab === item.id ? "#F5F2EC" : "#666",
            fontSize: "13px", fontFamily: "'Georgia', serif",
            cursor: "pointer", textAlign: "left",
            transition: "all 0.15s",
            width: "100%",
          }}>
            <span style={{ fontSize: "16px" }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge > 0 && (
              <span style={{
                background: "#C9A84C", color: "#1a1a1a",
                borderRadius: "10px", padding: "1px 7px",
                fontSize: "11px", fontFamily: "monospace",
              }}>{item.badge}</span>
            )}
          </button>
        ))}

        {/* Bottom */}
        <div style={{ marginTop: "auto", padding: "24px", borderTop: "1px solid #2a2a2a" }}>
          <div style={{ fontSize: "11px", color: "#444", marginBottom: "4px" }}>Connecté en tant que</div>
          <div style={{ fontSize: "13px", color: "#888" }}>{resolvedBy}</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: "220px", padding: "40px 40px 40px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#999", marginBottom: "8px" }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
          </div>
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "normal", letterSpacing: "-1px" }}>
            {tab === "dashboard" && "Vue d'ensemble"}
            {tab === "pending" && "Escalations en attente"}
            {tab === "resolved" && "Escalations résolues"}
            {tab === "api" && "Intégration API"}
          </h1>
        </div>

        {/* DASHBOARD TAB */}
        {tab === "dashboard" && (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "40px" }}>
              {[
                { label: "En attente", value: pending.length, sub: "Nécessitent une réponse", accent: "#C9A84C" },
                { label: "Résolues aujourd'hui", value: resolved.length, sub: "Agents débloqués", accent: "#4CAF50" },
                { label: "Temps moyen", value: "18 min", sub: "Pour une résolution", accent: "#2196F3" },
              ].map(s => (
                <div key={s.label} style={{
                  background: "#fff",
                  border: "1px solid #E8E4DC",
                  borderRadius: "8px",
                  padding: "24px",
                  borderTop: `3px solid ${s.accent}`,
                }}>
                  <div style={{ fontSize: "36px", fontWeight: "normal", marginBottom: "6px" }}>{s.value}</div>
                  <div style={{ fontSize: "14px", color: "#1a1a1a", marginBottom: "4px" }}>{s.label}</div>
                  <div style={{ fontSize: "12px", color: "#999" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Pending alerts */}
            {pending.length > 0 && (
              <div style={{
                background: "#FFFBF0",
                border: "1px solid #C9A84C44",
                borderLeft: "3px solid #C9A84C",
                borderRadius: "8px",
                padding: "20px 24px",
                marginBottom: "32px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "normal", marginBottom: "4px" }}>
                    {pending.length} agent{pending.length > 1 ? "s" : ""} en attente de réponse
                  </div>
                  <div style={{ fontSize: "12px", color: "#999" }}>
                    Les agents sont bloqués tant que vous n'avez pas répondu
                  </div>
                </div>
                <button onClick={() => setTab("pending")} style={{
                  background: "#1a1a1a", color: "#F5F2EC",
                  border: "none", padding: "10px 20px",
                  borderRadius: "6px", fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  cursor: "pointer", letterSpacing: "1px",
                }}>
                  RÉPONDRE →
                </button>
              </div>
            )}

            {/* Recent */}
            <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#999", marginBottom: "16px" }}>
              ACTIVITÉ RÉCENTE
            </div>
            <EscalationList items={escalations.slice(0, 4)} onSelect={e => { setSelected(e.id); setTab("pending"); }} />
          </>
        )}

        {/* PENDING TAB */}
        {tab === "pending" && (
          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: "24px" }}>
            <div>
              {pending.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "80px 40px",
                  background: "#fff", borderRadius: "8px",
                  border: "1px solid #E8E4DC",
                }}>
                  <div style={{ fontSize: "40px", marginBottom: "16px" }}>◎</div>
                  <div style={{ color: "#999", fontSize: "14px" }}>Tous les agents sont débloqués</div>
                </div>
              ) : (
                <EscalationList
                  items={pending}
                  onSelect={e => { setSelected(e.id); setAnswer(""); }}
                  selected={selected}
                />
              )}
            </div>

            {/* Detail panel */}
            {selected && selectedEsc && (
              <div style={{
                background: "#fff", borderRadius: "8px",
                border: "1px solid #E8E4DC", padding: "28px",
                height: "fit-content", position: "sticky", top: "40px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                  <div>
                    <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#999", marginBottom: "6px" }}>
                      {selectedEsc.agent_id.toUpperCase()}
                    </div>
                    <div style={{ fontSize: "18px", letterSpacing: "-0.5px" }}>{selectedEsc.task}</div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#999", fontSize: "20px", padding: "0",
                  }}>×</button>
                </div>

                {/* Question */}
                <div style={{
                  background: "#F5F2EC", borderRadius: "6px",
                  padding: "16px", marginBottom: "20px",
                  fontSize: "14px", lineHeight: "1.6",
                  borderLeft: "3px solid #C9A84C",
                }}>
                  {selectedEsc.question}
                </div>

                {/* Context */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#999", marginBottom: "12px" }}>
                    CONTEXTE
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {Object.entries(selectedEsc.context).map(([k, v]) => (
                      <div key={k} style={{
                        background: "#F9F7F3", borderRadius: "4px",
                        padding: "10px 12px",
                      }}>
                        <div style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", letterSpacing: "1px" }}>{k}</div>
                        <div style={{ fontSize: "13px", marginTop: "2px" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Answer */}
                {selectedEsc.status === "pending" ? (
                  <>
                    <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#999", marginBottom: "10px" }}>
                      VOTRE RÉPONSE
                    </div>
                    <textarea
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      placeholder="Tapez votre décision ici..."
                      style={{
                        width: "100%", minHeight: "90px",
                        background: "#F5F2EC", border: "1px solid #E0DAD0",
                        borderRadius: "6px", padding: "12px",
                        fontFamily: "'Georgia', serif", fontSize: "14px",
                        color: "#1a1a1a", resize: "vertical",
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
                      <button onClick={() => { setAnswer("Non, refuser."); }} style={{
                        padding: "12px", background: "#fff",
                        border: "1px solid #E8E4DC", borderRadius: "6px",
                        fontFamily: "'Georgia', serif", fontSize: "13px",
                        cursor: "pointer", color: "#c0392b",
                      }}>
                        ✗ Refuser
                      </button>
                      <button onClick={() => handleResolve(selected)} style={{
                        padding: "12px",
                        background: answer.trim() ? "#1a1a1a" : "#E8E4DC",
                        color: answer.trim() ? "#F5F2EC" : "#999",
                        border: "none", borderRadius: "6px",
                        fontFamily: "'Georgia', serif", fontSize: "13px",
                        cursor: answer.trim() ? "pointer" : "not-allowed",
                        letterSpacing: "1px",
                      }}>
                        ENVOYER →
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{
                    background: "#F0FFF4", border: "1px solid #4CAF5044",
                    borderRadius: "6px", padding: "16px",
                  }}>
                    <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#4CAF50", marginBottom: "8px" }}>
                      RÉSOLU PAR {selectedEsc.resolved_by?.toUpperCase()}
                    </div>
                    <div style={{ fontSize: "14px", lineHeight: "1.6" }}>{selectedEsc.answer}</div>
                  </div>
                )}

                <div style={{ marginTop: "16px", fontSize: "11px", color: "#bbb", textAlign: "right" }}>
                  Reçu il y a {timeAgo(selectedEsc.created_at)} · {selectedEsc.id}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESOLVED TAB */}
        {tab === "resolved" && (
          <EscalationList items={resolved} onSelect={() => {}} />
        )}

        {/* API TAB */}
        {tab === "api" && (
          <div style={{ maxWidth: "640px" }}>
            <div style={{
              background: "#fff", border: "1px solid #E8E4DC",
              borderRadius: "8px", padding: "28px", marginBottom: "20px",
            }}>
              <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#999", marginBottom: "12px" }}>
                VOTRE CLÉ API
              </div>
              <div style={{
                background: "#F5F2EC", borderRadius: "6px",
                padding: "14px 16px", fontFamily: "monospace",
                fontSize: "13px", color: "#1a1a1a",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span>sk-hoff-••••••••••••••••3f9a</span>
                <button onClick={() => showToast("Clé copiée ✓")} style={{
                  background: "#1a1a1a", color: "#F5F2EC",
                  border: "none", padding: "6px 14px",
                  borderRadius: "4px", fontSize: "11px",
                  fontFamily: "monospace", cursor: "pointer",
                }}>
                  COPIER
                </button>
              </div>
            </div>

            <div style={{
              background: "#1a1a1a", borderRadius: "8px",
              padding: "28px", color: "#F5F2EC",
            }}>
              <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#C9A84C", marginBottom: "16px" }}>
                EXEMPLE D'INTÉGRATION
              </div>
              <pre style={{
                margin: 0, fontSize: "12px", lineHeight: "1.8",
                color: "#aaa", overflowX: "auto",
                fontFamily: "monospace",
              }}>{`import requests

response = requests.post(
  "https://handoff.io/api/escalate",
  headers={"x-api-key": "sk-hoff-...3f9a"},
  json={
    "agent_id": "mon-agent",
    "task": "Validation commande",
    "question": "Valider 8 000€ ?",
    "context": {"order_id": "ORD-001"},
    "webhook_url": "https://monagent.io/resume"
  }
)

esc_id = response.json()["escalation_id"]
# L'agent attend... puis reçoit la réponse
# automatiquement via le webhook.`}</pre>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
      `}</style>
    </div>
  );
}

function EscalationList({ items, onSelect, selected }) {
  if (items.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#999", fontSize: "14px" }}>
      Aucune escalation
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {items.map(e => (
        <div key={e.id} onClick={() => onSelect(e)}
          style={{
            background: selected === e.id ? "#FFFBF0" : "#fff",
            border: selected === e.id ? "1px solid #C9A84C88" : "1px solid #E8E4DC",
            borderLeft: e.status === "pending" ? "3px solid #C9A84C" : "3px solid #4CAF50",
            borderRadius: "8px", padding: "18px 20px",
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={ev => ev.currentTarget.style.borderColor = "#C9A84C66"}
          onMouseLeave={ev => ev.currentTarget.style.borderColor = selected === e.id ? "#C9A84C88" : "#E8E4DC"}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{
                  fontSize: "10px", letterSpacing: "2px",
                  color: e.status === "pending" ? "#C9A84C" : "#4CAF50",
                  background: e.status === "pending" ? "#FFFBF0" : "#F0FFF4",
                  padding: "2px 8px", borderRadius: "10px",
                }}>
                  {e.status === "pending" ? "EN ATTENTE" : "RÉSOLU"}
                </span>
                <span style={{ fontSize: "11px", color: "#bbb", fontFamily: "monospace" }}>
                  {e.agent_id}
                </span>
              </div>
              <div style={{ fontSize: "15px", marginBottom: "6px", letterSpacing: "-0.3px" }}>
                {e.task}
              </div>
              <div style={{ fontSize: "13px", color: "#777", lineHeight: "1.5" }}>
                {e.question.length > 80 ? e.question.slice(0, 80) + "..." : e.question}
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "#bbb", marginLeft: "16px", flexShrink: 0 }}>
              {timeAgo(e.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
