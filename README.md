# Hard Things Club

Next.js + Supabase accountability app for April-September program.

## 1) Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL editor.
3. Enable Google auth in Supabase and set callback:
   - `https://<your-domain>/auth/callback`
   - `http://localhost:3000/auth/callback`
4. Copy `.env.example` to `.env.local` and fill values.

## 2) Local run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 3) Deploy

1. Push this repo to GitHub.
2. Import to Vercel.
3. Add the same env vars in Vercel.
4. Deploy.

## Notes

- IST-based day logic is implemented via utility functions.
- Rest day is included and mutually exclusive in logging.
- Admin routes are role-protected.
- CSV export buttons are represented in UI scope; wire exact download handlers if needed for production exports.
