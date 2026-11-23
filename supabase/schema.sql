-- =========================================================
-- UNICO データベース設計 (Supabase / PostgreSQL) 草案
-- PHASE 6-9 で使用。現時点ではアプリから未接続 (DEMO データ稼働中)。
-- 2026-11 改訂: 料金体系 (FREE / 事前買い目300円 / PRO月額1,280円) と
--   PRE_RACE / FINAL の版管理・公開状態・RLS を新仕様に合わせて再設計。
--   旧 entitlements / has_pro_access は subscriptions + purchases + has_active_pro() に置換。
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

-- ---------- 無料ワイド BOX (無料公開。印・買い目金額は含めない) ----------
create table free_wide_predictions (
  id          bigint generated always as identity primary key,
  race_id     text not null references races(id) on delete cascade,
  run_id      bigint references index_runs(id),
  free_wide   jsonb not null,               -- BOX種別・馬番・理由
  created_at  timestamptz not null default now()
);

-- =========================================================
-- 予想 (買い目) — 生成層。指数計算とは分離
-- PRE_RACE (事前買い目) と FINAL (最終買い目) は別レコード。
-- (race_id, prediction_type, version) ごとに不変。FINAL の公開で PRE_RACE を上書き・削除しない。
-- 状態: DRAFT → SCHEDULED → PUBLISHED → (REVISED | CLOSED)
-- =========================================================
create table predictions (
  id                 bigint generated always as identity primary key,
  race_id            text not null references races(id) on delete restrict,
  prediction_type    text not null check (prediction_type in ('PRE_RACE','FINAL')),
  version            int  not null check (version >= 1),
  prediction_status  text not null default 'DRAFT'
                     check (prediction_status in ('DRAFT','SCHEDULED','PUBLISHED','REVISED','CLOSED')),
  run_id             bigint references index_runs(id),
  publish_at         timestamptz,            -- 公開予定日時 (DRAFT は null 可)
  published_at       timestamptz,            -- 実際の公開日時 (未公開は null)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  total_stake        int not null check (total_stake >= 0),
  note               text,                   -- 更新理由 (PRO 向け)
  unique (race_id, prediction_type, version),
  check (prediction_status <> 'SCHEDULED' or publish_at is not null),
  check ((prediction_status in ('DRAFT','SCHEDULED')) = (published_at is null))
);
create index predictions_race_type on predictions (race_id, prediction_type, version desc);

create table prediction_lines (
  id              bigint generated always as identity primary key,
  prediction_id   bigint not null references predictions(id) on delete restrict,
  line_no         smallint not null,
  ticket_type     text not null check (ticket_type in ('TANSHO','FUKUSHO','WIDE','UMAREN','UMATAN','SANRENPUKU','SANRENTAN')),
  role            text not null check (role in ('main','mid','longshot')),   -- 本線/中穴/穴同士
  combinations    jsonb not null,             -- [[1,5],[1,7],...]
  points          int not null check (points >= 0),
  stake_per_point int not null check (stake_per_point >= 0),
  stake           int not null check (stake >= 0),
  unique (prediction_id, line_no)
);

create table prediction_stake_allocation (
  prediction_id   bigint not null references predictions(id) on delete restrict,
  role            text not null check (role in ('main','mid','longshot')),
  ticket_type     text not null,
  amount          int not null check (amount >= 0),
  ratio           numeric(5,4) not null check (ratio between 0 and 1),
  primary key (prediction_id, role, ticket_type)
);

-- 予想印 (PRO 限定)。FINAL のみ保持し、PRE_RACE には作成しない (トリガで強制)
create table prediction_marks (
  prediction_id   bigint not null references predictions(id) on delete restrict,
  horse_no        smallint not null,
  mark            text not null check (mark in ('◎','○','▲','△','☆','注')),
  primary key (prediction_id, horse_no)
);

-- 公開履歴ログ (追記のみ)
create table prediction_publish_events (
  id              bigint generated always as identity primary key,
  prediction_id   bigint not null references predictions(id) on delete restrict,
  race_id         text not null,
  prediction_type text not null check (prediction_type in ('PRE_RACE','FINAL')),
  version         int not null,
  from_status     text,
  to_status       text not null check (to_status in ('DRAFT','SCHEDULED','PUBLISHED','REVISED','CLOSED')),
  occurred_at     timestamptz not null default now(),
  actor           text not null default 'system'
);

-- ---------- 不変性の強制 ----------
-- 公開後 (PUBLISHED/REVISED/CLOSED) は内容を変更できない。許されるのは状態の前進のみ。
create or replace function predictions_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.prediction_status <> 'DRAFT' then
      raise exception 'published/scheduled prediction % cannot be deleted', old.id;
    end if;
    return old;
  end if;
  if old.prediction_status in ('PUBLISHED','REVISED','CLOSED') then
    if new.race_id is distinct from old.race_id
       or new.prediction_type is distinct from old.prediction_type
       or new.version is distinct from old.version
       or new.total_stake is distinct from old.total_stake
       or new.published_at is distinct from old.published_at
       or new.run_id is distinct from old.run_id then
      raise exception 'prediction % is immutable after publish', old.id;
    end if;
    if not (old.prediction_status = new.prediction_status
            or (old.prediction_status = 'PUBLISHED' and new.prediction_status in ('REVISED','CLOSED'))
            or (old.prediction_status = 'REVISED' and new.prediction_status = 'CLOSED')) then
      raise exception 'invalid status transition % -> %', old.prediction_status, new.prediction_status;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger predictions_guard before update or delete on predictions
  for each row execute function predictions_guard();

-- 子テーブル: 親が DRAFT の間だけ変更可。marks は FINAL のみ
create or replace function prediction_children_guard() returns trigger
language plpgsql as $$
declare
  pid bigint := coalesce(new.prediction_id, old.prediction_id);
  st  text;
  typ text;
begin
  select prediction_status, prediction_type into st, typ from predictions where id = pid;
  if st is distinct from 'DRAFT' then
    raise exception 'prediction % is not DRAFT; its lines/allocation/marks are immutable', pid;
  end if;
  if tg_table_name = 'prediction_marks' and typ <> 'FINAL' then
    raise exception 'marks are allowed only on FINAL predictions';
  end if;
  return coalesce(new, old);
end $$;
create trigger prediction_lines_guard before insert or update or delete on prediction_lines
  for each row execute function prediction_children_guard();
create trigger prediction_alloc_guard before insert or update or delete on prediction_stake_allocation
  for each row execute function prediction_children_guard();
create trigger prediction_marks_guard before insert or update or delete on prediction_marks
  for each row execute function prediction_children_guard();

-- 公開履歴は追記のみ
create or replace function append_only() returns trigger
language plpgsql as $$
begin
  raise exception '% is append-only', tg_table_name;
end $$;
create trigger prediction_publish_events_append_only before update or delete on prediction_publish_events
  for each row execute function append_only();

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


-- =========================================================
-- 会員・決済・権限
--   FREE            無料指数・無料ワイドのみ
--   SINGLE_PURCHASE 購入した race の PRE_RACE のみ (FINAL は不可。PRO 終了後も保持)
--   PRO             有効期間中、全対象レースの PRE_RACE + FINAL + PRO分析 + 履歴
-- 書き込みは Stripe Webhook (service_role) のみ。
-- =========================================================
create table profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  stripe_customer_id text unique,
  created_at   timestamptz not null default now()
);

create table subscriptions (
  id                      bigint generated always as identity primary key,
  user_id                 uuid not null references auth.users(id),
  plan                    text not null default 'PRO_MONTHLY' check (plan in ('PRO_MONTHLY')),
  stripe_customer_id      text not null,
  stripe_subscription_id  text not null unique,
  status                  text not null
                          check (status in ('trialing','active','past_due','canceled','incomplete','unpaid')),
  current_period_end      timestamptz not null,
  cancel_at_period_end    boolean not null default false,
  last_event_created      timestamptz,       -- 順不同で届く Webhook の古いイベントを無視するため
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index subscriptions_user on subscriptions (user_id);

-- 単品購入 (事前買い目 300円 / race 単位)。FINAL の権利は含まない
create table purchases (
  id                         bigint generated always as identity primary key,
  user_id                    uuid not null references auth.users(id),
  race_id                    text not null references races(id),
  product                    text not null default 'PRE_RACE_SINGLE' check (product in ('PRE_RACE_SINGLE')),
  amount_jpy                 int not null default 300,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id   text unique,
  status                     text not null check (status in ('paid','refunded')),
  purchased_at               timestamptz not null default now(),
  unique (user_id, race_id, product)
);

-- Webhook の冪等性 (event.id を PK に。insert が衝突したら処理済み)
create table stripe_events (
  id           text primary key,             -- evt_...
  type         text not null,
  created      timestamptz not null,
  processed_at timestamptz not null default now(),
  payload      jsonb
);

-- ---------- 権限判定関数 ----------
create or replace function has_active_pro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from subscriptions s
    where s.user_id = auth.uid()
      and s.status in ('active','trialing')
      and s.current_period_end > now()
  );
$$;

create or replace function has_pre_race_purchase(p_race_id text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from purchases p
    where p.user_id = auth.uid() and p.race_id = p_race_id
      and p.product = 'PRE_RACE_SINGLE' and p.status = 'paid'
  );
$$;

-- 予想 1 行を現在のユーザーが読めるか
--   DRAFT / SCHEDULED / 公開時刻前: 誰も読めない
--   PRE_RACE 最新公開版 (PUBLISHED/CLOSED): 購入者 or 有効 PRO
--   PRE_RACE 旧版 (REVISED = 履歴): 有効 PRO のみ
--   FINAL (全公開版): 有効 PRO のみ
create or replace function can_read_prediction(p_prediction_id bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from predictions p
    where p.id = p_prediction_id
      and p.prediction_status in ('PUBLISHED','REVISED','CLOSED')
      and p.published_at is not null and p.published_at <= now()
      and (
        has_active_pro()
        or (p.prediction_type = 'PRE_RACE'
            and p.prediction_status in ('PUBLISHED','CLOSED')
            and has_pre_race_purchase(p.race_id))
      )
  );
$$;

-- ---------- RLS ----------
alter table unico_index_detail          enable row level security;
alter table free_wide_predictions       enable row level security;
alter table predictions                 enable row level security;
alter table prediction_lines            enable row level security;
alter table prediction_stake_allocation enable row level security;
alter table prediction_marks            enable row level security;
alter table prediction_publish_events   enable row level security;
alter table profiles                    enable row level security;
alter table subscriptions               enable row level security;
alter table purchases                   enable row level security;
alter table stripe_events               enable row level security;

-- 項目別指数は PRO 限定 (単品購入では不可)
create policy detail_pro_only on unico_index_detail for select using (has_active_pro());
create policy free_wide_public on free_wide_predictions for select using (true);

create policy predictions_read on predictions for select using (can_read_prediction(id));
create policy prediction_lines_read on prediction_lines for select using (can_read_prediction(prediction_id));
create policy prediction_alloc_read on prediction_stake_allocation for select using (can_read_prediction(prediction_id));
-- 印は FINAL のみ存在し、PRO のみ読める
create policy prediction_marks_read on prediction_marks for select using (
  has_active_pro() and can_read_prediction(prediction_id)
);
-- 公開履歴は PRO のみ。未公開 (DRAFT/SCHEDULED) への遷移ログは返さない
create policy prediction_publish_events_read on prediction_publish_events for select using (
  has_active_pro()
  and to_status in ('PUBLISHED','REVISED','CLOSED')
  and occurred_at <= now()
  and can_read_prediction(prediction_id)
);

create policy profiles_own on profiles for select using (user_id = auth.uid());
create policy subscriptions_own on subscriptions for select using (user_id = auth.uid());
create policy purchases_own on purchases for select using (user_id = auth.uid());
-- stripe_events: ポリシーなし = 一般ユーザーは読み書き不可

-- INSERT / UPDATE / DELETE は service_role (Webhook / 公開バッチ) のみ。
-- 書き込み用ポリシーを作らないことで anon / authenticated からの書き込みを拒否する。
revoke insert, update, delete on
  predictions, prediction_lines, prediction_stake_allocation, prediction_marks,
  prediction_publish_events, subscriptions, purchases, stripe_events, free_wide_predictions
from anon, authenticated;
-- 権限関数は auth.uid() 固定 (他人の権限状態は問い合わせられない)
