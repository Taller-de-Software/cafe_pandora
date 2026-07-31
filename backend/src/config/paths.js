import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, "../../..");
const REPO_UPLOADS = path.join(REPO_ROOT, "uploads");
const REPO_IMAGES = path.join(REPO_ROOT, "images");

const DATA_DIR = process.env.PANDORA_DATA_DIR
  ? path.resolve(process.env.PANDORA_DATA_DIR)
  : REPO_ROOT;

export const UPLOADS_DIR = process.env.PANDORA_DATA_DIR
  ? path.join(DATA_DIR, "uploads")
  : REPO_UPLOADS;

export const IMAGES_DIR = process.env.PANDORA_DATA_DIR
  ? path.join(DATA_DIR, "images")
  : REPO_IMAGES;

export function resolveUpload(subdir) {
  return path.join(UPLOADS_DIR, subdir);
}
