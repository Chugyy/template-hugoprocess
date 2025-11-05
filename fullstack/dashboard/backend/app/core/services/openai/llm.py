import openai
from config.config import settings
from app.core.limiters import openai_limiter
import logging

logger = logging.getLogger(__name__)


class OpenAIService:
    def __init__(self):
        self.api_key = settings.openai_api_key
        self.client = None
        self.model = settings.openai_model
        self.max_tokens = settings.llm_max_tokens
        self.temperature = settings.llm_temperature

    def authenticate(self) -> bool:
        if not self.api_key:
            logger.error("Missing OpenAI API key")
            return False
        try:
            self.client = openai.OpenAI(api_key=self.api_key)
            return True
        except Exception as e:
            logger.error(f"OpenAI authentication failed: {e}")
            return False

    def generate_text(self, message: str, **kwargs):
        if not self.client and not self.authenticate():
            return None

        # Rate limiting
        openai_limiter.wait_for_gpt()

        try:
            logger.info(f"Calling OpenAI GPT: {len(message)} chars")
            response = self.client.chat.completions.create(
                model=kwargs.get('model', self.model),
                max_tokens=kwargs.get('max_tokens', self.max_tokens),
                temperature=kwargs.get('temperature', self.temperature),
                messages=[{"role": "user", "content": message}]
            )
            result = response.choices[0].message.content
            logger.info(f"OpenAI response: {len(result)} chars")
            return result
        except Exception as e:
            logger.error(f"OpenAI error: {e}")
            return None
