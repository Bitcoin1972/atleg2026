const express    = require('express');
const cors       = require('cors');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const path       = require('path');
const fs         = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// Cloudinary config — set as env vars on Render dashboard
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── GUESTBOOK: persisted to local JSON
// NOTE: Guestbook entries will still reset on Render restarts.
// For persistence, migrate to a free DB (MongoDB Atlas, Render Postgres, etc.)
// Photos are now fully persistent via Cloudinary — no local file needed.
const DATA_DIR = path.join(__dirname, 'data');
const GB_FILE  = path.join(DATA_DIR, 'guestbook.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(GB_FILE))  fs.writeFileSync(GB_FILE, '[]');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Multer: memory storage → Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

function readJSON(f)     { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; } }
function writeJSON(f, d) { fs.writeFileSync(f, JSON.stringify(d, null, 2)); }

// ── GUESTBOOK ──────────────────────────────────────────────────────────────
app.get('/api/guestbook', (req, res) => {
  const entries = readJSON(GB_FILE);
  const safe = entries.slice().reverse().map(({ id, name, title, msg, date }) =>
    ({ id, name, title: title || '', msg, date })
  );
  res.json(safe);
});

app.post('/api/guestbook', (req, res) => {
  const { name, title, email, msg } = req.body;
  if (!name?.trim())         return res.status(400).json({ error: 'Name is required.' });
  if (!email?.includes('@')) return res.status(400).json({ error: 'Valid email required.' });
  if (!msg?.trim())          return res.status(400).json({ error: 'Message is required.' });

  const entries = readJSON(GB_FILE);
  const entry = {
    id:    Date.now(),
    name:  name.trim().slice(0, 120),
    title: (title || '').trim().slice(0, 150),
    email: email.trim().slice(0, 200),
    msg:   msg.trim().slice(0, 2000),
    date:  new Date().toISOString()
  };
  entries.push(entry);
  writeJSON(GB_FILE, entries);
  const { email: _e, ...safe } = entry;
  res.json({ success: true, entry: safe });
});

// ── PHOTOS via Cloudinary (persistent — no local file) ─────────────────────
//
// Caption and uploader are stored as Cloudinary context tags so they
// survive server restarts without any database.

app.get('/api/photos', async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression('folder:atleg2026')
      .with_field('context')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    const photos = result.resources.map(r => ({
      id:        r.asset_id,
      url:       r.secure_url,
      public_id: r.public_id,
      caption:   r.context?.custom?.caption  || '',
      uploader:  r.context?.custom?.uploader || '',
      date:      r.created_at
    }));

    res.json(photos);
  } catch (err) {
    console.error('Cloudinary search error:', err.message);
    res.status(500).json({ error: 'Could not load photos.' });
  }
});

app.post('/api/photos', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received.' });
  const { caption, uploader } = req.body;
  if (!uploader?.trim()) return res.status(400).json({ error: 'Uploader name required.' });

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:        'atleg2026',
          resource_type: 'image',
          // Store caption + uploader as Cloudinary context — persists forever
          context: `caption=${(caption || '').trim().slice(0, 300)}|uploader=${uploader.trim().slice(0, 120)}`
        },
        (err, r) => err ? reject(err) : resolve(r)
      );
      stream.end(req.file.buffer);
    });

    const photo = {
      id:        result.asset_id,
      url:       result.secure_url,
      public_id: result.public_id,
      caption:   (caption || '').trim().slice(0, 300),
      uploader:  uploader.trim().slice(0, 120),
      date:      result.created_at
    };

    res.json({ success: true, photo });
  } catch (err) {
    console.error('Cloudinary upload error:', err.message);
    res.status(500).json({ error: 'Upload failed. Please try again.' });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`ATLEG-2026 on port ${PORT}`));
