-- CreateTable
CREATE TABLE "pitch_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pitch_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pitch_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pitch_comments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
