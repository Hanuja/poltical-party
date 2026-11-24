# Political Party Website

Full-stack Sri Lankan political party website: public React site, separate admin React panel, shared PHP REST API, MySQL database.

## Structure

- `frontend/` — Public website (React + Vite, dev on http://localhost:5173)
- `admin-frontend/` — Admin panel (React + Vite, dev on http://localhost:5174)
- `backend/` — PHP REST API + MySQL (served by WAMP Apache)

## Quick start

1. Install the database: import `backend/database/political_party_db.sql` into MySQL (WAMP phpMyAdmin).
2. Copy `backend/.env.example` to `backend/.env` and set DB credentials.
3. `cd frontend && npm install && npm run dev`
4. `cd admin-frontend && npm install && npm run dev`

See full documentation in README (added in later phases).
