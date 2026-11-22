# Birthday Wishlist — Next.js + TypeScript + Tailwind CSS

## Requirements
- Node.js 20.9 or newer
- npm

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Files
- `app/page.tsx`: responsive wishlist, category filters, contribution dialog, copy-account buttons and guestbook state.
- `app/layout.tsx`: page metadata and viewport.
- `app/globals.css`: Tailwind v4 import, fonts and global styles.

## Important before publishing
1. Replace the sample bank account numbers and account holder names in `app/page.tsx`.
2. Replace the sample contact email.
3. Replace the example profile/product images with images you own or have permission to use.
4. The guestbook currently stores messages in React state only. Messages disappear on refresh. For a public guestbook, connect a database such as Supabase and add server-side validation/moderation.
5. Contributions are not processed online. The modal only helps a visitor choose an amount and then directs them to the bank-transfer section.
