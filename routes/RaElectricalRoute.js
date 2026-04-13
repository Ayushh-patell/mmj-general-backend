const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const ADMIN_EMAIL = "Electrical.ra@yahoo.com";
const ADMIN_PASSWORD = "Raelectrical@123";
const ADMIN_TOKEN = process.env.RA_ADMIN_TOKEN || "ra-electrical-admin-token";

const uploadsDir = path.join(__dirname, "..", "uploads", "raelectrical");
const dataFile = path.join(__dirname, "..", "data", "raelectrical-project-images.json");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(path.dirname(dataFile))) fs.mkdirSync(path.dirname(dataFile), { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "{}");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({ storage });

function readMap() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  } catch {
    return {};
  }
}

function writeMap(map) {
  fs.writeFileSync(dataFile, JSON.stringify(map, null, 2), "utf-8");
}

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  next();
}

// POST /raelectrical/api/admin/login
router.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body || {};
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: ADMIN_TOKEN });
  }
  return res.status(401).json({ success: false, error: "Invalid credentials" });
});

// GET /raelectrical/api/projects/images
router.get("/api/projects/images", (_req, res) => {
  return res.json({ success: true, images: readMap() });
});

// POST /raelectrical/api/admin/projects/upload
router.post("/api/admin/projects/upload", auth, upload.single("image"), (req, res) => {
  const projectTitle = String(req.body?.projectTitle || "").trim();
  if (!projectTitle) {
    return res.status(400).json({ success: false, error: "projectTitle is required" });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, error: "image file is required" });
  }

  const map = readMap();
  map[projectTitle] = `/uploads/raelectrical/${req.file.filename}`;
  writeMap(map);

  return res.json({
    success: true,
    projectTitle,
    imagePath: map[projectTitle],
  });
});

module.exports = router;
