import anthropic
from config.config import settings
from app.core.limiters import anthropic_limiter
import logging

logger = logging.getLogger(__name__)

class AnthropicService:
    def __init__(self):
        self.api_key = settings.anthropic_api_key
        self.client = None
        self.model = settings.anthropic_model
        self.max_tokens = settings.llm_max_tokens
        self.temperature = settings.llm_temperature

    def authenticate(self) -> bool:
        if not self.api_key:
            logger.error("Missing Anthropic API key")
            return False
        try:
            self.client = anthropic.Anthropic(api_key=self.api_key)
            return True
        except Exception as e:
            logger.error(f"Anthropic authentication failed: {e}")
            return False

    def generate_text(self, message: str, **kwargs):
        if not self.client and not self.authenticate():
            return None

        # Rate limiting
        anthropic_limiter.wait()

        try:
            logger.info(f"Calling Anthropic Claude: {len(message)} chars")
            response = self.client.messages.create(
                model=kwargs.get('model', self.model),
                max_tokens=kwargs.get('max_tokens', self.max_tokens),
                temperature=kwargs.get('temperature', self.temperature),
                messages=[{"role": "user", "content": message}]
            )
            result = response.content[0].text
            logger.info(f"Anthropic response: {len(result)} chars")
            return result
        except Exception as e:
            logger.error(f"Anthropic error: {e}")
            return None
