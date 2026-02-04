# PrintCraft Studio — Admin Portal

## Overview

The admin portal is accessible at `/admin` and allows authorized administrators to manage all website content through a visual interface.

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (no frameworks)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Google Sign-In via Supabase Auth
- **File Storage**: Supabase Storage (logos/images)
- **Hosting**: Vercel

## Admin Tabs

| Tab | Description |
|-----|-------------|
| **Dashboard** | Overview stats + quick actions |
| **Products** | CRUD for print products, organized by category |
| **Services** | CRUD for printer services, organized by category |
| **Pricing** | Fixed prices and quote-only options |
| **Sections** | Drag-and-drop reorder + enable/disable frontend sections |
| **About Us** | Edit heading, content, mission, image, year |
| **Our Clients** | Upload client logos and names |
| **Contact** | Email, phone, address, hours, social links, Google Maps |
| **Analytics** | Connect Google Analytics Measurement ID |

## Database Tables

| Table | Purpose |
|-------|---------|
| `admin_users` | Whitelist of authorized admin emails |
| `products` | Print products with category, image, display order |
| `services` | Printer services with category, icon, display order |
| `pricing` | Pricing entries — fixed price or request-quote |
| `page_sections` | Frontend section order and enabled/disabled state |
| `site_content` | Key-value store for About Us, Contact, Analytics config |
| `clients` | Client logos, names, websites |

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create new project named **Print** under the **Bizfloo** org
3. Save the database password

### 2. Run Migration

1. Go to SQL Editor in your Supabase dashboard
2. Paste and run the contents of `supabase/migration.sql`
3. This creates all tables, RLS policies, and the storage bucket

### 3. Enable Google Auth

1. Go to Authentication > Providers > Google
2. Enable Google provider
3. Add your Google OAuth Client ID and Secret
4. Set redirect URL to `https://yourdomain.com/admin/`

### 4. Update Config

Replace the placeholder values in these files:
- `admin/login.html` — `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- `admin/admin.js` — `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### 5. Deploy

Push to GitHub and deploy via Vercel. The admin portal is at `/admin`.

## Security

- Only emails in the `admin_users` table can access the admin portal
- RLS policies ensure public users can only read active/enabled items
- Admin operations require a valid JWT matching an `admin_users` email
- Storage uploads are restricted to authenticated admins

## Section Manager

The Section Manager allows admins to:
- **Reorder** sections via drag-and-drop
- **Enable/disable** sections with toggle switches
- Changes affect the frontend rendering order

Default sections: Hero, Popular Services, Business Card Designer, About Us, Our Clients, Booking Form, File Upload, Contact Us

## Adding New Admins

Insert a new row in the `admin_users` table:
```sql
INSERT INTO admin_users (email) VALUES ('newemail@example.com');
```
