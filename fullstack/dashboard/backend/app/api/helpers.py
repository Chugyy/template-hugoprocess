from fastapi import HTTPException, status
from typing import Dict, Any, List


def verify_ownership(entity: Dict[str, Any], user_id: int, entity_type: str = "Entity") -> None:
    """
    Vérifie que l'entity appartient à l'utilisateur.
    Raise HTTPException 401 si mismatch.
    """
    if entity["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"{entity_type} not found or unauthorized"
        )


def paginated_response(data: List[Any], total: int, offset: int, limit: int) -> Dict:
    """
    Formate réponse paginée standardisée.
    """
    return {
        "data": data,
        "pagination": {
            "total": total,
            "offset": offset,
            "limit": limit,
            "has_more": offset + limit < total
        }
    }
