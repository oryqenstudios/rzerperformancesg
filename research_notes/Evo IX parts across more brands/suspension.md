# Suspension for the Lancer Evolution IX (CT9A): coilovers (Tein, HKS Hipermax, Öhlins Road & Track, KW, Cusco, Blitz ZZ-R, Zeal/Endless Function, BC Racing), sway bars, arms and bushings (Whiteline, Cusco, Hardrace, Ikeya Formula), strut braces (Cusco, Ultra Racing)

Scope and method notes (read first):
- Checked in late November 2026. Most data comes straight from the makers' own catalogues: Tein's CT9A search data, Cusco's CT9A parts search, Blitz's parts navigator, Öhlins Europe, Hardrace USA's store and Ultra Racing Malaysia's store. Retailers fill the gaps for KW, BC Racing, Öhlins pricing and Singapore prices.
- **HKS Hipermax** and **Zeal / ENDLESS Function** were covered earlier. See `research_notes/Tomei and HKS Evo IX parts/hks_exhaust_chassis.md` (Q2, Q4) and `endless.md` (section H). Below they are summed up only so the tables are complete. The one new thing added is that no Singapore listing was found for either.
- **Singapore distribution and LTA rules** are covered in full in the sibling file `singapore_sourcing_lta.md`. The parts that matter for suspension are repeated in Q5 with their sources.
- **Tool limits during this run:**
  - The web-search budget for the session ran out partway through, so later items were checked only on the makers' own sites.
  - These hosts could not be reached or were blocked: `store.kwsuspensions.com` (DNS); Whiteline product pages (Cloudflare 403 after a few requests; one search page loaded); `hardrace.com.tw` and `ultraracing.com.my` (unreachable; `hardraceusa.com` and `ultraracing.my` used instead); `ikeya-formula.com` (unreachable; `ikeya-f.co.jp` used).
  - The WebFetch tool could not resolve most hosts, so pages were read with curl.
- **Photo checks:** every photo URL marked "verified" returned HTTP 200 with an `image/*` content type from `curl -sIL`. I then downloaded it to a scratch folder outside the repository, checked its size and looked at it. No images were saved in the repository.

---

## Q1. Coilovers: exact Evo IX models, part numbers, damper type, adjustment, spring rates, ride-height range, top mounts, look, status

### Takeaway
Every brand on the list still sells a current CT9A kit, except where noted:
- **Tein:** FLEX Z, MONO SPORT, MONO RACING, SUPER RACING, STREET ADVANCE Z; STREET BASIS Z outside Japan only
- **HKS:** HIPERMAX S and R
- **Öhlins:** Road & Track MIS MI01S2
- **KW:** V1, V3, V3/V4 Clubsport
- **Cusco:** Street ZERO / ZERO A; SPORT S / R / X
- **Blitz:** ZZ-R 92766
- **ENDLESS:** FUNCTION-PS/SC/TC/.COM, sold abroad as Zeal
- **BC Racing:** BR B-08-BR

Through the spokes they look very different:
- Tein: all green
- HKS: white springs on black bodies
- Öhlins: yellow springs with gold parts
- KW: yellow springs, purple collars, stainless bodies
- BC Racing: black springs with gold plates and collars
- Blitz: black springs with red mounts and collars
- Zeal Function X Plus: yellow springs on a blue body

Typical street drops are about 30–55 mm front and 15–35 mm rear. The maximum adjustable range reaches about −80 to −110 mm front on some kits.

### Cited Findings

#### Tein (official CT9A search data from tein.co.jp)
Tein's CT9A search page carries a JSON block (`COIL_DATA`) with every Evo IX kit. Its fields:
- `基準車高純正比`: standard ride height vs stock
- an adjustable range, with the recommended range in brackets
- spring rates and free lengths
- upper mounts
- price

[Tein CT9A search](https://www.tein.co.jp/srch/jps_search.php?maker=&carmodel=&modelyear=&item=&restype=1&allvch=1&genuine=&srchfrwd=CT9A&partno=&tuvchk=undefined)

| Tein model | Evo IX part no. | Fitment rows (market) | Damper | Damping adj. | Springs F / R (N/mm, kgf/mm, free length) | Std height vs stock F / R; adjustable range (recommended) | Upper mounts F / R | Price (JPY, Tein data) |
|---|---|---|---|---|---|---|---|---|
| **FLEX Z** | **VSR84-C1SS4** | JPN 2005.03–2006.12 GSR/RS/GT; GBR 2006–07 GSR/RS; USA 2006–07 and 2007 MR | Twin-tube, full-length adjustable, sealed (non-rebuildable, "replacement service") | 16 steps, rebound and compression together | 98.1 (10.0) 200 mm / 78.5 (8.0) 200 mm | JPN: F −40, range −97 to −10 (−50 to −30); R −20, range −68 to +22 (−30 to −10) | Camber-adjustable (pillow ball) / rubber | ¥156,750 |
| **MONO SPORT** | **GSR52-71SS4** | JPN 2005.03–2006.12; GBR, USA 2006–07, 2007 MR | Monotube; strut type uses Tein's upright "Strong Tube" | 16 steps, together, plus ADVANCE M.S.V. | 117.7 (12.0) 175 / 98.1 (10.0) 175 | JPN: F −40, −112 to −15 (−50 to −30); R −20, −88 to +26 (−30 to −10) | Camber-adjustable / rubber | ¥239,800 |
| **MONO RACING** | **VSR52-K1LS4** | JPN, GBR, USA as above | Monotube, upright Strong Tube | 16 steps, together | 156.9 (16.0) 175 / 137.3 (14.0) 175; F 14/16/18K or R 12/14/16K free of charge | JPN: F −50, −84 to −16 (−60 to −40); R −30, −67 to −4 (−40 to −20) | Camber **and caster** adjustable pillow (camber stepless, caster 4 steps) / rubber; plus camber collars at the lower bracket | ¥264,880 |
| **SUPER RACING** | **DSR84-81LS1** | JPN 2005.03–2006.12; USA 2006–07, 2007 MR | Monotube, inverted on struts, separate reservoir | 16 × 16 (rebound and compression separate) | 137.3 (14.0) 175 / 117.7 (12.0) 175; **main springs sold separately** | F −55, −91 to −30 (−65 to −45); R −35, −70 to −10 (−45 to −25). Tein: "circuit recommendation; may not meet safety standards" | Camber and caster adjustable / pillow | ¥413,600 |
| **STREET ADVANCE Z** | **GSR52-91SS2** | JPN 2005.03–2006.12; GBR 2006–07 | Twin-tube, sealed, threaded-collar adjustment (not full-length) | Adjustable (step count not captured) | 58.8 (6.0) 250 / 58.8 (6.0) 225 | F −40, −67 to −28 (−50 to −30); R −15, −59 to +3 (−25 to −5) | Stock mounts / stock | ¥112,200 |
| **STREET BASIS Z** | **GSR52-8USS2** | GBR, USA only (no Japanese price) | Twin-tube, sealed | Fixed damping | 68.6 (7.0) 225 / 58.8 (6.0) 225 | F −50, −80 to −29 (−60 to −40); R −25, −55 to −15 (−35 to −15). Rear seat lowered fully may touch the arm | Stock / stock | not sold in JP |

- **Specs** come from the Tein data above. Tube type, step counts and mounts come from the series pages:
  - FLEX Z ("複筒式", 16-step adjustment, mounts included, sealed construction) — [Tein FLEX Z](https://www.tein.co.jp/products/flex_z/); [Tein USA FLEX Z: "Twin-Tube Structure"](https://www.tein.com/products/flex_z/)
  - MONO SPORT (monotube, 16 steps, upright Strong Tube on struts) — [Tein MONO SPORT](https://www.tein.co.jp/products/mono_sport/); [Tein USA MONO SPORT](https://www.tein.com/products/mono_sport/)
  - MONO RACING (monotube, upright, camber/caster pillow mount, 16 steps) — [Tein MONO RACING](https://www.tein.co.jp/products/mono_racing/)
  - SUPER RACING (monotube, 16 × 16 separate adjustment, inverted on struts) — [Tein SUPER RACING](https://www.tein.co.jp/products/super_racing/)
  - STREET ADVANCE Z / BASIS Z (twin-tube, sealed, damping adjustable or fixed) — [Tein STREET ADVANCE Z / BASIS Z](https://www.tein.co.jp/products/street_advance_basis_z/)
- **Look:** Tein green throughout: green springs, green damper bodies and brackets, green camber plates, black dust boots. Seen on the FLEX Z banner and the MONO SPORT and FLEX Z kit photos. — [Tein FLEX Z main image](https://www.tein.co.jp/products/img/flz/img_flz_main.jpg); [MONO SPORT kit](https://www.tein.co.jp/products/img/mnsa/mnsa_products.jpg)
- **Status:** current. All six are live in Tein's search data with prices (Street Basis Z has no Japanese price) and are on Blackhawk Japan SG with SGD prices (Q5).

#### HKS Hipermax (summary; full detail in `hks_exhaust_chassis.md` Q2)
- **HIPERMAX S 80330-AM002** (rubber mounts, ¥273,900) and **80330-AM002P** (front pillow ball, ¥297,000):
  - single-tube, inverted on struts, 30 steps
  - springs 78 / 59 N/mm (8 / 6 kgf/mm)
  - height F −34 (−8 to −59), R −16 (−5 to −71) mm
- **HIPERMAX R 80310-AM002** (¥338,800):
  - pillow ball F and R, 30 steps
  - springs 137 / 137 N/mm (14 / 14)
  - height F −43 (0 to −75), R −25 (−1 to −49)
- **Discontinued:** 80300-AM002P (the S up to 2025), MAX IV GT 80230-AM002, MAX IV SP 80250-AM002.
- **Look:** black bodies, white springs; S has grey brackets with yellow accents, R has dark brackets with red accents.

Sources: [HKS HIPERMAX table, Mitsubishi](https://www.hks-power.co.jp/en/product_search/product/433/maker/5); [HKS DB 36937](https://www.hks-power.co.jp/en/product_db/hipermax/db/36937); [HKS DB 31799](https://www.hks-power.co.jp/en/product_db/hipermax/db/31799) (from earlier notes; not re-fetched).

#### Öhlins Road & Track
- **Part number MIS MI01S2.** RZ Crew Garage sells "Öhlins – Road & Track DFV Coilover Kit – Mitsubishi Lancer Evolution CT9A Evo 7/8/9", SKU MIS MI01S2, fitting Evo VII 2001–02, VIII 2003–05 and IX 2005–07. — [RZ Crew MIS MI01S2](https://rzcrewgarage.com/products/ohlins-europe-road-track-dfv-coilover-kit-mitsubishi-lancer-evolution-ct9a-evo-7-8-9-mis-mi01s2)
- **Öhlins's own page for the shock kit.** Öhlins Europe's Evo 4–6 package is "MIS MI01S2 + MIZ MI00". In other words, the CT9A kit MIS MI01S2 plus an adaption kit for the older car. Its listed features:
  - DFV (Dual Flow Valve), separate height adjustment, rebuildable, ISO 9227 salt-spray tested, 2-year warranty
  - **front:** McPherson strut upside down; compression and rebound on one adjuster; preload adjuster; **approx. 20–50 mm lower than standard; spring rate 100 N/mm**; aluminium top mounts with adjustable camber
  - **rear:** conventional shock; **approx. 15–45 mm lower; 80 N/mm**; aluminium top mounts
  - price €3,282.51 incl. 19% VAT, "Not in stock"

  — [Öhlins Europe, Evo 4–6 (MIS MI01S2 + MIZ MI00)](https://www.ohlins.eu/en/products/packages/mitsubishi-lancer-evo-4-6--64/)
- **RZ Crew's spec for MIS MI01S2:**
  - front: pillow ball with camber plates, default −35 mm, range −20 to −50 mm, 10 kg
  - rear: aluminium top mount, −30 mm, −15 to −45 mm, 8 kg
  - single adjuster with "32 settings"

  — [RZ Crew MIS MI01S2](https://rzcrewgarage.com/products/ohlins-europe-road-track-dfv-coilover-kit-mitsubishi-lancer-evolution-ct9a-evo-7-8-9-mis-mi01s2)
- **Conflicting retailer copy.** Bulletproof lists MIS Mi01S1 (older suffix) at US$2,900 (was $3,093.50), special order. It claims 90 N/mm front and rear, "34 clicks", about 15 mm drop at OE settings, and pillow (spherical) mounts at the rear. These figures disagree with Öhlins's own 100/80 N/mm and RZ Crew's aluminium rear mount. — [Bulletproof Automotive](https://bulletproofautomotive.com/product/ohlins-dfv-road-track-coilovers-for-mitsubishi-evo-vii-viii-ix-mismi01s1/)
- **Status:** Öhlins's model finder still lists "Lancer Evolution 7-9 (CT0)" under Mitsubishi. — [Öhlins product finder](https://www.ohlins.eu/en/products/automotive/product-finder/?Brand=Mitsubishi). But the dedicated Evo 7–9 package URL now redirects to the general product list. — [old Öhlins Evo 7–9 package URL](https://www.ohlins.eu/de/products/packages/mitsubishi-lancer-evo-7-9--81/)
- **Look** (Öhlins sample images and a close-up), as listed below. — [Öhlins MIS MI00/MI01 front sample](https://www.ohlins.eu/images/db/previews/img-00000341.jpg); [Öhlins rear](https://www.ohlins.eu/images/db/previews/img-00001610.jpg); [Bulletproof close-up](https://bulletproofautomotive.com/wp-content/uploads/2021/12/2001-2007-Mitsubishi-EVO-7-9-Ohlins-DFV-Road-Track-Coilovers-Image-3-960x1000.jpg)
  - **yellow** springs with "ÖHLINS" lettering
  - black bump stops and boot
  - silver-grey front strut tube with a cast aluminium knuckle bracket
  - **gold-anodised** rear damper body, adjuster collars and top-mount plates

#### KW (Germany)
| Kit | Part no. | What it is | Price seen |
|---|---|---|---|
| V1 | **10265006** | "Inox-line" stainless struts, fixed damping (tuned by KW) | US$2,254 at JD Customs (titled "Evo 8/9") — [JD Customs V1](https://jdcustomsusa.com/products/kw-coilover-kit-v1-mitsubishi-lancer-ct9a-evo-7-evo-8-evo-9) |
| V3 | **35265006** | Inox-line; separately adjustable rebound and compression (TVR-A/TVC-A) | US$3,699 at UroTuning (in stock) — [UroTuning V3](https://www.urotuning.com/products/kw-suspensions-kw-v3-coilover-kit-mitsubishi-lancer-ct9a-evo-7-evo-8-evo-9); US$3,794 at JD Customs, "01-07 Mitsubishi Lancer (CT9A) EVO 7, EVO 8, EVO 9" — [JD Customs V3](https://jdcustomsusa.com/products/kw-coilover-kit-v3-mitsubishi-lancer-ct9a-evo-7-evo-8-evo-9); CAD 5,312 — [Lowriders.ca](https://www.lowriders.ca/i-18952266-35265006-kw-v3-coilover-kit-mitsubishi-lancer-ct9a-evo-7-evo-8-evo-9.html) |
| V3 Clubsport | **35265806** | track kit | search-result title only — [FRSport listing (title)](https://frsport.com/products/kw-v3-clubsport-kit-35265806) |
| V4 Clubsport | **39765206** | 3-way; low-speed compression 6 clicks (purple dial), high-speed compression 14 clicks (gold wheel) | US$7,499 at UroTuning — [UroTuning V4 Clubsport](https://www.urotuning.com/products/kw-suspensions-kw-v4-clubsport-kit-mitsubishi-lancer-ct9a-evo-7-evo-8-evo-9) |

- **Look:** KW's standard look: polished stainless bodies, **yellow** springs, **purple/violet** spring perches and adjuster collars. Note that UroTuning's 35265006 image looks like KW's generic V3 picture, not a CT9A-specific one. — [UroTuning 35265006 image](https://cdn.shopify.com/s/files/1/0005/7773/2663/products/35265006_001.jpg?v=1675575769)
- **Status:** all are listed and orderable at US retailers. KW's own store could not be reached.

#### Cusco (official CT9A coilover table, cusco.co.jp)
Cusco's own search for the "Lancer Evolution 9, CT9A, 2005-03–2006-07" gives the rows below. Prices are tax-inclusive, with the ex-tax price in brackets. — [Cusco CT9A coilover kits](https://www.cusco.co.jp/search/en/index/detail/?make=MITSUBISHI&car=Lancer+Evolution+9&chassis=CT9A&impreza=&category=suskit)

| Cusco model | Part no. | Price | Upper mount F / R (Cusco code) | Damping | Recommended range F / R (mm); max range | Default height F / R | Springs F / R (kgf/mm; options) |
|---|---|---|---|---|---|---|---|
| street ZERO (red) | **564 61P CN** | ¥173,800 (¥158,000) | PAJ / ARG | none listed ("–") | −70 to −30 / −55 to 0; max −80 to 0 / −86 to 0 | −55 / −30 | 7 (8/9/10) / 5 (6/7/8) |
| street ZERO A (red) | **564 61N CN** | ¥198,000 (¥180,000) | PAJ / ARG | **40 steps** F and R; e-con2 compatible (00B 60J 1014) | −70 to −30 / −65 to 0; max −80 to 0 / −80 to 0 | −55 / −30 | 7 (8/9/10) / 5 (6/7/8) |
| SPORT S | **564 64S CN** | ¥272,800 (¥248,000) | PAJ / ARG | 24 steps | −60 to 0 / −70 to 0 | −55 / −30 | 8 (6/7/9/10/11/12) / 5 (6–11) |
| SPORT R | **564 64R CP** | ¥294,800 (¥268,000) | PAJ / **PRG** | 24 steps | −70 to 0 / −50 to 0 | −50 / −30 | 12 (9/10/11/14/16) / 11 (8/9/10/12/14) |
| SPORT X | **564 64X CP** | ¥580,800 (¥528,000) | PAJ / PRG | 24 steps, 3-way, reservoir | −70 to 0 / −50 to 0 | −50 / −30 | as SPORT R |
| SPORT G | 564 64C SB0 (gymkhana) / 564 64C LB0 (rally, dirt) | ¥272,800 / ¥294,800 | – | 24 steps | competition only | – | – |

- On the Street ZERO and ZERO A, front and rear pillow-ball upper mounts are an option at +¥20,000. — same source
- **Damper type:**
  - Street ZERO: twin-tube, low-pressure gas; front-strut models get a camber-adjustable pillow upper mount; φ22 piston rod — [Cusco street ZERO](https://www.cusco.co.jp/catalog/new_streetzero_red.html)
  - Street ZERO A: 40-step, top of the street series, camber-adjustable pillow upper on front struts — [Cusco street ZERO A](https://www.cusco.co.jp/catalog/new_streetzeroa_red.html)
  - SPORT S / R: **monotube, "ram" (inverted) shock, 24-step**; optional CC pillow upper mount with separate camber and caster adjustment for some strut cars — [Cusco SPORT S](https://www.cusco.co.jp/catalog/cusco_sport_s.html); [Cusco SPORT R](https://www.cusco.co.jp/catalog/cusco_sport_r.html)
- **Status:** all rows are live with a stock-check link. Blackhawk Japan SG lists Street ZERO, SPORT S and SPORT R with SGD prices (Q5).

#### Blitz DAMPER ZZ-R (official parts navigator)
- **92766**, "LANCER EVO IX, 2005/03–2007/10, CT9A, 4G63". Blitz parts navigator (Mitsubishi, DAMPER ZZ-R): — [Blitz parts navigator](https://partsnavi.blitz.co.jp/products/search/search_products/list.php?category_id=1&maker_id=5)
  - mounts: front adjustable pillow ball, rear reinforced rubber
  - springs: 7.0 / 8.0 kgf/mm, free length 200 / 220 mm, straight
  - **height range F −80 to 0, R −50 to +10 mm**
  - recommended damping setting 16 / 16; rear dial at position "A", with a 100 mm extension dial supplied
  - **¥211,200 (¥192,000)**
  - remark: the pillow mounts make damper noise easier to hear
- **ZZ-R + DSC Plus full set 98766**, ¥321,200 (¥292,000). Fitting the rear motor needs interior trim work or removal. — same source
- **Series specs:** **monotube**, full-length adjustable, **32-step** damping front and rear, φ44 piston, SAE9245 springs, black-chrome-plated STKM13C cylinder, forged aluminium spring seats, black-anodised brackets, camber-adjustable pillow upper on front struts. — [Blitz DAMPER ZZ-R](https://www.blitz.co.jp/products/suspension/damper_zz-r.html)
- **Look:** **black springs** printed "BLITZ", black bodies, **red anodised pillow top mounts and red lock collars**. The white-background kit photo shows red mounts at all four corners, which suggests a generic image, since the CT9A rear uses rubber. — [Blitz ZZ-R slide](https://www.blitz.co.jp/wp-content/themes/blitz/images/damper_zz-r/slide1.jpg); [Blackhawk SG 92766 photo](https://cdn.shopify.com/s/files/1/0644/3486/4197/files/92766_3b60696c-9e5f-4768-919a-0241736a89db.jpg?v=1742330021)

#### Zeal / ENDLESS Function (summary; full detail in `endless.md` section H)
- **Japan (ENDLESS):**
  - FUNCTION-PS **ZS603PS2** ¥393,800: X COILS PLUS springs, F 8 / R 5 kgf/mm, reinforced rubber mounts
  - FUNCTION-SC **ZS603SC2** ¥368,500: F 8 / R 5, rubber mounts
  - FUNCTION-TC **ZS603TC2** ¥412,500: F 12 / R 10 with helpers, fixed spherical mounts
  - FUNCTION .COM **ZS603COMR** ¥429,000: spec to order
- **UK (J-PN, "Zeal"):** Function X Plus ZS603XPS / ZS604XPS, Function.Com, Super Function Racing; special order, lead time up to 5 months.
- **Look:** Function X Plus: **blue body, yellow springs**. Super Function: dark body, **red springs**.

Sources: [Blackhawk Japan ZS603PS2](https://blackhawkjapan.com/products/endless-endless-function-ps-suspension-kit-for-mitsubishi-lancer-evolution-ct9a-7-8-9-zs603ps2); [Endless USA FUNCTION X plus](https://endlessusa.com/products/suspension-road-car/function-x-plus) (from earlier notes; not re-fetched).

#### BC Racing BR series
- **B-08-BR**, "2002–2007 Mitsubishi Evo VII / VIII / IX". MAPerformance's listing gives: — [MAPerformance B-08-BR](https://www.maperformance.com/products/mitsubishi-evo-vii-viii-ix-evo-7-9-br-series-coilovers-by-bc-racing)
  - variants: rubber rear **BC-B-08-BR-RA** US$1,070 (was $1,195); pillowball rear **BC-B-08-BR-RH** US$1,305
  - monotube; **30 clicks**, compression and rebound together
  - front top mount: camber plate
  - **springs F 7 kg, R 5.5 kg**
  - "Product photos are generic"
- **Series:** monotube, height adjustable independently of spring preload, 30 clicks, custom springs and valving available. — [BC Racing NA, BR Series](https://bcracing-na.com/series/br-series/)
- **Look** (generic BR photos): **black springs, black bodies, gold/champagne zinc camber plates and lock rings**. — [MAPerformance image](https://cdn.shopify.com/s/files/1/0890/6136/products/bc-racing-11980815106118.jpg?v=1752533574); [BC Racing BR hero](https://bcracing-na.com/wp-content/uploads/2019/09/bc-racing-br-series-hero.jpg)
- **Status:** current and orderable.

#### Summary table: coilovers (one row per configurator-worthy kit)
| Brand | Model | Evo IX part no. | Damper / adjustment | Drop vs stock (F / R, default; range) | Mounts F / R | Look | Status | Photo (verified) | Page | Price | Singapore |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Tein | FLEX Z | VSR84-C1SS4 | twin-tube, 16 steps | −40 / −20; −97…−10 / −68…+22 | camber pillow / rubber | all green | current | [kit, dark bg, 400×265](https://www.tein.com/products/img/flz/flz_products.jpg) | [Tein](https://www.tein.co.jp/products/flex_z/) | ¥156,750 | Blackhawk SG S$1,133.55 |
| Tein | MONO SPORT | GSR52-71SS4 | monotube, 16 | −40 / −20; −112…−15 / −88…+26 | camber pillow / rubber | green | current | [kit, dark bg, 400×267](https://www.tein.co.jp/products/img/mnsa/mnsa_products.jpg) | [Tein](https://www.tein.co.jp/products/mono_sport/) | ¥239,800 | S$1,790.91 |
| Tein | MONO RACING | VSR52-K1LS4 | monotube, 16 | −50 / −30; −84…−16 / −67…−4 | camber + caster pillow / rubber | green | current | banner only ([img_mrc_main](https://www.tein.com/products/img/mrc/img_mrc_main.jpg), car photo) | [Tein](https://www.tein.co.jp/products/mono_racing/) | ¥264,880 | S$1,978.02 |
| Tein | SUPER RACING | DSR84-81LS1 | monotube, inverted, 16×16, reservoir | −55 / −35; −91…−30 / −70…−10 (circuit) | camber + caster / pillow | green | current | [labelled diagram, white, 300×420](https://www.tein.co.jp/products/photo/src_spec.jpg) | [Tein](https://www.tein.co.jp/products/super_racing/) | ¥413,600 (springs extra) | S$3,088.80 |
| Tein | STREET ADVANCE Z | GSR52-91SS2 | twin-tube, adjustable | −40 / −15; −67…−28 / −59…+3 | stock | green | current | banner ([img_staz_stbz_main](https://www.tein.co.jp/products/img/staz_stbz/img_staz_stbz_main.jpg), 750×250) | [Tein](https://www.tein.co.jp/products/street_advance_basis_z/) | ¥112,200 | S$837.54 |
| HKS | HIPERMAX S | 80330-AM002 / -AM002P | monotube inverted, 30 | −34 / −16; −8…−59 / −5…−71 | rubber (P: front pillow) | black body, white springs, grey brackets, yellow | current | see earlier notes | [HKS DB 36937](https://www.hks-power.co.jp/en/product_db/hipermax/db/36937) | ¥273,900 / ¥297,000 | Garage R (HKS distributor; earlier notes) |
| HKS | HIPERMAX R | 80310-AM002 | 30 steps | −43 / −25; 0…−75 / −1…−49 | pillow / pillow | black, white springs, red | current | see earlier notes | [HKS DB 31799](https://www.hks-power.co.jp/en/product_db/hipermax/db/31799) | ¥338,800 | as above |
| Öhlins | Road & Track DFV | MIS MI01S2 | DFV, single adjuster, inverted front | −35 / −30; −20…−50 / −15…−45 | alu camber top / alu top | yellow springs, gold | current (EU page moved) | [Öhlins sample, white, 300×181](https://www.ohlins.eu/images/db/previews/img-00000341.jpg); [RZ Crew, 681×451](https://cdn.shopify.com/s/files/1/2343/5009/files/Ohlins-Europe-Mitsubishi-Lancer-Evolution-7-8-9-MIS-MI01_8d7beed0-9bb2-4281-9158-df50676125a4.jpg?v=1731288921) | [RZ Crew](https://rzcrewgarage.com/products/ohlins-europe-road-track-dfv-coilover-kit-mitsubishi-lancer-evolution-ct9a-evo-7-8-9-mis-mi01s2) | €3,282.51 (EU, Evo 4–6 pkg); US$2,900 | RZ Crew S$3,712 |
| KW | V3 | 35265006 | separate rebound/compression | not found | not found | stainless, yellow springs, purple | current | [generic V3, white, 1600×1600](https://cdn.shopify.com/s/files/1/0005/7773/2663/products/35265006_001.jpg?v=1675575769) | [UroTuning](https://www.urotuning.com/products/kw-suspensions-kw-v3-coilover-kit-mitsubishi-lancer-ct9a-evo-7-evo-8-evo-9) | US$3,699 | regional (KW Malaysia) |
| KW | V1 / V4 Clubsport | 10265006 / 39765206 | fixed / 3-way | not found | not found | as above | current | – | [JD Customs V1](https://jdcustomsusa.com/products/kw-coilover-kit-v1-mitsubishi-lancer-ct9a-evo-7-evo-8-evo-9); [UroTuning V4](https://www.urotuning.com/products/kw-suspensions-kw-v4-clubsport-kit-mitsubishi-lancer-ct9a-evo-7-evo-8-evo-9) | US$2,254 / US$7,499 | regional |
| Cusco | street ZERO A | 564 61N CN | 40 steps | −55 / −30; rec −70…−30 / −65…0 | PAJ / ARG (+¥20k pillow option) | not confirmed (see Gaps) | current | none found | [Cusco search](https://www.cusco.co.jp/search/en/index/detail/?make=MITSUBISHI&car=Lancer+Evolution+9&chassis=CT9A&impreza=&category=suskit) | ¥198,000 | grey import |
| Cusco | SPORT S / R | 564 64S CN / 564 64R CP | monotube inverted, 24 | −55 / −30; −50 / −30 | PAJ / ARG; PAJ / PRG | blue body (small banner) | current | banners only (355×117) | [Cusco SPORT R](https://www.cusco.co.jp/catalog/cusco_sport_r.html) | ¥272,800 / ¥294,800 | Blackhawk SG S$1,852.29 / S$2,001.78 |
| Blitz | DAMPER ZZ-R | 92766 | monotube, 32 steps | range −80…0 / −50…+10 | camber pillow / rubber | black springs, red mounts and collars | current | [white bg, 2756×1837 (generic)](https://cdn.shopify.com/s/files/1/0644/3486/4197/files/92766_3b60696c-9e5f-4768-919a-0241736a89db.jpg?v=1742330021) | [Blitz](https://www.blitz.co.jp/products/suspension/damper_zz-r.html) | ¥211,200 | Blackhawk SG S$1,182.46 |
| ENDLESS / Zeal | FUNCTION-SC / PS / TC | ZS603SC2 / PS2 / TC2 | 20-step (Function X Plus) | not found | rubber / rubber; TC spherical | blue body, yellow springs | current (Zeal names legacy) | earlier notes | [Blackhawk Japan](https://blackhawkjapan.com/products/endless-endless-function-ps-suspension-kit-for-mitsubishi-lancer-evolution-ct9a-7-8-9-zs603ps2) | ¥368,500–412,500 | none found |
| BC Racing | BR | B-08-BR (-RA / -RH) | monotube, 30 clicks | not found | camber plate / rubber or pillow | black springs, gold plates | current | [generic, white, 500×375](https://cdn.shopify.com/s/files/1/0890/6136/products/bc-racing-11980815106118.jpg?v=1752533574) | [MAPerformance](https://www.maperformance.com/products/mitsubishi-evo-vii-viii-ix-evo-7-9-br-series-coilovers-by-bc-racing) | US$1,195 MSRP | Fong Kim (sole distributor) |

### Inferences
- **Japanese prices.** Tein's figures look tax-inclusive: each is 1.1 × a round number, for example ¥156,750 = 1.1 × ¥142,500 and ¥239,800 = 1.1 × ¥218,000. Cusco and Blitz state their tax-inclusive prices outright.
- **Ride-height slider.** Every kit's default or recommended street setting falls between about −30 and −55 mm front and −15 and −35 mm rear. A slider running from stock to about −50 mm front and −30 mm rear covers every brand's street setting. Deeper settings (Tein MONO SPORT's −112 mm front limit, Blitz's −80 mm) are possible, but tyres and LTA rules make them unrealistic (Q5).
- **Wheel close-up.** The visible colour through the spokes is what separates the brands:
  - **Tein:** green spring and green body
  - **Öhlins:** yellow spring on a silver strut, with a gold rear body
  - **KW:** yellow spring with purple collars on a polished body
  - **HKS:** white spring on a black body
  - **BC Racing:** black spring with gold collars
  - **Blitz:** black spring with red collars and top mount
  - **Zeal Function X Plus:** yellow spring on a blue body
  - **Cusco:** confirm from the parts; the Sport banner shows a blue body
- **Engine-bay view.** The coilover top mount shows on top of the front strut tower:
  - red on Blitz
  - gold on Öhlins and BC Racing
  - green on Tein (pillow models)
  - dark grey on HKS S-P
  - stock rubber on Tein Street Advance Z / Basis Z and on HKS S (rubber)
- **Öhlins figures.** Öhlins's own 100 / 80 N/mm and RZ Crew's 10 kg / 8 kg agree (100 N/mm ≈ 10.2 kgf/mm). The Bulletproof figures (90 / 90 N/mm, 34 clicks) are probably wrong or describe another variant.

### Gaps
- **KW:** no CT9A lowering range, spring rates or mount details. KW's own store (store.kwsuspensions.com) was unreachable and its main site is a JavaScript app; no official KW photo specific to the CT9A.
- **Cusco:**
  - The colour of the spring and body on the CT9A kits was not confirmed. "(red)" in Cusco's model names is the sports-model tuning, going by the title of Cusco's 2015 street list ("レッド：スポーツ系モデル"); it is not necessarily the colour.
  - No usable Cusco coilover product photo was found. The site loads its images by script; Blackhawk SG has only 355×117 banners.
  - The upper-mount codes PAJ / ARG / PRG are not explained on the page. My reading is pillow-ball camber-adjustable front, and rubber or pillow rear, consistent with Cusco's catalogue text.
- **Öhlins:** the click count is not confirmed (RZ Crew says 32 settings; Bulletproof says 34). Whether Öhlins Europe still stocks the CT9A kit: the package page now redirects, though the model finder still lists the car.
- **BC Racing:** no drop range was found; BC's site has no B-08 product page.
- **Tein:** the Street Advance Z step count was not captured. The Japanese data lists the Evo IX only up to 2006.12 (the IX MR, 2006.08–2007, appears only in the US rows).
- **Zeal / ENDLESS:** no drop range (also a gap in the earlier notes).
- **Price search:** the search budget ran out, so I didn't look for retailer prices beyond the ones above.

---

## Q2. Sway bars, arms and bushings for the Evo IX (Whiteline, Cusco, Hardrace, Ikeya Formula)

### Takeaway
- **Cusco** has the widest official CT9A list: front sway bars φ21 or φ25 (stock φ23), rear φ18 or φ23 with 3-way adjustment (stock φ22), pillow-ball bushes for every arm, pillow upper mounts and lower-arm bars. All in Cusco blue.
- **Hardrace** has blue adjustable rear toe arms, a silver forged rear camber kit, roll-centre adjusters and a full set of pillow or hardened-rubber bushings.
- **Whiteline:** its own site lists a front 26 mm bar, rear 24 or 26 mm 3-point adjustable bars, a front-and-rear bar kit, bump-steer and caster kits and a 24 mm bar bushing kit.
- **Ikeya Formula** lists no Mitsubishi products at all.

### Cited Findings

#### Cusco (official CT9A list)
All of the following come from one source. — [Cusco CT9A parts search](https://www.cusco.co.jp/search/en/index/detail/?make=MITSUBISHI&car=Lancer+Evolution+9&chassis=CT9A&impreza=&category=body); [Cusco CT9A coilover and bush table](https://www.cusco.co.jp/search/en/index/detail/?make=MITSUBISHI&car=Lancer+Evolution+9&chassis=CT9A&impreza=&category=suskit)

**Sway bars:**
- front **564 311 A21**: φ21, "64% compared to standard (standard φ23)", uses the stock bush and bracket, ¥39,600
- front **564 311 A25**: φ25, 123%, ¥40,700
- rear **560 311 BJ18**: φ18, 3-step 30/46/57% of standard φ22, with bush, "for Rally and Dirt trial", ¥33,000
- rear **560 311 BJ23**: φ23, 3-step 103/115/125%, with bush, ¥39,600
- front **adjustable bracket 560 315 A**: 3-step, works with the standard bar, ¥5,610

**Pillow-ball bushes** (with rubber boots):
- front lower arm **564 464 BV** (front side) ¥33,000 and **564 464 CV** (rear side) ¥57,200
- rear trailing arm **560 464 EV** ¥33,000
- rear upper arm **560 464 LV** ¥24,200

**Pillow upper mounts:**
- front **564 410 A**, camber-adjustable, ¥48,400
- rear **508 421 S / A60 / A65 / A**, centre-lock, each ¥52,800, chosen by spring ID

**Bracing under the car:**
- front lower-arm bars **564 475 A** (Ver.1, ¥10,450) and **564 477 A** (Ver.2, ¥22,000); the two can be fitted together
- trunk bar 560 490 A, ¥12,100
- Power Brace set 564 492 FM / FC / FS / C / RT (¥18,700–51,700 each)

**Look:** blue-painted bars and braces. Official photos show the rear sway bar fitted under a CT9A, and the lower-arm bar. — [Cusco rear sway bar on a CT9A](https://www.cusco.co.jp/search/img/products/560-311-BJ18_swaybar-rear%5BCN9A_CP9A_CT9A_CT9W%5D_Lancer-evo9-CT9A-fitt.jpg); [Cusco lower-arm bar Ver.2](https://www.cusco.co.jp/search/img/products/564-477-A_lowerarm-bar-ver2_%5BCT9A_CT9W%5D_Lancer-evo7-9%26wagon.jpg); [Cusco adjustable bracket](https://www.cusco.co.jp/search/img/products/560-315-A_adjustable-swaybar-bracket_%5BCP9A_CT9A_CZ4A_CT9W%5D_Lancer-evo.jpg)

#### Whiteline (from Whiteline's own Australian site listing; product pages blocked)
All of the following appear on one Whiteline search page. — [Whiteline search listing](https://whitelineperformance.com/au/search?q=evo%20ix)
- **BMK009** and **BMK009M**: "Front and Rear Sway Bar – Vehicle Kit to Suit Mitsubishi Lancer Evolution 7 8 9" — [BMK009](https://whitelineperformance.com/au/front-and-rear-sway-bar-vehicle-kit-to-suit-mitsubishi-lancer-evolution-7-8-9-9986-bmk009.html); [BMK009M](https://whitelineperformance.com/au/front-and-rear-sway-bar-vehicle-kit-to-suit-mitsubishi-lancer-evolution-7-8-9-9986-bmk009m.html)
- **BMF48**: "Front Sway Bar – 26mm Non Adjustable … Evolution 7 8 9" — [BMF48](https://whitelineperformance.com/au/front-sway-bar-26mm-non-adjustable-to-suit-mitsubishi-lancer-evolution-7-8-9-9986-bmf48.html)
- **BMR65XZ**: "Rear Sway Bar – 24mm 3 Point Adjustable … Evo 4 5 6 7 8 9" — [BMR65XZ](https://whitelineperformance.com/au/rear-sway-bar-24mm-3-point-adjustable-to-suit-mitsubishi-lancer-evo-4-5-6-7-8-9-9986-bmr65xz.html)
- **BMR65XXZ**: "Rear Sway Bar – 26mm 3 Point Adjustable … Evo 4 5 6 7 8 9" — [BMR65XXZ](https://whitelineperformance.com/au/rear-sway-bar-26mm-3-point-adjustable-to-suit-mitsubishi-lancer-evo-4-5-6-7-8-9-9986-bmr65xxz.html)
- **W22960**: "Front Sway Bar Mount – Bushing Kit 24mm … Evolution 7 8 9" — [W22960](https://whitelineperformance.com/au/front-sway-bar-mount-bushing-kit-24mm-to-suit-mitsubishi-lancer-evolution-7-8-9-9986-w22960.html)
- **KCA387** and **KCA390**: "Front Bump Steer – Correction Kit … Evolution 7 8 9" — [KCA387](https://whitelineperformance.com/au/front-bump-steer-correction-kit-to-suit-mitsubishi-lancer-evolution-7-8-9-9986-kca387.html); [KCA390](https://whitelineperformance.com/au/front-bump-steer-correction-kit-to-suit-mitsubishi-lancer-evolution-7-8-9-9986-kca390.html)
- **KCA469**: "Front Lower Inner Rear Bushings Offset Caster Kit … Evolution 7 8 9" — [KCA469](https://whitelineperformance.com/au/front-lower-inner-rear-bushings-offset-caster-kit-to-suit-mitsubishi-lancer-evolution-7-8-9-9986-kca469.html)

#### Hardrace (Hardrace USA store data)
Each entry links to its Hardrace USA product page.
- **6726** Adjustable Rear Toe Arms (pillow ball), Evo 7–9 CT9A and 5–6 CP9A, 2 pcs, US$277.58 — [6726](https://hardraceusa.com/products/hardrace-adjustable-rear-toe-arms-pillow-ball-evolution-7th-9th-ct9a-5-6th-cp9a)
- **Q1446** Rear Lower Arm / Camber Kit, CN9A, CP9A, CT9A, pillow ball, 2 pcs, US$640 — [Q1446](https://hardraceusa.com/products/rear-lower-arm-camber-kit-for-lancer-evolution-4th-cn9a-5-6th-cp9a-7-0th-ct9a)
- **Q0582** front roll-centre adjuster V2 (+10/15 mm), Evo 7–10, US$272.06 — [Q0582](https://hardraceusa.com/products/hardrace-q0582)
- **Front lower-arm bushings:**
  - **Q0284** rear side, offset, caster +0.5°, pillow ball, US$293.34 — [Q0284](https://hardraceusa.com/products/q0284-hardrace-mitsubishi-lancer-evolution-7-8-9-01-08-front-lower-arm-bushing-rear-side-offset-function-caster-0-5-pillow-ball-2pcs-set)
  - **6746** pillow ball, 4 pcs, US$396.49 — [6746](https://hardraceusa.com/products/evo-7-9-front-lower-arm-bushing-pillow-ball-4pcs-set)
  - **7256** front side, small, hardened rubber, US$88.09 — [7256](https://hardraceusa.com/products/evo-7-9-front-lower-arm-bushing-front-side-small-harden-rubber-2pcs-set)
- **Rear lower-arm bushings, Evo 4–9:**
  - **6658** steel body, hardened rubber, US$176.16 — [6658](https://hardraceusa.com/products/evo-4-9-rear-lower-arm-bush-steel-body-harden-rubber-6pcs-set)
  - **6658F** steel body, pillow ball, US$317.29 — [6658F](https://hardraceusa.com/products/evo-4-9-rear-lower-arm-bushing-steel-body-pillow-ball-6pcs-set)
  - **6678** aluminium body, hardened rubber, US$176.16 — [6678](https://hardraceusa.com/products/evo-4-9-rear-lower-arm-bush-aluminum-body-harden-rubber-6pcs-set)
- **6917** front stabiliser bushing 24 mm (TPV), US$26.30 — [6917](https://hardraceusa.com/products/evo-7-9-front-stabilizer-bushing-24mm-tpv-bushing-2pcs-set)
- **6791 / 6792** front / rear reinforced stabiliser links, Lancer Evo 96–08, US$87.41 each — [6791](https://hardraceusa.com/products/lancer-evo-96-08-front-reinforced-stabilizer-link-2pcs-set); [6792](https://hardraceusa.com/products/lancer-evo-96-08-rear-reinforced-stabilizer-link-2pcs-set)
- **7366** rear arm ball joints, CT9A, US$121.90 — [7366](https://hardraceusa.com/products/hardrace-rear-arm-ball-joints-2pcs-set-evo-7-9th-ct9a)
- **Q0922** brake master cylinder stopper, RHD, Evo 7–9, US$79.20 — [Q0922](https://hardraceusa.com/products/hardrace-q0922)
- **Q0042** hard tie rod, CT9A, US$66.13 — [Q0042](https://hardraceusa.com/products/hardrace-q0042)
- **6861** RC tie-rod end, US$198.36 — [6861](https://hardraceusa.com/products/evo-7-9-rc-tie-rod-end-2pcs-set)
- **Diff-support bushings:** 7295 (Evo 4–9, non-AYC, OD 45) and 6661 (Evo IV–IX, non-AYC, OD 54), US$88.09 each — [7295](https://hardraceusa.com/products/evo-4-9-rear-diff-support-member-bushing-ayc-harden-rubber-2pcs-set); [6661](https://hardraceusa.com/products/hardrace-rear-differential-support-member-bushing-not-ayc-evo-iv-to-ix)
- **Look:** studio photos on dark grey show **blue anodised** toe arms with silver rod ends, a **silver** forged camber arm, black bushings and silver ball-joint roll-centre adjusters. — [6726 photo](https://cdn.shopify.com/s/files/1/1684/1897/products/20143111502615Y0T26GN.jpg?v=1483775316); [Q1446 photo](https://cdn.shopify.com/s/files/1/1684/1897/files/202510201518815Y18K8MC.jpg?v=1786159434)

#### Ikeya Formula
- Ikeya Formula's product index lists car-specific parts for Nissan, Toyota, Honda, Mazda and Subaru only. "ミツビシ", "ランサー" and "エボリューション" don't appear on the product, Mazda or general-purpose pages. — [Ikeya Formula products](https://www.ikeya-f.co.jp/product); [Ikeya Formula general-purpose](https://www.ikeya-f.co.jp/general-purpose)

#### Summary table: bars, arms, bushings
| Brand | Item | Evo IX part no. | Spec | Look | Status | Photo (verified) | Price |
|---|---|---|---|---|---|---|---|
| Cusco | Front sway bar | 564 311 A25 / A21 | φ25 (123%) / φ21 (64%); stock φ23 | blue | current | – | ¥40,700 / ¥39,600; Blackhawk SG S$265.32 / S$285.12 |
| Cusco | Rear sway bar | 560 311 BJ23 / BJ18 | φ23 3-way 103–125% / φ18 rally | blue | current | [fitted under CT9A, 800×600](https://www.cusco.co.jp/search/img/products/560-311-BJ18_swaybar-rear%5BCN9A_CP9A_CT9A_CT9W%5D_Lancer-evo9-CT9A-fitt.jpg) | ¥39,600 / ¥33,000; S$285.12 (BJ23) |
| Cusco | Pillow-ball arm bushes | 564 464 BV / CV, 560 464 EV / LV | front lower, rear trailing, rear upper | – | current | – | ¥24,200–57,200 |
| Cusco | Front lower-arm bar | 564 477 A (Ver.2), 564 475 A (Ver.1) | under-car brace | blue | current | [studio, black, 800×535](https://www.cusco.co.jp/search/img/products/564-477-A_lowerarm-bar-ver2_%5BCT9A_CT9W%5D_Lancer-evo7-9%26wagon.jpg) | ¥22,000 / ¥10,450; S$169.69 (Ver.2) |
| Whiteline | Front sway bar | BMF48 | 26 mm, non-adjustable | not confirmed | listed | – | – |
| Whiteline | Rear sway bar | BMR65XZ / BMR65XXZ | 24 / 26 mm, 3-point adjustable | not confirmed | listed | – | – |
| Whiteline | F + R sway bar kit | BMK009 / BMK009M | – | – | listed | – | – |
| Whiteline | Bushing / geometry kits | W22960, KCA387, KCA390, KCA469 | 24 mm bar bushes; bump steer; offset caster | – | listed | – | – |
| Hardrace | Rear toe arms | 6726 | pillow ball, adjustable | blue anodised | current | [dark bg, 815×543](https://cdn.shopify.com/s/files/1/1684/1897/products/20143111502615Y0T26GN.jpg?v=1483775316) | US$277.58 |
| Hardrace | Rear camber kit | Q1446 | pillow ball | silver forged | current | [dark bg, 1000×666](https://cdn.shopify.com/s/files/1/1684/1897/files/202510201518815Y18K8MC.jpg?v=1786159434) | US$640 |
| Hardrace | Front roll-centre adjuster | Q0582 | +10/15 mm | silver, blue HR cap | current | [dark bg, 815×543](https://cdn.shopify.com/s/files/1/1684/1897/products/20191111938339R38J33GB.jpg?v=1603730417) | US$272.06 |
| Hardrace | Front lower-arm pillow bushings | 6746, Q0284 | pillow ball; Q0284 +0.5° caster | black | current | [6746, dark bg, 815×543](https://cdn.shopify.com/s/files/1/1684/1897/products/Hardrace-6746.jpg?v=1514820651) | US$396.49 / US$293.34 |
| Ikeya Formula | – | none | – | – | no Mitsubishi products | – | – |

### Inferences
- Of these items, only the sway bar and the rear toe or camber arms could show in a configurator photo: under the rear of the car, or behind the rear wheel in a low rear shot. Bushings never show; they belong with the "pulses the job card" parts, like the cams and internals in the current configurator.
- Cusco gives two different front-bar directions: φ25 is stiffer and φ21 softer (a rally setting). The stock front bar is φ23 by Cusco's data. Yet Whiteline (W22960) and Hardrace (6917) both sell **24 mm** front bar bushings for Evo 7–9, which suggests the stock front bar size differs by model (for example 23 vs 24 mm between grades or years). The sources conflict, so check before quoting a stock size.

### Gaps
- Whiteline: no prices, photos, colours or Evo IX year limits (product pages blocked by Cloudflare, then the search page too). No Whiteline rear toe or camber arms or bushing kits for the CT9A were found beyond the items listed; there may be more.
- Hardrace's own Taiwanese site was unreachable; Hardrace USA's prices are US retail.
- No Hardrace sway bar or strut bar for the CT9A appeared in Hardrace USA's catalogue (about 2,700 products scanned).
- Ikeya Formula: older discontinued Evo parts may exist (forum or used listings), but none are on the official site.

---

## Q3. Strut braces: front and rear Evo IX braces, material, finish, look across the towers

### Takeaway
- **Cusco** has the full official CT9A range:
  - front Type OS oval aluminium bar (plain, with brake-master-cylinder stopper, or triangulated to the bulkhead), Type 40 round aluminium, Type CB carbon
  - rear OS, OS-T, 40 and CB
  - blue anodised tower brackets on a silver bar
- **Ultra Racing** (Malaysia) has a white powder-coated steel 3-point front bar and 2- or 4-point rear bars, plus fender, lower, side and frame braces.
- **Blitz, HKS and Hardrace** list no CT9A strut bar.

### Cited Findings
- **Cusco front bars**, all CT9A: — [Cusco CT9A parts search](https://www.cusco.co.jp/search/en/index/detail/?make=MITSUBISHI&car=Lancer+Evolution+9&chassis=CT9A&impreza=&category=body)
  - **565 540 A**: Type OS, aluminium oval, ¥19,800
  - **565 540 AM**: OS with BCS (brake cylinder stopper), ¥24,200
  - **565 540 AT**: OS triangle type, ¥26,400
  - **565 540 ATM**: triangle with BCS, ¥28,600
  - **565 525 A**: Type 40, aluminium φ40 round, ¥24,200
  - **565 555 A**: Type CB, carbon φ40, ¥33,000
- **Cusco rear bars**: — same source
  - **564 541 A**: OS aluminium oval, rear trim work needed, ¥19,800
  - **564 544 A**: OS-T add-on bar, rear only; can't be fitted alone; drilling needed; ¥19,800
  - **564 526 A**: Type 40, ¥24,200
  - **564 551 A**: carbon φ40, ¥33,000
- **Cusco look** (official photos): blue anodised tower plates, a silver oval aluminium shaft, and on the triangle type a centre brace with a silver bracket going back to the bulkhead. The fitted Evo IX photo shows it across both towers, over the red cam cover. — [565 540 ATM studio, black](https://www.cusco.co.jp/search/img/products/565-540-ATM_strutbar-front_%5BCT9A_CT9W%5D_Lancer-evo7-9%26wagon.jpg); [565 540 ATM fitted to an Evo IX](https://www.cusco.co.jp/search/img/products/565-540-ATM_strutbar-front_%5BCT9A_CT9W%5D_Lancer-evo7-9%26wagon_CT9A-evo9-fitt.jpg)
- **Blackhawk Japan SG prices:** 565 540 A S$142.56; 565 540 ATM S$205.92; 565 555 A S$237.60; 564 541 A S$142.56. — [565 540 A](https://www.blackhawkjapan.sg/products/cusco-565-540-a); [565 540 ATM](https://www.blackhawkjapan.sg/products/cusco-565-540-atm); [565 555 A](https://www.blackhawkjapan.sg/products/cusco-565-555-a); [564 541 A](https://www.blackhawkjapan.sg/products/cusco-564-541-a)
- **Ultra Racing** (Malaysia, ultraracing.my store data, prices in RM):
  - **UR-TW3-394** front strut bar, 3 points, bolt-on, accessory GC017, 107 × 19 × 6 cm, 3.1 kg, RM 365.00 — [UR-TW3-394](https://www.ultraracing.my/product/mitsubishi-evo-7-8-9-front-strut-bar-front-tower-bar-front-upper-brace/)
  - **UR-RE2-396** rear strut bar, 2 points, cover or carpet must be cut, 1.6 kg, RM 330.00 — [UR-RE2-396](https://www.ultraracing.my/product/mitsubishi-evo-7-8-9-rear-strut-bar-rear-tower-bar-2/)
  - **UR-RE4-801** rear, 4 points, bolt-on, 4.0 kg, RM 455.00. RE2-396 and RE4-801 can't be fitted together. — [UR-RE4-801](https://www.ultraracing.my/product/mitsubishi-evo-7-8-9-rear-strut-bar-rear-tower-bar/)
  - other Evo 7/8/9 braces:
    - fender brace UR-FD3-897P, RM 420 — [link](https://www.ultraracing.my/product/mitsubishi-evo-7-8-9-fender-bar-fender-brace/)
    - front lower bars UR-LA3-3184 (RM 268) and UR-LA4-310 (RM 318) — [LA3-3184](https://www.ultraracing.my/product/mitsubishi-evo-7-8-9-front-lower-bar-front-member-brace/); [LA4-310](https://www.ultraracing.my/product/mitsubishi-airtrek-evo-7-8-9-front-lower-bar-front-member-brace/)
    - side lower bar UR-SD8-395P, RM 495 — [link](https://www.ultraracing.my/product/mitsubishi-evo-7-8-9-side-lower-bar-side-floor-bar/)
    - front frame braces UR-FT4-2845 / -2846, RM 465 — [FT4-2845](https://www.ultraracing.my/product/mitsubishi-evo-7-8-9-front-torsion-bar-front-frame-brace/)
    - room bar UR-RO2-802, RM 255 — [link](https://www.ultraracing.my/product/mitsubishi-airtrek-evo-7-8-9-room-bar-room-cross-bar/)
- **Ultra Racing look:** the official fitted photos show **white** bars with a small UR logo plate. The front bar runs tower to tower with a third leg to the bulkhead; the rear bars span the boot. The photos carry an "ULTRA RACING" watermark. — [UR-TW3-394 fitted in an Evo, 2000×1500](https://www.ultraracing.my/wp-content/uploads/2025/04/6157ab67562c05bdc81730dc3dba14fd-1.jpeg); [UR-RE4-801 in an Evo boot](https://www.ultraracing.my/wp-content/uploads/2021/12/Rear-Tower-Bar3.jpg)
- **Blitz:** its parts navigator's TOWER BAR category has no Lancer entries under Mitsubishi. — [Blitz tower bar list, Mitsubishi](https://partsnavi.blitz.co.jp/products/search/search_products/list.php?category_id=24&maker_id=5)
- **HKS:** no CT9A strut bar (earlier notes, Q5 of `hks_exhaust_chassis.md`). **Hardrace:** no CT9A strut bar in Hardrace USA's catalogue. The nearest item is the Q0922 brake master cylinder stopper. — [Hardrace Q0922](https://hardraceusa.com/products/hardrace-q0922)

| Brand | Item | Part no. | Material / finish | Look across the towers | Status | Photo (verified) | Page | Price | Singapore |
|---|---|---|---|---|---|---|---|---|---|
| Cusco | Front Type OS | 565 540 A | aluminium oval shaft, anodised brackets | blue tower plates, silver bar | current | – | [Cusco search](https://www.cusco.co.jp/search/en/index/detail/?make=MITSUBISHI&car=Lancer+Evolution+9&chassis=CT9A&impreza=&category=body) | ¥19,800 | Blackhawk SG S$142.56 |
| Cusco | Front OS triangle + BCS | 565 540 ATM | as above, centre brace to bulkhead | blue plates, silver triangle | current | [studio, black, 800×600](https://www.cusco.co.jp/search/img/products/565-540-ATM_strutbar-front_%5BCT9A_CT9W%5D_Lancer-evo7-9%26wagon.jpg); [on Evo IX](https://www.cusco.co.jp/search/img/products/565-540-ATM_strutbar-front_%5BCT9A_CT9W%5D_Lancer-evo7-9%26wagon_CT9A-evo9-fitt.jpg) | same | ¥28,600 | S$205.92 |
| Cusco | Front Type CB | 565 555 A | carbon φ40 tube | black carbon bar, blue plates (expected) | current | – | same | ¥33,000 | S$237.60 |
| Cusco | Front Type 40 | 565 525 A | aluminium φ40 | – | current | – | same | ¥24,200 | – |
| Cusco | Rear OS / 40 / CB | 564 541 A / 564 526 A / 564 551 A | as front; rear trim work | in the boot, not visible in exterior views | current | – | same | ¥19,800 / ¥24,200 / ¥33,000 | S$142.56 (564 541 A) |
| Ultra Racing | Front 3-point | UR-TW3-394 | steel, white powder coat | white bar plus a leg to the bulkhead | current | [fitted, watermarked, 2000×1500](https://www.ultraracing.my/wp-content/uploads/2025/04/6157ab67562c05bdc81730dc3dba14fd-1.jpeg) | [UR](https://www.ultraracing.my/product/mitsubishi-evo-7-8-9-front-strut-bar-front-tower-bar-front-upper-brace/) | RM 365 | none found |
| Ultra Racing | Rear 2- / 4-point | UR-RE2-396 / UR-RE4-801 | steel, white | boot only | current | [RE2, 600×600](https://www.ultraracing.my/wp-content/uploads/2021/12/Rear-Tower-Bar11.jpg); [RE4, 600×600](https://www.ultraracing.my/wp-content/uploads/2021/12/Rear-Tower-Bar3.jpg) | [RE2](https://www.ultraracing.my/product/mitsubishi-evo-7-8-9-rear-strut-bar-rear-tower-bar-2/); [RE4](https://www.ultraracing.my/product/mitsubishi-evo-7-8-9-rear-strut-bar-rear-tower-bar/) | RM 330 / RM 455 | none found |

### Inferences
- For the engine-bay view, two looks stand apart: the **Cusco front OS / triangle** (blue plates and a silver bar, the classic Evo look, with an official photo on an Evo IX) and the **Ultra Racing 3-point** (a white bar). The Cusco carbon CB adds a third (a black carbon tube).
- Rear bars sit inside the boot and never show in the eight exterior views. They suit a job-card line, not a photo layer.
- The Cusco "BCS" versions add a brake master cylinder stopper. On a right-hand-drive car it sits on the right-hand side of the bay, so it shows in the engine-bay view as a small extra bracket.

### Gaps
- No clean studio photo was found for the Cusco 565 540 A, 565 555 A or the rear bars (only the ATM had images in the search). Ultra Racing photos are fitted shots with a watermark, not cut-outs.
- Ultra Racing's material (steel) and colour are inferred from the photos; the store pages don't say.
- No Singapore stockist was found for Ultra Racing (Malaysian prices only).

---

## Q4. Official product photos per model: direct image URL, page URL, `curl -sIL` result, watermarks

### Takeaway
- **Clean white-background shots** exist for:
  - Blitz ZZ-R (2756 px, generic)
  - KW V3 (1600 px, generic)
  - Öhlins (small official samples and a retailer close-up)
  - BC Racing (generic)
  - the Tein Super Racing diagram (labelled)
- **Dark backgrounds:** Tein FLEX Z and MONO SPORT kit shots; all Hardrace and Cusco photos.
- **Evo-specific official photos** exist only for the Cusco strut bar and rear sway bar (fitted to a CT9A) and the Ultra Racing braces (fitted, watermarked).
- **None usable:** Cusco coilovers, KW CT9A specifically, Whiteline.

### Cited Findings
Every photo below returned **HTTP 200** with the listed content type under `curl -sIL` on 26 Nov 2026.

| Item | Direct image URL | Type, size | Background / notes | Page URL |
|---|---|---|---|---|
| Tein FLEX Z kit | https://www.tein.com/products/img/flz/flz_products.jpg | image/jpeg, 400×265 | dark studio; green kit; generic, not CT9A | https://www.tein.com/products/flex_z/ |
| Tein FLEX Z banner | https://www.tein.co.jp/products/img/flz/img_flz_main.jpg | image/jpeg, 1500×500 | banner with Japanese text and logos | https://www.tein.co.jp/products/flex_z/ |
| Tein MONO SPORT kit | https://www.tein.co.jp/products/img/mnsa/mnsa_products.jpg | image/jpeg, 400×267 | dark studio; generic | https://www.tein.co.jp/products/mono_sport/ |
| Tein SUPER RACING | https://www.tein.co.jp/products/photo/src_spec.jpg | image/jpeg, 300×420 | white, with letter callouts (A–L) | https://www.tein.co.jp/products/super_racing/ |
| Tein MONO RACING | https://www.tein.com/products/img/mrc/img_mrc_main.jpg | image/jpeg, 750×250 | banner with a race car, no product | https://www.tein.com/products/mono_racing/ |
| Tein STREET ADVANCE Z / BASIS Z | https://www.tein.co.jp/products/img/staz_stbz/img_staz_stbz_main.jpg | image/jpeg, 750×250 | banner with logos | https://www.tein.co.jp/products/street_advance_basis_z/ |
| HKS HIPERMAX S / R | see `hks_exhaust_chassis.md` Q4 (HKS USA 80330-AM002 at 3097×2323, white, is the best) | – | verified in the earlier run | – |
| Öhlins R&T front (sample) | https://www.ohlins.eu/images/db/previews/img-00000341.jpg | image/jpeg, 300×181 | white; labelled "MIS MI00 MIS MI01 front (sample image)"; small | https://www.ohlins.eu/en/products/packages/mitsubishi-lancer-evo-4-6--64/ |
| Öhlins R&T front / rear | https://www.ohlins.eu/images/db/previews/img-00001607.jpg ; https://www.ohlins.eu/images/db/previews/img-00001610.jpg | image/jpeg, 224×300 / 196×300 | white; MIS MI00 (Evo 4–6 package) shots | same |
| Öhlins (retailer) | https://cdn.shopify.com/s/files/1/2343/5009/files/Ohlins-Europe-Mitsubishi-Lancer-Evolution-7-8-9-MIS-MI01_8d7beed0-9bb2-4281-9158-df50676125a4.jpg?v=1731288921 | image/jpeg, 681×451 | from RZ Crew, named for MIS MI01 (not viewed) | https://rzcrewgarage.com/products/ohlins-europe-road-track-dfv-coilover-kit-mitsubishi-lancer-evolution-ct9a-evo-7-8-9-mis-mi01s2 |
| Öhlins close-up (retailer) | https://bulletproofautomotive.com/wp-content/uploads/2021/12/2001-2007-Mitsubishi-EVO-7-9-Ohlins-DFV-Road-Track-Coilovers-Image-3-960x1000.jpg | image/jpeg, 960×1000 | white, close crop of a rear shock | https://bulletproofautomotive.com/product/ohlins-dfv-road-track-coilovers-for-mitsubishi-evo-vii-viii-ix-mismi01s1/ |
| KW V3 | https://cdn.shopify.com/s/files/1/0005/7773/2663/products/35265006_001.jpg?v=1675575769 | image/jpeg, 1600×1600 | white; looks like KW's generic V3 (German "Technische Dokumente" leaflet in shot) | https://www.urotuning.com/products/kw-suspensions-kw-v3-coilover-kit-mitsubishi-lancer-ct9a-evo-7-evo-8-evo-9 |
| Blitz ZZ-R kit | https://cdn.shopify.com/s/files/1/0644/3486/4197/files/92766_3b60696c-9e5f-4768-919a-0241736a89db.jpg?v=1742330021 | image/jpeg, 2756×1837 | white studio; "BLITZ" on springs; probably generic (red mounts at all four corners) | https://www.blackhawkjapan.sg/products/blitz-92766 |
| Blitz ZZ-R (official) | https://www.blitz.co.jp/wp-content/themes/blitz/images/damper_zz-r/slide1.jpg | image/jpeg, 1920×849 | dark; close-up of red pillow mounts | https://www.blitz.co.jp/products/suspension/damper_zz-r.html |
| BC Racing BR | https://cdn.shopify.com/s/files/1/0890/6136/products/bc-racing-11980815106118.jpg?v=1752533574 | image/jpeg, 500×375 | white; "generic" per the retailer | https://www.maperformance.com/products/mitsubishi-evo-vii-viii-ix-evo-7-9-br-series-coilovers-by-bc-racing |
| BC Racing BR (official) | https://bcracing-na.com/wp-content/uploads/2019/09/bc-racing-br-series-hero.jpg | image/jpeg, 1920×840 | white, wide hero | https://bcracing-na.com/series/br-series/ |
| Zeal / ENDLESS Function | see `endless.md` (function_x_plus.jpg, dark gradient; super_function.jpg, white) | – | earlier run | – |
| Cusco front strut bar 565 540 ATM | https://www.cusco.co.jp/search/img/products/565-540-ATM_strutbar-front_%5BCT9A_CT9W%5D_Lancer-evo7-9%26wagon.jpg | image/jpeg, 800×600 | black studio, no watermark | Cusco CT9A search (Q3) |
| Cusco 565 540 ATM on an Evo IX | https://www.cusco.co.jp/search/img/products/565-540-ATM_strutbar-front_%5BCT9A_CT9W%5D_Lancer-evo7-9%26wagon_CT9A-evo9-fitt.jpg | image/jpeg, 800×600 | fitted in an Evo IX bay | same |
| Cusco rear sway bar 560 311 BJ18 | https://www.cusco.co.jp/search/img/products/560-311-BJ18_swaybar-rear%5BCN9A_CP9A_CT9A_CT9W%5D_Lancer-evo9-CT9A-fitt.jpg | image/jpeg, 800×600 | under a CT9A, fitted | same |
| Cusco lower-arm bar Ver.2 / Ver.1 | https://www.cusco.co.jp/search/img/products/564-477-A_lowerarm-bar-ver2_%5BCT9A_CT9W%5D_Lancer-evo7-9%26wagon.jpg ; https://www.cusco.co.jp/search/img/products/564-475-A_lowerarm-bar-ver1_%5BCT9A_CT9W%5D_Lancer-evo7-9%26wagon.jpg | image/jpeg, 800×535 | black studio; Ver.2 has a red arrow graphic | same |
| Cusco adjustable sway-bar bracket | https://www.cusco.co.jp/search/img/products/560-315-A_adjustable-swaybar-bracket_%5BCP9A_CT9A_CZ4A_CT9W%5D_Lancer-evo.jpg | image/jpeg, 800×600 | – (not viewed) | same |
| Cusco coilovers | https://cdn.shopify.com/s/files/1/0644/3486/4197/files/sportS_97880198-b3f2-45ea-a1df-d1b709e69fc1.jpg?v=1759817245 (SPORT S); …/suskit_streetzero_b_fb640704-413f-4d41-9311-e8dca0aad517.jpg?v=1759817209 (Street ZERO) | image/jpeg, 355×117 | logo banners with a tiny product; unusable as cut-outs | https://www.blackhawkjapan.sg/products/cusco-564-64s-cn |
| Hardrace 6726 toe arms | https://cdn.shopify.com/s/files/1/1684/1897/products/20143111502615Y0T26GN.jpg?v=1483775316 | image/jpeg, 815×543 | dark grey studio | https://hardraceusa.com/products/hardrace-adjustable-rear-toe-arms-pillow-ball-evolution-7th-9th-ct9a-5-6th-cp9a |
| Hardrace Q1446 camber kit | https://cdn.shopify.com/s/files/1/1684/1897/files/202510201518815Y18K8MC.jpg?v=1786159434 | image/jpeg, 1000×666 | dark grey studio | https://hardraceusa.com/products/rear-lower-arm-camber-kit-for-lancer-evolution-4th-cn9a-5-6th-cp9a-7-0th-ct9a |
| Hardrace 6746 / Q0582 | https://cdn.shopify.com/s/files/1/1684/1897/products/Hardrace-6746.jpg?v=1514820651 ; https://cdn.shopify.com/s/files/1/1684/1897/products/20191111938339R38J33GB.jpg?v=1603730417 | image/jpeg, 815×543 | dark grey studio | Hardrace USA (Q2) |
| Ultra Racing front bar | https://www.ultraracing.my/wp-content/uploads/2025/04/6157ab67562c05bdc81730dc3dba14fd-1.jpeg | image/jpeg, 2000×1500 | fitted in an Evo VII–IX bay; UR watermark | UR-TW3-394 page (Q3) |
| Ultra Racing rear bars / fender brace | https://www.ultraracing.my/wp-content/uploads/2021/12/Rear-Tower-Bar11.jpg ; …/Rear-Tower-Bar3.jpg ; …/Fender-Brace2.jpg | image/jpeg, 600×600 | fitted; UR watermark | UR pages (Q3) |

### Inferences
- **Studio cut-outs.** The best sources are the Blitz ZZ-R kit (2756 px, white) and the KW V3 (1600 px, white). Both are generic images, fine for a parts card. Next come the Öhlins close-up and the HKS high-resolution S from the earlier notes.
- **Engine-bay layer.** For a Kling edit (the configurator's method), the **Cusco 565 540 ATM fitted to an Evo IX** is the best reference: the same car, the same bay and the same red cam cover.
- **Watermarks and text:**
  - Ultra Racing photos carry the "ULTRA RACING" logo; Tein banners have Japanese copy.
  - Several products have brand lettering on the springs (Öhlins, Blitz, HKS R) or a logo label (KW, BC Racing). That matters under the "no text on the car" brief.

### Gaps
- No official CT9A-specific photo for KW, BC Racing or Öhlins: all are generic or labelled for another Evo.
- No Whiteline photo (pages blocked).
- No usable Cusco coilover photo.
- I didn't view every image: the Öhlins RZ Crew image and the Cusco bracket were checked only for status, size and type.

---

## Q5. Rough prices, how each brand is sold in Singapore, and LTA notes on lowering

### Takeaway
- **Singapore retail is mostly grey import:**
  - Blackhawk Japan SG carries Tein, Blitz and Cusco Evo IX parts with SGD prices
  - RZ Crew Garage carries the Öhlins CT9A kit (S$3,712, import taxes included)
  - BC Racing has an official sole distributor, Fong Kim Exhaust System
  - KW and Öhlins are served regionally, from Malaysia and Thailand
  - HKS has its official distributor, Garage R
- **LTA:** suspension changes need no approval, with conditions. The body must never touch the road, steering must not be affected and no bodywork may be cut. No minimum ground-clearance figure was found.

### Cited Findings

**Singapore prices found (SGD):**

| Item | Part no. | SGD price | Source |
|---|---|---|---|
| Tein FLEX Z | VSR84-C1SS4 | S$1,133.55 (was S$1,333.53) | [Blackhawk Japan SG](https://www.blackhawkjapan.sg/products/tein-vsr84-c1ss4) |
| Tein MONO SPORT | GSR52-71SS4 | S$1,790.91 (was S$2,105.73) | [Blackhawk Japan SG](https://www.blackhawkjapan.sg/products/tein-gsr52-71ss4) |
| Tein STREET ADVANCE Z | GSR52-91SS2 | S$837.54 (was S$985.05) | [Blackhawk Japan SG](https://www.blackhawkjapan.sg/products/tein-gsr52-91ss2) |
| Tein MONO RACING | VSR52-K1LS4 | S$1,978.02 (was S$2,326.50) | [Blackhawk Japan SG](https://www.blackhawkjapan.sg/products/tein-vsr52-k1ls4) |
| Tein SUPER RACING | DSR84-81LS1 | S$3,088.80 (was S$3,633.30) | [Blackhawk Japan SG](https://www.blackhawkjapan.sg/products/tein-dsr84-81ls1) |
| Blitz ZZ-R (listed under "Evolution VII CT9A") | 92766 | S$1,182.46 (was S$1,947.43) | [Blackhawk Japan SG](https://www.blackhawkjapan.sg/products/blitz-92766) |
| Cusco street ZERO | 564 61P CN | S$1,095.93 | [Blackhawk Japan SG](https://www.blackhawkjapan.sg/products/cusco-564-61p-cn) |
| Cusco SPORT S | 564 64S CN | S$1,852.29 | [Blackhawk Japan SG](https://www.blackhawkjapan.sg/products/cusco-564-64s-cn) |
| Cusco SPORT R | 564 64R CP | S$2,001.78 | [Blackhawk Japan SG](https://www.blackhawkjapan.sg/products/cusco-564-64r-cp) |
| Cusco front sway bar | 564 311 A25 / A21 | S$265.32 / S$285.12 | [A25](https://www.blackhawkjapan.sg/products/cusco-564-311-a25); [A21](https://www.blackhawkjapan.sg/products/cusco-564-311-a21) |
| Cusco rear sway bar | 560 311 BJ23 | S$285.12 | [Blackhawk Japan SG](https://www.blackhawkjapan.sg/products/cusco-560-311-bj23) |
| Cusco front pillow upper mount | 564 410 A | S$314.82 | [Blackhawk Japan SG](https://www.blackhawkjapan.sg/products/cusco-564-410-a) |
| Cusco front lower-arm bar Ver.2 | 564 477 A | S$169.69 | [Blackhawk Japan SG](https://www.blackhawkjapan.sg/products/cusco-564-477-a) |
| Cusco strut bars | 565 540 A / 565 540 ATM / 565 555 A / 564 541 A | S$142.56 / S$205.92 / S$237.60 / S$142.56 | Q3 links |
| Öhlins Road & Track | MIS MI01S2 | S$3,712 ("All import taxes are included"; ships from RZ Crew's EU warehouse by DHL, 3–7 days) | [RZ Crew](https://rzcrewgarage.com/products/ohlins-europe-road-track-dfv-coilover-kit-mitsubishi-lancer-evolution-ct9a-evo-7-8-9-mis-mi01s2) |

**Prices elsewhere** (internal reference):
- **Japan:** Tein ¥112,200–413,600; Cusco ¥173,800–580,800; Blitz ZZ-R ¥211,200; HKS ¥273,900–338,800; ENDLESS ¥368,500–429,000
- **US:** KW V1 $2,254, V3 $3,699–3,794, V4 Clubsport $7,499; Öhlins $2,900; BC Racing BR $1,070–1,305; Hardrace toe arms $277.58, camber kit $640
- **EU:** Öhlins €3,282.51
- **Malaysia:** Ultra Racing front bar RM 365

All are in the Q1–Q3 sources.

**How each brand reaches Singapore** (from the sibling file `singapore_sourcing_lta.md` and its sources):
- **BC Racing:** BC Racing North America lists **Fong Kim Exhaust System Pte Ltd** as its sole distributor for Singapore. — [BC Racing, Sole Distributors by Region](https://bcracing-na.com/sole-distributors-by-region)
- **KW:** regional distributor KW Automotive Sdn Bhd, Malaysia. **Öhlins:** regional, Öhlins Asia (Thailand); no Singapore authorised car service centre found. — [Öhlins Asia](https://ohlinsasia.com/?p=17630); [RecordOwl, KW Automotive](https://recordowl.com/company/kw-automotive)
- **Tein:** Blackhawk Japan SG (grey or retail). **Cusco:** no Singapore distributor found; Malaysian retailer K2 Industries. **Whiteline, Hardrace:** none found in Singapore. — [K2 Industries, Cusco](https://www.k2-industries.com/en-my/collections/cusco)
- **HKS:** Garage R is HKS's exclusive Singapore/Malaysia distributor. — see `research_notes/Tomei and HKS Evo IX parts/singapore_market_and_lta.md`
- **Not found in Singapore (this run):** HKS Hipermax CT9A on Blackhawk SG (no listing under the guessed handles); ENDLESS ZS603xx; Ultra Racing.

**LTA rules on lowering:**
- OneMotoring's rules for suspension, as quoted in the sibling file: — [LTA OneMotoring, Vehicle Technologies and Modifications](https://onemotoring.lta.gov.sg/content/onemotoring/home/owning/modification.html) (search extract, via `singapore_sourcing_lta.md`)
  - springs, dampers, anti-roll bars and strut bars may be changed **without approval**, on conditions
  - they must not adversely affect steering and manoeuvring
  - "the lowest part of the body must never touch the road"
  - bodywork must not be cut or altered to fit them
- Motorist lists suspension systems as needing no LTA approval. Torque calls a heavily lowered stance "almost definitely illegal" (an opinion). — [Motorist.sg Q&A](https://www.motorist.sg/ask-motorists/3846/what-car-mods-can-i-do-without-lta-approval); [Torque](https://www.torque.com.sg/?p=62837)
- **Chassis changes are not allowed.** — [LTA OneMotoring](https://onemotoring.lta.gov.sg/content/onemotoring/home/owning/modification.html) (search extract, earlier notes)
- **Penalties since 27 Feb 2026:** up to S$20,000 and/or 2 years' jail for individuals, up to S$40,000 for workshops (doubled for repeat offenders). — [The Independent SG](https://theindependent.sg/lta-warns-against-illegal-vehicle-mods-as-workshop-fined-and-penalties-raised/)
- **Tein's own warning:** the SUPER RACING ride heights for the CT9A are "circuit recommendations and may not meet safety standards". This is about Japan's 保安基準, but it is a useful flag for the deepest settings. — [Tein CT9A data](https://www.tein.co.jp/srch/jps_search.php?maker=&carmodel=&modelyear=&item=&restype=1&allvch=1&genuine=&srchfrwd=CT9A&partno=&tuvchk=undefined)

### Inferences
- Blackhawk SG prices are roughly the Japanese tax-inclusive price converted at today's rate and discounted (for example Tein FLEX Z ¥156,750 → S$1,133.55), plus shipping. A Singapore workshop buying through Japanese grey channels can expect similar costs.
- For an LTA-safe configurator, keep the ride-height slider to moderate drops (about −30 to −50 mm front). Any extreme setting should carry a note that "the body must never touch the road" and that steering must stay unaffected.
- Camber plates, roll-centre adjusters and toe or camber arms change alignment, not the body or chassis. They fall under the same suspension rule. Anything that needs cutting the body (some rear strut bars need trim or carpet cut, which is interior trim, not bodywork) needs care. The Cusco "drilling needed" OS-T rear bar and any frame brace should be checked against the "no chassis changes" rule.

### Gaps
- The full official OneMotoring text could not be read in this run or the earlier ones (search extracts only). No minimum ground-clearance figure or measurement method was found.
- No Singapore price was found for HKS Hipermax, ENDLESS/Zeal, KW, BC Racing (Fong Kim has no online prices), Whiteline, Hardrace or Ultra Racing.
- Whether an LTA inspection (VITAS/VICOM) checks ride height on a modified car was not confirmed.
