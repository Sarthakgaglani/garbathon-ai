import logging
from typing import Any, Dict, Optional

logger = logging.getLogger("scam_shield.alert_stub")


class AlertStub:
    """
    Mocked emergency alert dispatcher for SMS / WhatsApp alerts.
    Simulates sending an urgent alert to the elder's trusted family contact.
    """

    @staticmethod
    def send_emergency_alert(
        contact_phone: str,
        relationship: str = "Son",
        elder_name: Optional[str] = None,
        detected_flags: Optional[list[str]] = None,
    ) -> Dict[str, Any]:
        flags_desc = f" [{', '.join(detected_flags)}]" if detected_flags else ""
        rel_label = relationship.strip().capitalize() if relationship else "Family Member"
        elder_label = elder_name or "Your elderly parent"

        # Construct realistic SMS message
        message = (
            f"URGENT: {elder_label} may be on a suspected telephone scam call right now{flags_desc}. "
            f"Please call them immediately to ensure their safety. (Sent via Scam Call Shield)"
        )

        logger.info(
            f"[MOCKED ALERT DISPATCHED] To: {rel_label} ({contact_phone}) | Message: '{message}' | Simulated: True"
        )

        return {
            "contact": contact_phone,
            "relationship": rel_label,
            "message": message,
            "simulated": True,
            "status": "delivered_mock",
        }
