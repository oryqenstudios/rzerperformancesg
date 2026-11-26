# Interior parts for the Mitsubishi Lancer Evolution IX (CT9A): a model-by-model catalogue for the RZER photo configurator

Research notes for the report writer. Researched 26 Nov 2026. Scope: seats (Bride ZETA IV, Recaro RS-G / Pole Position / Podium) and their CT9A rails; steering wheels (MOMO, Nardi); Works Bell bosses and quick releases; gauges (Defi, GReddy, Prosport, AEM) and Evo A-pillar pods; shift knobs (Ralliart, Razo, Raceseng); track parts (Cusco Safety21 cages, Sabelt and Schroth harnesses); Singapore LTA rules.

How the facts were gathered:
- **Read in full this session:** the official LTA OneMotoring modification page (it was blocked in an earlier session and is reachable now), Bride's own fitment database (JSON behind its fitment search) for the CT9A, Works Bell's Mitsubishi fitment PDF, and the product pages of Bride, Recaro, Nardi, Works Bell, Defi, GReddy, Prosport, Razo, Cusco, Sabelt and Schroth.
- **SGD prices:** these come from Blackhawk Japan's Singapore store (blackhawkjapan.sg), read through its product JSON.
- **Blocked hosts:** `momo.com`/`momomotorsport.com`, `www.aemelectronics.com` and `www.autometer.com` refused this session (DNS failure or Cloudflare 403). MOMO, AEM and Autometer details therefore come from retailers, and are labelled that way. To read those makers' own pages, the hosts would have to be allowed in the session's network settings.
- **Search extracts:** a claim marked "(search extract)" rests on a search-engine summary, not a full read of the page.
- **Images:** every photo URL in the tables was checked with `curl -sIL` (HTTP 200, image content type). The images were looked at in a scratch contact sheet outside the repository, and nothing was saved into the repository.

## 1. For each model: Evo IX fitment and part numbers, variants, look, and status

### Takeaway
Most of the brief can be fitted to an RHD CT9A with documented part numbers. The two closest fits are:
- **Bride ZETA IV on Bride's CT9A BG rails** (M019BG right / M020BG left, which replace the discontinued FG rails).
- **Works Bell standard boss 817 or 820** for the CT9A (airbag/SRS car; which one depends on how the factory wheel is fixed), or the Rapfix short bosses 817S/820S.

Cusco's Safety21 cages come in CT9A codes 564 270 xxx (dash-escape) and 564 290 xxx (dash-through), from a 4-point rear cage up to a 13-point "works" cage, all for cars without a sunroof. Several items are discontinued or uncertain:
- **Raceseng** has closed and its store lists no products.
- **Ralliart Evo knobs** survive only as used or old stock.
- **Works Bell's Rapfix II** is temporarily not taking orders.
- **Gauges:** the Defi gauges are 60 mm, so they need 60 mm pods, while most Evo 8/9 A-pillar pods are 52 mm and made for LHD cars.

### Cited Findings

#### 1.0 Baseline: the factory Evo IX interior (what the configurator starts from)
- A Japanese spec table lists a MOMO leather-wrapped steering wheel and Recaro full bucket seats as standard on the GSR. — [j-garage CT9A spec](https://j-garage.com/mitsubishi/evoct9aspec3.html) (search extract)
- Ward's US launch coverage says all trims have a three-spoke, dark titanium MOMO wheel and Recaro buckets. — [Ward's](https://www.wardsauto.com/news/archive-wards-lancer-evolution-ix-debuts-in-new-york/767611/) (search extract)
- A 2005 Carsales review remarks that the MOMO wheel's boss "looks too small to house an airbag". — [Carsales](https://www.carsales.com.au/editorial/details/mitsubishi-lancer-evo-ix-2006-3955) (search extract)
- Works Bell's own fitment table lists the CT9A (Evo 7/8/9, Feb 2001 – Sep 2007) as **SRS** (airbag) equipped. — [Works Bell Mitsubishi fitment PDF](https://www.worksbell.co.jp/pdf/matching/mitsubishi.pdf)
- The two disagree. Treat the JDM car as having a driver's airbag, as Works Bell does.

#### 1.1 Seats

| Brand | Model | Evo IX fitment / part no. | Variants | Look (for the image generator) | Status | Photo URL (verified) | Page URL | Price | Singapore availability |
|---|---|---|---|---|---|---|---|---|---|
| Bride | **ZETA IV** (black) | Full bucket. CT9A rails below. FRP silver shell **HA1ASF**; carbon shell **HA1ASC** | Shell: FRP silver or carbon. 7.4 kg. FIA 8855-1999. Seat-back protector type K17 | Deep, high-sided fixed bucket with an integrated headrest and two harness slots. Black flame-retardant fabric with quilted centre panels; white BRIDE wordmark at the top of the backrest. The current FRP shell is silver-grey, visible at the sides and base | Current ("販売中") | https://brideseats.com/seat/zeta/images/HA1AMF.jpg | [Bride ZETA IV black](https://brideseats.com/seat/zeta/zeta4_black.html) | ¥150,700 (FRP) / ¥211,200 (carbon); S$982.08 (HA1ASF) | Blackhawk Japan SG ([listing](https://www.blackhawkjapan.sg/products/bride-ha1asf)) |
| Bride | ZETA IV **red** | HA1BSF (FRP) / HA1BSC (carbon) | As above | The same bucket in bright red fabric with darker accents at the bolster edges | Current | https://brideseats.com/seat/zeta/images/HA1BMF.jpg | [Bride ZETA IV red](https://brideseats.com/seat/zeta/zeta4_red.html) | ¥150,700 / ¥211,200 | Blackhawk Japan SG (red not price-checked) |
| Bride | ZETA IV **gradation logo** | HA1GSF (FRP) / HA1GSC (carbon) | As above | Black bucket with a column of grey repeated "BRIDE" wordmarks down the centre of the backrest, fading in tone (Bride's "gradation" pattern) | Current | https://brideseats.com/seat/zeta/images/HA1GMF.jpg | [Bride ZETA IV gradation](https://brideseats.com/seat/zeta/zeta4_glogo.html) | ¥161,700 / ¥222,200; S$1,053.36 (HA1GSF) | Blackhawk Japan SG ([listing](https://www.blackhawkjapan.sg/products/bride-ha1gsf)) |
| Bride | ZETA IV **black logo** | HA1HSF (FRP) / HA1HSC (carbon) | As above, marked 【NEW】 | Black bucket; this photo shows the silver FRP shell clearly at the lower sides | Current, new | https://brideseats.com/seat/zeta/images/HA1HSF.jpg | [Bride ZETA IV black logo](https://brideseats.com/seat/zeta/zeta4_black_logo.html) | ¥156,200 / ¥216,700 | Not price-checked |
| Recaro | **RS-G** (Japan-market) | Recaro Japan base frames: 2083.511.1 (left) / 2083.511.2 (right), listed for "Lancer / Lancer Cedia CT9A W" (see Gaps). Needs RS-G/TS-G side adapter 1700000J | Upholstery shown: velour red, ALC, GK; RS-GS velour black/red | Slim full bucket with "non-slip shoulder support" wings and a split cushion. Black with dark grey suede-like centre panels; RECARO wordmark on the headrest | Current. Recaro's company was rescued in 2024 (see below) | https://au.recaro-automotive.com/fileadmin/01-products/race/rs-g-rs-gs/recaro-rs-g-product.png (GK: …/upholstery/recaro-rs-g-gk.png) | [Recaro RS-G](https://au.recaro-automotive.com/race/recaro-rs-g) | Blackhawk SG: RS-GS black S$1,303.53; RS-G CL black S$1,359.27; RS-GS GK S$1,374.81 | Blackhawk Japan SG ([RS-GS](https://www.blackhawkjapan.sg/products/recaro-81-081-20-867-0)); used on Carousell |
| Recaro | **Pole Position N.G. (FIA)** | Universal (sidemount on a car-specific base frame) | Velour black/red. Sidemounts: steel 3.3 kg or 2.6 kg, aluminium 1.1 kg | Classic racing bucket, all-black velour, GFRP shell, tall headrest, harness slots | Current | https://www.recaro-automotive.com/fileadmin/01-products/race/pole-position-fia/recaro-pole-position-fia-product.png | [Recaro Pole Position N.G.](https://www.recaro-automotive.com/en/race/recaro-pole-position-ng-fia) | Not captured | Not confirmed |
| Recaro | Pole Position (ABE) (road-approved version) | Universal | Not read | Black bucket with a red velour centre cushion and back panel; silver aluminium side mounts | Current (on Recaro's nav) | https://www.recaro-automotive.com/fileadmin/01-products/dynamic/pole-position-abe/recaro-pole-position-abe-product.png | [Recaro Pole Position ABE](https://www.recaro-automotive.com/en/dynamic/recaro-pole-position-abe) (page not read) | RZ Crew lists it (price not captured) | [RZ Crew Garage](https://rzcrewgarage.com/products/recaro-pole-position-abe-bucket-seat-perlon-velour-070-77-0184a) (search extract) |
| Recaro | **Podium CF** (also GF, glass fibre) | Universal; ABE/component certification only with Recaro base frame and sidemount | Pad kits M/L: velour black; Alcantara black/leather red; Alcantara red/leather black | Sculpted carbon-shell bucket with cut-outs in the shell and separate bolt-on pads; the product photo shows black pads with red edging | Current | https://www.recaro-automotive.com/fileadmin/01-products/race/podium/recaro-podium-race-product.png | [Recaro Podium CF](https://www.recaro-automotive.com/en/race/recaro-podium-cf) | Not captured | Not confirmed |

Sources for the seat rows:
- **Bride ZETA IV codes, prices and specs:** codes, prices, 7.4 kg, FIA 8855-1999, FRP silver or carbon shells, three colours (gradation, black, red) plus the new black logo, flame-retardant fabric, seat-back protector K17. — [Bride ZETA IV pages](https://brideseats.com/seat/zeta/zeta4_black.html)
- **ZETA IV body size and line-up:** designed for drivers around 170 cm and up to about 80 kg; 560 mm shoulder width; LOWMAX system; smaller Verio/VERIA versions; first renewal in 16 years. Other current ZETA IV models: NUGRAIN, D1 Limited, Classic, REIMS (black/black, black/red, black/blue), Keiichi Tsuchiya editions. — [Bride ZETA series](https://brideseats.com/seat/zeta/)
- **Image filenames:** the photos are named with older codes (HA1AMF, HA1BMF, HA1GMF), while the current codes are HA1ASF, HA1BSF, HA1GSF and the carbon -SC versions. Blackhawk shows the HA1AMF photo on its HA1ASF listing. — [Bride ZETA series](https://brideseats.com/seat/zeta/); [Blackhawk HA1ASF](https://www.blackhawkjapan.sg/products/bride-ha1asf)
- **Recaro RS-G:** "full bucket racing seat" with "nonslip shoulder support", FIA approved and "compliant with the safety regulations of Japan"; key figure 4.5 kg net. — [Recaro RS-G](https://au.recaro-automotive.com/race/recaro-rs-g)
- **Recaro Pole Position N.G.:** GFRP shell, FIA 8855-1999 with five-year approval, about 7.7 kg, for 4-, 5- and 6-point belts. — [Recaro Pole Position N.G.](https://www.recaro-automotive.com/en/race/recaro-pole-position-ng-fia)
- **Recaro Podium CF:** CFRP shell, FIA 8855-1999, ABE/TÜV component certification with a 3-point belt for many vehicles, 4.9 kg net shell, 7.3 kg complete. — [Recaro Podium CF](https://www.recaro-automotive.com/en/race/recaro-podium-cf)
- **Recaro CT9A base frame:** 2083.511.2 (right) needs the TS-G/RS-G/TS-W/RS-W side adapter set 1700000J, bought separately. — [Blackhawk Japan .com](https://www.blackhawkjapan.com/products/recaro-2083-511-2) (search extract); SGD price S$260.17 each side — [Blackhawk SG 2083.511.2](https://www.blackhawkjapan.sg/products/recaro-2083-511-2)
- **Alternative low rail:** an HKS Kansai low-position genuine Recaro rail for the CT9A is also sold. — [JustJap](https://justjap.com/products/hks-kansai-low-position-genuine-recaro-seat-rail-r-h-fits-mitsubishi-lancer-evolution-7-9-ct9a.oembed) (search extract)
- **Recaro's company status:**
  - Recaro Automotive GmbH filed for insolvency in July 2024. Italy's Proma Group bought it around December 2024, and aftermarket seat sales resumed in January 2025. — [Hagerty](https://www.hagerty.co.uk/articles/recaro-saved-from-bankruptcy-by-italian-investors/); [Motor1](https://www.motor1.com/news/743474/recaro-gets-new-investor/); [MarkLines](https://www.marklines.com/en/top500/recaro-automotive-seating) (search extracts)
  - Recaro's operations in Japan and North America carried on as usual during the insolvency. — [Motor1](https://www.motor1.com/news/743389/recaro-automotive-new-investor/) (search extract)

#### 1.2 Seat rails for the CT9A (from Bride's own fitment database)

| Brand | Rail | CT9A part numbers | Notes | Status | Photo (verified) | Price |
|---|---|---|---|---|---|---|
| Bride | **Super seat rail BG** (for full buckets incl. ZETA IV) | **M019BG** (right = driver's side in an RHD car), **M020BG** (left) | "Successor to FG". Same low seat position as FG, with an integrated side stay. Remark "EVO7,8,9の適合" (fits Evo 7, 8 and 9) | Current | https://brideseats.com/seatrail/images/rail/BG.jpg (white background, with dimension callouts 395 mm / 290 mm drawn on the image) | ¥31,900 each; S$217.21 (M019-BG at Blackhawk SG) |
| Bride | FG / IG | M019FG/M020FG, M019IG/M020IG | FG low-position rail; IG is the light, stiff FG | **Discontinued** ("※生産終了") | – | ¥31,900 / ¥35,200 |
| Bride | FX | M019FX / M020FX | FIA-homologated fixed competition rail; "competition only (not road-legal in Japan)" | Current | – | ¥35,200 |
| Bride | XL | M019XL / M020XL | Only for the WIDE seats (ZIEG IV WIDE) | Current | – | ¥38,500 |

Sources:
- **Bride's fitment data:** Bride's car record for "ランサーエボリューションⅦ～Ⅸ" (Evo VII–IX), type CT9A, from Feb 2001, lists every rail above with its price and remarks. The remarks mark FG and IG as discontinued, describe BG as "FGの後継タイプ" (FG's successor), and mark FX as competition-only. — [Bride fitment data for CT9A (MB15196)](https://brideseats.com/_cars/json/MB15196.json); [Bride car list](https://brideseats.com/car_type.json)
- **Why FG ended:** Blackhawk's BG listing says FG ended production because of parts supply, and that BG keeps the same seat position. — [Blackhawk M019-BG](https://www.blackhawkjapan.sg/products/bride-super-seat-rail-right-side-bg-type-for-mitsubishi-lancer-evolution-7-8-9-ct9a-cs-a-m019-bg)
- **Rail renaming notice:** Bride's site carries a banner about rail names and part numbers. FO/FB/FK/LG become BO/BB/BK/CG for factory orders from 1 Dec, and MO/MB/MK become AO/AB/AK from 15 Dec (details in a PDF dated 20 Nov 2026). — [Bride home banner](https://brideseats.com/seat/zeta/); [PDF](https://brideseats.com/news/2026/11/20261120_railnew.pdf) (image-only; text not extracted)
- **Rear passengers and side airbags:** Bride's own simulator notes that a seat-back protector is needed in any car that is not a two-seater, and that cars with side airbags need a part to switch off the warning lamp. — [Bride ZETA IV page (simulator text)](https://brideseats.com/seat/zeta/zeta4_black.html)
- **Retailer codes:** Cusco also sells the Bride CT9A rails under BRDS-M019/M020 codes. — [frsport](https://frsport.com/products/cusco-brds-m020fg-bride-seat-rail-fg-lh-mitsubishi-lancer-evo-7-8-9-cs-ct9a-evo) (search extract)
- **No M041:** a guessed code "M041" does not exist for the CT9A. The CT9A codes are M019 and M020. — [Bride fitment data](https://brideseats.com/_cars/json/MB15196.json)

#### 1.3 Steering wheels

| Brand | Model | Part no. | Variants / size | Look | Status | Photo (verified) | Page URL | Price | Singapore |
|---|---|---|---|---|---|---|---|---|---|
| MOMO | **Prototipo** (black) | P-1 (Japan code) | 347 mm, 43 mm dish. Also P-9 silver 320 mm flat (0 mm dish), P-6/P-7 370 mm, Prototipo 6C, Black Edition | Classic 1970s-style wheel: thin black leather rim with white stitching, three flat black spokes, each pierced with a row of round holes; MOMO horn button | Current | https://cdn.shopify.com/s/files/1/0644/3486/4197/files/p-1_prototipo_bk_w400.jpg?v=1742327588 | [Blackhawk P-1](https://www.blackhawkjapan.sg/products/momo-p-1) | S$255.42 (P-1); S$345.41 (P-9) | Blackhawk Japan SG |
| MOMO | **Mod.69** | M-52 | 347 mm, 37 mm dish, black suede | Medium-dish black suede rim, three black spokes with round lightening holes, MOMO badge on the lower spoke | Current | https://cdn.shopify.com/s/files/1/0644/3486/4197/files/m-52_mod69_ar.png?v=1742327588 | [Blackhawk M-52](https://www.blackhawkjapan.sg/products/momo-m-52) | S$289.87 | Blackhawk Japan SG |
| MOMO | **Mod.07** | M-41 (leather) / M-42 (suede) | 348 mm, 70 mm dish; yellow top-centre marker | Deep-dish rally wheel: black leather or suede rim with a yellow 12 o'clock stripe, black drilled spokes | Current | https://cdn.shopify.com/s/files/1/0644/3486/4197/files/m-41_mod07_ar.png?v=1742327588 | [Blackhawk M-41](https://www.blackhawkjapan.sg/products/momo-m-41) | S$262.25 | Blackhawk Japan SG |
| MOMO | Mod.08 330 | M-70 | 330 mm, 90 mm dish, microfibre, yellow top marker | Very deep dish (no photo on the listing) | Current (60th-anniversary release) | – | [Blackhawk M-70](https://www.blackhawkjapan.sg/products/momo-m-70) | S$284.13 | Blackhawk Japan SG |
| Nardi | **Deep Corn** (wood) | 5069.33.2000 | 330 mm, 53 mm offset; mahogany wood, black spokes | Polished mahogany wooden rim, three black slotted spokes, Nardi horn button | Current (price on request) | https://nardi-personal.com/wp-content/uploads/2021/01/N-Deep-Corn-5069.33.2000-01.jpg (beige studio background) | [Nardi 5069.33.2000](https://nardi-personal.com/product/5069-33-2000/) | On request | Nardi wheels at Blackhawk SG (Japan-market codes) |
| Nardi | **Competition** | 6070.33.2091 (black perforated leather, grey cross-stitch, black anodised spokes); 6070.33.1091 (same with white anodised spokes); 6070.33.2094 (black suede, red cross-stitch, black spokes) | 330 mm | Dished sports wheel: perforated black leather or suede rim with contrast cross-stitching, three anodised spokes, Nardi horn button | Current (price on request) | https://nardi-personal.com/wp-content/uploads/2021/01/N-Competition-6070.33.2091-01.jpg; …/N-Competition-6070.33.2094-01.jpg | [Nardi 6070.33.2091](https://nardi-personal.com/product/6070-33-2091/); [6070.33.2094](https://nardi-personal.com/product/6070-33-2094/) | On request | – |
| Nardi | Classic (Japan-market line) | N110 (black leather, 330 mm), N005 (perforated, red stitch, 330 mm), N100 (wood, 330 mm) | 330–380 mm | Flat classic three-spoke | Current | https://cdn.shopify.com/s/files/1/0644/3486/4197/files/leather_img03.jpg?v=1770478089 (small, 8 KB) | [Blackhawk N110](https://www.blackhawkjapan.sg/products/nardi-n110) | S$392.04 (N110), S$399.96 (N005), S$543.51 (N100) | Blackhawk Japan SG |

Sources:
- **MOMO sizes and colours** come from Blackhawk's listings. They also say the six mounting screws are not included and the screws that come with the boss are used, so these wheels bolt to a six-screw boss such as Works Bell's. — [Blackhawk MOMO P-1](https://www.blackhawkjapan.sg/products/momo-p-1); [M-52](https://www.blackhawkjapan.sg/products/momo-m-52); [M-41](https://www.blackhawkjapan.sg/products/momo-m-41); [M-42](https://www.blackhawkjapan.sg/products/momo-m-42); [M-70](https://www.blackhawkjapan.sg/products/momo-m-70)
- **MOMO's ownership:** Univergomma, an Italian tyre distributor, bought MOMO from MW Company (CB Insights dates the deal to March 2025). — [MOMO news](https://momomotorsport.com/news/mw-company-announces-sale-of-momo-to-univergomma-italy); [CB Insights](https://www.cbinsights.com/company/momo-2) (search extracts)
- **Nardi:** sizes, materials and "price on request" are from Nardi's own pages. Nardi says it supplies hubs "for a good range of cars" on enquiry. — [Nardi hubs](https://nardi-personal.com/product/hubs/)
- **Replicas:** "MOMO-style" replica wheels are sold on Carousell SG for about S$78–99, so check authenticity. — search extract via [Carousell SG](https://www.carousell.sg/nardi/q/)

#### 1.4 Bosses (hubs) and quick releases: Works Bell

| Item | CT9A part no. | Detail | Status | Photo (verified) | Price |
|---|---|---|---|---|---|
| Works Bell **standard boss** (universal hub kit for sports wheels) | **817** if the factory wheel is held on the shaft by a **nut**; **820** if it is held by a **hex socket cap bolt from the side** | Lancer EVO 7/8/9 CT9A, Feb 2001 – Sep 2007 (Japanese-calendar H13/2–H19/9), SRS (airbag) car. Note 10: the boss cover can foul the clock spring. Works Bell warns the airbag warning lamp cannot be turned off on some cars | Current (data as of April 2026) | https://www.worksbell.co.jp/wp-content/uploads/2020/07/b51e1c2f9319eeb9570cbb61d9ae7064-2.png (needs a browser-like `Accept` header; a bare request gets HTTP 415); Blackhawk copy: https://cdn.shopify.com/s/files/1/0644/3486/4197/files/Works-Bell-Hub-Adapter-Regular_7a6ac23f-421e-4b47-baeb-77bed4d91dd3.jpg?v=1770518261 | 820: S$135.83 (Blackhawk lists it as "LANCER EVO EVO7 8 9 CT9A"); 817: S$108.60 |
| Works Bell **Rapfix short boss** | **817S / 820S** | 817S is 65 mm long, 20 mm shorter than 817, for Mitsubishi cars with an airbag. Used with Rapfix so the wheel does not sit too close to the driver | Current | https://www.worksbell.co.jp/wp-content/uploads/2020/07/b51e1c2f9319eeb9570cbb61d9ae7064-1.png | 817S: S$117.71 |
| Works Bell **Rapfix II** quick release | Universal (fits on the boss) | Ball-lock quick release; locks in the top position; the horn contact connects with the wheel; anodised colour choices | **Orders temporarily suspended** (parts supply) | – | ¥36,080; Rapfix2 orange S$296.90 at Blackhawk SG |

Sources:
- **817/820 choice, years, SRS, note 10 and the April 2026 date:** [Works Bell Mitsubishi PDF](https://www.worksbell.co.jp/pdf/matching/mitsubishi.pdf)
- **817S and 820S:** both appear in Works Bell's short-boss airbag-canceller table. — [Works Bell canceller (short)](https://www.worksbell.co.jp/pdf/matching/airbag_canceller_short.pdf)
- **817S length** (65 mm, 20 mm shorter than 817): [Blackhawk 817S](https://www.blackhawkjapan.sg/products/works-bell-817s)
- **820 listed for the CT9A:** [Blackhawk 820](https://www.blackhawkjapan.sg/products/works-bell-820-5)
- **Rapfix II** price, order pause, features and Japanese patents: [Works Bell Rapfix II](https://www.worksbell.co.jp/products_detail/rapfix-2/)
- **Purpose of the short boss:** [Works Bell short boss](https://www.worksbell.co.jp/products_detail/short-boss/)
- **Conflict:** JustJap sells "817S" as a non-airbag boss "for the RS only". — [JustJap 817S](https://justjap.com/products/works-bell-steering-wheel-boss-kit-short-type-mitsubishi-evo-ct9a-rs) (search extract). This is contradicted by Works Bell's canceller table and Blackhawk, which describe 817S as the short version of 817 for Mitsubishi cars **with** an airbag.

#### 1.5 Gauges

| Brand | Model | Part no. (examples) | Variants | Look | Status | Photo (verified) | Page URL | Price |
|---|---|---|---|---|---|---|---|---|
| Defi | **ADVANCE BF** | Turbo 200 kPa amber red **DF09902**; oil pressure blue DF10203; fuel pressure white DF10301; 80 mm tacho amber red DF10902 / blue DF11003 | 60 mm gauges and 80 mm tacho. JDM: white, amber red or blue light (fixed per gauge); USDM: amber red only. Turbo, intake manifold, oil and fuel pressure, oil, water and exhaust temperature, tacho | Black dial behind flat glass, bright lit numerals (red, white or blue), red needle, chrome bezel ring, "Defi" logo and "ADVANCE SYS. BF" on the dial; start-up "opening mode" needle sweep | Current. Needs the ADVANCE Control Unit SE (DF17701); not compatible with the older Defi-Link system | https://www.defi-shop.com/wp-content/themes/defi/img/product/advance_bf/tb200ar-L.jpg (also tb120wh-L.jpg, tb120bl-L.jpg) | [Defi ADVANCE BF](https://www.defi-shop.com/products/advance_bf) | DF09902 S$213.84; DF10203 S$249.48; Control Unit SE S$131.57 |
| Defi | **ADVANCE A1** | Turbo 200 kPa **DF14801** (no sensor: DF14802); 300 kPa DF14901; 80 mm tacho DF17601 (9,000 rpm) / DF15501 (11,000 rpm) | 60 mm gauges; 80 mm tachos | Premium dark metallic dial with fine circular hairlines and a raised scale ring, white numerals that stay invisible until the ignition is on, low-reflection glass, polished bezel | Current. Needs the Control Unit SE | https://www.defi-shop.com/wp-content/themes/defi/img/product/advance_a1/df14801.webp | [Defi ADVANCE A1](https://www.defi-shop.com/products/advance_a1) | DF14801 S$241.56 |
| GReddy | **Sirius Meter** turbo boost | **16001730** (Sirius Unify set 16001740; OBD set 16001755) | **74 mm** dial; also water temp, oil temp, oil pressure, fuel pressure | Large black dial with white scale and red needle, 3D layered face, on a black pedestal cup; white LED, red when warning | "Special order" | https://cdn.shopify.com/s/files/1/1668/8171/files/16001730_TB_H.jpg?v=1712122422 | [GReddy 16001730](https://greddy.com/products/sirius-meter-turbo-boost-16001730) | US$310.00 |
| Prosport | **Premium EVO 52 mm** boost | **216EVOBO-PK-R.PSI** | 52 mm. Four colours in one gauge (red, blue, green, white). Also EGT, oil, water, fuel, volts | Black face, large digital readout in the centre, LED ring around it, chrome bezel, Prosport logo | Current | https://cdn.shopify.com/s/files/1/0310/8198/8236/files/Boost.1.png?v=1739824698 | [Prosport boost](https://prosportgauges.com/products/2-1-16-premium-evo-electrical-boost-gauge) | US$137.50 |
| Prosport | Premium EVO 52 mm **wideband AFR kit** | **216EVOAFRPK4.9-WO** | Bosch LSU 4.9 sensor, reads 10.0–20.0 AFR, 0–5 V output | As above, with a lit LED bar graph around a digital AFR readout | Current | https://cdn.shopify.com/s/files/1/0310/8198/8236/files/afr_52b565b9-f69c-433a-8401-18734919d1ed.jpg?v=1739824793 | [Prosport AFR](https://prosportgauges.com/products/2-1-16-premium-evo-wideband-digital-air-fuel-ratio-kit) | US$254.00 |
| AEM | **X-Series wideband UEGO AFR gauge** | **30-0300** (a 30-0334 also exists; its difference is not confirmed) | 52 mm; Bosch LSU 4.9; 0–5 V, AEMnet CAN and RS-232 outputs | 52 mm gauge, black face and bezel, red digital AFR digits over a 24-LED arc (a white-face version is in the same photo) | Current | https://cdn.shopify.com/s/files/1/0644/3486/4197/files/30-0300-product-image_e5c1e7cf-2f2f-4a84-bb3d-1176b04f7357.jpg?v=1792374789 (retailer-hosted) | [NZ Performance](https://nzperformance.co.nz/products/aem300300); [Blackhawk](https://www.blackhawkjapan.sg/products/aem-aem-uego-wideband-air-fuel-ratio-sensor-replacement-sensor-main-gauge-30-0300-for-69501202) | S$402.32 (Blackhawk); NZ$449 (NZ Performance); US$199.95 at AEM, US$222.95 at retailers (search extract) |

Sources:
- **Defi BF:** colours, sizes, control unit, and incompatibility with Defi-Link. — [Defi ADVANCE BF](https://www.defi-shop.com/products/advance_bf)
- **Defi A1:** the dial, numerals hidden until ignition, sizes and tachos. The page calls the scale "convex" in one place and "concave" in another. — [Defi ADVANCE A1](https://www.defi-shop.com/products/advance_a1)
- **Defi SGD prices:** [Blackhawk DF09902](https://www.blackhawkjapan.sg/products/defi-df09902); [DF14801](https://www.blackhawkjapan.sg/products/defi-df14801); [DF17701](https://www.blackhawkjapan.sg/products/defi-df17701)
- **GReddy Sirius:** "special order", range −0.99 to 2.5, peak hold, white/red LED. — [GReddy](https://greddy.com/products/sirius-meter-turbo-boost-16001730)
- **GReddy size:** the 74 mm diameter appears on retailer pages. — [CARiD](https://www.carid.com/greddy/custom-gauges/) (search extract)
- **Prosport** SKUs, prices and features: [Prosport boost](https://prosportgauges.com/products/2-1-16-premium-evo-electrical-boost-gauge); [Prosport AFR](https://prosportgauges.com/products/2-1-16-premium-evo-wideband-digital-air-fuel-ratio-kit)
- **AEM features:** [NZ Performance AEM 30-0300](https://nzperformance.co.nz/products/aem300300); 24 LEDs and up to 16 V input — [Blackhawk AEM](https://www.blackhawkjapan.sg/products/aem-aem-uego-wideband-air-fuel-ratio-sensor-replacement-sensor-main-gauge-30-0300-for-69501202)
- **AEM AFR scale** (8.5–18.0:1), black bezel and face: [Jegs](https://Jegs.com/i/AEM/017/30-0300/10002/-1) (search extract)

#### 1.6 A-pillar gauge pods for the Evo 8/9 (the Evo IX shares the Evo VIII's A-pillar per the listings)

| Brand | Pod | Part no. | Fitment as listed | Look | Photo | Price |
|---|---|---|---|---|---|---|
| Autometer | Dual full A-pillar pod | **22618** | "Fits all Mitsubishi Lancer EVO 8"; 2 × 52 mm; black, with tweeter cut-out | Black moulded pillar trim with two 52 mm cups | Only a 2.9 KB placeholder GIF on LancerShop (not usable) | US$93.09 ([LancerShop](https://lancershop.com/products/autometer-dual-full-a-pillar-gauge-pod-lancer-evo)) |
| Autometer | Triple full A-pillar pod | **22619** | Evo 8, 3 × 52 mm, black, tweeter cut-out | Three stacked cups | Placeholder GIF only | US$100.35 ([LancerShop](https://lancershop.com/products/autometer-triple-full-a-pillar-gauge-pod-lancer-evo)) |
| Autometer | Single pod | 20619 | 2003–2007 Evo 8/9, one 2-1/16 in gauge | – | – | Vivid Racing (search extract) |
| LancerShop | Dual EVO grey A-pillar **60 mm** pod, no cut-out | lot.2p.60c | **Evo 8/9**; 2 × 60 mm (fits Defi); grey, painted to match the factory trim | Grey pillar trim with two 60 mm cups | https://cdn.shopify.com/s/files/1/0701/0405/5868/files/image_3a1b13b4-977a-408a-a044-5e2a3c23737f.png?v=1765303329 (only 118 × 114 px) | US$55.14 ([LancerShop](https://lancershop.com/products/dual-evo-grey-a-pillar-60mm-gauge-pod-without-cutout)) |
| Rexpeed | Carbon double pillar pod | – | **LHD**, Evo 8/9 | Carbon fibre | Listing image | US$322 ([LancerShop](https://lancershop.com/products/rexpeed-carbon-fiber-double-pillar-gauge-pod-lhd-evo-8-9)) |
| Various (eBay) | Carbon triple 52 mm pod, **RHD** | – | Evo 7/8/9 RHD | Carbon | – | [eBay.de listing](https://www.ebay.de/itm/266407644489) (search extract) |

Sources:
- **Autometer and LancerShop pods:** [LancerShop pillar pods](https://lancershop.com/products/autometer-dual-full-a-pillar-gauge-pod-lancer-evo); [Vivid Racing Autometer single](https://www.vividracing.com/autometer-gauge-mount-apillar-pod-single-116in-mitsubishi-evo-0307-mitsubishi-lancer-20032006-p-151806222.html) (search extract)
- **GlowShift triple pod:** fits 2003–2007 Evo VIII/IX, with a speaker cut-out. — search extract summarising GlowShift and eBay listings, [eBay category](https://www.ebay.com/b/EVO-Car-Truck-Instrument-Gauge-Parts-for-Mitsubishi/bn_19922071)
- **Evo X pods** do not fit the Evo 7–9 pillars. — same search extract

#### 1.7 Shift knobs

| Brand | Model | Part no. | Evo IX fitment | Look | Status | Photo (verified) | Price |
|---|---|---|---|---|---|---|---|
| Ralliart (Mitsubishi) | Ralliart shift knob | **MZ525618** (5MT; Evo 7–9 MR / Colt Ralliart) | The listing covers the 5-speed. No genuine part number found for the 6-speed knob | Not documented here | Used or old stock on eBay only; no current Mitsubishi listing found | None found | 6-speed Ralliart knobs listed at about US$60–100 (search extract) |
| RAZO (Carmate) | **Carbon Look Knob R 60 BK** | **RA135** | Razo names the "ランエボ(CT9A)" **6MT with reverse ring**; shaft threads M6/M8/M10/M12 | Ball knob in carbon-fibre-look weave with a RAZO logo on top; 60 g; super-low position | Current | https://razo.jp/product/.assets/thumbnail/RA135-800wi.jpg | ¥3,630 |
| RAZO | Carbon Look Knob R 240 BK | **RA136** | CT9A 6MT with reverse ring; M8/M10/M12; fitting part RAP11 | The same ball look with a heavy die-cast body, 240 g | Current | https://razo.jp/product/.assets/thumbnail/RA136-800wi.jpg | ¥4,400 |
| RAZO | Leather Knob R 240 red stitch | **RA128RE** | CT9A 6MT with reverse ring; M8/M10/M12 | Black leather ball with a hand-sewn red stitch seam (sewn in Japan), 240 g | Current. The blue-stitch and black versions appear to be marked "製造終了" (production ended) | https://razo.jp/product/.assets/thumbnail/RA128RE-800wi.jpg | ¥4,798 |
| RAZO | GT Advance Knob 2 340G | **RA131** | "Ring-type 6MT (… Lancer Evo …)"; M8/M10/M12; RAP03 | Short black gun-grip knob, 340 g, polished metal collar | Current | https://razo.jp/product/.assets/thumbnail/RA131-800wi.jpg | Not captured |
| Raceseng | (all models) | – | – | – | **Company closed** ("RACESENG IS CLOSED!"); liquidation sale at 70% off; the store's product feed lists **0 products** | None | – |

Sources:
- **RAZO** models, weights, threads, CT9A notes and yen prices: [RAZO shift knobs](https://razo.jp/product/shiftknob/)
- **Raceseng:** [Raceseng liquidation page](https://raceseng.com/pages/raceseng-liquidation-sale); [Raceseng products.json](https://raceseng.com/products.json?limit=250) returned an empty list
- **Ralliart MZ525618:** a Japanese eBay seller's listing for the 5MT knob, found in a search summary; the exact listing URL was not confirmed (one candidate: [eBay](https://ebay.com/itm/153830529529)). Search extract.
- **Thread size:** Torque Solution says M10×1.25 fits "most Mitsubishi (DSM, Evo, 3000GT)", and Cobb's chart lists an Evo knob at M10×1.25. — [STM Tuned / Torque Solution](https://stmtuned.com/products/torque-solution-billet-aluminum-shift-knobs); [Cobb thread chart](https://cobbtuning.atlassian.net/wiki/spaces/PRS/pages/4132306954/COBB+Shift+Knob+Thread+Pitch) (search extracts)

#### 1.8 Roll cages: Cusco (SAFETY 21 is Cusco's own cage line)

| Series | CT9A code | Points / seats / front | Price (Blackhawk SG) |
|---|---|---|---|
| SAFETY 21 | 564 270 **A20** | 4-point rear cage, 5 seats (keeps the rear bench) | S$570.34 |
| SAFETY 21 | 564 270 D20 | – | S$678.94 |
| SAFETY 21 | 564 270 **E20** / 564 290 E20 | 6-point, 2 seats, dash-**escape** / dash-**through** | S$860.01 |
| SAFETY 21 | 564 270 B20 / 564 290 B20 | – | S$860.01 |
| SAFETY 21 | 564 270 **F20** / 564 290 F20 | 7-point, 2 seats, escape / through | S$1,004.85 |
| SAFETY 21 | 564 270 L20 / 564 290 L20 | – | S$1,004.85 |
| SAFETY 21 | 564 270 G20 / 564 290 G20 | – | S$1,194.93 |
| SAFETY 21 | 564 270 W10 / 564 290 W10 | "Works" type | S$1,312.54 |
| SAFETY 21 | 564 270 W12 / 564 290 W12 | Works type | S$1,466.49 |
| SAFETY 21 | 564 270 **W13** / 564 290 **W13** | 13-point "Works type", 2 seats, escape / through | S$1,556.97 |
| Cusco D1 (chromoly) | 564 261 A / 564 261 B / 564 261 G / 564 265 G / 564 265 L | – | S$678.94 / 1,050.09 / 1,330.66 / 1,330.66 / 1,194.93 |

Every CT9A cage above is listed for "Lancer Evolution CT9A (Evo 7/8/8MR/9/9MR) (sunroof Ex)", meaning cars without a sunroof.

Photos (verified):
- Cusco's own photo of a black cage on a grey studio background: https://www.cusco.co.jp/catalog/img/rollcage/safety21_01.jpg (350 × 230, small)
- Cusco's illustration of the point layouts, with Japanese labels and prices: https://www.cusco.co.jp/catalog/assets_c/2024/06/safety21_illust_01_2024-thumb-1000x788-74991.jpg

Sources:
- **Code meanings:** "front shape: escape" for 564 270 and "through" for 564 290; points and seats per suffix (A20 = 4-point, 5 seats; E20 = 6-point, 2 seats; F20 = 7-point, 2 seats; W13 = 13-point Works type, 2 seats); "(sunroof Ex)" on every CT9A code. — [Blackhawk 564 270 A20](https://www.blackhawkjapan.sg/products/cusco-564-270-a20); [564 270 E20](https://www.blackhawkjapan.sg/products/cusco-564-270-e20); [564 290 E20](https://www.blackhawkjapan.sg/products/cusco-564-290-e20); [564 270 F20](https://www.blackhawkjapan.sg/products/cusco-564-270-f20); [564 270 W13](https://www.blackhawkjapan.sg/products/cusco-564-270-w13); [564 290 W13](https://www.blackhawkjapan.sg/products/cusco-564-290-w13)
- **Cusco's own SAFETY 21 specification:**
  - 40 mm cold-drawn seamless carbon steel tube (JIS STKM13C), 2.0 mm wall, tensile strength of at least 510 N/mm².
  - Mounting plates of at least 60 cm² × 2.6 mm; reinforcement plates of at least 120 cm² × 3.2 mm (the page prints "m²", evidently a typo).
  - Front hoop designed not to block the driver's view.
  - **Not allowed in FIA-sanctioned events.**
  - Optional colours at extra cost: white, red, titanium and Cusco blue.
  - Price depends only on the number of points, not on the car.
  - The CT9A is on the list for the B-pillar mounting option (+¥4,620 incl. tax).
  - Cusco's separate ASN-homologated cages are **fully welded in**. — [Cusco SAFETY 21](https://www.cusco.co.jp/catalog/rollcage/safety21.html)
- **Cusco's official prices** (tax included, from its illustration): rear 4-point ¥69,300 (13.0 kg); rear 5-point ¥82,500 (16.0 kg); 6-point ¥104,500 (24.0 kg); 7-point ¥121,000 (27.0 kg); 8-point ¥134,200 (30.0 kg). — [Cusco SAFETY 21 illustration](https://www.cusco.co.jp/catalog/assets_c/2024/06/safety21_illust_01_2024-thumb-1000x788-74991.jpg) (read from the image)
- **Cusco D1 roll bar:** chromoly steel, 33% lighter. — [Cusco roll cage index](https://www.cusco.co.jp/catalog/rollcage/)
- **US price:** Vivid Racing lists 564 290 W13 at US$1,872. — [Vivid Racing](https://stg.vividracing.com/cusco-safety-13point-2passenger-dashthrough-roll-cage-mitsubishi-evolution-20012007-p-156484180.html) (search extract)

#### 1.9 Harnesses

| Brand | Model | Part no. | Homologation | Variants | Look | Photo (verified) | Page |
|---|---|---|---|---|---|---|---|
| Sabelt | **SILVER Rally** (6-point, GT/rally) | **CFCI4210A622SU2F** | FIA 8853-2016 | Red, black, blue. Full-length 2 in webbing, patented B2 buckle, light A2 quick adjusters | Red 2 in straps, yellow Sabelt labels on the shoulder straps, round silver turn buckle at the centre | https://catalogue.sabelt.com/182-large_default/silver-rally.jpg | [Sabelt SILVER Rally](https://catalogue.sabelt.com/seatbelts/156-244-silver-rally.html) |
| Sabelt | **Steel Rally 3x3** (6-point) | **CFCI4335S633SU2F** | FIA 8853-2016 | Red, black, blue. Full-length 3 in webbing, steel A5 adjusters | Wider red 3 in straps, same layout | https://catalogue.sabelt.com/187-large_default/steel-rally-3x3.jpg | [Sabelt Steel Rally 3x3](https://catalogue.sabelt.com/seatbelts/161-259-steel-rally-3x3.html) |
| Sabelt | **4-point Clubman** (saloon) | **CFCC904001NP_A** (also CFCC4046, CFCC904002NP_A, CFCC904005N_B, CFCC904059NP_B, CFCC904070NP_B) | **ECE** | Red, black, blue. Shoulder pads included | Red 4-point belt with yellow Sabelt logos on the shoulder pads | https://catalogue.sabelt.com/171-large_default/cfcc904001npa.jpg | [Sabelt CFCC904001NP_A](https://catalogue.sabelt.com/seatbelts/145-211-cfcc904001npa.html) |
| Schroth | **Profi 2x2** (6-point) | **94550A-0**, **94550A-2** (colour codes) | FIA 8853-2016; made for FHR (HANS) use | 2 in lap belts, pull-up adjusters | Black straps, yellow Schroth labels, cam-lock buckle | https://www.schroth.com/assets/images/0/94550a-0_profi_2x2_fwu-kqkg7sxfpatgczx.jpg | [Schroth Profi 2x2](https://www.schroth.com/en/racing/racing/details/show/profi-2x2/) |
| Schroth | **Rallye 4 asm** (street-legal 4-point) | **16090E** (left) / **16590E** (right) | **ECE, FMVSS** | 2 in webbing with black flock; asm anti-submarining system; V-shaped quick-release tail strap | Black 4-point with a V-shaped rear strap. The file name says "red" but the photo shows black straps | https://www.schroth.com/assets/images/q/10012_Rallye_4_asm_red-pzqqmn4qaxmkkb4.jpg | [Schroth Rallye 4 asm](https://www.schroth.com/en/racing/street-legal/details/show/rallye-4-asm-2/) |

Sources:
- **Sabelt:** part numbers, homologations and colours. — [Sabelt catalogue, 6-point](https://catalogue.sabelt.com/12-6-points-seatbelt); [4-point Clubman](https://catalogue.sabelt.com/14-4-points-clubman)
- **Schroth line-up:**
  - Racing 6-point harnesses: Profi, Enduro, Flexi, Formula and Clubman 2x2.
  - Street-legal: Profi II-FE asm, asm autocontrol II, and Rallye 3, Rallye 4 and Rallye Cross asm. — [Schroth racing harnesses](https://www.schroth.com/en/racing/racing/t/harness-restraints/); [Schroth street-legal](https://www.schroth.com/en/racing/street-legal/t/harness-restraints-2/)

### Inferences
- **What shows in each of the four configurator views** (inferred from the parts' geometry and the RHD layout):
  - **Dashboard from the rear seat:** the backs of the front seats (a bare bucket shell, or Bride's seat-back protector panel), harness shoulder straps running back to a cage cross-bar or harness bar, the cage's front hoop and dash bar, the back of the steering wheel and the quick release, the A-pillar pod, and the dash gauges.
  - **Front seats through the open driver's door:** the side of each bucket and its rail or sidemount, the harness lap belt and buckle, the cage door bars (Works-type cages), the side of the steering wheel's dish, and the shift knob.
  - **Rear bench:** a 5-seat cage (564 270 A20, the rear 4-point) keeps the bench. Every 6-point-plus code listed is a 2-seat cage, so the bench would be removed and the rear hoop, diagonals and harness bar take its place.
  - **Steering wheel and gauges from the driver's seat:** the wheel face (rim material, spokes, horn button, top marker), the Rapfix collar, the gauges and pod on the **right** A-pillar (RHD), and the knob to the driver's left.
- **Pods must match the gauges and the car:**
  - Defi BF and A1 are 60 mm, so they need a 60 mm pod such as LancerShop's lot.2p.60c. Prosport and AEM are 52 mm, so they suit the Autometer 22618/22619 or a 52 mm pod. GReddy's Sirius (74 mm) is a stand-alone dash-top gauge.
  - Most US pods are LHD. For an RHD Singapore car the photo should put the pod on the right (driver's) A-pillar, and the part bought must be an RHD pod.
- **Seats:** for the configurator, offer ZETA IV black, red and gradation on BG rails as the main seat options, with Recaro RS-G as the Japanese-market Recaro option. The Pole Position N.G. and Podium are FIA seats aimed at track builds, which lines up with the LTA rule that seats must use the car's original anchorage points (see section 4).
- **Steering wheel set:** a complete "aftermarket wheel" option on the CT9A is a MOMO or Nardi wheel, plus a Works Bell 817/820 boss (or 817S/820S with Rapfix), plus an airbag canceller. Because the Rapfix II is paused, a Rapfix option should be marked "subject to availability".
- **Shift knob thread:** Razo explicitly lists the CT9A 6MT with reverse ring. 5-speed CT9As (an RS, for example) would most likely take M10×1.25 knobs per the Torque Solution note, but this was not confirmed for the Evo IX 5MT.

### Gaps
- **Recaro CT9A base frame:** Blackhawk titles 2083.511.1/.2 "Lancer / Lancer Cedia CT9A W". It is not confirmed that this frame is for the Evo IX rather than another CT9A-coded Lancer. Confirm with Recaro Japan's base-frame list.
- **MOMO's own pages** (`momo.com`, `momomotorsport.com`) refused this session, so the current official MOMO catalogue, its colours and MOMO's own hub numbers for the CT9A were not read.
- **AEM 30-0334:** how it differs from 30-0300 was not confirmed (aemelectronics.com was blocked).
- **No genuine Ralliart part number for the Evo IX 6MT knob was found.** The MZ525618 5MT listing came only through a search summary.
- **Exact factory transmission per grade** (GSR 6MT versus RS/GT 5MT, and UK FQ models) was not confirmed from a primary source.
- **Unnamed Cusco codes:** the point layouts for 564 270 B20, D20, G20 and L20, and for W10/W12, were not given in the listings read.
- **Recaro Pole Position ABE and Podium:** prices and the full Pole Position ABE page were not captured.
- **RAZO RA131** price was not captured.
- **Sabelt and Schroth** list no prices on their official catalogues.
- **Raceseng:** no model list survives on its site, so its knobs cannot be catalogued.

## 2. Official product photo per model (direct image URL plus page URL, verified with `curl -sIL`)

### Takeaway
Almost every model has a verified, plain-background photo from its maker: Bride, Recaro (transparent PNG cut-outs), Nardi, Works Bell, Defi, GReddy, Prosport, RAZO, Cusco, Sabelt and Schroth. MOMO and AEM photos come from retailers (Blackhawk Japan's Shopify CDN, NZ Performance) because the makers' sites refused this session. There is **no usable photo** for the Autometer Evo pods (2.9 KB placeholders), Raceseng (store empty) or the Ralliart knob. Brand logos sit on most of the products themselves, and none of the checked images carries a retailer watermark.

### Cited Findings
Results of `curl -sIL` (final status | content type | size) for the URLs in section 1:
- **Bride:**
  - ZETA IV black: 200 | image/jpeg | 90,190 B
  - Red: 200 | image/jpeg | 105,244 B
  - Gradation: 200 | image/jpeg | 101,056 B
  - Black logo: 200 | image/jpeg | 141,875 B (1500 × 1500)
  - BG rail: 200 | image/jpeg | 14,977 B
  - White backgrounds; the BRIDE wordmark is part of the seat; the rail photo carries drawn dimension lines. — [Bride ZETA](https://brideseats.com/seat/zeta/)
- **Recaro:**
  - RS-G: 200 | image/png | 49,962 B
  - RS-G GK: 200 | image/png | 133,673 B
  - Pole Position N.G.: 200 | image/png | 62,303 B
  - Pole Position ABE: 200 | image/png | 41,529 B
  - Podium CF (race): 200 | image/png | 183,618 B
  - Podium (dynamic, front): 200 | image/png | 170,054 B
  - All 480 × 480 cut-outs with RECARO wordmarks on the seats. — [Recaro RS-G](https://au.recaro-automotive.com/race/recaro-rs-g); [Pole Position N.G.](https://www.recaro-automotive.com/en/race/recaro-pole-position-ng-fia); [Podium CF](https://www.recaro-automotive.com/en/race/recaro-podium-cf)
- **Nardi:**
  - Deep Corn: 200 | image/jpeg | 44,713 B (900 × 600)
  - Competition 2091: 200 | image/jpeg | 73,934 B (1280 × 960)
  - Competition 2094: 200 | image/jpeg | 63,303 B
  - Classic flat 5061.36.3001: 200 | image/jpeg | 261,813 B
  - Deep Corn and Competition 2091 are on a beige studio backdrop, not plain white; the Nardi logo is on the horn button. — [Nardi](https://nardi-personal.com/product/5069-33-2000/)
- **MOMO (via Blackhawk's CDN):**
  - P-1: 200 | image/jpeg | 18,592 B (400 × 400)
  - Mod.69: 200 | image/png | 114,237 B
  - Mod.07 M-41: 200 | image/png | 112,262 B
  - Mod.07 M-42: 200 | image/png | 105,291 B
  - White or transparent backgrounds; MOMO logo on the horn button and spoke; small at 400 px. — [Blackhawk MOMO](https://www.blackhawkjapan.sg/products/momo-p-1)
- **Works Bell:**
  - Standard boss (-2.png): 200 | image/png | 441,460 B with a browser `Accept` header; HTTP 415 without one.
  - Short boss (-1.png): 200 | image/png | 748,605 B (368 × 367)
  - Blackhawk copy: 200 | image/jpeg | 17,246 B
  - Transparent cut-outs of a ribbed black hub with a polished aluminium top; the Works Bell mark is engraved on the hub. — [Works Bell boss](https://www.worksbell.co.jp/products_detail/boss/); [short boss](https://www.worksbell.co.jp/products_detail/short-boss/)
- **Defi:**
  - BF turbo amber red: 200 | image/jpeg | 34,505 B
  - BF white: 200 | image/jpeg | 32,692 B
  - BF blue: 200 | image/jpeg | 36,624 B
  - A1: 200 | image/webp | 39,772 B
  - White backgrounds; "Defi" is printed on the dial. — [Defi](https://www.defi-shop.com/products/advance_bf)
- **GReddy:** Sirius 16001730: 200 | image/jpeg | 77,437 B (2148 × 1400), white background. — [GReddy](https://greddy.com/products/sirius-meter-turbo-boost-16001730)
- **Prosport:**
  - Boost: 200 | image/png | 588,382 B
  - AFR: 200 | image/jpeg | 103,250 B
  - Both are composites showing all four colour options on white. — [Prosport](https://prosportgauges.com/collections/2-1-16-52mm-evo-premium)
- **AEM:**
  - Blackhawk-hosted 30-0300: 200 | image/jpeg | 23,759 B (400 × 250; white and black versions side by side, AEM logo)
  - NZ Performance-hosted: 200 | image/jpeg | 219,481 B — [Blackhawk AEM](https://www.blackhawkjapan.sg/products/aem-aem-uego-wideband-air-fuel-ratio-sensor-replacement-sensor-main-gauge-30-0300-for-69501202); [NZ Performance](https://nzperformance.co.nz/products/aem300300)
- **Pods:**
  - Autometer triple and dual (LancerShop-hosted GIFs): 200 | image/gif | 2,948 B each, too small to be real photos.
  - Grey 60 mm pod: 200 | image/png | 9,456 B (118 × 114). — [LancerShop](https://lancershop.com/products/dual-evo-grey-a-pillar-60mm-gauge-pod-without-cutout)
- **RAZO:**
  - RA135: 200 | image/jpeg | 99,983 B
  - RA136: 200 | image/jpeg | 98,163 B
  - RA128RE: 200 | image/jpeg | 69,385 B
  - RA131: 200 | image/jpeg | 32,700 B
  - 800 × 800 on white; the RAZO logo shows on the RA135 top and RA131 base. — [RAZO](https://razo.jp/product/shiftknob/)
- **Cusco:**
  - SAFETY 21 photo: 200 | image/jpeg | 30,497 B (350 × 230, grey gradient background)
  - Illustration: 200 | image/jpeg | 171,426 B (Japanese text and prices)
  - Blackhawk's generic cage image: 200 | image/jpeg | 19,143 B, marked "for illustration purpose only". — [Cusco SAFETY 21](https://www.cusco.co.jp/catalog/rollcage/safety21.html); [Blackhawk](https://www.blackhawkjapan.sg/products/cusco-564-270-e20)
- **Sabelt:**
  - SILVER Rally: 200 | image/jpeg | 104,744 B
  - Steel Rally 3x3: 200 | image/jpeg | 115,358 B
  - CFCC904001NP_A: 200 | image/jpeg | 87,638 B
  - 1000 × 1000 on white; Sabelt logos are on the strap labels. — [Sabelt](https://catalogue.sabelt.com/12-6-points-seatbelt)
- **Schroth:**
  - Profi 2x2: 200 | image/jpeg | 21,633 B
  - Rallye 4 asm: 200 | image/jpeg | 17,516 B
  - On white; Schroth labels on the straps. — [Schroth Profi 2x2](https://www.schroth.com/en/racing/racing/details/show/profi-2x2/)
- **Recaro RS-GS (Blackhawk):** 200 | image/jpeg | 18,751 B. — [Blackhawk RS-GS](https://www.blackhawkjapan.sg/products/recaro-81-081-20-867-0)

### Inferences
- **Best references for Kling-style image edits** are the cut-out PNGs (Recaro, Works Bell) and the white-background shots (Bride, Defi, RAZO, Sabelt, Schroth). The Nardi wood wheel's beige backdrop, the small MOMO renders (400 px) and the tiny Cusco photo will need care.
- **The "no text on the car" brief:** BRIDE, RECARO, MOMO, Nardi, Defi, RAZO, Sabelt and Schroth logos are printed or embroidered on the products themselves. This is the same issue the earlier HKS/Tomei/ENDLESS parts raised.
- **Copyright:** all of these photos belong to the manufacturers. The retailer-hosted MOMO and AEM images are most likely the makers' own press renders, but that is not confirmed.

### Gaps
- No usable photo was found for the Autometer 22618/22619 Evo pods (autometer.com returned a Cloudflare 403) or for any RHD Evo IX pod.
- No official photo was found for the Ralliart MZ525618 knob or for any Raceseng knob.
- MOMO's and AEM's own image servers were not reachable in this session, so the photos above are retailer-hosted copies.

## 3. Rough prices (internal reference) and how each brand is sold in Singapore

### Takeaway
One Singapore web store, **Blackhawk Japan (blackhawkjapan.sg)**, stocks nearly every Japanese brand on the list with SGD prices: Bride (it describes itself as a BRIDE Meister shop), Recaro Japan seats and rails, MOMO, Nardi, Works Bell, Defi, AEM and Cusco cages. **RZ Crew Garage** sells Bride and Recaro with import taxes included for Singapore and Malaysia, and **Carousell** carries used seats and replica wheels. No official Singapore distributor was confirmed for any brand on this list. Rough SGD prices before fitting:

| Part | SGD |
|---|---|
| ZETA IV | about S$980–1,050 |
| A pair of Bride BG rails | about S$435 |
| MOMO or Nardi wheel | S$255–545 |
| Works Bell boss | about S$110–135 |
| Defi gauge | about S$185–250 each, plus a S$132 control unit |
| Cusco SAFETY 21 cage | S$570 (rear 4-point) to S$1,557 (13-point) |

### Cited Findings
**Prices in SGD (Blackhawk Japan SG, Nov 2026, read from product JSON):**
- **Bride:**
  - ZETA IV black FRP HA1ASF: S$982.08 — [link](https://www.blackhawkjapan.sg/products/bride-ha1asf)
  - Gradation HA1GSF: S$1,053.36 — [link](https://www.blackhawkjapan.sg/products/bride-ha1gsf)
  - M019-BG rail: S$217.21 — [link](https://www.blackhawkjapan.sg/products/bride-super-seat-rail-right-side-bg-type-for-mitsubishi-lancer-evolution-7-8-9-ct9a-cs-a-m019-bg)
- **Recaro:**
  - RS-GS black 81-081.20.867-0: S$1,303.53 — [link](https://www.blackhawkjapan.sg/products/recaro-81-081-20-867-0)
  - RS-GS without FIA: S$1,252.65
  - RS-G CL black: S$1,359.27
  - RS-GS GK blue/black and red/black: S$1,374.81 each
  - Base frames 2083.511.1/.2: S$260.17 each — [link](https://www.blackhawkjapan.sg/products/recaro-2083-511-1)
- **MOMO:**
  - Prototipo P-1: S$255.42
  - P-9: S$345.41
  - Prototipo 6C: S$706.96
  - Mod.69 M-52: S$289.87
  - Mod.07 M-41/M-42: S$262.25
  - Mod.08 330 M-70: S$284.13
  - Tomei × MOMO Mod.08: S$659.34 — [Blackhawk MOMO](https://www.blackhawkjapan.sg/products/momo-p-3)
- **Nardi:**
  - N110: S$392.04
  - N005: S$399.96
  - N100 wood: S$543.51
  - N162 wood 360 mm: S$512.82 — [Blackhawk Nardi](https://www.blackhawkjapan.sg/products/nardi-n100)
- **Works Bell:**
  - 820 (CT9A): S$135.83
  - 817: S$108.60
  - 817S: S$117.71
  - Rapfix2 orange: S$296.90
  - Rapfix key lock +e: S$206.42 — [Blackhawk Rapfix2](https://www.blackhawkjapan.sg/products/works-bell-wb-rapfix2-or)
- **Defi:**
  - BF turbo DF09902: S$213.84
  - BF oil temp DF10403: S$186.12
  - BF tacho DF10902: S$198.00
  - A1 turbo DF14801: S$241.56
  - Control Unit SE DF17701: S$131.57
  - Control-unit sensor package, 25th-anniversary edition, DF18901: S$466.79 — [Blackhawk DF18901](https://www.blackhawkjapan.sg/products/defi-df18901)
- **AEM:** 30-0300: S$402.32. — [Blackhawk AEM](https://www.blackhawkjapan.sg/products/aem-aem-uego-wideband-air-fuel-ratio-sensor-replacement-sensor-main-gauge-30-0300-for-69501202)
- **Cusco:** SAFETY 21 CT9A S$570.34–1,556.97; D1 chromoly CT9A S$678.94–1,330.66. — [Blackhawk Cusco](https://www.blackhawkjapan.sg/products/cusco-564-270-w13)

**Makers' own prices:**
- **Bride:** ZETA IV ¥150,700–222,200 incl. tax; BG rail ¥31,900. — [Bride](https://brideseats.com/seat/zeta/zeta4_black.html)
- **Works Bell:** Rapfix II ¥36,080. — [Works Bell](https://www.worksbell.co.jp/products_detail/rapfix-2/)
- **RAZO:** RA135 ¥3,630; RA136 ¥4,400; RA128RE ¥4,798. — [RAZO](https://razo.jp/product/shiftknob/)
- **Cusco SAFETY 21:** ¥69,300–134,200 by point count. — [Cusco](https://www.cusco.co.jp/catalog/assets_c/2024/06/safety21_illust_01_2024-thumb-1000x788-74991.jpg)
- **GReddy:** Sirius US$310. — [GReddy](https://greddy.com/products/sirius-meter-turbo-boost-16001730)
- **Prosport:** US$137.50 (boost); US$254.00 (AFR kit). — [Prosport](https://prosportgauges.com/products/2-1-16-premium-evo-electrical-boost-gauge)
- **Nardi:** "price on request". — [Nardi](https://nardi-personal.com/product/6070-33-2091/)

**Other retailers:**
- AEM 30-0300 NZ$449. — [NZ Performance](https://nzperformance.co.nz/products/aem300300)
- Autometer 22618 US$93.09 and 22619 US$100.35; grey 60 mm pod US$55.14. — [LancerShop](https://lancershop.com/products/autometer-triple-full-a-pillar-gauge-pod-lancer-evo)

**Singapore channels:**
- **Blackhawk Japan SG** describes itself as a BRIDE Meister shop. — [Blackhawk ZETA IV Classic](https://www.blackhawkjapan.sg/products/bride-ha1cl1) (search extract)
- **RZ Crew Garage** sells Bride and Recaro, with all import taxes included for Singapore and Malaysia. — [RZ Crew Garage](https://rzcrewgarage.com/products/bride-ergoster-reclinable-seat-frp-red-e64bsn) (search extract)
- **Carousell SG** has private sellers of used Bride (Stradia, Zeta, Ergo, Maxis) and Recaro (SP-G, RS-G) seats. — [Carousell](https://www.carousell.sg/bride-stradia/q/) (search extract)
- **Recaro's FAQ** sends buyers to an authorised RECARO partner in Asia and to a base-frame list. — [Recaro RCS (jp-en)](https://www.recaro-automotive.com/jp-en/comfort/recaro-rcs) (search extract)
- **Desertcart SG** lists a MOMO wheel bundled with an NRG quick release and hub at S$696, duties included. — [Desertcart](https://www.desertcart.sg/products/127902419-1.md) (search extract)
- **eBay SG** carries genuine MOMO wheels (for example Mod.08 350 MO-R1908/35S). — [eBay SG](https://www.ebay.com.sg/itm/165329126534) (search extract)
- **Defi's site** has a "Distributor/Shop list" page (in its navigation; not read). — [Defi](https://www.defi-shop.com/products/advance_bf)
- **Sabelt** runs a store locator and **Schroth** a dealer search (not read). — [Sabelt](https://www.sabelt.com/store-locator/); [Schroth](https://www.schroth.com/en/racing/service/dealer-search/)

### Inferences
- For a workshop, Blackhawk Japan SG is the simplest single source for pricing and ordering the Japanese parts. Its SGD prices sit roughly at Japanese list price converted, with no fitting.
- A complete "track seat" option for one side (ZETA IV, BG rail, seat-back protector) would be roughly S$1,200–1,300 before fitting. That is an estimate from the figures above, not a quote.
- A full steering set (MOMO or Nardi wheel, Works Bell boss, airbag canceller) would be roughly S$400–700 before fitting, also an estimate.

### Gaps
- No official Singapore distributor was confirmed for Bride, Recaro, MOMO, Nardi, Works Bell, Defi, GReddy, Prosport, AEM, Cusco, Sabelt or Schroth.
- The airbag canceller's part number and price for 817/820 were not captured; the Works Bell table lists them, but the column was not parsed.
- No prices were found for the Sabelt and Schroth harnesses, the Recaro Pole Position and Podium, or GReddy and Prosport in SGD.

## 4. LTA rules in Singapore for seats, harnesses, roll cages, steering wheels (airbag removal), gauges and pods

### Takeaway
LTA's OneMotoring modification page, read in full this session, puts **car seats, gear knobs, meters/gauges and steering wheels in the "no LTA approval needed" group, with conditions**:
- Seats must use the car's **original anchorage points** and must not block the driver's view.
- Changes to **airbag-equipped** seats or **steering wheels** must be done "in consultation with the vehicle manufacturer or its (authorised) agent".
- Added gauges must not block the view or interfere with the controls or instruments.

The page does **not** mention harnesses or saloon roll cages: rollover bars appear only for **convertibles**, and **chassis modification is not allowed**. A welded cage, or an aftermarket wheel that removes the factory airbag, is therefore at best a grey area and needs confirming with LTA.

### Cited Findings
All of the following come from the official page. — [LTA OneMotoring, Vehicle Technologies and Modifications](https://onemotoring.lta.gov.sg/content/onemotoring/home/owning/modification.html)
- **Three groups:** modifications that do not need LTA's approval, those that need it, and those that are not allowed. All modifications "must be installed by qualified personnel according to the vehicle and product manufacturer's recommendations."
- **Car seats (no approval needed):** "Car seats, including sport seats and bucket seats, must be properly and safely secured using the original anchorage points of the vehicle. The car seats must not obstruct the driver's view. Any modification to original airbag-equipped car seats must be carried out in consultation with the vehicle manufacturer or its authorised agent."
- **Steering wheels (no approval needed):** "Any modification to original airbag-equipped steering wheels must be carried out in consultation with the vehicle manufacturer or its agent."
- **Gear knobs (no approval needed):** "Aftermarket gear knobs should be securely fastened according to the product manufacturer's recommendations."
- **Meters and gauges (no approval needed):** "Additional meters or gauges on the dashboard, such as vacuum gauges, oil temperature gauges or battery voltage meters, should not obstruct the driver's view. These additional meters or gauges should not interfere with the vehicle controls or instrumentation."
- **Rollover bars (no approval needed):** "If your vehicle is a convertible, the installation of aftermarket rollover bars must not obstruct the driver's view." No other cage or roll-bar rule appears on the page.
- **Not allowed:** "Chassis — The chassis is an integral part of a vehicle and it cannot be modified." Also not allowed: "Decorative lamps, such as … vehicle-interior neon lights or flashing decorative lights."
- **No mention** of seat belts, harnesses, rear-seat removal or seating capacity anywhere on the page.
- **Penalties:** individuals who modify illegally face "fines of up to $20,000 or imprisonment for a term not exceeding two years, or both", doubled for repeat offenders. Workshops face up to $40,000 for a first offence and up to $80,000 for a repeat.
- **Insurance:** the General Insurance Association of Singapore advises owners to tell their insurer about modifications, or "claims may be declined … and the motor insurance policy considered void".
- **Used cars:** LTA-Authorised Inspection Centres offer assessment of modifications on a used car.

Related product facts:
- Recaro says its FIA-homologated racing seats without the German ABE type approval cannot be used in road traffic (German context), and points to the Pole Position ABE for road use. — [Recaro RS-G FAQ](https://au.recaro-automotive.com/race/recaro-rs-g)
- Bride says the ZETA IV meets Japan's road vehicle safety standards (shaken) and FIA 8855-1999. Its CT9A FX rail is "competition only (not road-legal in Japan)". — [Bride ZETA IV](https://brideseats.com/seat/zeta/zeta4_black.html); [Bride CT9A fitment](https://brideseats.com/_cars/json/MB15196.json)
- Works Bell warns the airbag warning lamp cannot be turned off on some cars, and notes the boss cover can foul the clock spring on the CT9A. — [Works Bell Mitsubishi PDF](https://www.worksbell.co.jp/pdf/matching/mitsubishi.pdf)
- Cusco's SAFETY 21 cages bolt to the body through mounting and reinforcement plates and are not for FIA events; Cusco's ASN-homologated cages are welded in. — [Cusco SAFETY 21](https://www.cusco.co.jp/catalog/rollcage/safety21.html)
- Sabelt's 4-point Clubman (CFCC904001NP_A) is **ECE**-homologated for saloons, and Schroth's Rallye 4 asm is **ECE and FMVSS**. The Sabelt SILVER and Steel Rally and Schroth Profi 2x2 are FIA 8853-2016 racing harnesses. — [Sabelt CFCC904001NP_A](https://catalogue.sabelt.com/seatbelts/145-211-cfcc904001npa.html); [Schroth Rallye 4 asm](https://www.schroth.com/en/racing/street-legal/details/show/rallye-4-asm-2/); [Sabelt SILVER Rally](https://catalogue.sabelt.com/seatbelts/156-244-silver-rally.html)
- Searches found no Singapore rule that deals specifically with racing harnesses or roll cages on road cars. — search extract (results included the [LTA page](https://onemotoring.lta.gov.sg/content/onemotoring/home/owning/modification.html) and an [NLB article on seat-belt legislation](https://biblioasia.nlb.gov.sg/vol-21/issue-4/jan-mar-2026/seat-belts-mandatory-legislation/), not read)

### Inferences
- **Seats:** bucket seats are allowed without approval if bolted to the CT9A's original seat anchorages. Bride's CT9A BG rails and Recaro's CT9A base frames do this. Competition-only fixed rails (Bride FX) and any drilled or welded mounts would conflict with "original anchorage points" and the chassis ban. Bride's own note that rear passengers need a seat-back protector argues for fitting one on a road car.
- **Steering wheels:**
  - MOMO and Nardi wheels have no airbag, so fitting one removes the factory airbag.
  - LTA's wording requires "consultation with the vehicle manufacturer or its agent" rather than banning it outright, but an agent is unlikely to endorse removing an airbag.
  - For marketing, show aftermarket wheels as **track or show options** and confirm road legality case by case with LTA or an Authorised Inspection Centre.
- **Gauges and pods:** allowed if they don't block the view or interfere with controls. An A-pillar pod sits in the driver's view line at the pillar, so a slim pod and placement that keeps the windscreen view clear matter. Gauge backlighting is functional, but any added interior neon or flashing accent lighting is explicitly banned.
- **Roll cages:** no saloon cage rule exists, and the chassis cannot be modified. A **welded** cage (Cusco ASN type) is very likely not allowed. A **bolt-in** cage (SAFETY 21) is not addressed, and the 2-seat cages remove the rear seats (a seating-capacity change). Treat cages as **track-car only**, pending LTA confirmation.
- **Harnesses:** not addressed by LTA. A harness fitted together with the factory 3-point belts, or an ECE-homologated 4-point (Sabelt Clubman, Schroth Rallye 4 asm), is the more defensible road option. FIA 6-point racing harnesses are for track cars.

### Gaps
- No LTA or Singapore Statutes text on seat belts and harnesses (for example the Road Traffic (Motor Vehicles, Wearing of Seat Belts) Rules) was read. Whether a 4- or 6-point harness can replace or supplement the factory belts on a road car is unknown.
- No official statement was found on bolt-in roll cages in saloons, on removing rear seats, or on changing the registered seating capacity.
- What "consultation with the vehicle manufacturer or its agent" means in practice for an Evo IX (Mitsubishi's Singapore agent and its process) was not researched.
- Whether LTA accepts ECE-homologated aftermarket belts on Singapore-registered cars was not found.
