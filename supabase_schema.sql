-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Customers Table
create table customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  address text,
  company text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Invoices Table
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null,
  project_number text,
  date timestamp with time zone,
  due_date timestamp with time zone,
  client_name text,
  client_email text,
  client_phone text,
  client_address text,
  currency text default 'USD',
  tax_enabled boolean default false,
  tax_rate numeric,
  discount_code text,
  discount_amount numeric,
  notes text,
  po_number text,
  bank_details text,
  payment_status text default 'pending',
  amount_paid numeric default 0,
  is_recurring boolean default false,
  recurring_interval text,
  signature text, -- Base64 signature
  items jsonb default '[]'::jsonb, -- Storing items as JSONBA for simplicity
  attachments text[] default array[]::text[], -- Array of attachment URLs or Base64
  pdf_url text, -- URL to the saved PDF copy
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Settings Table (Single Row)
create table settings (
  id uuid primary key default uuid_generate_v4(),
  name text,
  email text,
  phone text,
  address text,
  website text,
  tax_id text,
  logo text, -- Base64 or URL
  signature text, -- Base64
  bank_details text,
  upi_id text,
  default_currency text default 'USD',
  default_tax_rate numeric default 0,
  invoice_prefix text default 'INV',
  next_invoice_number integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Coupons Table
create table coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  discount_type text not null, -- 'percentage' or 'fixed'
  discount_value numeric not null,
  description text,
  is_active boolean default true,
  usage_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Storage Bucket for Bills/PDFs
insert into storage.buckets (id, name)
values ('bills', 'bills');

-- Policies (Enable RLS and allow public access for simplicity in this demo, 
-- BUT in production you should restrict this to authenticated users)
alter table customers enable row level security;
create policy "Public customers access" on customers for all using (true);

alter table invoices enable row level security;
create policy "Public invoices access" on invoices for all using (true);

alter table settings enable row level security;
create policy "Public settings access" on settings for all using (true);

alter table coupons enable row level security;
create policy "Public coupons access" on coupons for all using (true);

-- Storage Policies
create policy "Public Access" on storage.objects for all using ( bucket_id = 'bills' );
