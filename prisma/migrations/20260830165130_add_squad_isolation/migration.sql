-- CreateTable
CREATE TABLE "squads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "squads_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "squad_id" TEXT,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "photo_url" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "height_cm" INTEGER,
    "weight_kg" INTEGER,
    "primary_position" TEXT NOT NULL,
    "secondary_position" TEXT,
    "preferred_foot" TEXT NOT NULL,
    "jersey_number" INTEGER,
    "overall_rating" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "players_squad_id_fkey" FOREIGN KEY ("squad_id") REFERENCES "squads" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_players" ("bio", "created_at", "height_cm", "id", "is_active", "jersey_number", "name", "nickname", "overall_rating", "phone", "photo_url", "preferred_foot", "primary_position", "secondary_position", "updated_at", "user_id", "weight_kg") SELECT "bio", "created_at", "height_cm", "id", "is_active", "jersey_number", "name", "nickname", "overall_rating", "phone", "photo_url", "preferred_foot", "primary_position", "secondary_position", "updated_at", "user_id", "weight_kg" FROM "players";
DROP TABLE "players";
ALTER TABLE "new_players" RENAME TO "players";
CREATE UNIQUE INDEX "players_user_id_key" ON "players"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "squads_code_key" ON "squads"("code");
