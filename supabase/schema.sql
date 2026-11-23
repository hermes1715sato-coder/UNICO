-- =========================================================
-- UNICO データベース設計 (Supabase / PostgreSQL) 草案
-- PHASE 6-9 で使用。現時点ではアプリから未接続 (DEMO データ稼働中)。
-- 層の分離: 取得層(JV-Link) → 本テーブル → 指数計算 → 予想生成 → 画面
-- =========================================================

-- ---------- マスタ ----------
create table venues (
  code        char(2) primary key,          -- JRA場コード
  name        text not null,
  name_en     text not null
);

create table jockeys (
  id          text primary key,             -- JRA-VAN 騎手コード
  name        text not null,
  affiliation text
);

create table horses (
  id          text primary key,             -- JRA-VAN 血統登録番号
  name        text not null,
  sex         text check (sex in ('牡','牝','セ')),
  birth_year  int,
  sire_id     text references horses(id),
  dam_id      text references horses(id),
  dam_sire_id text references horses(id)
);

-- 血統 (5代血統表を世代・位置で保持)
create table pedigrees (
  horse_id     text references horses(id) on delete cascade,
  generation   smallint not null check (generation between 1 and 5),
  position     smallint not null,           -- 世代内の位置 (父系=偶数 等)
  ancestor_id  text references horses(id),
  ancestor_name text not null,
  primary key (horse_id, generation, position)
);

-- ---------- 開催・レース ----------
create table meeting_days (
  date        date not null,
  venue_code  char(2) references venues(code),
  kai         smallint,                     -- 回
  nichi       smallint,                     -- 日目
  primary key (date, venue_code)
);

create table races (
  id              text primary key,         -- YYYYMMDD-VV-RR
  date            date not null,
  venue_code      char(2) not null,
  race_no         smallint not null check (race_no between 1 and 12),
  name            text not null,
  grade           text,
  class_name      text,
  post_time       time,
  surface         text check (surface in ('turf','dirt')),
  distance        int,
  direction       text,
  track_condition text,
  field_size      smallint,
  status          text not null default 'before_entry'
                  check (status in ('before_entry','analyzing','analyzed','finished')),
  pro_price_jpy   int not null default 300,
  updated_at      timestamptz not null default now(),
  foreign key (date, venue_code) references meeting_days(date, venue_code),
  unique (date, venue_code, race_no)
);

create table entries (
  race_id     text references races(id) on delete cascade,
  horse_no    smallint not null,
  frame       smallint not null check (frame between 1 and 8),
  horse_id    text references horses(id),
  jockey_id   text references jockeys(id),
  weight_kg   numeric(3,1),
  odds        numeric(6,1),
  popularity  smallint,
  scratched   boolean not null default false,
  finish_pos  smallint,
  updated_at  timestamptz not null default now(),
  primary key (race_id, horse_no)
);

-- 過去走
create table past_runs (
  horse_id    text references horses(id) on delete cascade,
  race_id     text references races(id),
  finish_pos  smallint,
  time_sec    numeric(6,1),
  last3f_sec  numeric(4,1),
  passing     text,                          -- 通過順 "3-3-2"
  margin      text,
  primary key (horse_id, race_id)
);

-- ---------- 指数 (計算層) ----------
-- 再計算ごとに新しい run を作る (出走取消・騎手変更・当日馬場・直前オッズ)
create table index_runs (
  id           bigint generated always as identity primary key,
  race_id      text references races(id) on delete cascade,
  version      text not null,                -- 例 'v2.0' (配点バージョン)
  trigger      text not null,                -- 'initial','scratch','jockey_change','track','odds'
  computed_at  timestamptz not null default now(),
  is_current   boolean not null default true
);
create unique index index_runs_current on index_runs(race_id) where is_current;

-- 総合指数 (無料公開)
create table unico_index (
  run_id     bigint references index_runs(id) on delete cascade,
  race_id    text not null,
  horse_no   smallint not null,
  score      numeric(4,1) not null,
  rank       smallint not null,
  primary key (run_id, horse_no)
);

-- 項目別指数 (PRO限定) 9項目 + 将来の約180特徴量は features に保持
create table unico_index_detail (
  run_id      bigint references index_runs(id) on delete cascade,
  race_id     text not null,
  horse_no    smallint not null,
  ability     smallint, recent smallint, aptitude smallint, pace smallint,
  workout     smallint, stable smallint, jockey smallint, draw_weight smallint,
  pedigree    smallint,
  features    jsonb,
  primary key (run_id, horse_no)
);

-- ---------- 予想 (生成層。指数計算とは分離) ----------
create table predictions (
  id          bigint generated always as identity primary key,
  race_id     text references races(id) on delete cascade,
  run_id      bigint references index_runs(id),
  tier        text not null check (tier in ('free','pro')),
  free_wide   jsonb,                        -- 無料: BOX種別・馬番・理由 (印なし)
  marks       jsonb,                        -- PRO: {"◎":5,"○":1,...}
  created_at  timestamptz not null default now()
);

create table bets (
  id             bigint generated always as identity primary key,
  prediction_id  bigint references predictions(id) on delete cascade,
  role           text not null check (role in ('main','mid','longshot')), -- 本線/中穴/穴同士
  bet_type       text not null,              -- 'wide','umaren','sanrenpuku' ...
  combination    smallint[] not null,
  amount_jpy     int not null
);

-- ---------- 会員・決済・権限 ----------
create table profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at  timestamptz not null default now()
);

create table purchases (
  id                 bigint generated always as identity primary key,
  user_id            uuid not null references auth.users(id),
  race_id            text references races(id),
  amount_jpy         int not null,
  stripe_session_id  text unique,
  status             text not null check (status in ('pending','paid','refunded','failed')),
  created_at         timestamptz not null default now()
);

-- 閲覧権限 (Stripe Webhook でのみ付与。将来の月額プランは scope='subscription')
create table entitlements (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id),
  scope       text not null check (scope in ('race','subscription')),
  race_id     text references races(id),
  valid_until timestamptz,
  source_purchase_id bigint references purchases(id),
  unique (user_id, scope, race_id)
);

-- ---------- データ取得ログ ----------
create table ingest_logs (
  id          bigint generated always as identity primary key,
  source      text not null,                 -- 'JV-Link'
  data_spec   text not null,                 -- 'RACE','SE','UM' 等
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  records     int,
  status      text not null,
  message     text
);

-- ---------- RLS: PRO情報は購入者のみ ----------
alter table unico_index_detail enable row level security;
alter table predictions        enable row level security;
alter table bets               enable row level security;
alter table purchases          enable row level security;
alter table entitlements       enable row level security;

create or replace function has_pro_access(p_race_id text) returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from entitlements e
    where e.user_id = auth.uid()
      and ((e.scope = 'race' and e.race_id = p_race_id)
        or (e.scope = 'subscription' and (e.valid_until is null or e.valid_until > now())))
  );
$$;

create policy detail_pro_only on unico_index_detail for select using (has_pro_access(race_id));
create policy predictions_free on predictions for select using (tier = 'free' or has_pro_access(race_id));
create policy bets_pro_only on bets for select using (
  exists (select 1 from predictions p where p.id = bets.prediction_id and has_pro_access(p.race_id))
);
create policy purchases_own on purchases for select using (user_id = auth.uid());
create policy entitlements_own on entitlements for select using (user_id = auth.uid());
-- INSERT/UPDATE は service_role (Webhook / バッチ) のみ。ポリシーを作らないことで一般ユーザーからの書き込みを拒否。
