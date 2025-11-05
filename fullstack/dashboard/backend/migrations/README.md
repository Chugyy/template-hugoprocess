# Scripts de migration

## cleanup_users_and_reassign.py

**Migration complète pour nettoyer la base de données et configurer l'utilisateur principal.**

### Utilisation

**Connexion à la base de production :**

```bash
# Définir les variables d'environnement pour la DB de production
export DB_HOST=72.61.162.200
export DB_PORT=5434
export DB_NAME=dashboard-personnel-db
export DB_USER=postgres
export DB_PASSWORD=Tv7Luxu6aS8S84

# Exécuter la migration
cd /path/to/dev/backend
source .venv/bin/activate
python migrations/cleanup_users_and_reassign.py
```

### Ce que fait la migration

1. **Vérifier/créer l'utilisateur principal** (`contact@multimodal.digital`)
2. **Trouver l'ancien admin** (`admin@admin.admin`) s'il existe
3. **Réassigner toutes les données** de admin vers contact :
   - Contacts
   - Tâches (Tasks)
   - Projets (Projects)
   - Notes
   - Ressources (Resources)
4. **Supprimer l'ancien admin**
5. **Mettre à jour les infos de l'utilisateur principal** :
   - Username : `hugo`
   - Email : `contact@multimodal.digital`
   - First name : `Hugo`
   - Last name : `Hoarau`
   - Nouveau mot de passe sécurisé
6. **Supprimer tous les autres utilisateurs** (ne garde que Hugo Hoarau)
7. **Vérification finale** : affiche le nombre d'utilisateurs restants

### Output attendu

```
============================================================
✅ MIGRATION COMPLETED SUCCESSFULLY
============================================================
📧 Email: contact@multimodal.digital
👤 Name: Hugo Hoarau
🔑 Password: 6ThIde6Qfaw8eDm8RcWWpg
⚠️  IMPORTANT: Save this password securely, it will not be shown again!
============================================================
```

### Résultat de la dernière exécution (2025-01-21)

- ✅ Utilisateur `contact@multimodal.digital` mis à jour
- ✅ 4 utilisateurs de test supprimés
- ✅ 1 seul utilisateur restant : **Hugo Hoarau**
- 🔑 Nouveau mot de passe : `6ThIde6Qfaw8eDm8RcWWpg`

### Rollback

⚠️ Cette migration est **destructive** (supprime des utilisateurs).
Restaurez depuis une sauvegarde si nécessaire.

---

## update_admin_credentials.py

**Migration initiale (obsolète, remplacée par cleanup_users_and_reassign.py)**

Cette migration ne fait que mettre à jour les credentials admin sans nettoyer les autres utilisateurs.

---

## ⚠️ IMPORTANT

Sauvegardez le mot de passe généré dans un gestionnaire de mots de passe sécurisé :
- 1Password
- Bitwarden
- LastPass
- etc.
