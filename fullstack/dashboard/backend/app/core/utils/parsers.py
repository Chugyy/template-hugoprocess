from typing import List, Union


def parse_multi_value_filter(value: Union[str, List[str]]) -> List[str]:
    """
    Parse filtre multi-valeurs (ex: "pending,completed" -> ["pending", "completed"]).
    Sécurité : rejette caractères SQL suspects.

    Args:
        value: String avec virgules ou liste déjà parsée

    Returns:
        Liste de valeurs filtrées

    Raises:
        ValueError: Si caractères SQL suspects détectés
    """
    if isinstance(value, list):
        return value

    if not value or not value.strip():
        return []

    # Validation sécurité : rejeter caractères SQL suspects
    if any(char in value for char in [";", "--", "/*", "*/"]):
        raise ValueError("Invalid characters in filter value")

    # Split par virgule et strip whitespace
    if "," in value:
        return [v.strip() for v in value.split(",") if v.strip()]
    else:
        return [value.strip()]
