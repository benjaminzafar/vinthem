create extension if not exists "uuid-ossp";

alter table if exists public.users
  add column if not exists accepted_terms_at timestamp with time zone,
  add column if not exists accepted_privacy_at timestamp with time zone,
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists marketing_consent_at timestamp with time zone,
  add column if not exists consent_version text default '2026-04-16',
  add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null;

create table if not exists public.newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'subscribed',
  source text not null default 'storefront_homepage',
  unsubscribe_token text,
  consent_marketing boolean not null default true,
  consented_at timestamp with time zone,
  subscribed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint newsletter_subscribers_status_check check (status in ('subscribed', 'unsubscribed'))
);

alter table public.newsletter_subscribers
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists status text not null default 'subscribed',
  add column if not exists source text not null default 'storefront_homepage',
  add column if not exists unsubscribe_token text,
  add column if not exists consent_marketing boolean not null default true,
  add column if not exists consented_at timestamp with time zone,
  add column if not exists unsubscribed_at timestamp with time zone,
  add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null;

update public.newsletter_subscribers
set
  status = case
    when unsubscribed_at is not null then 'unsubscribed'
    else coalesce(status, 'subscribed')
  end,
  source = coalesce(nullif(source, ''), 'storefront_homepage'),
  consent_marketing = coalesce(consent_marketing, true),
  consented_at = coalesce(consented_at, subscribed_at, created_at, timezone('utc'::text, now())),
  subscribed_at = coalesce(subscribed_at, created_at, timezone('utc'::text, now())),
  updated_at = coalesce(updated_at, created_at, timezone('utc'::text, now())),
  unsubscribe_token = coalesce(unsubscribe_token, replace(uuid_generate_v4()::text, '-', ''))
where true;

delete from public.newsletter_subscribers a
using public.newsletter_subscribers b
where lower(a.email) = lower(b.email)
  and a.ctid < b.ctid;

create unique index if not exists newsletter_subscribers_email_lower_idx
  on public.newsletter_subscribers (lower(email));

create unique index if not exists newsletter_subscribers_unsubscribe_token_idx
  on public.newsletter_subscribers (unsubscribe_token)
  where unsubscribe_token is not null;

create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers (status);

create table if not exists public.newsletter_campaigns (
  id uuid primary key default uuid_generate_v4(),
  subject text not null,
  body text,
  recipient_count integer not null default 0,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_campaigns enable row level security;

drop policy if exists "Admin full access" on public.newsletter_subscribers;
create policy "Admin full access" on public.newsletter_subscribers
for all
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "Admin full access" on public.newsletter_campaigns;
create policy "Admin full access" on public.newsletter_campaigns
for all
using (app_private.is_admin())
with check (app_private.is_admin());

insert into public.pages (id, title, slug, content, updated_at)
select
  uuid_generate_v4(),
  '{"en":"Terms of Service","sv":"Användarvillkor","fi":"Käyttöehdot","da":"Vilkår"}'::jsonb,
  'terms-of-service',
  '{"en":"# Terms of Service\n\nBy creating an account, you agree to use this store lawfully and to provide accurate account information.\n\n## Accounts\n\n- Keep your login credentials secure.\n- You are responsible for activity under your account.\n- We may suspend abusive, fraudulent, or illegal use.\n\n## Orders\n\n- Prices, taxes, and shipping are confirmed at checkout.\n- Orders may be refused or cancelled in cases of fraud, stock issues, or payment failure.\n\n## Returns and support\n\nPlease review our shipping, returns, and privacy pages for the latest policies.\n\n## Contact\n\nContact us through the support page for any account or order issue.","sv":"# Användarvillkor\n\nGenom att skapa ett konto godkänner du att använda butiken lagligt och att lämna korrekt kontoinformation.\n\n## Konton\n\n- Skydda dina inloggningsuppgifter.\n- Du ansvarar för aktivitet på ditt konto.\n- Vi kan stänga av missbruk, bedrägeri eller olaglig användning.\n\n## Beställningar\n\n- Priser, skatter och frakt bekräftas i kassan.\n- Beställningar kan nekas eller avbrytas vid bedrägeri, lagersaldo eller betalningsproblem.\n\n## Returer och support\n\nSe våra sidor för frakt, returer och integritet för aktuella villkor.\n\n## Kontakt\n\nKontakta oss via supportsidan vid frågor om konto eller beställning.","fi":"# Käyttöehdot\n\nLuomalla tilin hyväksyt tämän kaupan laillisen käytön ja oikeiden tietojen antamisen.\n\n## Tilit\n\n- Suojaa kirjautumistietosi.\n- Vastaat tililläsi tapahtuvasta toiminnasta.\n- Voimme keskeyttää väärinkäytön, petoksen tai laittoman käytön.\n\n## Tilaukset\n\n- Hinnat, verot ja toimitus vahvistetaan kassalla.\n- Tilaukset voidaan hylätä tai perua petoksen, varastosaldon tai maksuhäiriöiden vuoksi.\n\n## Palautukset ja tuki\n\nKatso ajantasaiset ehdot toimitus-, palautus- ja tietosuojasivuilta.\n\n## Yhteys\n\nOta yhteyttä tukisivun kautta tili- tai tilausasioissa.","da":"# Vilkår\n\nVed at oprette en konto accepterer du at bruge butikken lovligt og at give korrekte kontooplysninger.\n\n## Konti\n\n- Beskyt dine loginoplysninger.\n- Du er ansvarlig for aktivitet på din konto.\n- Vi kan suspendere misbrug, svindel eller ulovlig brug.\n\n## Ordrer\n\n- Priser, skatter og fragt bekræftes ved checkout.\n- Ordrer kan afvises eller annulleres ved svindel, lagerproblemer eller betalingsfejl.\n\n## Returnering og support\n\nSe vores sider om fragt, returnering og privatliv for de nyeste vilkår.\n\n## Kontakt\n\nKontakt os via supportsiden ved spørgsmål om konto eller ordre."}'::jsonb,
  timezone('utc'::text, now())
where not exists (
  select 1 from public.pages where slug = 'terms-of-service'
);

insert into public.pages (id, title, slug, content, updated_at)
select
  uuid_generate_v4(),
  '{"en":"Cookie Policy","sv":"Cookiepolicy","fi":"Evästekäytäntö","da":"Cookiepolitik"}'::jsonb,
  'cookie-policy',
  '{"en":"# Cookie Policy\n\nWe use essential cookies to keep the store secure and functional.\n\n## Optional analytics cookies\n\nWith your permission, we use analytics tools such as PostHog and Microsoft Clarity to understand how visitors use the store and improve the experience.\n\n## Your choices\n\n- You can accept or reject optional analytics cookies.\n- You can reopen cookie preferences from the footer at any time.\n- You can unsubscribe from marketing emails using the unsubscribe page or the link in each email.\n\n## Contact\n\nIf you have privacy questions, please review our privacy policy or contact support.","sv":"# Cookiepolicy\n\nVi använder nödvändiga cookies för att hålla butiken säker och fungerande.\n\n## Valfria analyscookies\n\nMed ditt samtycke använder vi analystjänster som PostHog och Microsoft Clarity för att förstå hur besökare använder butiken och förbättra upplevelsen.\n\n## Dina val\n\n- Du kan acceptera eller neka valfria analyscookies.\n- Du kan öppna cookieinställningar igen från sidfoten när som helst.\n- Du kan avsluta prenumerationen på marknadsföringsmejl via avregistreringssidan eller länken i varje mejl.\n\n## Kontakt\n\nOm du har frågor om integritet, läs vår integritetspolicy eller kontakta support.","fi":"# Evästekäytäntö\n\nKäytämme välttämättömiä evästeitä pitääksemme kaupan turvallisena ja toimivana.\n\n## Valinnaiset analytiikkaevästeet\n\nSuostumuksellasi käytämme analytiikkatyökaluja, kuten PostHogia ja Microsoft Claritya, ymmärtääksemme käyttöä ja parantaaksemme kokemusta.\n\n## Valintasi\n\n- Voit hyväksyä tai hylätä valinnaiset analytiikkaevästeet.\n- Voit avata evästeasetukset uudelleen alatunnisteesta milloin tahansa.\n- Voit perua markkinointiviestit peruutussivulta tai jokaisen viestin linkistä.\n\n## Yhteys\n\nJos sinulla on tietosuojaan liittyviä kysymyksiä, lue tietosuojasivu tai ota yhteyttä tukeen.","da":"# Cookiepolitik\n\nVi bruger nødvendige cookies for at holde butikken sikker og funktionel.\n\n## Valgfrie analysecookies\n\nMed dit samtykke bruger vi analysetjenester som PostHog og Microsoft Clarity til at forstå brugen og forbedre oplevelsen.\n\n## Dine valg\n\n- Du kan acceptere eller afvise valgfrie analysecookies.\n- Du kan genåbne cookieindstillinger fra footeren når som helst.\n- Du kan afmelde markedsføringsmails via afmeldingssiden eller linket i hver mail.\n\n## Kontakt\n\nHvis du har spørgsmål om privatliv, så læs vores privatlivspolitik eller kontakt support."}'::jsonb,
  timezone('utc'::text, now())
where not exists (
  select 1 from public.pages where slug = 'cookie-policy'
);
