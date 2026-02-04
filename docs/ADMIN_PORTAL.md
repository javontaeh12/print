# PrintCraft Studio — Admin Portal

## Overview

The admin portal is accessible at `/admin` and allows authorized administrators to manage all website content through a visual interface. All changes made in the admin portal are reflected on the public-facing website pages.

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (no frameworks)
- **Database**: Supabase (PostgreSQL) — Project: PrintWebsite under ibuild org
- **Auth**: Google Sign-In via Supabase Auth
- **File Storage**: Supabase Storage (logos/images)
- **Hosting**: Vercel (auto-deploys from GitHub)
- **Repository**: github.com/Javontaeh12/Print

## Supabase Config

- **Project**: PrintWebsite
- **URL**: `https://bfdpgapvrnlegizpjflf.supabase.co`
- **Admin Email**: javontaedharden@gmail.com

## Project Structure

```
Print/
├── index.html          # Homepage (dynamic sections from Supabase)
├── about.html          # About Us page
├── clients.html        # Our Clients page
├── contact.html        # Contact Us page
├── styles.css          # Homepage styles
├── script.js           # Homepage interactions (designer, booking, upload)
├── homepage.js         # Homepage dynamic data loading from Supabase
├── pages.css           # Shared styles for About/Clients/Contact
├── pages.js            # Shared Supabase data loading for subpages
├── admin/
│   ├── index.html      # Admin portal (all 9 tabs)
│   ├── login.html      # Google Sign-In login page
│   ├── admin.css       # Admin portal styles
│   └── admin.js        # Admin CRUD logic
├── supabase/
│   └── migration.sql   # Database schema
└── docs/
    └── ADMIN_PORTAL.md # This file
```

## Admin Tabs

| Tab | Description | Frontend Page |
|-----|-------------|---------------|
| **Dashboard** | Overview stats + quick actions | — |
| **Products** | CRUD for print products, organized by category | index.html (services section) |
| **Services** | CRUD for printer services, organized by category | index.html (services section) |
| **Pricing** | Fixed prices and quote-only options | index.html (service cards) |
| **Sections** | Drag-and-drop reorder + enable/disable frontend sections | index.html (section ordering) |
| **About Us** | Edit story, mission, heading, subheading, image, year | about.html |
| **Our Clients** | Upload client logos, names, websites | clients.html |
| **Contact** | Email, phone, address, hours, social links, map embed | contact.html |
| **Analytics** | Connect Google Analytics Measurement ID | All pages (loaded dynamically) |

## Database Tables

| Table | Purpose |
|-------|---------|
| `admin_users` | Whitelist of authorized admin emails |
| `products` | Print products with category, image, display order |
| `services` | Printer services with category, icon, display order |
| `pricing` | Pricing entries — fixed price or request-quote |
| `page_sections` | Frontend section order and enabled/disabled state |
| `site_content` | Key-value JSONB store for About Us, Contact, Analytics config |
| `clients` | Client logos, names, websites, display order |

## Data Architecture

### site_content table (key-value JSONB)

| Key | Value Structure |
|-----|----------------|
| `about` | `{ heading, subheading, content, mission, image, year }` |
| `contact` | `{ email, phone, address, hours, mapUrl, facebook, instagram, twitter, linkedin }` |
| `analytics` | `{ measurementId }` |

## Frontend Pages

### Homepage (index.html)
- Sections are dynamically ordered based on `page_sections` table
- Services load from `services` table (replaces hardcoded cards)
- Pricing overlays from `pricing` table
- Footer contact info loaded from `site_content` (key: "contact")
- Google Analytics loaded from `site_content` (key: "analytics")
- Admin can enable/disable and reorder all sections

### About Us (about.html)
- Story, mission, heading, subheading loaded from `site_content` (key: "about")
- Admin edits content via About Us tab in admin portal

### Our Clients (clients.html)
- Client logos and names loaded from `clients` table
- Admin uploads logos and manages client list via Our Clients tab

### Contact Us (contact.html)
- Contact info loaded from `site_content` (key: "contact")
- Social links built from facebook/instagram/twitter/linkedin fields
- Google Maps embed from mapUrl field
- Contact form (submissions currently client-side only)

## Setup Status

- [x] Supabase project created (PrintWebsite under ibuild)
- [x] Database migration run (7 tables + RLS + storage)
- [x] Admin user seeded (javontaedharden@gmail.com)
- [x] Google OAuth configured
- [x] Supabase credentials updated in all files
- [x] Admin portal built (HTML/CSS/JS)
- [x] Frontend pages created (about, clients, contact)
- [x] Navigation updated across all pages
- [x] Homepage dynamic data loading (services, sections, pricing, analytics)
- [x] Google Analytics integration (all pages)
- [x] Fixed pages.js table names and credentials
- [ ] Production testing

## Security

- Only emails in the `admin_users` table can access the admin portal
- RLS policies ensure public users can only read active/enabled items
- Admin operations require a valid JWT matching an `admin_users` email
- Storage uploads are restricted to authenticated admins

## Section Manager

The Section Manager allows admins to:
- **Reorder** sections via drag-and-drop
- **Enable/disable** sections with toggle switches
- Changes affect the frontend rendering order on the homepage

Default sections: Hero, Popular Services, Business Card Designer, About Us, Our Clients, Booking Form, File Upload, Contact Us

## Google Analytics

The admin can enter a Google Analytics Measurement ID (e.g., `G-XXXXXXXXXX`) in the Analytics tab. The gtag script is dynamically loaded on all pages (homepage via `homepage.js`, subpages via `pages.js`).

## Adding New Admins

Insert a new row in the `admin_users` table:
```sql
INSERT INTO admin_users (email) VALUES ('newemail@example.com');
```
