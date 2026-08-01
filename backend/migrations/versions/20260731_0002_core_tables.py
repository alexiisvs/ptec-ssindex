"""Create users, facts, and likes."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260731_0002"
down_revision: str | None = "20260731_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("username", postgresql.CITEXT(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("username", name="uq_users_username"),
    )
    op.create_table(
        "facts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("length", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=100), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_facts"),
        sa.UniqueConstraint("content_hash", name="uq_facts_content_hash"),
    )
    op.create_table(
        "likes",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("fact_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["fact_id"], ["facts.id"], name="fk_likes_fact_id_facts", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_likes_user_id_users", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("user_id", "fact_id", name="pk_likes"),
    )
    op.create_index("ix_likes_fact_id", "likes", ["fact_id"])
    op.create_index("ix_likes_user_id_created_at", "likes", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_likes_user_id_created_at", table_name="likes")
    op.drop_index("ix_likes_fact_id", table_name="likes")
    op.drop_table("likes")
    op.drop_table("facts")
    op.drop_table("users")
