# app/core/services/slack.py
import requests
from typing import Optional
from config.config import settings
from config.logger import logger

class SlackNotifier:
    def __init__(self):
        self.token = getattr(settings, 'slack_bot_token', '')
        self.url = "https://slack.com/api/chat.postMessage"
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        self.enabled = getattr(settings, 'slack_enabled', False) and bool(self.token)
        self.default_channel = getattr(settings, 'slack_default_channel', '#general')

    def send_notification(self, message: str, channel: Optional[str] = None) -> bool:
        if not self.enabled:
            return False
            
        target_channel = channel or self.default_channel
        
        payload = {
            "channel": target_channel,
            "text": message
        }
        
        try:
            response = requests.post(self.url, headers=self.headers, json=payload, timeout=10)
            response_data = response.json()
            
            if response_data.get("ok"):
                logger.info(f"Message Slack envoyé vers {target_channel}")
                return True
            else:
                logger.error(f"Erreur Slack: {response_data.get('error', 'Erreur inconnue')}")
                return False
                
        except requests.RequestException as e:
            logger.error(f"Erreur réseau Slack: {e}")
            return False
        except Exception as e:
            logger.error(f"Erreur inattendue Slack: {e}")
            return False

    def send_error_notification(self, error_type: str, error_message: str, context: Optional[str] = None) -> bool:
        emoji_map = {
            "CRITICAL": "🚨",
            "ERROR": "❌", 
            "WARNING": "⚠️",
            "INFO": "ℹ️"
        }
        
        emoji = emoji_map.get(error_type.upper(), "🔥")
        
        message = f"{emoji} *{error_type.upper()}* - {settings.app_name}\n\n"
        message += f"**Message:** {error_message}\n"
        
        if context:
            message += f"**Contexte:** {context}\n"
            
        message += f"**Application:** {settings.app_name}"
        
        return self.send_notification(message)

    def send_new_customer_notification(self, user_id: int, email: str, plan: str) -> bool:
        message = f"🎉 *NOUVEAU CLIENT* - {settings.app_name}\n\n"
        message += f"**Utilisateur ID:** {user_id}\n"
        message += f"**Email:** {email}\n"
        message += f"**Plan:** {plan}\n"
        message += f"**Application:** {settings.app_name}"
        
        return self.send_notification(message)

    def send_cancellation_notification(self, user_id: int, email: str) -> bool:
        message = f"❌ *ANNULATION ABONNEMENT* - {settings.app_name}\n\n"
        message += f"**Utilisateur ID:** {user_id}\n"
        message += f"**Email:** {email}\n"
        message += f"**Application:** {settings.app_name}"
        
        return self.send_notification(message)

# Instance globale
slack_notifier = SlackNotifier()