import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "..", "..", "BCNSW-Leave-Calendar");
process.chdir(projectDir);
const vitePath = path.resolve(projectDir, "node_modules", "vite", "bin", "vite.js");
await import(pathToFileURL(vitePath).href);
