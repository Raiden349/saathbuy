insert into public.pickup_points (name, description)
select 'Main gate kiosk', 'Collect confirmed deals at the kiosk beside the main gate.'
where not exists (select 1 from public.pickup_points where name = 'Main gate kiosk');

insert into public.pickup_points (name, description)
select 'Library steps', 'Collect confirmed deals at the steps outside the library.'
where not exists (select 1 from public.pickup_points where name = 'Library steps');

insert into public.deals (
  slug, title, description, image_url, category, retail_price, tiers,
  max_qty_per_user, deadline, pickup_point_id, pickup_time
)
select
  seed.slug,
  seed.title,
  seed.description,
  '',
  seed.category,
  seed.retail_price,
  jsonb_build_array(
    jsonb_build_object('name', 'Bronze', 'min_joiners', 5, 'price', seed.bronze_price),
    jsonb_build_object('name', 'Silver', 'min_joiners', 10, 'price', seed.silver_price),
    jsonb_build_object('name', 'Gold', 'min_joiners', 20, 'price', seed.gold_price)
  ),
  3,
  now() + make_interval(days => seed.deadline_days),
  point.id,
  (
    (now() at time zone 'Asia/Karachi')::date + seed.deadline_days + 1 + time '16:00'
  ) at time zone 'Asia/Karachi'
from (values
  ('notebooks-a4-pack-6', 'Notebooks, A4 ruled, pack of 6', 'Each pack contains 6 A4 ruled notebooks. The paper is lined for class notes and assignments.', 'Stationery', 1150, 1010, 920, 830, 2, 'Main gate kiosk'),
  ('gel-pens-blue-box-20', 'Gel pens, blue, box of 20', 'Each box contains 20 blue gel pens. The pens have medium tips for everyday writing.', 'Stationery', 600, 530, 480, 430, 3, 'Library steps'),
  ('instant-noodles-carton-24', 'Instant noodles, carton of 24', 'Each carton contains 24 single-serve noodle packs. Each pack includes one seasoning sachet.', 'Snacks', 1300, 1140, 1040, 940, 4, 'Main gate kiosk'),
  ('extension-board-4-socket-3m', 'Extension board, 4 socket, 3 m cable', 'The board has 4 sockets and a 3 m cable. It is for indoor use near a desk or bed.', 'Hostel', 1450, 1280, 1160, 1040, 5, 'Library steps'),
  ('mixed-dry-fruit-500g', 'Mixed dry fruit, 500 g', 'Each sealed pack contains 500 g of mixed dry fruit. Check the package for ingredient and allergy information.', 'Snacks', 1800, 1580, 1440, 1300, 6, 'Main gate kiosk'),
  ('cotton-tote-bag-one-color', 'Cotton tote bag, one-color print', 'Each bag is made from cotton and has one-color printing. It is sized to carry books and daily items.', 'Merch', 700, 620, 560, 500, 7, 'Library steps')
) as seed(slug, title, description, category, retail_price, bronze_price, silver_price, gold_price, deadline_days, pickup_name)
join public.pickup_points as point on point.name = seed.pickup_name
where not exists (select 1 from public.deals where slug = seed.slug);

insert into public.deal_costs (deal_id, wholesale_cost)
select deal.id, round((deal.tiers -> 1 ->> 'price')::numeric * 0.7)::int
from public.deals as deal
where deal.slug in (
  'notebooks-a4-pack-6', 'gel-pens-blue-box-20', 'instant-noodles-carton-24',
  'extension-board-4-socket-3m', 'mixed-dry-fruit-500g', 'cotton-tote-bag-one-color'
)
on conflict (deal_id) do nothing;
