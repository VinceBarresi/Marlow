ALTER TABLE locations ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS longitude double precision;

UPDATE locations SET latitude = 30.4015, longitude = -97.7254 WHERE slug = 'austin-domain';
UPDATE locations SET latitude = 30.2493, longitude = -97.7490 WHERE slug = 'austin-south-congress';
UPDATE locations SET latitude = 32.7480, longitude = -96.8289 WHERE slug = 'dallas-bishop-arts';
UPDATE locations SET latitude = 32.7243, longitude = -97.3498 WHERE slug = 'fort-worth-magnolia';
UPDATE locations SET latitude = 29.8024, longitude = -95.4042 WHERE slug = 'houston-heights';
UPDATE locations SET latitude = 29.4426, longitude = -98.4798 WHERE slug = 'san-antonio-pearl';
UPDATE locations SET latitude = 31.7778, longitude = -106.4955 WHERE slug = 'el-paso-mesa';
UPDATE locations SET latitude = 30.3110, longitude = -104.0205 WHERE slug = 'marfa-highland';

ALTER TABLE locations ALTER COLUMN latitude SET NOT NULL;
ALTER TABLE locations ALTER COLUMN longitude SET NOT NULL;

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  department text NOT NULL CHECK (department IN ('marketing', 'sales', 'engineering', 'retail')),
  workplace text NOT NULL CHECK (workplace IN ('remote', 'store')),
  location_id uuid REFERENCES locations (id),
  summary text NOT NULL,
  description text NOT NULL,
  CHECK (
    (workplace = 'remote' AND location_id IS NULL)
    OR (workplace = 'store' AND location_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS jobs_department_idx ON jobs (department);
CREATE INDEX IF NOT EXISTS jobs_location_id_idx ON jobs (location_id);

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES jobs (id),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  work_authorization text NOT NULL CHECK (work_authorization IN ('yes', 'no')),
  start_date date NOT NULL,
  linkedin text,
  website text,
  cover_letter text NOT NULL,
  resume_filename text NOT NULL,
  resume_original_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applications_job_id_idx ON applications (job_id);

INSERT INTO jobs (id, slug, title, department, workplace, location_id, summary, description)
VALUES
  (
    '6c0a0001-0000-4000-8000-000000000001',
    'software-engineer',
    'Software Engineer',
    'engineering',
    'remote',
    NULL,
    'Build the shop, catalog, and order tools from anywhere.',
    'You will work on the Marlow web shop and the services behind it. The role is remote, on US hours, and reports to engineering.'
  ),
  (
    '6c0a0001-0000-4000-8000-000000000002',
    'frontend-engineer',
    'Frontend Engineer',
    'engineering',
    'remote',
    NULL,
    'Shape the storefront, from the product grid to checkout.',
    'You will build the pages guests use to browse, pick up, and track orders. The role is remote.'
  ),
  (
    '6c0a0001-0000-4000-8000-000000000003',
    'brand-marketing-manager',
    'Brand Marketing Manager',
    'marketing',
    'remote',
    NULL,
    'Tell the Marlow story across the site, mail, and the stores.',
    'You will plan campaigns for the shop and the Texas stores. The role is remote, with occasional visits to a store.'
  ),
  (
    '6c0a0001-0000-4000-8000-000000000004',
    'content-marketing',
    'Content Marketing',
    'marketing',
    'remote',
    NULL,
    'Write the product stories, the journal, and the store notes.',
    'You will draft copy for goods, campaigns, and the careers page. The role is remote.'
  ),
  (
    '6c0a0001-0000-4000-8000-000000000005',
    'account-executive',
    'Account Executive',
    'sales',
    'remote',
    NULL,
    'Sell Marlow to trade accounts and hospitality groups.',
    'You will own a book of wholesale accounts and visit stores when a buyer wants to see the floor. The role is remote.'
  ),
  (
    '6c0a0001-0000-4000-8000-000000000006',
    'wholesale-sales',
    'Wholesale Sales',
    'sales',
    'remote',
    NULL,
    'Keep trade buyers stocked and introduce new goods.',
    'You will write orders, answer buyers, and coordinate pickup with the stores. The role is remote.'
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO jobs (id, slug, title, department, workplace, location_id, summary, description)
SELECT
  gen_random_uuid(),
  'sales-associate-' || l.slug,
  'Sales Associate',
  'sales',
  'store',
  l.id,
  'Help guests on the floor at ' || l.name || ' in ' || l.city || '.',
  'Greet guests, know the goods, and hand off pickup orders at ' || l.name || '. The store is at ' || l.line1 || ', ' || l.city || ', ' || l.region || ' ' || l.postal_code || '. Hours are ' || l.hours || '.'
FROM locations l
ON CONFLICT (slug) DO NOTHING;

INSERT INTO jobs (id, slug, title, department, workplace, location_id, summary, description)
SELECT
  gen_random_uuid(),
  'store-lead-' || l.slug,
  'Store Lead',
  'retail',
  'store',
  l.id,
  'Open and close ' || l.name || ' and run the floor.',
  'Schedule the team, watch the shelf, and make sure pickup orders leave the store complete. This job is on site at ' || l.name || ' in ' || l.city || '.'
FROM locations l
ON CONFLICT (slug) DO NOTHING;

INSERT INTO jobs (id, slug, title, department, workplace, location_id, summary, description)
SELECT
  gen_random_uuid(),
  'visual-merchandiser-' || l.slug,
  'Visual Merchandiser',
  'marketing',
  'store',
  l.id,
  'Set the floor at ' || l.name || ' so the goods read from the door.',
  'You will change the windows and tables at ' || l.name || ' in ' || l.city || ' and keep the shop looking like the pictures. This job is on site.'
FROM locations l
ON CONFLICT (slug) DO NOTHING;
