const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const uploadRoot = path.join(__dirname, "uploads");
const subdirs = ["w", "other"];

subdirs.forEach((dir) => {
  fs.mkdirSync(path.join(uploadRoot, dir), { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type === "w" ? "w" : "other";
    cb(null, path.join(uploadRoot, type));
  },
  filename: (req, file, cb) => {
    const safeName = path
      .basename(file.originalname)
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ext === ".svg");
  },
});

app.use(express.static(__dirname));
app.use("/uploads/w", express.static(path.join(uploadRoot, "w")));
app.use("/uploads/other", express.static(path.join(uploadRoot, "other")));

app.post("/upload", upload.array("svg"), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Keine SVG-Datei hochgeladen." });
  }

  const type = req.body.type === "w" ? "w" : "other";
  const files = req.files.map((file) => ({
    filename: file.filename,
    type,
  }));

  res.json({ success: true, files });
});

app.get("/uploads/list", (req, res) => {
  const all = [];

  subdirs.forEach((type) => {
    const folder = path.join(uploadRoot, type);
    const files = fs
      .readdirSync(folder)
      .filter((name) => path.extname(name).toLowerCase() === ".svg");

    files.forEach((filename) => {
      all.push({
        type,
        filename,
        url: `/uploads/${type}/${filename}`,
      });
    });
  });

  res.json(all);
});

app.delete("/uploads/:type/:filename", (req, res) => {
  const { type, filename } = req.params;

  if (!subdirs.includes(type)) {
    return res.status(400).json({ error: "Ungültiger Typ." });
  }

  const safeName = path.basename(filename);
  const filePath = path.join(uploadRoot, type, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Datei nicht gefunden." });
  }

  fs.unlinkSync(filePath);
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});