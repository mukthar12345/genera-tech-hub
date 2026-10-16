
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_brand on public.products(brand);
create index if not exists idx_products_available on public.products(is_available);
create index if not exists idx_products_featured on public.products(is_featured);
create index if not exists idx_products_created on public.products(created_at desc);
create index if not exists idx_repairs_status on public.repair_requests(status);
create index if not exists idx_repairs_reference on public.repair_requests(reference_number);
create index if not exists idx_repairs_created on public.repair_requests(created_at desc);
create index if not exists idx_swaps_status on public.swap_requests(status);
create index if not exists idx_swaps_created on public.swap_requests(created_at desc);
create index if not exists idx_reviews_approved on public.reviews(is_approved);
create index if not exists idx_reviews_created on public.reviews(created_at desc);
create index if not exists idx_messages_status on public.contact_messages(status);
create index if not exists idx_messages_created on public.contact_messages(created_at desc);
create index if not exists idx_visits_created on public.site_visits(created_at desc);
create index if not exists idx_visits_visitor on public.site_visits(visitor_id);
create index if not exists idx_activity_created on public.activity_logs(created_at desc);
create index if not exists idx_activity_type on public.activity_logs(activity_type);
create index if not exists idx_views_product on public.product_views(product_id);
create index if not exists idx_views_created on public.product_views(viewed_at desc);

create or replace function public.is_ceo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from auth.users u
        where u.id = (select auth.uid())
          and lower(u.email) = 'mudasirumukthar@gmail.com'
    );
$$;

revoke all on function public.is_ceo() from public;
grant execute on function public.is_ceo() to authenticated;

alter table public.products enable row level security;
alter table public.repair_requests enable row level security;
alter table public.swap_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_visits enable row level security;
alter table public.activity_logs enable row level security;
alter table public.product_views enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products" on public.products
for select to anon, authenticated using (true);
drop policy if exists "CEO can manage products" on public.products;
create policy "CEO can manage products" on public.products
for all to authenticated using (public.is_ceo()) with check (public.is_ceo());

drop policy if exists "Anyone can insert repairs" on public.repair_requests;
create policy "Anyone can insert repairs" on public.repair_requests
for insert to anon, authenticated with check (true);
drop policy if exists "CEO can read repairs" on public.repair_requests;
create policy "CEO can read repairs" on public.repair_requests
for select to authenticated using (public.is_ceo());
drop policy if exists "CEO can update repairs" on public.repair_requests;
create policy "CEO can update repairs" on public.repair_requests
for update to authenticated using (public.is_ceo()) with check (public.is_ceo());

drop policy if exists "Anyone can insert swaps" on public.swap_requests;
create policy "Anyone can insert swaps" on public.swap_requests
for insert to anon, authenticated with check (true);
drop policy if exists "CEO can read swaps" on public.swap_requests;
create policy "CEO can read swaps" on public.swap_requests
for select to authenticated using (public.is_ceo());
drop policy if exists "CEO can update swaps" on public.swap_requests;
create policy "CEO can update swaps" on public.swap_requests
for update to authenticated using (public.is_ceo()) with check (public.is_ceo());

drop policy if exists "Anyone can insert reviews" on public.reviews;
create policy "Anyone can insert reviews" on public.reviews
for insert to anon, authenticated with check (true);
drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews" on public.reviews
for select to anon, authenticated using (is_approved = true);
drop policy if exists "CEO can manage reviews" on public.reviews;
create policy "CEO can manage reviews" on public.reviews
for all to authenticated using (public.is_ceo()) with check (public.is_ceo());

drop policy if exists "Anyone can insert contact" on public.contact_messages;
create policy "Anyone can insert contact" on public.contact_messages
for insert to anon, authenticated with check (true);
drop policy if exists "CEO can read contacts" on public.contact_messages;
create policy "CEO can read contacts" on public.contact_messages
for select to authenticated using (public.is_ceo());
drop policy if exists "CEO can update contacts" on public.contact_messages;
create policy "CEO can update contacts" on public.contact_messages
for update to authenticated using (public.is_ceo()) with check (public.is_ceo());

drop policy if exists "Anyone can log visits" on public.site_visits;
create policy "Anyone can log visits" on public.site_visits
for insert to anon, authenticated with check (true);
drop policy if exists "CEO can read visits" on public.site_visits;
create policy "CEO can read visits" on public.site_visits
for select to authenticated using (public.is_ceo());

-- Restrict activity log writes to the CEO account.
drop policy if exists "Anyone can log activity" on public.activity_logs;
drop policy if exists "CEO can insert activity" on public.activity_logs;
create policy "CEO can insert activity" on public.activity_logs
for insert to authenticated with check (public.is_ceo());
drop policy if exists "CEO can read activity" on public.activity_logs;
create policy "CEO can read activity" on public.activity_logs
for select to authenticated using (public.is_ceo());

drop policy if exists "Anyone can log product views" on public.product_views;
create policy "Anyone can log product views" on public.product_views
for insert to anon, authenticated with check (true);
drop policy if exists "CEO can read product views" on public.product_views;
create policy "CEO can read product views" on public.product_views
for select to authenticated using (public.is_ceo());

grant select on public.products to anon, authenticated;
grant insert on public.repair_requests, public.swap_requests, public.reviews,
    public.contact_messages, public.site_visits, public.product_views to anon, authenticated;
grant select, update on public.repair_requests, public.swap_requests,
    public.contact_messages, public.site_visits, public.activity_logs,
    public.product_views to authenticated;
grant select, insert, update, delete on public.products, public.reviews to authenticated;
grant insert, select on public.activity_logs to authenticated;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

commit;

-- Verify:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('products','repair_requests','swap_requests','reviews',
-- 'contact_messages','site_visits','activity_logs','product_views')
-- ORDER BY table_name;
