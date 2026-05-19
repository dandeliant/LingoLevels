# LingoLevels AI Worker — instrukcja wdrożenia

Ten Worker stoi pomiędzy frontendem (na GitHub Pages) a Gemini 1.5 Flash.
Trzyma klucz API jako sekret, dodaje CORS, opcjonalnie pobiera tekst z URL-a.
Hostowanie jest **darmowe** w limitach: 100 000 requestów/dzień (Cloudflare)
+ 1 500 requestów/dzień (Gemini Free tier).

## 1. Klucz Gemini (2 min)

1. Wejdź na <https://aistudio.google.com/apikey>
2. **Get API key** → **Create API key in new project**
3. Skopiuj klucz — będzie potrzebny za chwilę.

## 2. Konto Cloudflare i Wrangler (3 min)

1. Załóż darmowe konto na <https://dash.cloudflare.com/sign-up> (jeśli nie masz)
2. Zainstaluj Wrangler:
   ```bash
   npm install -g wrangler
   ```
   (jeśli nie masz `npm` — pobierz Node.js z <https://nodejs.org/>)
3. Zaloguj:
   ```bash
   wrangler login
   ```
   Otworzy się przeglądarka, zatwierdź autoryzację.

## 3. Wdrożenie Worker'a (1 min)

W katalogu `worker/` tego repo:

```bash
cd worker
wrangler secret put GEMINI_API_KEY
```

Wklej skopiowany klucz Gemini gdy zapyta. Następnie:

```bash
wrangler deploy
```

Po chwili dostaniesz adres w stylu:
```
https://lingolevels-ai.<TWOJ-LOGIN>.workers.dev
```

## 4. Podłącz do frontendu (30 sek)

1. Otwórz <https://dandeliant.github.io/LingoLevels/>
2. Zakładka **Admin → Settings**
3. Pole **Worker URL** → wklej adres z kroku 3
4. **Save**

Gotowe. Teraz w **Admin → AI Import** możesz wkleić dowolny tekst lub URL
i Gemini wygeneruje 6 wersji CEFR + polskie tłumaczenia + słówka.

## Diagnostyka

- **„Worker URL not configured"** → wróć do kroku 4
- **CORS error** → sprawdź czy adres Worker'a w Admin jest dokładnie taki jak
  zwrócony przez `wrangler deploy` (z `https://`, bez końcowego `/`)
- **„Failed to fetch URL"** → strona blokuje boty lub jest paywalled; wklej
  tekst bezpośrednio zamiast URL-a
- **„Gemini error: Quota exceeded"** → wyczerpałeś dzienny limit 1500
  requestów. Reset o północy UTC.
- **Logi**: `wrangler tail` (na żywo) lub w panelu Cloudflare → Workers →
  twój worker → Logs

## Aktualizacja Worker'a

Po edycji `index.js`:
```bash
wrangler deploy
```

Wdraża się w ~5 sekund, bez przerwy w działaniu.

## Bezpieczeństwo

- `GEMINI_API_KEY` jest sekretem w Cloudflare — nigdy nie trafia do
  przeglądarki użytkownika.
- CORS jest ograniczony do `dandeliant.github.io`, localhost, i `file://`.
  Inne domeny dostają błąd przy `OPTIONS` preflight.
- Jeśli ktoś będzie nadużywał Worker'a, możesz dorzucić rate limiting przez
  Cloudflare KV — patrz dokumentacja CF Workers.
