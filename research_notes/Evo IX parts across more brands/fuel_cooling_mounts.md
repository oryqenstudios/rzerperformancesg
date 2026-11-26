# Fuel system, cooling and engine mount parts for the Lancer Evolution IX (CT9A, 4G63 MIVEC)

Scope: injectors (Injector Dynamics), in-tank fuel pumps (DeatschWerks, Walbro), radiators (Koyo, Mishimoto, Fluidyne, plus GReddy/Trust where it came up), oil coolers (HKS, GReddy/Trust), silicone hoses (Samco, plus Mishimoto) and engine mounts (Torque Solution, Vibra-Technics, Cusco) for a right-hand-drive Evo IX (2005–2007) in Singapore.

How the data was gathered (read before using the numbers):
- Pages were read on 2026-11-26, mostly by fetching manufacturer pages directly (title, JSON-LD product data, price meta tags). Prices are list prices on that day, in the currency shown; they are for internal reference only.
- **Not reachable from this session:** `injectordynamics.com` (DNS/TLS refused by the session's network policy; it would have to be allowed in the session's network settings) and `fluidyne.com` (HTTP 403 to automated requests). Injector Dynamics data therefore comes from Evo retailers (FR Sport, STM, MAPerformance, T1 Race Development). `torquesolution.net` reset the connection; the brand's store at `torquesolution.com` worked.
- **Photos:** every photo URL in the tables was checked with `curl -sIL` (final status, content type, size) and downloaded once into a scratch folder outside the repository to read its pixel size and background. Nothing was saved in the repository. All photos are the manufacturers' or retailers' copyright.
- **Visibility codes** used in the tables, for the configurator's two engine views: **Bay** = seen in the front view with the bonnet up; **Close-up** = only in the engine bay close-up; **Front** = seen from outside through the bumper openings; **Job card** = not visible in either engine view. These are judgements from where each source says the part is fitted (see Inferences).
- The HKS oil cooler 15004-AM110 is already covered in `research_notes/Tomei and HKS Evo IX parts/hks_engine_powertrain.md`; only what that file misses is added here.

---

## Which models exist for the Evo IX, with exact part numbers, specs, look, visibility and status?

### Takeaway
Every requested brand except Fluidyne and Vibra-Technics has a current Evo IX part:
- **Injectors:** ID1050x `1050.60.11.D.4` and ID1300x `1300.60.11.D.4` (now sold as "-XDS"). Both use USCAR plugs and need `90.1` plug-and-play adaptors on the Evo loom.
- **Fuel pumps:** DeatschWerks DW200/DW300/DW420 Evo 8/9 kits (`9-201-0847`, `9-301-0847`, `9-421-0847`); there is no DW300C or DW400 Evo kit. Walbro: GSS342 255 lph with Evo kit 400-847, or the universal F90000267 450 lph E85 pump, which needs modification.
- **Radiators:** Koyo Type-F `KH031610R` (48 mm, all-aluminium; international code HH031610), Mishimoto `MMRAD-EVO-01` (2-row, 1.97 in core) and GReddy/Trust TW-R `12033800` (50 mm).
- **Oil coolers:** GReddy/Trust `12034608` (twin, JDM spec, Evo VIII/IX) and HKS `15004-AM110` (Black series).
- **Hoses:** Samco `TCS299/C` (3 coolant hoses), `TCS299` (7 turbo hoses) and `TCS299/H` (2 heater hoses), in 19 colours. Samco Japan also sells `40TCS321/C`, a 2-piece radiator set.
- **Mounts:** Torque Solution billet kits (`TS-EV-125`/`126` and others; the **rear mount does not fit RHD**). Cusco `565 911 SET` (5MT) and `565 911 SET6` (6MT).

### Cited Findings

#### 1. Injectors

| Brand | Model | Evo IX part number | Key specs | Look / visible? | Status | Photo URL | Page URL | Price | Singapore |
|---|---|---|---|---|---|---|---|---|---|
| Injector Dynamics | ID1050x (now "ID1050-XDS") | **1050.60.11.D.4** (set of 4). 60 mm body, 11 mm (blue) adaptor top, Denso lower. Needs 4 × **90.1** USCAR plug-and-play adaptors (STM bundles them as `STMK-ID-1050.60.11.D.4+90.1X4`) | 1065 cc/min @ 3.0 bar (43.5 psi), gasoline at 52 °C; max differential pressure 10.0 bar (145 psi); "compatible with all known fuels" (E85-safe); USCAR connector; replaceable inlet filter | Blue anodised bodies, black USCAR plugs, blue top adaptors. **Close-up at most** (sits under the fuel rail and intake plenum); treat as **job card** | Current; T1 sells it under the newer "ID1050-XDS" name (Dual Slope Matching) | https://frsport.com/cdn/shop/files/83baa8e51bec6098d63596bfd2af4cbe_46eb0f4b-9647-4341-894c-4826303b3f3b.jpg?v=1744405801&width=800 (retailer) | [FR Sport](https://frsport.com/products/injector-dynamics-1050-60-11-d-4-id1050x-evo-iii-ix-2-0l-turbo-11mm-blue-adaptor-tops-denso-l) | USD 600.60 (FR Sport); USD 600.60–632.94 (T1) | No Evo kit seen at RZCrew (it lists ID kits for Subaru) |
| Injector Dynamics | ID1300x (now "ID1300-XDS") | **1300.60.11.D.4** (set of 4). Same 60 mm / 11 mm blue top / Denso lower layout; 90.1 adaptors (STM bundle `ID-1300.60.11.D.4+90.1x4`) | 1335 cc/min @ 43.5 psi on iso-octane at 52 °C (FR Sport, STM); max differential 7.0 bar / 101.5 psi (FR Sport, STM), but MAPerformance says 1340 cc/min and 6.0 bar / 87 psi; "designed specifically for alternative fuels"; USCAR | Same look as the ID1050x. **Close-up at most / job card** | Current ("ID1300-XDS" at T1) | https://www.maperformance.com/cdn/shop/products/injector-dynamics-21315900099.jpg?v=1563438744 (retailer, 308 px) | [MAPerformance](https://www.maperformance.com/products/injector-dynamics-1300cc-injectors-dsm-evo-3-9-1300-60-11-d-4) | USD 1,039.50 (MAPerformance, FR Sport); USD 1,085.70 with adaptors (STM) | As above |

Sources:
- ID1050x
  - Fitment "Evo III-IX, 2.0L turbo. 11mm (blue) Adaptor Tops, Denso L[ower]"; specs 1065 cc/min @ 3.0 bar, 10.0 bar, USCAR; USD 600.60. — [FR Sport](https://frsport.com/products/injector-dynamics-1050-60-11-d-4-id1050x-evo-iii-ix-2-0l-turbo-11mm-blue-adaptor-tops-denso-l)
  - "Includes a full set of 4 injectors with the proper 90.1 plug and play adapters. E85 safe!"; PNP clips 90.1; 1065 cc/min @ 43.5 psi, 145 psi. — [STM](https://stmtuned.com/products/id1050-injector-dynamics-evo-dsm)
  - Applications include "2003-2006 Mitsubishi Lancer Evo VIII / IX"; features: corrosion-resistant internals, +5% flow over the ID1000, stable up to 10 bar, replaceable inlet filter. — [MAPerformance](https://www.maperformance.com/products/injector-dynamics-1050cc-fuel-injectors-id1050x-multiple-fitments-1050-60-11-d-4)
  - Listed as "Evo III-IX | ID1050-XDS | 1050.60.11.D.4", 1065 cc/min, "Dual Slope Matching"; USD 600.60–632.94. — [T1 Race Development](https://www.t1racedevelopment.com/product/id1050x-evo-iii-ix/)
- ID1300x
  - 1335 cc/min @ 3.0 bar (iso-octane, 52 °C); 7.0 bar (101.5 psi); "Designed Specifically for Alternative Fuels"; USCAR; USD 1,039.50. — [FR Sport](https://frsport.com/products/injector-dynamics-1300-60-11-d-4-id1300x-evo-iii-ix-2-0l-turbo-11mm-blue-adapter-tops-denso-l)
  - 1335 cc/min, 101.5 psi, PNP clips 90.1, kit with 4 adaptors, USD 1,085.70. — [STM](https://stmtuned.com/products/id1300x-injector-dynamics-evo-dsm)
  - 1340 cc/min, 6.0 bar (87.0 psi), applications "1995-2006 Mitsubishi Lancer Evolution 3-9", USD 1,039.50. — [MAPerformance](https://www.maperformance.com/products/injector-dynamics-1300cc-injectors-dsm-evo-3-9-1300-60-11-d-4)
  - Sold as "Evo III-IX | ID1300-XDS | 1300.60.11.D.4". — [T1 Race Development](https://www.t1racedevelopment.com/?p=540) (title seen in search results only)
- Connector: a seller says the Evo 8/9 loom uses the older rectangular "EV1" plug, so four USCAR-to-EV1 adaptors (ID P/N 90.1) are needed, and that some listings leave them out. Seen only in a search summary, not on a fetched page. — [search results for ID1300x](https://www.maperformance.com/products/injector-dynamics-1300cc-injectors-dsm-evo-3-9-1300-60-11-d-4)

#### 2. In-tank fuel pumps

| Brand | Model | Evo IX part number | Key specs | Look / visible? | Status | Photo URL | Page URL | Price | Singapore |
|---|---|---|---|---|---|---|---|---|---|
| DeatschWerks | DW200 | **9-201-0847** (pump + install kit) | 255 lph in-tank; "for Eclipse (turbo AWD) 95-98 and EVO 8/9 2003-2006" | Black pump body with "DW200 255LPH" graphics; kit has a yellow filter sock. **Job card** (in the tank) | Current, in stock | https://cdn.shopify.com/s/files/1/0414/1681/8852/files/9-201-0847.jpg?v=1751919687 | [DW](https://deatschwerks.com/products/9-201-0847) | USD 109 | Not seen in SG |
| DeatschWerks | DW300 | **9-301-0847** | 340 lph @ 40 psi (360 @ 30 psi … 235 @ 100 psi); 6–18 V; "E85 compatibility is built in" | Black body, "DW300 340LPH" graphics. **Job card** | Current, in stock | https://cdn.shopify.com/s/files/1/0414/1681/8852/files/9-301-0847.jpg?v=1751919762 | [DW](https://deatschwerks.com/products/9-301-0847) | USD 169 | Not seen in SG |
| DeatschWerks | DW420 | **9-421-0847** | 420 lph in-tank, same Evo 8/9 fitment | Black body, "420LPH DW" graphics. **Job card** | Current | https://deatschwerks.com/cdn/shop/files/9-421-0847.jpg?v=1751920055 | [DW](https://deatschwerks.com/products/9-421-0847) | USD 199 | Not seen in SG |
| DeatschWerks | DW200/300 install kit | 9-0847 | Filter sock, grommets, wiring for the Evo 8/9 hanger | Job card | Current | https://cdn.shopify.com/s/files/1/0414/1681/8852/files/9-0847.jpg?v=1751919454 | [DW](https://deatschwerks.com/products/9-0847) | USD 25 | — |
| Walbro (TI Automotive) | 255 lph high-pressure in-tank | **GSS342G3** + Evo install kit **400-847** | 255 lph; gasoline (RZCrew lists "Fuel Type: Gasoline") | Silver cylindrical pump with hanger hardware. **Job card** | Current at retailers | https://lancershop.com/cdn/shop/files/walbro-255-fuel-pump-w-install-kit-evo-8-9.jpg?v=1769504784&width=1920 (retailer, with shop overlay) | [LancerShop](https://lancershop.com/collections/evo-8/products/walbro-255-fuel-pump-w-install-kit-evo-8-9) | USD 147.14 with kit (LancerShop); SGD 80.91 pump only (RZCrew) | RZCrew (ships from a US warehouse) |
| Walbro (TI Automotive) | 450 lph E85 | **F90000267** (universal; install kit 400-1168) | 450 lph; up to 750 hp; 345 kPa rated, 600 kPa max system; 14 mm inlet; gas and E85; "Requires modifications to wiring, fuel lines and fuel module" | Silver pump. **Job card** | Current (universal, no Evo-specific kit) | https://stmtuned.com/cdn/shop/products/F90000267-450-lph-universal-in-tank-fuel-pump-gas-e85.jpg?v=1571334131&width=750 (retailer) | [STM](https://stmtuned.com/products/walbro-f90000267-450-lph-universal-in-tank-fuel-pump-gas-e85) | Not captured | RZCrew lists the related F90000262 400 lph at SGD 159.80 |

Sources:
- DeatschWerks
  - DW's own search lists only DW200, DW300 and DW420 "Fuel pump for Evo 7/8/9 and AWD DSM" plus the DW200/300 install kit; no DW300C or DW400 Evo kit appears. — [DW search API, queries "evo" and "0847"](https://deatschwerks.com/products/9-421-0847)
  - The DW300C is a compact universal pump; a DW300C kit (9-307-1062) carries "Cannot Confirm Fitment". — [CARiD](https://www.carid.com/deatschwerks/dw300c-in-tank-fuel-pump-with-install-kit-mpn-9-307-1062.html)
  - Prices, descriptions and stock state come from each product page's JSON-LD (DW200 USD 109, DW300 USD 169 "InStock", DW420 USD 199, kit USD 25). — [DW200](https://deatschwerks.com/products/9-201-0847); [DW300](https://deatschwerks.com/products/9-301-0847); [DW420](https://deatschwerks.com/products/9-421-0847); [kit](https://deatschwerks.com/products/9-0847)
  - DW300 tech sheet: "The DW300 flows 340lph at 40psi and is a popular choice for e85 applications"; "E85 compatibility is built in"; 6–18 V input; the flow table above. — [DW300 Tech Sheet (PDF)](https://cdn.shopify.com/s/files/1/0414/1681/8852/files/DW300_Tech_Sheet.pdf)
  - DW also sells Evo 8/9 fuel rails (7-502, USD 159) and its own Evo 8/9 injectors (800–2400 cc). — [DW search API](https://deatschwerks.com/products/9-301-0847)
  - DW tech sheets are hosted under Tomei's "dealing brands" folder, so Tomei Japan handles DW. — [Tomei-hosted DW tech sheet](https://www.tomei-p.co.jp/dealing_brands/dw/9-307-1026%20Tech%20Sheet.pdf)
- Walbro 255
  - "Fits: Mitsubishi Lancer Evolution VIII, IX Part # GSS-342 + 400-847"; the kit has pump, filter, clamps, hoses and brackets; USD 147.14. — [LancerShop](https://lancershop.com/collections/evo-8/products/walbro-255-fuel-pump-w-install-kit-evo-8-9)
  - 400-858 is a generic GSS342 kit; Evo-specific sellers use 400-847. — [search results incl. CJ Motor](https://www.cj-motor.com/255l-fuel-pump-installation-kit-evo-7-9)
  - "GSS342G3 … 255LPH … Fuel Type: Gasoline", SGD 80.91, ships from a US warehouse. — [RZCrew](https://rzcrewgarage.com/products/walbro-255lph-in-tank-high-pressure-fuel-pump-gss340g5-gss342g3)
- Walbro 450: specs, "Universal Fitment", "Requires modifications to wiring, fuel lines and fuel module", "E85 Safe!", install kit 400-1168. — [STM](https://stmtuned.com/products/walbro-f90000267-450-lph-universal-in-tank-fuel-pump-gas-e85)
- HKS's own Evo pump (14007-AK008, 265 L/h) and injectors are discontinued. — [hks_engine_powertrain.md](../Tomei%20and%20HKS%20Evo%20IX%20parts/hks_engine_powertrain.md)

#### 3. Radiators

| Brand | Model | Evo IX part number | Key specs | Look / visible? | Status | Photo URL | Page URL | Price | Singapore |
|---|---|---|---|---|---|---|---|---|---|
| Koyo (Koyorad Japan) | Racing radiator **Type-F** (48 mm, aluminium 2-row, flagship) | **KH031610R** (Japan table, CT9A 4G63). International / Koyorad USA equivalent **HH031610** ("HH series 48mm") | 48 mm all-aluminium 2-row core; Nocolok brazed, hand TIG-welded; billet filler neck; 1/8 NPT sensor port; no cap included (Koyo cap SK-C13) | Mirror-polished aluminium tanks and core, often with a blue/red KOYORAD sticker. **Bay**: top tank and filler neck across the front of the bay | Current (in Koyo's 2024 table). Type-Z (53 mm) is discontinued | https://nzperformance.co.nz/cdn/shop/files/KH031610.jpg?v=1717110128 (retailer, white) | [Koyo JP racing range](https://www.koyorad.co.jp/products/motersport/racing01.html); [fitment table PDF](https://www.koyorad.co.jp/images/main/products/koyorad_racing.pdf) | USD 403.99 (MAPerformance HH031610); NZD 520.40 (NZ Performance, out of stock); **SGD 695.20** (RZCrew KH031610R) | RZCrew (ships from Japan) |
| Koyo (Koyorad USA) | HH series half-size | HH032412 | 48 mm, about half the stock volume; "RACE ONLY", drag cars; needs Evo 4/5/6 hoses and DIY mounts | Small polished radiator. **Bay** | Current at retailers | https://stmtuned.com/cdn/shop/products/Koyo_Racing_Half-Size_Aluminum_Radiator_Evo_8_9_1024x1024.jpg?v=1580936663 | [STM](https://stmtuned.com/products/koyo-hh-series-evo-8-9-half-size-aluminum-radiator) | USD 369.28 | — |
| Koyo | Type-R copper (49 mm, 3-row, brass tanks) | KA031610 (RZCrew lists it for the Evo 8) | 49 mm copper 3-row | Copper/brass. **Bay** | Unclear: Koyo's 2024 table lists only KH031610R for the CT9A | — | [RZCrew](https://rzcrewgarage.com/products/koyo-49mm-type-r-copper-radiator-mitsubishi-lancer-evolution-viii-ct9a-evo-8-ka031610-ka031610) | SGD 695.20 | RZCrew |
| Mishimoto | Performance Aluminum Radiator | **MMRAD-EVO-01** (MT only) | 2 rows; core 27.08 × 14.76 × 1.97 in; overall 28.2 × 19.5 × 2.47 in; 1.4 in inlet/outlet; 1.79 gal listed fluid capacity; brazed core, TIG-welded tanks; 1.3 bar cap included; lifetime warranty | Bare aluminium with a black Mishimoto "M" logo on the core. **Bay** | Current | https://www.mishimoto.com/media/catalog/product/m/m/mmrad-evo-01_1_10_klpxeny5kg8rbaih.png | [Mishimoto](https://www.mishimoto.com/mitsubishi-lancer-evolution-performance-aluminum-radiator-01.html) | USD 359.96 (mishimoto.com); **SGD 474.37** (RZCrew) | RZCrew, import taxes included for SG/MY |
| Mishimoto | Half-size radiator | MMRAD-EVO-01H | Half-size, for big front-mount/turbo set-ups | **Bay** | Current | https://www.mishimoto.com/media/catalog/product/m/m/mmrad-evo-01h_1_xyfihgf5oiskm8bp.png | (product URL not resolved; image from Mishimoto's catalogue) | about USD 399.95 (search summary) | — |
| GReddy / Trust | Aluminium Radiator TW-R | **12033800** (JAN 4991995219699) | 50 mm all-aluminium core; 1/8 PT service hole; shroud can be fitted; not with a GReddy turbo kit; **not for AT** | Polished aluminium. **Bay** | Current (special order in the USA) | https://www.greddy.com/cdn/shop/files/12033800_WP_01.jpg?v=1754607332 | [Trust JP](https://www.trust-power.com/products/cooling/ct9a_aluminum_radiator); [GReddy USA](https://www.greddy.com/products/aluminum-radiator-tw-r-ct9a-evolution-front-mount-12033800) | ¥59,400 incl. tax (¥54,000 excl.); USD 650 | Not seen in SG |
| Fluidyne | — | **None found** | — | — | No Evo 8/9 product found; site blocked | — | — | — | — |

Sources:
- Koyo
  - Koyo's racing range: Type-F (aluminium 2-row, 48 mm, flagship, about 35% lower air-side pressure loss than Type-Z and about 1 kg lighter dry); Type-Z (53 mm, "生産終了品", discontinued); Type-M (36 mm aluminium); Type-R (copper 3-row, brass tanks, 41/49 mm); Type-RII (copper, resin tanks); Type-S (copper 2-row, 27/32 mm). — [Koyorad racing page](https://www.koyorad.co.jp/products/motersport/racing01.html)
  - Koyo's fitment table (dated 2024.3) has a single CT9A 4G63 entry, `KH031610R`, in the aluminium column. — [koyorad_racing.pdf](https://www.koyorad.co.jp/images/main/products/koyorad_racing.pdf)
  - "KOYO Type F Aluminium Radiator Mitsubishi Lancer Evolution IX CT9A Evo 7/8/9 KH031610R", SGD 695.20, "Note: the photo is generic". — [RZCrew](https://rzcrewgarage.com/products/koyo-type-f-aluminium-radiator-mitsubishi-lancer-evolution-ix-ct9a-evo-7-8-9-kh031610r-kh031610r)
  - "KOYO-KH031610 International part number KOYO-HH031610 … HH Series 48mm Radiator Core"; caps not included, correct cap SK-C13; NZD 520.40, out of stock. — [NZ Performance](https://nzperformance.co.nz/products/koyokh031610)
  - HH031610: "Nocolok brazed … direct bolt in … retain mounts for the stock fan shrouds and fans", applications 2001–2006 Evo 7–9, USD 403.99. — [MAPerformance](https://www.maperformance.com/products/03-07-evo-8-9-aluminum-radiator-by-koyo-hh031610)
  - HH032412 half-size "RACE ONLY" details, USD 369.28. — [STM](https://stmtuned.com/products/koyo-hh-series-evo-8-9-half-size-aluminum-radiator)
  - Conflicts and fitment notes (all from a search summary, not fetched pages):
    - One retailer calls KH031610 a "36 mm Hyper V-Core". A retailer's code key gives KV = 36 mm and KH = 48 mm.
    - One seller says the Evo 7/8/9 OEM fan will not bolt on.
    - HH031610 needs the factory oil cooler relocated on automatic cars.
    - HH030939 is listed for both CT9A and Evo 4–6 (inconsistent).
    - Source: [search results incl. Ross Sport](https://rossp-sumopower.dc01.gob2b.com/Brands/KOYORAD/MITSUBISHI/Rad-Lancer-Colt-Man-1092-0895-KH031610)
- Mishimoto
  - Tech-spec table, MT-only note, cap included, USD 359.96. — [Mishimoto](https://www.mishimoto.com/mitsubishi-lancer-evolution-performance-aluminum-radiator-01.html)
  - Other listings conflict on price: a search summary had Mishimoto at USD 336.95 sale / 371.00 regular; MMRAD-EVO-01H about USD 399.95. — [search results](https://throtl.com/products/mm-radiators-alum-mmrad-evo-01h)
  - "Part Number: MMRAD-EVO-01 Transmission: MT", SGD 474.37, "Singapore and Malaysia: All import taxes are included in our pricing". — [RZCrew](https://rzcrewgarage.com/products/mishimoto-performance-aluminium-radiator-mitsubishi-lancer-evolution-ix-ct9a-evo-7-8-9-mt-mmrad-evo-01)
- GReddy / Trust
  - Code 12033800; JAN code; 50 mm core; 1/8PT service hole; shroud OK; "GReddyタービンKIT装着車両は取り付け不可" (not with a GReddy turbo kit); "AT車両不可" (not for AT); fits CT9A VII/VIII/IX 01.02–06.12; ¥59,400 incl. tax (¥54,000). — [Trust JP](https://www.trust-power.com/products/cooling/ct9a_aluminum_radiator)
  - "SPECIAL ORDER", USD 650, the same notes in English. — [GReddy USA](https://www.greddy.com/products/aluminum-radiator-tw-r-ct9a-evolution-front-mount-12033800)
- Fluidyne: searching for a Fluidyne Evo 8/9 radiator only returned other brands (Koyo, Mishimoto, CSF 3163, Megan MR-RT-MLE03). `fluidyne.com` answered HTTP 403. — [search results](https://www.rallysportdirect.com/products/csf-3163-csf-racing-aluminum-radiator)

#### 4. Oil coolers

| Brand | Model | Evo IX part number | Key specs | Look / visible? | Status | Photo URL | Page URL | Price | Singapore |
|---|---|---|---|---|---|---|---|---|---|
| GReddy / Trust | Oil Cooler Kit STD 13-row, twin, **JDM spec** | **12034608** (Evo VIII / IX) | NS1310G 13-row core **plus the stock core** ("twin"); sandwich block at the stock oil filter; uses the genuine thermostat; cores **inside the left and right fenders**; splash shield must be cut | Photo is a generic sample: blue core, black hoses. **Front** (through the bumper corner openings); lines partly visible low in the bay | Current (special order in the USA) | https://www.greddy.com/cdn/shop/files/OilCoolerKitsW13_noBlock.jpg?v=1731371109 (generic) | [Trust JP](https://www.trust-power.com/products/cooling/oilcooler_kit_ct9a-2); [GReddy USA](https://www.greddy.com/products/oil-cooler-ns1310g-std-ct9a-jdm-12034608) | ¥84,700 incl. tax (¥77,000); USD 760 | RZCrew sells Trust/GReddy universal kits (SGD 353.60–760.14), not this code |
| GReddy / Trust | Oil Cooler Kit STD 13-row (Evo VII only) | 12034607 | Same core; **Evo VII only**; inside the right fender | — | Current, but **not for the IX** | (same generic photo) | [Trust JP](https://www.trust-power.com/products/cooling/oilcooler_kit_ct9a) | ¥97,900 incl. tax; USD 740 | — |
| HKS | Oil Cooler Kit **Black** | **15004-AM110** (details in the HKS notes: 200×220×48 core, 15 rows, inside the left fender, combined with the stock cooler, #10 hoses, ¥107,800) | **New here:** "lightweight black mesh hose", 20% lighter than HKS's stainless hose, black and silver fittings; HKS thermostat opens at 70 °C ±3 and is fully open at 80 °C ±3 | Black braided lines, black/silver fittings, silver core. **Front** (left bumper opening) | Current | https://www.hks-power.co.jp/storage/syshks/product_db/PAn4hS1M9AkehgL4xqkiCbkF8xjNRxtg2QhuOzJx.jpg (fitted); series studio shot https://www.hks-power.co.jp/product/cooling/oilcooler/images/oil_cooler_black_Rtype.jpg is the **S15 fender kit, not the Evo** | [HKS series page](https://www.hks-power.co.jp/en/product/cooling/oilcooler/index.html) | ¥107,800 incl. tax | See the HKS notes |
| Trust (Japan) | — | Same company as GReddy: see the GReddy / Trust rows | — | — | — | — | — | — | — |

Sources:
- GReddy and Trust: "Founded in Japan in 1977, Trust Co., Ltd. … Since 1994, the development and distribution of Trust Company products in the United States has been accomplished by GReddy Performance Products in Irvine, California." Trust's Japanese site is titled "TRUST | GReddy". — [GReddy About Us](https://www.greddy.com/pages/about-us); [Trust JP](https://www.trust-power.com/)
- 12034608: コアタイプ NS1310G, サーモスタット 純正使用, コア取付位置 左右フェンダー内, CT9A Evo 8/9 2003.01–2007.10, ¥84,700 (¥77,000); remark: "ツインオイルクーラー（純正コア＋NS1310G）スプラッシュシールド要加工" (twin oil cooler, genuine core plus NS1310G; splash shield must be cut). — [Trust JP](https://www.trust-power.com/products/cooling/oilcooler_kit_ct9a-2)
- The same in English, "SPECIAL ORDER", USD 760. — [GReddy USA](https://www.greddy.com/products/oil-cooler-ns1310g-std-ct9a-jdm-12034608)
- 12034607: Evo 7 only, right fender, ¥97,900 (¥89,000). — [Trust JP](https://www.trust-power.com/products/cooling/oilcooler_kit_ct9a); [GReddy USA](https://www.greddy.com/products/oil-cooler-ns1310g-std-ct9a-12034607) (USD 740; the title says "CT9A" but the text says "For Evo VII only")
- HKS Black series: black mesh hose 20% lighter than stainless; black and silver fittings; thermostat 70 °C ±3 opening and 80 °C ±3 full open; the series page labels its R-type studio image "S15 Fender Spec". — [HKS Oil Cooler Kit page](https://www.hks-power.co.jp/en/product/cooling/oilcooler/index.html)

#### 5. Silicone hoses

| Brand | Model | Evo IX part number | Contents / specs | Look / visible? | Status | Photo URL | Page URL | Price | Singapore |
|---|---|---|---|---|---|---|---|---|---|
| Samco Sport (UK) | Coolant hose kit | **TCS299/C** (retail SKUs such as TCS299C-BLK/-RED/-BLU/-PUR/-CBL); clip kit CK299/C | 3 hoses: upper and lower radiator hoses and the overflow hose; Evo IX CT9A 2005–2007; 1 5/8 in OD reinforced silicone; 338 °F (170 °C) max | Gloss colour (photo: blue). **Bay**: upper hose and overflow visible at the front of the engine; lower hose hidden | Current; most colours made to order | https://samcosport.com/wp-content/uploads/2020/04/TCS-299C-scaled.jpg | [Samco](https://samcosport.com/product/lancer-evo-9-ct9a/) | USD 187.35 (MAPerformance); USD 162.06 (STM, dropping colours) | No named SG distributor found (see Q3) |
| Samco Sport (UK) | Turbo / boost hose kit | **TCS299**; clip kit CK299 | 7 turbo (intercooler pipe) couplers, Evo IX 2005–2007 (STM: only 6 used on US cars) | Gloss colour (photo: blue). **Bay**: couplers on the intercooler pipes at the front of the bay | Current | https://samcosport.com/wp-content/uploads/2020/04/TCS-299-scaled.jpg | [Samco](https://samcosport.com/product/lancer-evo-9-ct9a-2/) | Not captured | — |
| Samco Sport (UK) | Heater hose kit | **TCS299/H**; clip kit CK299/H | 2 heater hoses, Evo IX 2005–2007 | Photo: black. **Close-up** (at the bulkhead) | Current | https://samcosport.com/wp-content/uploads/2020/04/TCS-299-H.png | [Samco](https://samcosport.com/product/lancer-evo-9-ct9a-3/) | Not captured | — |
| Samco (Japan line) | 2-piece radiator hose set | **40TCS321/C** (Evo IX, MT only) | 2 hoses; 3–5-ply silicone/aramid; colours blue, red, black, green, yellow, orange | **Bay** | Listed | https://rzcrewgarage.com/cdn/shop/products/samco_2_hoses_radiator_kit_2f38e7e4-238c-4922-914f-48b5548deb86.jpg?v=1710179365&width=600 (retailer) | [RZCrew](https://rzcrewgarage.com/products/samco-japan-2-pcs-cooling-hoses-set-radiator-mitsubishi-lancer-evolution-ix-ct9a-evo-9-mt-only-40tcs321-c) | **SGD 249** | RZCrew |
| Samco Sport | Induction hose | TB1292 | Turbo inlet hose, Evo VIII–IX | **Bay** | Listed at retailers | — | [MAPerformance](https://www.maperformance.com/products/samco-sport-induction-hose-evo-viii) | Not captured | — |
| Mishimoto | Silicone radiator hose kit | **MMHOSE-EVO-9BL** (blue; the Evo 9 page shows only this colour) | Dual-layer silicone with embedded fibres, OEM fit, Evo 9 2005–2007 | Blue. **Bay** | Current, in stock | https://www.mishimoto.com/media/catalog/product/m/m/mmhose-evo-9bl_1.jpg | [Mishimoto](https://www.mishimoto.com/silicone-radiator-hose-kit-blue-fits-mitsubishi-lancer-evolution-9-2005-2007.html) | USD 50.98 | — |

Sources:
- Samco Sport product pages:
  - TCS299/C: "This kit contains 3 Coolant hoses and fits Mitsubishi Lancer EVO 9 CT9A 2005 ~ 2007", clip kit CK299/C. — [Samco](https://samcosport.com/product/lancer-evo-9-ct9a/)
  - TCS299: "7 Turbo hoses", clip kit CK299. — [Samco](https://samcosport.com/product/lancer-evo-9-ct9a-2/)
  - TCS299/H: "2 Heater hoses", clip kit CK299/H. — [Samco](https://samcosport.com/product/lancer-evo-9-ct9a-3/)
- Samco colours: "available in a range of 19 different colours … most parts are made to order".
  - Standard: blue, red, orange, yellow, green, black.
  - Premium: purple, British racing green, viper red, white, classic black, gunmetal grey, vintage black.
  - Camo: fire red, lightning blue, ninja green, urban, solar orange, blaze.
  - Source: [Samco Colours](https://samcosport.com/colours/)
- MAPerformance:
  - "All Samco Sport hoses are produced in a high gloss finish, except the matte Classic Black"; 338 °F max; "Not all colors are in stock and may be special order"; box: upper, lower and overflow; USD 187.35.
  - Warranty listed as "N/A", which conflicts with STM's "Samco Limited Lifetime Warranty".
  - Source: [MAPerformance](https://www.maperformance.com/products/samco-sport-radiator-hose-kit-evo-ix)
- STM:
  - Colour SKUs (BLK, RED, BLU, PUR, CBL); 1 5/8 in OD; "We will only be carrying the gloss black option"; USD 162.06.
  - "The top hose for Evo 7/8/9 is the same"; the bottom hose is Evo 9-specific; the top hose will not fit Evo 4/5/6-type radiators.
  - Source: [STM](https://stmtuned.com/products/tcs299c-samco-coolant-hoses-evo-9)
- TCS299 has seven couplers, six of them used on USDM cars; TB1292 inlet hose. — [search results incl. STM](https://stmtuned.com/products/tcs299-samco-intercooler-coupler-kit-evo-8-9)
- Samco Japan 40TCS321/C details and SGD price. — [RZCrew](https://rzcrewgarage.com/products/samco-japan-2-pcs-cooling-hoses-set-radiator-mitsubishi-lancer-evolution-ix-ct9a-evo-9-mt-only-40tcs321-c)
- Mishimoto hose: JSON-LD SKU MMHOSE-EVO-9BL, USD 50.98, in stock; the requested URL for the Evo 9 kit redirected to the blue variant. — [Mishimoto](https://www.mishimoto.com/silicone-radiator-hose-kit-blue-fits-mitsubishi-lancer-evolution-9-2005-2007.html)

#### 6. Engine mounts

| Brand | Model | Evo IX part number | Key specs | Look / visible? | Status | Photo URL | Page URL | Price | Singapore |
|---|---|---|---|---|---|---|---|---|---|
| Torque Solution | 3-pc kit, **5-speed**: trans + side + front | **TS-EV-125** | 6061-T6 billet, polyurethane **75A** bushes, steel pins; "1000HP+ and 8sec e.t. torture tested" | Black anodised billet with laser-engraved "TORQUE SOLUTION" logo. **Bay**: side mount (timing-belt end) and gearbox mount on top of the rails; front mount below = job card | Current | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-125-2.jpg | [TS](https://www.torquesolution.com/product-p/ts-ev-125.htm) | USD 489.99 | Not seen in SG |
| Torque Solution | 3-pc kit, **6-speed**: side + front + trans | **TS-EV-126** | As above | As above | Current | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-126-2.jpg | [TS](https://www.torquesolution.com/product-p/ts-ev-126.htm) | USD 489.99 | — |
| Torque Solution | 3-pc kit, 5-speed: side + **rear** + trans | TS-EV-135 | As above; "**Will not fit RHD vehicles (JDM)**" | As above | Current, **not for an SG RHD car** | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-135-2.jpg | [TS](https://www.torquesolution.com/product-p/ts-ev-135.htm) | USD 489.99 | — |
| Torque Solution | 3-pc kit, 6-speed: side + **rear** + trans | TS-EV-136 | As above (this page gives no RHD warning, but the rear mount alone carries it) | As above | Current, rear mount RHD issue | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-136-2.jpg | [TS](https://www.torquesolution.com/product-p/ts-ev-136.htm) | USD 489.99 | — |
| Torque Solution | 4-pc full kit, 5-speed | TS-EV-1235 | "The rear mount in this kit will not fit RHD vehicles (JDM)" | As above | Current, rear mount RHD issue | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-1235-2.jpg | [TS](https://www.torquesolution.com/product-p/ts-ev-1235.htm) | USD 609.99 | — |
| Torque Solution | 4-pc full kit, 6-speed | TS-EV-1236 | As above (no RHD warning on this page) | As above | Current, rear mount RHD issue | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-1236-2.jpg | [TS](https://www.torquesolution.com/product-p/ts-ev-1236.htm) | USD 593.99 | — |
| Torque Solution | Front mount (single) | TS-EV-002 | Direct OEM replacement; 75A | Job card (below the engine) | Current | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-002-2.jpg | [TS](https://www.torquesolution.com/product-p/ts-ev-002.htm) | USD 119.99 | — |
| Torque Solution | Rear mount (single) | TS-EV-003 | "**Will not fit RHD vehicles (JDM)**" | Job card | Current, not RHD | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-003-2.jpg | [TS](https://www.torquesolution.com/product-p/ts-ev-003.htm) | USD 119.99 | — |
| Torque Solution | Driver/passenger mount inserts | TS-EV8-001 (one pair, one side; order 2 for both) | 75A polyurethane inserts for the OEM side and trans housings; "600HP+ and 9sec" | Black inserts inside the stock mounts. Effectively job card | Current | https://www.torquesolution.com/v/vspfiles/photos/TS-EV8-001-2.jpg | [TS](https://www.torquesolution.com/product-p/ts-ev8-001.htm) | USD 59.99 | — |
| Cusco | Engine mount set, **5MT** | **565 911 SET** | 4-piece set; stiffer than stock rubber ("HD rubber" per Evasive); bolts to the factory points | Black steel brackets, black rubber bushes, zinc sleeves. **Bay** (side and gearbox mounts) | Sold at retailers (no official Cusco page found) | https://rzcrewgarage.com/cdn/shop/files/565_911_SET6_8afc6c31-1d65-4a5b-97a4-4e14ec11a90c.jpg?v=1724384166&width=600 (retailer; same photo as the 6MT listing) | [Autobarn](https://www.autobarn.net/products/cusco-cusco-motor-mount-evo-7-9-ct9a-5-speed-only-t14-249152) | USD 396 (Autobarn); USD 418–440 (Andy's, search summary); **SGD 289.17** (RZCrew) | RZCrew (ships from Japan) |
| Cusco | Engine mount set, **6MT** | **565 911 SET6** | As above | As above | As above | https://rzcrewgarage.com/cdn/shop/files/565_911_SET6_96353ef4-0ca9-47a5-9d97-61a2b6e2f190.jpg?v=1724384169&width=600 (retailer) | [RZCrew](https://rzcrewgarage.com/products/cusco-engine-mount-set-6mt-565-911-set6) | USD 396 (MSRP 440, Evasive, search summary); **SGD 289.17** (RZCrew) | RZCrew |
| Vibra-Technics | — | **None** | — | — | **No Mitsubishi range on the current site** | — | [Vibra-Technics](https://www.vibra-technics.co.uk/) | — | — |

Sources:
- Torque Solution product pages (title, "Our Price", description) on torquesolution.com:
  - [TS-EV-125](https://www.torquesolution.com/product-p/ts-ev-125.htm): kit is "5spd trans mount, side engine mount, front engine mount"; 75A; 6061-T6; black anodised, laser engraved.
  - [TS-EV-126](https://www.torquesolution.com/product-p/ts-ev-126.htm): "side engine mount, front engine mount, 6spd trans mount".
  - [TS-EV-135](https://www.torquesolution.com/product-p/ts-ev-135.htm): "Side engine mount, Rear engine mount, 5 spd trans mount … **Will not fit RHD vehicles (JDM)**".
  - [TS-EV-136](https://www.torquesolution.com/product-p/ts-ev-136.htm): side, rear, 6-speed trans.
  - [TS-EV-1235](https://www.torquesolution.com/product-p/ts-ev-1235.htm): "The rear mount in this kit will not fit RHD vehicles (JDM)".
  - [TS-EV-1236](https://www.torquesolution.com/product-p/ts-ev-1236.htm): no RHD warning.
  - [TS-EV-002](https://www.torquesolution.com/product-p/ts-ev-002.htm): "direct replacement of the OEM front engine mount".
  - [TS-EV-003](https://www.torquesolution.com/product-p/ts-ev-003.htm): "**Will not fit RHD vehicles (JDM)**".
  - [TS-EV8-001](https://www.torquesolution.com/product-p/ts-ev8-001.htm): inserts, 75A, "If you need both you must order Qty 2".
- Real Street Performance also notes that some TS kits will not fit RHD JDM models. — [search summary](https://www.realstreetperformance.com/torque-solution-mitsubishi-evo-vii-ix-billet-3-piece-mount-kit-mitsubishi-evolution-vii-ix-01-06.html)
- Cusco
  - 5-speed: "565 911 SET … specifically designed for … VII, VIII, and IX … 5-speed manual"; "More rigid than stock rubber mounts"; USD 396. — [Autobarn](https://www.autobarn.net/products/cusco-cusco-motor-mount-evo-7-9-ct9a-5-speed-only-t14-249152)
  - 6-speed: "CUS-565-911-SET6", "HD Rubber", USD 396 (MSRP 440). Andy's lists 565 911 SET at USD 418–440 and warns of somewhat more NVH. The Evasive and Andy's pages answered HTTP 403, so these come from search summaries. — [Evasive](https://www.evasivemotorsports.com/store/product/cusco-motor-mount-set-mitsubishi-evo-7-9-ct9a-6spd/); [Andy's](https://www.andysautosport.com/products/cusco__565%20911%20SET.html)
  - Vivid Racing describes "565 911 SET" as a suspension set, which conflicts with the others. — [Vivid (search summary)](https://stg.vividracing.com/cusco-motor-mounts-mitsubishi-evolution-20012007-p-156483832.html)
  - RZCrew: "Cusco Japan Reference Number: 565 911 SET Only for 5MT vehicles" and "565 911 SET6 Only for 6MT vehicles", SGD 289.17 each, ships from a Japanese warehouse by DHL in 3–7 days. — [RZCrew 5MT](https://rzcrewgarage.com/products/cusco-engine-mount-set-5mt-565-911-set); [RZCrew 6MT](https://rzcrewgarage.com/products/cusco-engine-mount-set-6mt-565-911-set6)
  - Other Evo sets: 509 911 SET (Evo 1–3), 560 911 SET (Evo 4), 561 911 SET (Evo 5/6), 566 911 SET (Evo X 5MT). — [RZCrew search](https://rzcrewgarage.com/products/cusco-japan-engine-mounts-set-mitsubishi-lancer-evolution-vi-cp9a-evo-5-6-561-911-set)
- Vibra-Technics: the site's make menu lists Alfa Romeo, Audi, BMW, Citroën, Fiat, Ford, Honda, kit cars, Lamborghini, Lotus, Mazda, MG Rover Triumph, Mini, Nissan, Noble, Peugeot, Porsche, Renault, Seat, Skoda, Subaru, Toyota, Vauxhall, Volvo and VW. There is no Mitsubishi, and `/mitsubishi` returns 404. A web search for Vibra-Technics Evo mounts returned only other brands. — [Vibra-Technics](https://www.vibra-technics.co.uk/)

### Inferences
- **Engine bay visibility.** The 4G63 in the CT9A sits transversely: exhaust and turbo at the front of the bay, intake plenum and fuel rail at the back, against the bulkhead.
  - **Clearly visible in the front, bonnet-up view:** the radiator's top tank and filler neck, the upper radiator hose and overflow hose (coloured Samco or Mishimoto), the Samco turbo couplers on the intercooler pipes, and the side engine mount and gearbox mount on top of the chassis rails (Torque Solution's black billet, Cusco's black brackets).
  - **Close-up only, or barely visible:** the injectors (blue ID bodies under the fuel rail and plenum) and the heater hoses at the bulkhead.
  - **Seen from outside the car** (through the bumper openings): the oil cooler cores. HKS and GReddy both put them inside the front fenders (HKS left; GReddy left and right).
  - **Job card only:** the fuel pumps (in the tank), the lower radiator hose, and the front and rear roll mounts underneath.
  - These positions come from the cited fitting locations plus the usual Evo layout. Check them against the configurator's own engine-bay photo.
- **RHD warning.** Singapore Evo IXs are RHD (JDM or UK spec), so Torque Solution's rear mount (TS-EV-003) and every kit that contains it (TS-EV-135/136/1235/1236) should be left out or flagged. TS-EV-125 (5MT) and TS-EV-126 (6MT) have no rear mount and carry no RHD warning. Torque Solution never says either way whether its side and transmission mounts fit RHD; confirm before offering them.
- **5MT or 6MT.** Torque Solution and Cusco both sell gearbox-specific kits, so the configurator must know the car's gearbox (the JDM GSR is 6MT; RS and GT are 5MT). This is general knowledge, not confirmed in the sources above.
- **One choice per slot.** Pick one radiator (Koyo, Mishimoto or GReddy) and one coolant hose kit (Samco or Mishimoto). The two oil cooler kits both use the left fender (HKS left; GReddy left and right), so treat them as exclusive.
- **Fitment conflicts.** The GReddy TW-R radiator cannot be used with a GReddy turbo kit, and HKS's oil cooler kit needs HKS IC piping. Neither the Koyo Type-F nor the Mishimoto suits an automatic car.
- **Brand names.** "Trust" and "GReddy" should not appear as two brands in the catalogue: Trust Japan sells under the GReddy brand, and the codes are the same.
- **Injector naming.** Present the ID injectors as "ID1050-XDS / ID1300-XDS (formerly ID1050x / ID1300x)". Their USCAR plugs need the 90.1 adaptors, so the job card should list the adaptors too.

### Gaps
- **Injector Dynamics:** `injectordynamics.com` could not be reached (blocked by the session's network policy). ID's own Evo fitment data and its official product photos are missing. The ID1300x's maximum pressure (6.0 or 7.0 bar) and flow (1335 or 1340 cc/min) differ between retailers.
- **Fluidyne:** no Evo 8/9 radiator was found, and the site refused automated access. Whether Fluidyne makes one is unconfirmed.
- **Vibra-Technics:** nothing is listed now. Whether it ever made Evo VII–IX mounts, and under which codes, was not found.
- **Cusco:** no official Cusco page or photo, durometer or rubber spec was found; the "HD rubber" wording comes from a retailer.
- **Koyo:** the official code-to-type mapping comes from a PDF whose Japanese headers did not extract. That KH = Type-F 48 mm rests on the NZ Performance "48mm" text, the RZCrew "Type F" title and a retailer's code key. Whether the Type-R KA031610 is still made, and whether a 36 mm Type-M / "Hyper V-Core" exists for the CT9A, is unconfirmed (none appears in Koyo's 2024 table).
- **Walbro:** TI Automotive's own pages were not checked. Prices for the F90000267 were not captured, and whether its fitting to the Evo IX hanger needs a specific kit is unconfirmed.
- **DeatschWerks:** DW lists the pumps for "EVO 8/9 2003-2006" (US years). That they fit the JDM/UK IX hanger is an assumption.
- **Not captured:** Samco TCS299 and TCS299/H prices, and the Mishimoto half-size radiator's product URL.

---

## Is there an official product photo for each model (plain background preferred), verified?

### Takeaway
Clean official photos on white exist for DeatschWerks, Mishimoto, Samco, Torque Solution and GReddy/Trust (radiator; the oil cooler photo is a generic sample).
- **Koyo** only has generic thumbnails on its own site; the best Evo photo is a retailer's (NZ Performance, 460 px).
- **Injector Dynamics:** the manufacturer's site was unreachable, so retailer photos are listed; the FR Sport image is the same file for the 1050 and 1300 kits.
- **Walbro and Cusco:** retailer photos only (the Walbro LancerShop photo has a shop overlay; Cusco's is on a light grey backdrop).
- **HKS:** the Evo oil cooler photo is a fitted shot; the series studio shot is the S15 kit.

### Cited Findings
Every URL returned HTTP 200 with an image content type on `curl -sIL`. Sizes and backgrounds come from a one-off download into scratch space.

| Part | Image URL | Size (px) | Bytes | Official? | Background / notes |
|---|---|---|---|---|---|
| DW200 9-201-0847 | https://cdn.shopify.com/s/files/1/0414/1681/8852/files/9-201-0847.jpg?v=1751919687 | 900×900 | 57,792 | DW | White; pump with DW graphics plus install kit |
| DW300 9-301-0847 | https://cdn.shopify.com/s/files/1/0414/1681/8852/files/9-301-0847.jpg?v=1751919762 | 900×900 | 58,785 | DW | White |
| DW420 9-421-0847 | https://deatschwerks.com/cdn/shop/files/9-421-0847.jpg?v=1751920055 | 900×900 | 60,036 | DW | White |
| DW install kit 9-0847 | https://cdn.shopify.com/s/files/1/0414/1681/8852/files/9-0847.jpg?v=1751919454 | 900×900 | 42,092 | DW | White |
| ID1050x (also used for ID1300x) | https://frsport.com/cdn/shop/files/83baa8e51bec6098d63596bfd2af4cbe_46eb0f4b-9647-4341-894c-4826303b3f3b.jpg?v=1744405801&width=800 | 800×800 | 40,646 | Retailer | White; 4 blue injectors with blue tops. The ID1300 listing serves an identical-size file |
| ID1050x | https://www.maperformance.com/cdn/shop/products/injector-dynamics-11959790895174.jpg?v=1630814074&width=1500 | 1500×1001 | 85,753 | Retailer | White; shows red-anodised adaptors, **not** the blue-top Evo kit |
| ID1050x | https://stmtuned.com/cdn/shop/products/id-injector-dynamics-evo-dsm-1050.jpg?v=1588974536&width=750 | 750×498 | 29,131 | Retailer | White; single injector with blue top; faint STM watermark |
| ID1300x | https://www.maperformance.com/cdn/shop/products/injector-dynamics-21315900099.jpg?v=1563438744 | 308×308 | 6,877 | Retailer | White; small |
| Walbro GSS342 + 400-847 | https://lancershop.com/cdn/shop/files/walbro-255-fuel-pump-w-install-kit-evo-8-9.jpg?v=1769504784&width=1920 | 600×600 | 24,363 | Retailer | White; shop overlay on the image |
| Walbro F90000267 | https://stmtuned.com/cdn/shop/products/F90000267-450-lph-universal-in-tank-fuel-pump-gas-e85.jpg?v=1571334131&width=750 | 750×498 | 20,996 | Retailer | White |
| Koyo KH031610 | https://nzperformance.co.nz/cdn/shop/files/KH031610.jpg?v=1717110128 | 460×460 | 41,425 | Retailer | White; KOYORAD sticker on the core |
| Koyo HH031610 | https://www.maperformance.com/cdn/shop/products/koyo-koy-hh031610-11991249551430.jpg?v=1749246256 | 250×169 | 8,738 | Retailer | Large "Koyo Racing" graphic over the core; too small |
| Koyo HH032412 | https://stmtuned.com/cdn/shop/products/Koyo_Racing_Half-Size_Aluminum_Radiator_Evo_8_9_1024x1024.jpg?v=1580936663 | 750×498 | 57,363 | Retailer | White |
| Koyo Type-F (generic) | https://www.koyorad.co.jp/images/main/products/typeF_AD.jpg | 200×262 | 114,968 | Koyo | Advertising poster, not a product shot |
| Mishimoto MMRAD-EVO-01 | https://www.mishimoto.com/media/catalog/product/m/m/mmrad-evo-01_1_10_klpxeny5kg8rbaih.png | 800×800 | 227,294 | Mishimoto | White; two views; black "M" logo on the core |
| Mishimoto MMRAD-EVO-01H | https://www.mishimoto.com/media/catalog/product/m/m/mmrad-evo-01h_1_xyfihgf5oiskm8bp.png | 800×800 | 134,924 | Mishimoto | White (greyscale PNG) |
| Mishimoto MMHOSE-EVO-9BL | https://www.mishimoto.com/media/catalog/product/m/m/mmhose-evo-9bl_1.jpg | 600×600 | 13,389 | Mishimoto | White; 2 blue hoses |
| GReddy TW-R 12033800 | https://www.greddy.com/cdn/shop/files/12033800_WP_01.jpg?v=1754607332 | 1200×800 | 237,543 | GReddy | White; polished radiator |
| GReddy oil cooler (generic) | https://www.greddy.com/cdn/shop/files/OilCoolerKitsW13_noBlock.jpg?v=1731371109 | 1800×1200 | 122,901 | GReddy | White; blue 13-row core, black hoses; small "sample photo" note bottom right |
| HKS 15004-AM110 (fitted) | https://www.hks-power.co.jp/storage/syshks/product_db/PAn4hS1M9AkehgL4xqkiCbkF8xjNRxtg2QhuOzJx.jpg | 640×480 | 139,771 | HKS | Fitted at the front of the car; not a cut-out |
| HKS oil cooler Black (series) | https://www.hks-power.co.jp/product/cooling/oilcooler/images/oil_cooler_black_Rtype.jpg | 600×432 | 103,740 | HKS | Dark studio; **S15 kit**, not the Evo |
| Samco TCS299/C | https://samcosport.com/wp-content/uploads/2020/04/TCS-299C-scaled.jpg | 2560×2093 | 86,760 | Samco | White; 3 blue hoses |
| Samco TCS299 | https://samcosport.com/wp-content/uploads/2020/04/TCS-299-scaled.jpg | 2560×1707 | 85,242 | Samco | White; 7 blue couplers |
| Samco TCS299/H | https://samcosport.com/wp-content/uploads/2020/04/TCS-299-H.png | 5184×3456 | 1,429,889 | Samco | White; 2 black hoses |
| Samco Japan 40TCS321/C | https://rzcrewgarage.com/cdn/shop/products/samco_2_hoses_radiator_kit_2f38e7e4-238c-4922-914f-48b5548deb86.jpg?v=1710179365&width=600 | (600 wide) | 27,748 | Retailer | Not inspected visually |
| TS-EV-125 | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-125-2.jpg | 872×672 | 57,188 | Torque Solution | White; black billet mounts with engraved logo |
| TS-EV-126 | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-126-2.jpg | 880×704 | 71,719 | Torque Solution | White |
| TS-EV-135 | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-135-2.jpg | 888×664 | 77,377 | Torque Solution | White |
| TS-EV-136 | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-136-2.jpg | 896×680 | 73,974 | Torque Solution | White |
| TS-EV-1235 | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-1235-2.jpg | 950×631 | 95,464 | Torque Solution | White |
| TS-EV-1236 | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-1236-2.jpg | 950×631 | 93,067 | Torque Solution | White |
| TS-EV-002 | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-002-2.jpg | 950×631 | 96,514 | Torque Solution | White |
| TS-EV-003 | https://www.torquesolution.com/v/vspfiles/photos/TS-EV-003-2.jpg | 950×631 | 73,912 | Torque Solution | White |
| TS-EV8-001 | https://www.torquesolution.com/v/vspfiles/photos/TS-EV8-001-2.jpg | 800×555 | 41,690 | Torque Solution | White |
| Cusco 565 911 SET / SET6 | https://rzcrewgarage.com/cdn/shop/files/565_911_SET6_96353ef4-0ca9-47a5-9d97-61a2b6e2f190.jpg?v=1724384169&width=600 | 600×400 | 27,265 | Retailer | Light grey backdrop; 4 mounts. The 5MT listing uses the same file |

Each image's page source is given in the Q1 tables. The Torque Solution full-size images are the `-2.jpg` versions of the `-2T.jpg` thumbnails named in each page's `og:image`. — [e.g. TS-EV-125](https://www.torquesolution.com/product-p/ts-ev-125.htm)

### Inferences
- **Easiest to cut out:** Torque Solution, DeatschWerks, Mishimoto, Samco and GReddy (white backgrounds, large files).
- **Need care:** Koyo (retailer photos; the MAPerformance one carries a large overlay), the ID injectors (the retailer photos don't all show the Evo adaptor colour) and Cusco (grey backdrop, retailer photo).
- **Logos:** most parts carry visible brand marks (DW pump graphics, the Mishimoto "M", KOYORAD stickers, Torque Solution engraving, printed Samco logos). As with the existing parts, that needs the client's OK under the "no text on the car" brief.

### Gaps
- No manufacturer photo for: Injector Dynamics (site unreachable), Walbro (TI site not checked), Cusco (no official page found), Koyo Evo-specific (Koyo shows only type thumbnails).
- Usage rights for all photos sit with the manufacturers or retailers. Dealer press images would need to be requested.

---

## What does each cost, and how is each brand sold in Singapore?

### Takeaway
The only Singapore-facing seller found carrying several of these brands is **RZCrew Garage** (rzcrewgarage.com, SGD prices with Singapore/Malaysia import taxes included, shipped by DHL from Japanese or US warehouses). It lists:
- Koyo Type-F KH031610R (SGD 695.20)
- Mishimoto MMRAD-EVO-01 (SGD 474.37)
- Cusco 565 911 SET/SET6 (SGD 289.17)
- Samco Japan 40TCS321/C (SGD 249)
- Walbro GSS342 (SGD 80.91)
- Trust/GReddy universal oil cooler kits

No Singapore source was found for Torque Solution, DeatschWerks pumps or an Evo-specific ID kit.

### Cited Findings
- **Price summary** (all read 2026-11-26; sources are in the Q1 tables):

  | Part | Price |
  |---|---|
  | ID1050x set | USD 600.60–632.94 |
  | ID1300x set | USD 1,039.50–1,085.70 |
  | DW200 / DW300 / DW420 kits | USD 109 / 169 / 199 |
  | Walbro 255 Evo kit | USD 147.14 |
  | Koyo HH031610 | USD 403.99 |
  | Koyo KH031610R | SGD 695.20 |
  | Mishimoto MMRAD-EVO-01 | USD 359.96 / SGD 474.37 |
  | GReddy TW-R | ¥59,400 incl. tax / USD 650 |
  | GReddy oil cooler 12034608 | ¥84,700 incl. tax / USD 760 |
  | HKS 15004-AM110 | ¥107,800 incl. tax |
  | Samco TCS299/C | USD 162.06–187.35 |
  | Samco Japan 40TCS321/C | SGD 249 |
  | Mishimoto hose kit | USD 50.98 |
  | TS-EV-125 / 126 | USD 489.99 |
  | Cusco 565 911 SET / SET6 | SGD 289.17 / USD 396 |

- **RZCrew sales terms.** Its listings state "Singapore and Malaysia: All import taxes are included in our pricing". Cusco and Koyo items ship "from our Japanese Warehouse … via DHL within 3 to 7 days"; Walbro ships "from our US Warehouse". — [RZCrew Cusco 5MT](https://rzcrewgarage.com/products/cusco-engine-mount-set-5mt-565-911-set); [RZCrew Walbro](https://rzcrewgarage.com/products/walbro-255lph-in-tank-high-pressure-fuel-pump-gss340g5-gss342g3)
- **Other RZCrew stock.**
  - Injector Dynamics kits for Subaru (SGD 662.20–1,999.50).
  - DeatschWerks injectors (no DW pumps came up in the search).
  - Trust/GReddy universal oil cooler kits (SGD 353.60–760.14).
  - Koyo Type-R KA031610 for the Evo 8 (SGD 695.20).
  - Source: [RZCrew search (store search API, queries for each brand)](https://rzcrewgarage.com/products/trust-greddy-oil-cooler-kit-std-3-4-16unf-oring-57mm-13-rows-an10-12004602)
- **Samco:** its distributor page has a "singapore" region filter, but no named Singapore distributor could be extracted from the page. — [Samco distributors](https://samcosport.com/distributors/)
- **Torque Solution:** an RZCrew search for "torque solution evo" returned only other brands (Skunk2, GCG) and one Subaru shifter bushing. — [RZCrew](https://rzcrewgarage.com/products/solid-shifter-linkage-u-joint-subaru-grf-gvf-ts-su-474)
- **DeatschWerks in Japan:** DW tech sheets sit under Tomei's dealing-brands folder, so Tomei Japan handles DW. — [Tomei-hosted DW sheet](https://www.tomei-p.co.jp/dealing_brands/dw/9-307-1026%20Tech%20Sheet.pdf)

### Inferences
- RZCrew appears to be an import retailer drop-shipping from Japan and the US, not necessarily an authorised Singapore distributor. A workshop would usually buy through its own trade channel (a Japanese exporter for Koyo, Cusco and Trust/GReddy; US vendors for DW, ID, Torque Solution and Mishimoto) or through local dealers.
- For the configurator, prices should stay internal (the client asked for no prices).

### Gaps
- No official Singapore distributor was confirmed for any of these brands (Koyo, Mishimoto, Samco, ID, DW, Walbro, Torque Solution, Cusco, GReddy).
- Local fitting labour and lead times were not researched.

---

## Are there Singapore / LTA notes (fuel system changes, E85)?

### Takeaway
LTA sorts modifications into "no approval", "needs LTA approval" and "not allowed". Engine and turbocharger changes are in the approval group, and an LTA circular ties any power-train change (engine, fuel tank, transmission) to a Change of Vehicle Particulars application. Larger injectors and pumps only make sense with an engine retune, so they belong on the approval side. **E85 is not sold at Singapore pumps** as far as could be found, so "E85-safe" (ID, DW300, Walbro F90000267) is only a durability point there.

### Cited Findings
- LTA's OneMotoring page: "There are 3 types of vehicle modifications: Modifications that do not need LTA's approval; Modifications that need LTA's approval; Modifications that are not allowed. Before you modify any part of your vehicle, check the list". — [LTA OneMotoring, Vehicle Technologies and Modifications](https://onemotoring.lta.gov.sg/content/onemotoring/home/owning/modification.html)
- From a search summary of the same page (the lists themselves did not come through in the fetch):
  - Engines, exhaust systems, superchargers/turbochargers and transmissions need approval.
  - Fuel additives and fuel molecule polarisers need none.
  - Source: [LTA OneMotoring](https://onemotoring.lta.gov.sg/content/onemotoring/home/owning/modification.html)
- From a search summary (not opened): an LTA circular to inspection centres says a Change of Vehicle Particulars (CVP) application, made through LTA's VITAS system, is required when modifying any power-train component (engine, fuel tank, transmission, or an EV's traction battery or motor). — [LTA VAC 34/2025](https://onemotoring.lta.gov.sg/content/dam/onemotoring/pdf/Circulars%20to%20ESAs/2025/VAC_34_2025.pdf); [VAC 35/2025](https://onemotoring.lta.gov.sg/content/dam/onemotoring/pdf/Circulars%20to%20ESAs/2025/VAC_35_2025.pdf)
- Third-party Singapore guides (search summaries):
  - Upgrading the exhaust, engine power or fuel system "often needs LTA approval", and enlarging the cylinder bore is prohibited. — [Motorist.sg](https://www.motorist.sg/article/6113/legal-and-illegal-car-modifications-in-singapore)
  - A modification that needs approval but is made without it can expose the owner to liability. — [Singapore Legal Advice](https://singaporelegaladvice.com/law-articles/modification-cars-motorcycles-legal-singapore/)
- **E85:**
  - No source found showing E85 sold at Singapore petrol stations.
  - Singapore's ethanol activity in the news is marine bunkering. — [Argus](https://www.argusmedia.com/en/news-and-insights/latest-market-news/2892550-singapore-completes-world-s-largest-ethanol-bunkering)
  - An NTU student project noted that blends above 5–10% would need new vehicles and infrastructure. — [NTU project page](https://ossarchive.adm.ntu.edu.sg/2016-17/cm8001-group-20/index.html%3Fp=128.html)
  - Bulk E100 ethanol is advertised to motorists in drums, not at pumps. — [Motorist.sg deal](https://motorist.sg/deal/291/bestchem-ethanol-e100)

### Inferences
- **Fuel parts.** Injectors (ID1050x/1300x) and high-flow pumps (DW300/DW420, Walbro 450) are only needed for a higher-power retune. That makes them part of an engine modification the workshop should treat as needing LTA approval and an inspection. The configurator could show a short "LTA approval may be required" note on fuel-system parts and turbo upgrades.
- **Cooling parts and mounts.** Radiators, oil coolers, silicone hoses and mounts are like-for-like replacements that do not change power. No LTA source says they need approval, but none says they don't either; check them against LTA's list.
- **Ethanol.** With no E85 at the pump, there is no point marketing an "E85 build". The ID and DW parts' corrosion-resistant, all-fuel design is still a valid durability point.

### Gaps
- The full LTA approval / no-approval / prohibited lists could not be read directly (they did not come through in the page fetch). Radiators, oil coolers, hoses and engine mounts specifically could not be confirmed either way.
- No official EMA, LTA or fuel-retailer statement on E85 availability was found. Its absence is inferred from the lack of any source.
