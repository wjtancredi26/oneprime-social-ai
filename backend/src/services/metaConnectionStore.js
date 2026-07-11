import fs from "fs";
import path from "path";

const FILE_PATH = path.resolve("storage/metaConnection.json");

export function saveMetaConnection(data) {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
  return data;
}

export function getMetaConnection() {
  if (!fs.existsSync(FILE_PATH)) return null;
  return JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
}

export function clearMetaConnection() {
  if (fs.existsSync(FILE_PATH)) fs.unlinkSync(FILE_PATH);
}