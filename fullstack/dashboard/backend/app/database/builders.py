from typing import Dict, Any, List, Tuple, Optional

FilterConfig = Dict[str, Any]
QueryResult = Tuple[str, str, List[Any], int, int]


def build_paginated_query(
    table: str,
    user_id: int,
    filters: FilterConfig,
    offset: int,
    limit: int
) -> QueryResult:
    """
    Construit requête paginée avec filtres dynamiques (parameterized queries).
    Supporte filtres multi-valeurs (ex: status=['pending', 'in_progress']).

    Args:
        table: Nom de la table
        user_id: ID de l'utilisateur
        filters: Dictionnaire de filtres (clé: valeur ou liste de valeurs)
        offset: Offset pour pagination
        limit: Limite pour pagination

    Returns:
        Tuple (select_query, count_query, params, offset, limit)
    """
    where_clauses = ["user_id = $1"]
    params: List[Any] = [user_id]
    param_idx = 2

    for field, value in filters.items():
        if value is None or (isinstance(value, list) and not value):
            continue

        if isinstance(value, list):
            placeholders = ", ".join([f"${param_idx + i}" for i in range(len(value))])
            where_clauses.append(f"{field} IN ({placeholders})")
            params.extend(value)
            param_idx += len(value)
        else:
            where_clauses.append(f"{field} = ${param_idx}")
            params.append(value)
            param_idx += 1

    where_sql = " AND ".join(where_clauses)

    count_query = f"SELECT COUNT(*) FROM {table} WHERE {where_sql}"

    select_query = f"""
        SELECT * FROM {table}
        WHERE {where_sql}
        ORDER BY created_at DESC
        OFFSET ${param_idx} LIMIT ${param_idx + 1}
    """

    params.extend([offset, limit])

    return (select_query, count_query, params, offset, limit)
