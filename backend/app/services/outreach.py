"""Personalised outreach generation.

Deterministic, multilingual templates built from the *real* audit findings,
with an optional Ollama pass to make copy more natural. Variants: soft email,
direct email, WhatsApp/SMS, LinkedIn DM, and two follow-ups.
"""
from __future__ import annotations

from . import ollama_client

VARIANTS = ["soft_email", "direct_email", "whatsapp", "linkedin", "follow_up_1", "follow_up_2"]
SUPPORTED_LANGS = ["en", "nl", "fr", "de", "es", "it", "pt", "pl", "tr", "ar", "ja"]

# Per-language building blocks. English is the fallback for any missing key.
L: dict[str, dict[str, str]] = {
    "en": {
        "greeting": "Hi there,",
        "intro": "I came across {name} and took a quick look at your website.",
        "found": "A few things stood out:",
        "offer": "I help {niche} businesses fix exactly this — happy to send a free homepage mockup so you can see the difference.",
        "cta": "May I send an example over?",
        "closing": "Best,\n{sender}",
        "wa": "Hi {name} 👋 I looked at your site and spotted {n} quick wins ({first}). Want a free homepage mockup? — {sender}",
        "li": "Hi — I audit {niche} websites and noticed a few fixable issues on {name}'s site ({first}). Happy to share a free mockup if useful.",
        "fu1": "Hi again — just floating this back to the top in case it got buried. Still happy to send that free {name} mockup.",
        "fu2": "Last note from me — if improving {name}'s website isn't a priority right now, no worries at all. I'll leave the offer open.",
        "subj_soft": "A quick idea for {name}'s website",
        "subj_direct": "{name}: {n} quick website fixes",
    },
    "nl": {
        "greeting": "Hallo,",
        "intro": "Ik kwam {name} tegen en heb even naar jullie website gekeken.",
        "found": "Een paar dingen vielen me op:",
        "offer": "Ik help {niche}-bedrijven precies hiermee — ik stuur graag een gratis voorbeeld van een verbeterde homepage.",
        "cta": "Mag ik een voorbeeld doorsturen?",
        "closing": "Groeten,\n{sender}",
        "wa": "Hoi {name} 👋 Ik keek naar jullie site en zag {n} snelle verbeterpunten ({first}). Zin in een gratis voorbeeld van de homepage? — {sender}",
        "li": "Hallo — ik audit {niche}-websites en zag een paar oplosbare punten op de site van {name} ({first}). Ik deel graag een gratis voorbeeld.",
        "fu1": "Nog even een kort bericht — voor het geval het ondersneeuwde. Ik stuur nog steeds graag dat gratis voorbeeld van {name}.",
        "fu2": "Laatste berichtje — als de website van {name} nu geen prioriteit is, helemaal prima. Het aanbod blijft staan.",
        "subj_soft": "Een klein idee voor de website van {name}",
        "subj_direct": "{name}: {n} snelle website-verbeteringen",
    },
    "fr": {
        "greeting": "Bonjour,",
        "intro": "Je suis tombé sur {name} et j'ai jeté un œil à votre site.",
        "found": "Quelques points m'ont marqué :",
        "offer": "J'aide les entreprises de {niche} à corriger exactement cela — je peux vous envoyer une maquette gratuite de page d'accueil.",
        "cta": "Puis-je vous envoyer un exemple ?",
        "closing": "Cordialement,\n{sender}",
        "wa": "Bonjour {name} 👋 J'ai regardé votre site et repéré {n} améliorations rapides ({first}). Une maquette gratuite vous intéresse ? — {sender}",
        "li": "Bonjour — j'audite les sites de {niche} et j'ai remarqué quelques points corrigeables sur le site de {name} ({first}). Je peux partager une maquette gratuite.",
        "fu1": "Petit rappel au cas où mon message serait passé inaperçu. Je peux toujours envoyer la maquette gratuite de {name}.",
        "fu2": "Dernier message — si le site de {name} n'est pas une priorité, aucun souci. L'offre reste ouverte.",
        "subj_soft": "Une idée pour le site de {name}",
        "subj_direct": "{name} : {n} améliorations rapides du site",
    },
    "de": {
        "greeting": "Hallo,",
        "intro": "Ich bin auf {name} gestoßen und habe mir Ihre Website kurz angesehen.",
        "found": "Ein paar Dinge sind mir aufgefallen:",
        "offer": "Ich helfe {niche}-Betrieben genau dabei — gerne sende ich Ihnen einen kostenlosen Homepage-Entwurf.",
        "cta": "Darf ich Ihnen ein Beispiel schicken?",
        "closing": "Beste Grüße,\n{sender}",
        "wa": "Hallo {name} 👋 Ich habe Ihre Seite angesehen und {n} schnelle Verbesserungen gefunden ({first}). Interesse an einem kostenlosen Entwurf? — {sender}",
        "li": "Hallo — ich prüfe {niche}-Websites und habe einige behebbare Punkte auf der Seite von {name} bemerkt ({first}). Ich teile gerne einen kostenlosen Entwurf.",
        "fu1": "Nur eine kurze Erinnerung, falls meine Nachricht untergegangen ist. Ich sende gerne den kostenlosen Entwurf für {name}.",
        "fu2": "Letzte Nachricht — falls die Website von {name} gerade keine Priorität hat, kein Problem. Das Angebot bleibt bestehen.",
        "subj_soft": "Eine Idee für die Website von {name}",
        "subj_direct": "{name}: {n} schnelle Website-Verbesserungen",
    },
    "es": {
        "greeting": "Hola,",
        "intro": "Encontré {name} y eché un vistazo rápido a vuestra web.",
        "found": "Algunas cosas me llamaron la atención:",
        "offer": "Ayudo a negocios de {niche} con exactamente esto — puedo enviaros una maqueta gratuita de la página de inicio.",
        "cta": "¿Puedo enviaros un ejemplo?",
        "closing": "Un saludo,\n{sender}",
        "wa": "Hola {name} 👋 Miré vuestra web y vi {n} mejoras rápidas ({first}). ¿Os interesa una maqueta gratuita? — {sender}",
        "li": "Hola — audito webs de {niche} y noté algunos puntos mejorables en la web de {name} ({first}). Puedo compartir una maqueta gratuita.",
        "fu1": "Solo un recordatorio por si mi mensaje se perdió. Sigo encantado de enviaros la maqueta gratuita de {name}.",
        "fu2": "Último mensaje — si la web de {name} no es prioridad ahora, sin problema. La oferta sigue en pie.",
        "subj_soft": "Una idea para la web de {name}",
        "subj_direct": "{name}: {n} mejoras rápidas para la web",
    },
}


def _lang(code: str) -> dict:
    base = dict(L["en"])
    base.update(L.get(code, {}))
    return base


def _top_findings(findings: list[dict], n: int = 3) -> list[str]:
    return [f["issue"] for f in findings[:n]]


def generate_variant(lead: dict, findings: list[dict], variant: str, language: str, sender: str = "Your name") -> dict:
    lang = _lang(language)
    name = lead.get("business_name", "there")
    niche = lead.get("category") or lead.get("niche") or "local"
    issues = _top_findings(findings, 3)
    first = issues[0].lower() if issues else "a few quick wins"
    n = len(issues) or 3
    bullets = "\n".join(f"• {i}" for i in issues)

    if variant in ("whatsapp", "linkedin"):
        key = "wa" if variant == "whatsapp" else "li"
        body = lang[key].format(name=name, niche=niche, n=n, first=first, sender=sender)
        subject = ""
    elif variant == "follow_up_1":
        body = lang["fu1"].format(name=name)
        subject = f"Re: {lang['subj_soft'].format(name=name, n=n)}"
    elif variant == "follow_up_2":
        body = lang["fu2"].format(name=name)
        subject = f"Re: {lang['subj_soft'].format(name=name, n=n)}"
    else:
        is_direct = variant == "direct_email"
        subject = (lang["subj_direct"] if is_direct else lang["subj_soft"]).format(name=name, n=n)
        parts = [
            lang["greeting"],
            "",
            lang["intro"].format(name=name),
            "",
            lang["found"],
            bullets,
            "",
            lang["offer"].format(niche=niche),
            "",
            lang["cta"],
            "",
            lang["closing"].format(sender=sender),
        ]
        body = "\n".join(parts)

    generated_by = "template"
    # Optional: let local AI smooth the email copy (never the facts).
    if variant in ("soft_email", "direct_email") and ollama_client.is_enabled():
        prompt = (
            f"Rewrite this cold outreach email to sound more natural and human in the same "
            f"language, keeping it short and keeping ONLY these facts:\n\n{body}\n\n"
            f"Do not invent any new claims. Return only the email body."
        )
        ai = ollama_client.generate(prompt, system="You are a concise B2B copywriter.")
        if ai:
            body, generated_by = ai, "ollama"

    return {"variant": variant, "language": language, "subject": subject, "body": body, "generated_by": generated_by}
