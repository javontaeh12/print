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
├── script.js           # Homepage JS
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
| **Pricing** | Fixed prices and quote-only options | index.html (booking form) |
| **Sections** | Drag-and-drop reorder + enable/disable frontend sections | index.html (section ordering) |
| **About Us** | Edit story, mission, values, team | about.html |
| **Our Clients** | Upload client logos, names, industry | clients.html |
| **Contact** | Email, phone, address, hours, social links, map | contact.html |
| **Analytics** | Connect Google Analytics Measurement ID | All pages |

## Database Tables

| Table | Purpose |
|-------|---------|
| `print_admin_users` | Whitelist of authorized admin emails |
| `print_products` | Print products with category, image, display order |
| `print_services` | Printer services with category, icon, display order |
| `print_pricing` | Pricing entries — fixed price or request-quote |
| `print_page_sections` | Frontend section order and enabled/disabled state |
| `print_site_content` | Key-value store for About Us, Contact, Analytics config |
| `print_clients` | Client logos, names, websites, industry |

## Frontend Pages

### Homepage (index.html)
- Sections are dynamically ordered based on `print_page_sections` table
- Services load from `print_products` and `print_services` tables
- Admin can enable/disable and reorder all sections

### About Us (about.html)
- Story, mission, values, and team loaded from `print_site_content`
- Admin edits content and uploads images via About Us tab
- Values and team members are stored as JSON in `print_site_content`

### Our Clients (clients.html)
- Client logos and names loaded from `print_clients` table
- Admin uploads logos and manages client list via Our Clients tab
- Testimonials stored in `print_site_content` as JSON

### Contact Us (contact.html)
- Contact info loaded from `print_site_content` table
- Contact form submissions (future: stored in Supabase)
- Google Maps embed configurable from admin
- Social links configurable from admin

## Setup Status

- [x] Supabase project created (PrintWebsite under ibuild)
- [x] Database migration run (7 tables + RLS + storage)
- [x] Admin user seeded (javontaedharden@gmail.com)
- [x] Google OAuth configured
- [x] Supabase credentials updated in code
- [x] Admin portal built (HTML/CSS/JS)
- [x] Frontend pages created (about, clients, contact)
- [x] Navigation updated across all pages
- [ ] Frontend dynamic data loading on index.html
- [ ] Google Analytics integration
- [ ] Production testing

## Security

- Only emails in the `print_admin_users` table can access the admin portal
- RLS policies ensure public users can only read active/enabled items
- Admin operations require a valid JWT matching an `print_admin_users` email
- Storage uploads are restricted to authenticated admins

## Section Manager

The Section Manager allows admins to:
- **Reorder** sections via drag-and-drop
- **Enable/disable** sections with toggle switches
- Changes affect the frontend rendering order on the homepage

Default sections: Hero, Popular Services, Business Card Designer, About Us, Our Clients, Booking Form, File Upload, Contact Us

## Adding New Admins

Insert a new row in the `print_admin_users` table:
```sql
INSERT INTO print_admin_users (email) VALUES ('newemail@example.com');
```
