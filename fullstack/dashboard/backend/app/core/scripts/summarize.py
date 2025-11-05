from app.core.services.anthropic.llm import AnthropicService
from app.core.services.openai.llm import OpenAIService
from config.config import settings
from typing import Dict, Optional
import json
import logging

logger = logging.getLogger(__name__)


class SummarizationEngine:
    def __init__(self):
        self.anthropic = AnthropicService()
        self.openai = OpenAIService()
        self.provider = settings.summarization_provider

    async def summarize(self, exchange_data: Dict, custom_instruction: Optional[str] = None) -> Optional[Dict]:
        prompt = self._build_prompt(exchange_data, custom_instruction)

        if self.provider == "anthropic":
            response = self._try_anthropic(prompt)
            if response:
                return self._parse_response(response)

            logger.warning("Anthropic failed, falling back to OpenAI")
            response = self._try_openai(prompt)
        else:
            response = self._try_openai(prompt)

        if not response:
            logger.error("All LLM providers failed")
            return None

        return self._parse_response(response)

    def _build_prompt(self, exchange: Dict, custom_instruction: Optional[str] = None) -> str:
        content = f"""
Transcript: {exchange.get('transcription', 'N/A')}
Description: {exchange.get('outcome', 'N/A')}
Notes: {exchange.get('next_steps', 'N/A')}
Date de l'échange : {exchange.get('exchange_date', 'N/A')}
""".strip()

        base_prompt = f"""
Analysez cet échange professionnel et fournissez un résumé structuré.

CONTENU :
{content}

RÉPONSE ATTENDUE (JSON uniquement) :
{{
  "summary": "résumé en 2-3 phrases",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": ["action immédiate 1", "action immédiate 2"],
  "suggestedTasks": [
    {{
      "title": "Titre court de la tâche",
      "description": "Description détaillée",
      "priority": "low|medium|high|urgent",
      "dueDate": "YYYY-MM-DD"
    }}
  ]
}}

Règles :
- summary : synthèse globale de l'échange
- keyPoints : 3-5 points essentiels discutés
- actionItems : actions immédiates à entreprendre (court terme)
- suggestedTasks : tâches identifiées avec deadline inférée selon contexte
  * priority : estimer selon urgence mentionnée dans l'échange
  * dueDate : calculer depuis la date de l'échange (ajouter délai réaliste)
  * Si aucune deadline mentionnée, laisser à null

Retourner UNIQUEMENT le JSON, sans markdown ni texte additionnel.
"""

        if custom_instruction and custom_instruction.strip():
            base_prompt += f"\n\nInstruction additionnelle : {custom_instruction}"

        return base_prompt

    def _try_anthropic(self, prompt: str) -> Optional[str]:
        try:
            return self.anthropic.generate_text(prompt)
        except Exception as e:
            logger.error(f"Anthropic failed: {e}")
            return None

    def _try_openai(self, prompt: str) -> Optional[str]:
        try:
            return self.openai.generate_text(prompt)
        except Exception as e:
            logger.error(f"OpenAI failed: {e}")
            return None

    def _parse_response(self, response: str) -> Optional[Dict]:
        if not response:
            return None

        try:
            clean = response.strip()
            if clean.startswith('```'):
                lines = clean.split('\n')
                clean = '\n'.join(lines[1:-1])

            data = json.loads(clean)
            required = ['summary', 'keyPoints', 'actionItems', 'suggestedTasks']

            if all(k in data for k in required):
                # Validation structure suggestedTasks
                if not isinstance(data['suggestedTasks'], list):
                    logger.error(f"suggestedTasks is not a list: {type(data['suggestedTasks'])}")
                    data['suggestedTasks'] = []
                else:
                    for task in data['suggestedTasks']:
                        if not isinstance(task, dict) or 'title' not in task:
                            logger.error(f"Invalid suggestedTask structure: {task}")
                            data['suggestedTasks'] = []
                            break
                return data

            logger.error(f"Missing required keys in response: {data.keys()}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e} | Response: {response[:200]}")
            return None


# Instance globale
summarization_engine = SummarizationEngine()
