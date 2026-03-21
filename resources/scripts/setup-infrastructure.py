#!/usr/bin/env python3
"""
setup-infrastructure.py
Setup infrastructure backend + frontend complète avec création BDD PostgreSQL
"""

import argparse
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path


# =====================================================
# Configuration PostgreSQL hardcodée
# =====================================================
DB_HOST = "localhost"
DB_PORT = "5432"
DB_USER = "hugohoarau"
DB_PASSWORD = ""  # Pas de password


# =====================================================
# Utilities
# =====================================================
def print_step(number, total, message):
    """Print formatted step message"""
    print(f"\n{'='*60}")
    print(f"📋 Step {number}/{total}: {message}")
    print('='*60)


def print_success(message):
    """Print success message"""
    print(f"✅ {message}")


def print_warning(message):
    """Print warning message"""
    print(f"⚠️  {message}")


def print_error(message):
    """Print error message"""
    print(f"❌ {message}")


def run_command(cmd, cwd=None, shell=False):
    """Execute shell command"""
    try:
        result = subprocess.run(
            cmd if shell else cmd.split(),
            cwd=cwd,
            capture_output=True,
            text=True,
            shell=shell
        )
        if result.returncode != 0:
            print_error(f"Command failed: {cmd}")
            print(result.stderr)
            return False
        return True
    except Exception as e:
        print_error(f"Error executing command: {e}")
        return False


# =====================================================
# PostgreSQL Database Creation
# =====================================================
def create_postgresql_database(app_name):
    """Create PostgreSQL database if it doesn't exist"""
    print_step("0", "10", "Creating PostgreSQL Database")

    db_name = f"{app_name}-db"

    try:
        import psycopg2
        from psycopg2 import sql
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

        print(f"🔌 Connecting to PostgreSQL at {DB_HOST}:{DB_PORT}")
        print(f"   User: {DB_USER}")
        print(f"   Target database: {db_name}")

        # Connect to default 'postgres' database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (db_name,)
        )
        exists = cursor.fetchone()

        if exists:
            print_warning(f"Database '{db_name}' already exists, skipping creation")
        else:
            # Create database
            cursor.execute(
                sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name))
            )
            print_success(f"Database '{db_name}' created successfully")

        cursor.close()
        conn.close()

        return db_name

    except ImportError:
        print_error("psycopg2 not installed. Installing...")
        if run_command("pip3 install psycopg2-binary"):
            print_success("psycopg2-binary installed")
            # Retry after installation
            return create_postgresql_database(app_name)
        else:
            print_error("Failed to install psycopg2-binary")
            sys.exit(1)

    except Exception as e:
        print_error(f"Failed to create database: {e}")
        print("\n💡 Troubleshooting:")
        print(f"   1. Ensure PostgreSQL is running: brew services list")
        print(f"   2. Ensure user '{DB_USER}' exists: psql postgres -c '\\du'")
        print(f"   3. Create user if needed: createuser -s {DB_USER}")
        sys.exit(1)


# =====================================================
# Admin User Seed Generation
# =====================================================
def parse_users_columns_from_schema(backend_path):
    """Read 001_initial_schema.sql to extract actual users table columns."""
    migrations_path = Path(backend_path) / "app" / "database" / "migrations"
    schema_file = migrations_path / "001_initial_schema.sql"
    if not schema_file.exists():
        return None
    content = schema_file.read_text()
    # Extract CREATE TABLE users block
    import re
    match = re.search(r'CREATE TABLE\s+users\s*\((.*?)\);', content, re.DOTALL | re.IGNORECASE)
    if not match:
        return None
    columns = []
    for line in match.group(1).split('\n'):
        line = line.strip().rstrip(',')
        if line and not line.upper().startswith(('PRIMARY', 'UNIQUE', 'CONSTRAINT', 'FOREIGN', 'CHECK', '--')):
            col_name = line.split()[0].strip('"')
            if col_name:
                columns.append(col_name)
    return columns


def generate_admin_seed_sql(backend_path):
    """Generate admin user seed SQL file with bcrypt hashed password.
    Reads actual schema to produce compatible INSERT."""
    print("\n👤 Generating admin user seed...")

    try:
        import bcrypt
    except ImportError:
        print_warning("bcrypt not installed. Installing...")
        if run_command("pip3 install bcrypt"):
            print_success("bcrypt installed")
            import bcrypt
        else:
            print_error("Failed to install bcrypt")
            return False

    # Read actual schema columns to avoid mismatch
    schema_columns = parse_users_columns_from_schema(backend_path)
    if schema_columns:
        print_success(f"Schema read — users columns: {schema_columns}")
    else:
        print_warning("Could not read schema, using safe defaults (email, password_hash, created_at)")
        schema_columns = ["id", "email", "password_hash", "created_at"]

    # Admin credentials
    admin_email = "admin@admin.admin"
    admin_password = "adminadmin"

    # Hash password with bcrypt
    password_hash = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Build INSERT dynamically from actual columns
    col_value_map = {
        "email": f"'{admin_email}'",
        "password_hash": f"'{password_hash}'",
        "is_verified": "true",
        "is_active": "true",
        "role": "'admin'",
        "created_at": "NOW()",
        "updated_at": "NOW()",
    }
    # Only include columns that exist in the schema AND we have a value for
    insert_cols = [c for c in schema_columns if c in col_value_map]
    insert_vals = [col_value_map[c] for c in insert_cols]

    if "email" not in insert_cols:
        print_error("users table has no 'email' column — cannot seed admin")
        return False

    sql_content = f"""-- Seed: Admin User
-- Generated: {datetime.now().isoformat()}
-- Email: {admin_email}
-- Password: {admin_password}
-- ⚠️ This file is auto-applied by run_pending_migrations() at backend startup
-- Columns auto-detected from 001_initial_schema.sql

INSERT INTO users ({', '.join(insert_cols)})
VALUES (
  {(',' + chr(10) + '  ').join(insert_vals)}
)
ON CONFLICT (email) DO NOTHING;
"""

    # Create migrations directory if not exists
    migrations_path = Path(backend_path) / "app" / "database" / "migrations"
    migrations_path.mkdir(parents=True, exist_ok=True)

    # Write seed file
    seed_file = migrations_path / "002_seed_admin_user.sql"
    with open(seed_file, 'w') as f:
        f.write(sql_content)

    print_success(f"Admin seed SQL generated: {seed_file}")
    print(f"   Email: {admin_email}")
    print(f"   Password: {admin_password}")

    return True


# =====================================================
# Backend Setup
# =====================================================
def setup_backend(backend_path, template_path, app_name, db_name, create_admin=False):
    """Setup backend infrastructure"""
    print_step("1", "10", "Backend Setup")

    backend_path = Path(backend_path)
    template_path = Path(template_path)

    # 1. Copy template
    print("\n📂 Copying backend template...")
    if backend_path.exists():
        print_warning("Backend directory already exists, skipping copy")
    else:
        if not template_path.exists():
            print_error(f"Template not found at {template_path}")
            sys.exit(1)
        shutil.copytree(template_path, backend_path)
        print_success("Backend template copied")

    # 2. Create virtual environment
    print("\n🐍 Creating virtual environment...")
    venv_path = backend_path / ".venv"
    if venv_path.exists():
        print_warning("Virtual environment already exists, skipping")
    else:
        if not run_command(f"python3 -m venv {venv_path}"):
            print_error("Failed to create virtual environment")
            sys.exit(1)
        print_success("Virtual environment created")

    # 3. Install dependencies
    print("\n📦 Installing dependencies...")
    pip_path = venv_path / "bin" / "pip"

    # Upgrade pip
    run_command(f"{pip_path} install --upgrade pip --quiet", shell=True)

    # Install requirements
    requirements_file = backend_path / "requirements.txt"
    if requirements_file.exists():
        if not run_command(f"{pip_path} install -r {requirements_file} --quiet", shell=True):
            print_error("Failed to install dependencies")
            sys.exit(1)
        print_success("Dependencies installed")
    else:
        print_warning("requirements.txt not found")

    # 4. Configure .env with database credentials + merge root .env
    print("\n⚙️  Configuring environment...")
    env_file = backend_path / "config" / ".env"
    env_example = backend_path / "config" / ".env.example"

    if env_example.exists():
        # Read template
        with open(env_example, 'r') as f:
            env_content = f.read()

        # Replace database values
        env_content = env_content.replace('DB_HOST=localhost', f'DB_HOST={DB_HOST}')
        env_content = env_content.replace('DB_PORT=5432', f'DB_PORT={DB_PORT}')
        env_content = env_content.replace('DB_NAME=contentos-db', f'DB_NAME={db_name}')
        env_content = env_content.replace('DB_USER=hugohoarau', f'DB_USER={DB_USER}')
        env_content = env_content.replace('DB_PASSWORD=', f'DB_PASSWORD={DB_PASSWORD}')
        env_content = env_content.replace('APP_NAME="ContentOS - Backend"', f'APP_NAME="{app_name} - Backend"')

        # Merge root .env if it exists (client-provided API keys)
        root_env = Path(".env")
        if root_env.exists():
            print("   🔗 Found root .env — merging client API keys...")
            root_vars = {}
            with open(root_env, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        root_vars[key.strip()] = value.strip()

            # Inject root vars into backend .env (replace empty values)
            for key, value in root_vars.items():
                # Replace empty value: KEY= → KEY=value
                env_content = env_content.replace(f'{key}=\n', f'{key}={value}\n')
                # Replace placeholder: KEY=change-this... → KEY=value
                if f'{key}=' in env_content:
                    import re
                    env_content = re.sub(
                        rf'^{re.escape(key)}=.*$',
                        f'{key}={value}',
                        env_content,
                        flags=re.MULTILINE
                    )

            print_success(f"Merged {len(root_vars)} variables from root .env")

        # Write .env
        with open(env_file, 'w') as f:
            f.write(env_content)

        print_success(f".env configured with database: {db_name}")
    else:
        print_warning(".env.example not found, skipping .env creation")

    # 5. Create documentation structure
    print("\n📝 Creating documentation structure...")
    docs_path = backend_path / "docs" / "backend-implementation"
    docs_path.mkdir(parents=True, exist_ok=True)
    (docs_path / "entitys").mkdir(exist_ok=True)
    (docs_path / "architecture").mkdir(exist_ok=True)

    # 6. Generate admin seed SQL if requested
    if create_admin:
        if not generate_admin_seed_sql(backend_path):
            print_warning("Failed to generate admin seed SQL")

    print_success("Backend setup complete")
    return True


# =====================================================
# Frontend Setup
# =====================================================
def setup_frontend(frontend_path, template_path, app_name):
    """Setup frontend infrastructure"""
    print_step("2", "10", "Frontend Setup")

    frontend_path = Path(frontend_path)
    template_path = Path(template_path)

    # 1. Copy template
    print("\n📂 Copying frontend template...")
    if frontend_path.exists():
        print_warning("Frontend directory already exists, skipping copy")
    else:
        if not template_path.exists():
            print_error(f"Template not found at {template_path}")
            sys.exit(1)
        shutil.copytree(template_path, frontend_path)
        print_success("Frontend template copied")

    # 2. Update package.json
    print("\n📝 Updating package.json...")
    package_json = frontend_path / "package.json"
    if package_json.exists():
        with open(package_json, 'r') as f:
            content = f.read()

        # Replace name
        content = content.replace('"name": "frontend-template"', f'"name": "{app_name}"')

        with open(package_json, 'w') as f:
            f.write(content)

        print_success(f"package.json updated with name: {app_name}")
    else:
        print_warning("package.json not found")

    # 3. Create .env.local
    print("\n⚙️  Creating .env.local...")
    env_local = frontend_path / ".env.local"
    with open(env_local, 'w') as f:
        f.write("NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1\n")
    print_success(".env.local created")

    # 4. Update layout.tsx metadata
    print("\n🎨 Updating layout metadata...")
    layout_file = frontend_path / "src" / "app" / "layout.tsx"
    if layout_file.exists():
        with open(layout_file, 'r') as f:
            content = f.read()

        # Replace title
        content = content.replace('title: "Frontend Template"', f'title: "{app_name}"')

        with open(layout_file, 'w') as f:
            f.write(content)

        print_success("layout.tsx metadata updated")
    else:
        print_warning("layout.tsx not found")

    # 5. Create providers.tsx
    print("\n⚙️  Creating providers.tsx...")
    providers_file = frontend_path / "src" / "components" / "providers.tsx"
    providers_file.parent.mkdir(parents=True, exist_ok=True)

    providers_content = '''\'use client\'

import { QueryClient, QueryClientProvider } from \'@tanstack/react-query\'
import { useState } from \'react\'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
'''

    with open(providers_file, 'w') as f:
        f.write(providers_content)
    print_success("providers.tsx created")

    # 6. Install dependencies
    print("\n📦 Installing npm dependencies...")
    print("   This may take a few minutes...")

    if not run_command("npm install", cwd=frontend_path, shell=True):
        print_error("Failed to install npm dependencies")
        sys.exit(1)

    print_success("npm dependencies installed")
    print_success("Frontend setup complete")
    return True


# =====================================================
# Final Report
# =====================================================
def print_final_report(app_name, backend_path, frontend_path, db_name, admin_created=False):
    """Print final setup report"""
    print_step("3", "10", "Setup Complete")

    admin_info = ""
    if admin_created:
        admin_info = """   👤 Admin user seed: 002_seed_admin_user.sql
      Email: admin@admin.admin
      Password: adminadmin
"""

    print(f"""
{'='*60}
✅ INFRASTRUCTURE SETUP COMPLETE
{'='*60}

📁 App Name: {app_name}

🗄️  Database:
   ✅ PostgreSQL: {db_name}
   📍 Connection: postgresql://{DB_USER}@{DB_HOST}:{DB_PORT}/{db_name}
   🔍 Verify: psql -U {DB_USER} -d {db_name} -c "\\dt"
{admin_info}
🔧 Backend: {backend_path}
   ✅ Structure copied
   ✅ Virtual environment created
   ✅ Dependencies installed
   ✅ .env configured

🎨 Frontend: {frontend_path}
   ✅ Structure copied
   ✅ package.json updated
   ✅ .env.local created
   ✅ Layout components created
   ✅ npm dependencies installed

{'='*60}

🚀 Next Steps:

Backend:
  cd {backend_path}
  source .venv/bin/activate
  python -m app.api.main

Frontend:
  cd {frontend_path}
  npm run dev

{'='*60}

💡 The infrastructure is ready for Phase 2: Database Models

{'='*60}
""")


# =====================================================
# Main
# =====================================================
def main():
    parser = argparse.ArgumentParser(
        description="Setup infrastructure backend + frontend avec création BDD PostgreSQL"
    )
    parser.add_argument("--app-name", required=True, help="Nom de l'application")
    parser.add_argument("--backend-path", default="dev/backend", help="Chemin backend")
    parser.add_argument("--frontend-path", default="dev/frontend", help="Chemin frontend")
    parser.add_argument(
        "--backend-template",
        default=".claude/resources/templates/code/backend",
        help="Chemin template backend"
    )
    parser.add_argument(
        "--frontend-template",
        default=".claude/resources/templates/code/frontend",
        help="Chemin template frontend"
    )
    parser.add_argument(
        "--create-admin",
        action="store_true",
        help="Créer un admin user initial (admin@admin.admin / adminadmin)"
    )

    args = parser.parse_args()

    print(f"""
{'='*60}
🚀 Infrastructure Setup
{'='*60}

App Name: {args.app_name}
Backend: {args.backend_path}
Frontend: {args.frontend_path}
Database: {args.app_name}-db

{'='*60}
""")

    # 0. Create PostgreSQL database
    db_name = create_postgresql_database(args.app_name)

    # 1. Setup backend
    setup_backend(
        args.backend_path,
        args.backend_template,
        args.app_name,
        db_name,
        args.create_admin
    )

    # 2. Setup frontend
    setup_frontend(
        args.frontend_path,
        args.frontend_template,
        args.app_name
    )

    # 3. Final report
    print_final_report(
        args.app_name,
        args.backend_path,
        args.frontend_path,
        db_name,
        args.create_admin
    )


if __name__ == "__main__":
    main()
