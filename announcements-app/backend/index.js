// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig);
const announcementRoutes = require('./routes/announcements');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// inject knex into request for easy access
app.use((req, res, next) => { req.db = knex; next(); });

app.use('/api/announcements', announcementRoutes);

// Simple health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Scheduler: publish scheduled announcements
cron.schedule('*/1 * * * *', async () => {
  const now = new Date().toISOString();
  try {
    const rows = await knex('announcements')
      .where('status', 'scheduled')
      .andWhere('published_at', '<=', now);
    for (const row of rows) {
      await knex('announcements')
        .where('id', row.id)
        .update({ status: 'published', updated_at: now });
      console.log(`Auto‑published announcement ${row.id}`);
    }
  } catch (err) {
    console.error('Scheduler error:', err);
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
