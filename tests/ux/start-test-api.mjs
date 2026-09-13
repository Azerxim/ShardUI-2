// Lance Shard-API pour les tests d'utilisabilité, sur une copie jetable de la base (jamais la vraie).
// SHARD_API_DIR : dossier de Shard-API (par défaut ../Shard-API à côté de ShardUI-2).
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(process.env.SHARD_API_DIR ?? path.join(here, "../../../Shard-API"));
const workDir = path.join(here, ".env-api");
const port = process.env.SHARD_TEST_API_PORT ?? "8011";
const python = path.join(apiDir, ".venv", "bin", "python");

// Base neuve à chaque lancement ; l'API lit ShardDB.db, assets/ et templates/ depuis son dossier courant
fs.rmSync(workDir, { recursive: true, force: true });
fs.mkdirSync(workDir, { recursive: true });
fs.copyFileSync(path.join(apiDir, "ShardDB.db"), path.join(workDir, "ShardDB.db"));
for (const name of ["assets", "templates", "robots.txt"]) {
  fs.symlinkSync(path.join(apiDir, name), path.join(workDir, name));
}

const api = spawn(python, ["-m", "uvicorn", "api.main:app", "--host", "127.0.0.1", "--port", port], {
  cwd: workDir,
  env: { ...process.env, PYTHONPATH: apiDir },
  stdio: "inherit",
});

const stop = () => api.kill("SIGTERM");
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
api.on("exit", (code) => process.exit(code ?? 0));
