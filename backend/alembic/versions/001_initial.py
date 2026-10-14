"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2026-10-13 15:00:00

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Tables are auto-created by SQLAlchemy Base.metadata.create_all
    pass

def downgrade() -> None:
    pass

