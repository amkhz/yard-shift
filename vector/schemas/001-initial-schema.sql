-- ============================================================================
-- Yard Shift: Initial Schema Migration
-- ADR: vector/decisions/ADR-001-data-model.md
-- Run this in the Supabase SQL Editor on a fresh project.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------

CREATE TYPE sale_status AS ENUM ('draft', 'active', 'completed');
CREATE TYPE member_role AS ENUM ('host', 'helper');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted');

-- ----------------------------------------------------------------------------
-- 2. TABLES
-- ----------------------------------------------------------------------------

-- Profiles: public user data, synced from auth.users via trigger.
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Public user profile, auto-created on signup.';

-- Sales: the yard sale event.
CREATE TABLE sales (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sale_date   DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  address     TEXT NOT NULL,
  status      sale_status NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sales IS 'A yard sale event with date, time, location, and status.';

-- Sale members: links users to sales with roles. Drives all RLS.
CREATE TABLE sale_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        member_role NOT NULL DEFAULT 'helper',
  invite_status invite_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (sale_id, user_id)
);

COMMENT ON TABLE sale_members IS 'Join table linking users to sales. Membership here grants access via RLS.';

-- Categories: lookup table for item categories.
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE categories IS 'Predefined item categories. Editable without schema migration.';

-- Items: things for sale.
CREATE TABLE items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  photo_url   TEXT,
  is_sold     BOOLEAN NOT NULL DEFAULT false,
  sold_price  NUMERIC(10, 2) CHECK (sold_price >= 0),
  sold_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sold_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE items IS 'An item listed in a yard sale. Tracks listing and sale details.';

-- ----------------------------------------------------------------------------
-- 3. INDEXES
-- ----------------------------------------------------------------------------

-- Sales by host (dashboard queries)
CREATE INDEX idx_sales_host_id ON sales(host_id);

-- Sale members: fast membership lookups for RLS
CREATE INDEX idx_sale_members_sale_id ON sale_members(sale_id);
CREATE INDEX idx_sale_members_user_id ON sale_members(user_id);

-- Items: queries scoped to a sale, filtering by sold status and category
CREATE INDEX idx_items_sale_id ON items(sale_id);
CREATE INDEX idx_items_sale_id_is_sold ON items(sale_id, is_sold);
CREATE INDEX idx_items_category_id ON items(category_id);

-- Categories: sort order for UI display
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- ----------------------------------------------------------------------------
-- 4. UPDATED_AT TRIGGER
-- ----------------------------------------------------------------------------

-- Generic function to auto-update the updated_at column.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_sale_members_updated_at
  BEFORE UPDATE ON sale_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- 5. AUTO-CREATE PROFILE ON SIGNUP
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- No SECURITY DEFINER triggers. Host membership is created client-side
-- in services/sales.js after the sale insert.
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----

CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---- CATEGORIES ----

CREATE POLICY "categories_select"
  ON categories FOR SELECT
  USING (true);

-- ---- SALES ----

CREATE POLICY "sales_insert"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (host_id = auth.uid());

-- Host can always see their sales; members see via sale_members.
-- No recursion: sale_members SELECT uses user_id = auth.uid() directly.
CREATE POLICY "sales_select"
  ON sales FOR SELECT
  TO authenticated
  USING (
    host_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM sale_members
      WHERE sale_members.sale_id = id
        AND sale_members.user_id = auth.uid()
    )
  );

CREATE POLICY "sales_update"
  ON sales FOR UPDATE
  TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "sales_delete"
  ON sales FOR DELETE
  TO authenticated
  USING (host_id = auth.uid());

-- ---- SALE MEMBERS ----
-- SELECT: direct user_id check (no self-reference).
-- INSERT/DELETE: checked via sales.host_id (no self-reference).

CREATE POLICY "sale_members_select"
  ON sale_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "sale_members_insert"
  ON sale_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_id
        AND sales.host_id = auth.uid()
    )
  );

CREATE POLICY "sale_members_update"
  ON sale_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "sale_members_delete"
  ON sale_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_id
        AND sales.host_id = auth.uid()
    )
  );

-- ---- ITEMS ----
-- All access scoped through sale_members (which uses direct user_id check).

CREATE POLICY "items_select"
  ON items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sale_members
      WHERE sale_members.sale_id = items.sale_id
        AND sale_members.user_id = auth.uid()
    )
  );

CREATE POLICY "items_insert"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sale_members
      WHERE sale_members.sale_id = items.sale_id
        AND sale_members.user_id = auth.uid()
    )
  );

CREATE POLICY "items_update"
  ON items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sale_members
      WHERE sale_members.sale_id = items.sale_id
        AND sale_members.user_id = auth.uid()
    )
  );

CREATE POLICY "items_delete"
  ON items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sale_members
      WHERE sale_members.sale_id = items.sale_id
        AND sale_members.user_id = auth.uid()
        AND sale_members.role = 'host'
    )
  );

-- ----------------------------------------------------------------------------
-- 8. SEED DATA: DEFAULT CATEGORIES
-- ----------------------------------------------------------------------------

INSERT INTO categories (name, sort_order) VALUES
  ('Furniture',    1),
  ('Clothing',     2),
  ('Electronics',  3),
  ('Books',        4),
  ('Kitchen',      5),
  ('Toys & Games', 6),
  ('Tools',        7),
  ('Sports',       8),
  ('Decor',        9),
  ('Music & Media', 10),
  ('Baby & Kids',  11),
  ('Outdoor',      12),
  ('Other',        99);

-- ============================================================================
-- DONE. Summary stats (total items, items sold, revenue) are derived via
-- queries against the items table -- no denormalized columns needed.
--
-- Example summary query for a sale:
--
--   SELECT
--     COUNT(*) AS total_items,
--     COUNT(*) FILTER (WHERE is_sold) AS items_sold,
--     COALESCE(SUM(sold_price) FILTER (WHERE is_sold), 0) AS total_revenue
--   FROM items
--   WHERE sale_id = '<sale-uuid>';
--
-- ============================================================================
