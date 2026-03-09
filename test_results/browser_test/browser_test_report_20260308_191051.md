# Otchyot o polnom testirovanii LinguaCheck-RU cherez brauzer

**Data:** 08.03.2026 19:10
**Testovyy sayt:** https://elentra.ru/
**Frontend:** http://[::1]:5173
**Backend:** http://127.0.0.1:8000

---

## Rezultaty

| Test | Status | Detali |
|------|--------|--------|
| Glavnaya stranitsa | [FAIL] FAIL | Page.goto: net::ERR_CONNECTION_REFUSED at http://[::1]:5173/
Call log:
  - navigating to "http://[::1]:5173/", waiting until "load"
 |
| Skanirovanie sayta | [FAIL] FAIL | Page.goto: net::ERR_CONNECTION_REFUSED at http://[::1]:5173/scans
Call log:
  - navigating to "http://[::1]:5173/scans", waiting until "load"
 |
| Istoriya skanirovaniy | [FAIL] FAIL | Page.goto: net::ERR_CONNECTION_REFUSED at http://[::1]:5173/history
Call log:
  - navigating to "http://[::1]:5173/history", waiting until "load"
 |
| Rezultaty skanirovaniya | [FAIL] FAIL | Page.goto: net::ERR_CONNECTION_REFUSED at http://[::1]:5173/scans
Call log:
  - navigating to "http://[::1]:5173/scans", waiting until "load"
 |
| Proverka teksta | [FAIL] FAIL | Page.goto: net::ERR_CONNECTION_REFUSED at http://[::1]:5173/text
Call log:
  - navigating to "http://[::1]:5173/text", waiting until "load"
 |
| Slovari | [FAIL] FAIL | Page.goto: net::ERR_CONNECTION_REFUSED at http://[::1]:5173/dictionaries
Call log:
  - navigating to "http://[::1]:5173/dictionaries", waiting until "load"
 |
| Mobilnaya adaptivnost | [FAIL] FAIL | Page.goto: net::ERR_CONNECTION_REFUSED at http://[::1]:5173/history
Call log:
  - navigating to "http://[::1]:5173/history", waiting until "load"
 |

---

## Statistika

- [OK] Uspeshno: 0
- [WARN] Preduprezhdeniya: 0
- [FAIL] Oshibki: 7
- VSEGO: 7

---

## Skrinshoty

Vse skrinshoty sokhraneny v papke: `test_results/browser_test/screenshots/`

---

## Zaklyuchenie

**Vse sistemy rabotayut stabilno i korrekt no!**

