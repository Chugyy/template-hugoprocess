# Audio Transcription Service

Architecture minimaliste pour transcription audio avec support API (OpenAI Whisper) et local (Whisper).

## Structure

```
transcription/
├── __init__.py         # Exports
├── base.py             # Classe abstraite + utilitaires
├── api.py              # OpenAI Whisper API
├── local.py            # Whisper local (optionnel)
├── manager.py          # Orchestrateur singleton
└── README.md           # Ce fichier
```

## Usage

### API Mode (recommandé)

```python
from app.core.services.openai.transcription.manager import TranscriptionManager

manager = TranscriptionManager()
task_id = manager.start_transcription(
    exchange_id=123,
    file_path="/path/to/audio.mp3",
    mode="api",
    db_session=db
)

status = manager.get_status(123)
# {'status': 'processing', 'progress': 0.65, 'text': None, 'error': None}
```

### Local Mode (nécessite openai-whisper)

```python
task_id = manager.start_transcription(
    exchange_id=123,
    file_path="/path/to/audio.mp3",
    mode="local",
    db_session=db
)
```

## Configuration

Dans `config/.env` :

```bash
OPENAI_API_KEY=sk-...
TRANSCRIPTION_MODE_DEFAULT=api  # ou "local"
```

## Dépendances

### Obligatoires
- `openai>=1.0.0` (mode API)

### Optionnelles
- `openai-whisper` (mode local)
- `pydub` (split de fichiers > 25MB)
- `ffmpeg` (mode local, segmentation audio)

## Limitations

| Critère | Mode API | Mode Local |
|---------|----------|------------|
| Taille max | 25MB (auto-split) | Illimité |
| Formats | mp3, wav, m4a, flac, ogg, webm | idem |
| Modèles | whisper-1 | tiny, base, small, medium, large, turbo |
| Coût | 0.006$/min | Gratuit (GPU local) |
| Vitesse | Rapide (API) | Variable (CPU/GPU) |

## Cas d'erreur gérés

- Fichier audio inexistant → `FileNotFoundError`
- Format non supporté → `ValueError`
- API key invalide → `RuntimeError`
- Modèle Whisper non disponible → `RuntimeError`
- Transcription déjà en cours → `RuntimeError`
- Annulation mid-transcription → `InterruptedError`

## Architecture

- **BaseTranscriber** : Interface abstraite avec validation
- **APITranscriber** : Implémentation OpenAI avec auto-split
- **LocalTranscriber** : Implémentation locale avec parallélisation
- **TranscriptionManager** : Singleton thread-safe, gestion d'état, auto-cleanup (1h)

## Scalabilité

- Singleton : 1 instance unique pour toute l'app
- Thread-safe : Lock sur état partagé
- Background workers : 1 thread par transcription
- Cleanup automatique : Suppression après 1h
