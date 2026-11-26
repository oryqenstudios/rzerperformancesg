# Evo IX (CT9A, 4G63 MIVEC) engine internals: Manley, CP, Eagle, Brian Crower, Tomei, GSC, Kelford, HKS, ARP, Tomei/Cosworth strokers, balance-shaft deletes, Gates belts

Researched 26 Nov 2026 for the RZER Performance photo configurator's two inside-engine views: the open head (cam cover off) and the sectioned cutaway engine.

**Builds on earlier notes.** Tomei's cams (Poncam/Procam EVO9), valvetrain, head gaskets, 2.2/2.3 L kits, pistons, rods, crank and head studs are in `research_notes/Tomei and HKS Evo IX parts/tomei.md` ("Camshafts", "Valvetrain, cam drive, gasket, timing" and "Bottom end, stroker kits, studs" tables, with JPY prices and photo URLs). HKS's cams (22002-AM011/-AM012), valve springs, cam pulley, Fine Tune timing belt, forged pistons (2103-RM006), H-beam rods (23004-AM005), stopper head gaskets, 2.3 L kit and short block are in `hks_engine_powertrain.md`, sections 6 and 7. They are not repeated here; only the extras found this round are added (Tomei USA part numbers, the CP-piston variant of the Tomei kits, SGD prices).

**Method notes for the report writer:**
- **Manufacturer sites behind bot checks**, unreadable from this session:
  - Cloudflare challenge (HTTP 403): manleyperformance.com, arp-bolts.com, kelfordcams.com, gates.com, extremepsi.com, evolutionm.net.
  - JavaScript "please wait" check: briancrower.com.
  - Proxy 502: gscpowerdivision.com.
  - Incapsula block: summitracing.com product pages.
- **Hosts that do not resolve in this session:** maperformance.com, importimageracing.com, frsport.com.
- **cp-carrillo.com** opens, but its catalogue search runs in JavaScript, and the canonical page for SC7201 (`/i-sc7201.html`) returns 404.
- **Where specs come from instead:**
  - Eagle's own store (eaglerod.com) and Tomei Japan, which both open.
  - US, NZ and SG retailers' product data, mostly STM Tuned (an Evo/DSM specialist that publishes the full manufacturer spec tables), Titan Motorsports, LancerShop, JDMuscle, RallySport Direct and NZ Performance.
  - RZ Crew Garage, which prices in SGD.
  - TDI (tdi-plc.com), Cosworth's UK distributor.
- **Photos:** every photo URL below was checked with `curl -sIL` on 26 Nov 2026 and returned HTTP 200 with `image/jpeg`. Most are retailer-hosted copies of the manufacturer's studio shots, because the manufacturers' own sites could not be read.
- **Prices:** for internal reference only. USD at STM/Titan/LancerShop/JDMuscle/RSD/Eagle, NZD at NZ Performance, GBP at TDI, SGD at RZ Crew Garage. Store currencies were confirmed from each Shopify store's `Shopify.currency`.

**Stock Evo IX bottom end, used as the reference below:**
- Bore 85.0 mm, stroke 88 mm, rod 150 mm, piston compression height 35.0 mm, head chamber 43 cc.
- Tomei's 2.3 L kit table gives these as "OEM +0.5 / +12.0 / −3.0 / −3.35". Manley lists 85 mm as "Standard" bore and 43 cc as the "EVO Head". HKS gives stock capacity as 1,997.4 cc.
- Sources: [STM, Tomei 2.3L kit](https://stmtuned.com/products/tomei-2-3l-stroker-kit-4g63-mitsubishi-evo-1-9); [STM, Manley 4G63 piston table](https://stmtuned.com/products/manley-4g63-7-bolt-pistons); `hks_engine_powertrain.md`.

## Key question 1: Evo IX part numbers, variants, specs, look and status per brand

### Takeaway
- **Pistons, rods, studs, belts and balance-shaft parts are shared.** Almost every piston, rod, stud, belt and balance-shaft part listed for the Evo IX is a "7-bolt 4G63, 22 mm pin, Evo IV–IX" part: Manley 606xxx pistons, CP SC7xxx, Eagle CRS5900MB3D, Manley 14022-4/15022-4/14403-4, ARP 207-4203/-4302/-5401, Gates T167RB.
- **Camshafts are the exception.** The IX's MIVEC head needs IX-only cam sets:
  - Brian Crower BC0124 (the only BC Evo 9 cam found)
  - GSC 7009 S1/S2/S3/R2
  - Kelford 9-TX/9-SLX
  - Tomei EVO9 Poncam/Procam and HKS 22002-AM011/AM012 (see earlier notes)
- **Cosworth sells no complete 2.3/2.4 L 4G63 stroker kit today.** Only parts were found: a lightweight stroker crank, forged rods, pistons, studs, Evo 9 gaskets and a belt. The complete-kit options are Tomei (2.2/2.3 L), Brian Crower (2.2/2.4 L), Eagle (2,324 cc rotating assembly) and HKS (in earlier notes).

### Cited Findings

#### A. Forged pistons (cutaway view)

Manley Platinum Series, 7-bolt 4G63 Evo IV–IX. All are 2618 forgings with a 22 mm (.866") pin, offset pin, pressure-balance groove, Napier second ring, and "will accommodate +1 mm valve sizes". Each set holds 4 pistons, rings, pins and spiral locks.

Manley publishes two compression ratios per part: the DSM ratio (47 cc head) and the Evo ratio (43 cc head). The Evo figure applies to the IX. Pin options:
- C = standard .150" chrome-moly pin
- CE = "Extreme" .210" 9310 pin
- Turbo Tuff = .250" 9310 pin, with vertical gas ports

Source for all rows: [STM, Manley 4G63 7-bolt piston table](https://stmtuned.com/products/manley-4g63-7-bolt-pistons).

| Brand / model | Evo IX part no. | Specs (Evo CR, bore, dish, comp. height, rod, weight) | Look | View | Status | Photo (checked) | Page | Price | Singapore |
|---|---|---|---|---|---|---|---|---|---|
| Manley Platinum, 2.0 L | 606000C-4 / CE-4 (85.0 std); 606005C-4 / CE-4 (85.5); 606010C-4 / CE-4 (86.0); also 86.5 and 87.0 | 9.0:1 Evo; −12 cc dish; 1.375" CH; 150 mm rod; 337–354 g | Polished machined crown with valve reliefs; dark coated skirt with Manley logo (STM's generic photo) | Cutaway | Listed with price (current) | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/manley-pistons_241a321c-9023-4efc-8907-600e6c8b4c8a.jpg) (generic; "pistons will vary by application") | [page](https://stmtuned.com/products/manley-4g63-7-bolt-pistons) | US$741.18 (C) / US$873.01 (CE) | RZ Crew S$950.36 ([606005C-4](https://rzcrewgarage.com/products/manley-pistons-kit-8-6-1cr-85-5mm-bore-mitsubishi-4g63-7-bolts-606005c-4-606005c-4)) |
| Manley Platinum, 2.0 L | 606100C-4 (85.0); 606105C-4 (85.5); 606110C-4 (86.0) | 9.5:1 Evo; −8 cc dish; 1.375" CH; 350 g (85.5) | as above | Cutaway | current | as above | [606105C-4](https://stmtuned.com/products/606105c-4-manley-pistons-4g63-7-bolt) | US$741.18 | RZ Crew S$950.36 ([606105C-4](https://rzcrewgarage.com/products/manley-pistons-kit-9-1-1cr-85-5mm-bore-mitsubishi-4g63-7-bolts-606105c-4-606105c-4)) |
| Manley Platinum, 2.0 L flat-top | 606200C-4 (85.0); 606205C-4 (85.5) | 10.5:1 Evo; −2.5 cc (flat top); 347 g (85.5) | Flat crown | Cutaway | current | as above | [table](https://stmtuned.com/products/manley-4g63-7-bolt-pistons) | US$741.18 | RZ Crew lists the range |
| Manley Turbo Tuff | 606305CE-4 (85.5, 9.0 Evo); 606405CE-4 (85.5, 10.5 Evo) | .250" wall pin; vertical gas ports; 369 / 376 g | Gas-port holes in the crown edge | Cutaway | current | as above | [table](https://stmtuned.com/products/manley-4g63-7-bolt-pistons) | US$873.01 class | — |
| STM-Spec Manley | 5812STM1C-4 (85.5 only) | 11.5:1 Evo; 376 g; gas ported; moly-coated skirts; 9310 pin, .250" wall | Same body with a dark skirt; [photo set](https://cdn.shopify.com/s/files/1/1893/9911/products/stm-4g63-evo-4-9-pistons-1.jpg) shows crown, side and underside | Cutaway | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/stm-4g63-evo-4-9-pistons-1.jpg) | [page](https://stmtuned.com/products/stm-spec-manley-evo-4g63-pistons) | US$864.17 | — |
| Manley for long rod / stroker | 617xx5C-4 (2.0 L, 156 mm rod, 1.130" CH); 618xxx (94 mm stroke, 150 rod, 1.248"); 619xxx (94 mm, 156 rod, 1.012"); 608xxx (100 mm stroke, 2.3 L, 1.130", −22 cc for 9.0 Evo) | e.g. 608005C-4: 85.5, 9.0 Evo, 295 g | Taller pin position (shorter CH) | Cutaway | current | as above | [table](https://stmtuned.com/products/manley-4g63-7-bolt-pistons) | US$741.18–873.01 | RZ Crew lists 617/619 sets at S$950.36 |

- **Conflict:** RZ Crew's titles give its own ratios, which differ from Manley's Evo figures: "8.6:1" for 606005C-4 and "9.1:1" for 606105C-4. Manley says 9.0:1 and 9.5:1 on an Evo head. — [RZ Crew 606005C-4](https://rzcrewgarage.com/products/manley-pistons-kit-8-6-1cr-85-5mm-bore-mitsubishi-4g63-7-bolts-606005c-4-606005c-4); [STM Manley table](https://stmtuned.com/products/manley-4g63-7-bolt-pistons)
- **Table error:** STM's table repeats "617005C-4" in the 100 mm, 10.5:1 block, which is evidently a typo. — [STM Manley table](https://stmtuned.com/products/manley-4g63-7-bolt-pistons)

CP (CP-Carrillo) "Sport Compact" shelf pistons. CP names each part with two compression ratios: one for the 2G DSM head and one for the "EVO VIII/EVO IX" head. The Evo figure is 0.5 point higher.

| Brand / model | Evo IX part no. | Specs | Look | View | Status | Photo (checked) | Page | Price | Singapore |
|---|---|---|---|---|---|---|---|---|---|
| CP, 85.0 std | SC7199 | 9.5:1 Evo (9.0 2G); 88 mm stroke, 150 rod, 1.37" CH, −8.5 cc; rings 1.0 × 1.2 × 2.8 mm; 22 mm pin | Bright machined 2618 forging, plain skirt, double pin oilers | Cutaway | current | [photo](https://cdn.shopify.com/s/files/1/0066/0370/2362/products/CPP_SC7201_001.jpg) (generic; the same image is used for SC7203) | [Titan](https://titanmotorsports.com/products/cp-carrillo-pistons-for-mitsubishi-4g63-2g-85mm-9-1-or-evo-viii-evo-ix-9-5-1) | US$885.15 (Titan); US$679 ([JDMuscle](https://jdmuscleusa.com/products/cp-pistons-rings-85-0mm-bore-standard-size-for-03-06-evo-8-9)) | RZ Crew S$1,060.80 ([SC7199](https://rzcrewgarage.com/products/cp-pistons-kit-9-5-1cr-85mm-bore-mitsubishi-4g63-7-bolts-evo-8-9-head-sc7199-sc7199)) |
| CP, 85.0 std | SC7228 | 9.0:1 "Evo 8/9 head" | as above | Cutaway | listed | — | [RZ Crew](https://rzcrewgarage.com/products/cp-pistons-kit-9-0-1cr-85mm-bore-mitsubishi-4g63-7-bolts-evo-8-9-head-sc7228-sc7228) | — | RZ Crew S$1,060.80 |
| CP, 85.5 (+0.5) | SC7201 | 9.5:1 Evo head (9.0 2G); 22 mm pin, 88 mm stroke, 150 rod (CJ Motor, via search); ring set RS1616-3366-0 | Kit photo: four pistons, pins, rings and a CP-Carrillo label | Cutaway | current | [photo (NZ Performance, 2048 px, CP Carrillo branding)](https://cdn.shopify.com/s/files/1/0848/9576/0691/files/CPSC7201.jpg) | [RZ Crew](https://rzcrewgarage.com/products/cp-pistons-kit-9-5-1cr-85-5mm-bore-mitsubishi-4g63-7-bolts-evo-8-9-head-sc7201-sc7201); [NZ Performance](https://nzperformance.co.nz/products/cpsc7201) | US$885.15 ([Titan](https://titanmotorsports.com/products/sport-compact-pistons-for-mitsubishi-4g63-2g)); US$679 ([JDMuscle](https://jdmuscleusa.com/products/cp-pistons-rings-85-5mm-bore-0-5mm-over-for-03-06-evo-8-9)); NZ$1,575 | RZ Crew S$1,060.80 |
| CP, 85.5 (+0.5) | SC7229 | 9.0:1 Evo (8.5 2G); 1.37" CH; −13.2 cc | as above | Cutaway | current | [photo](https://cdn.shopify.com/s/files/1/0066/0370/2362/products/CPP_Pistons_001_99eda293-1db1-4a63-97d8-54f2ca71cad2.jpg) (generic; captioned "image may not reflect actual product") | [Titan](https://titanmotorsports.com/products/cp-carrillo-pistons-for-mitsubishi-4g63-2g-85-5mm-8-5-1-or-evo-viii-evo-ix-9-1) | US$885.15 | RZ Crew S$1,060.80 ([SC7229](https://rzcrewgarage.com/products/cp-pistons-kit-9-0-1cr-85-5mm-bore-mitsubishi-4g63-7-bolts-evo-8-9-head-sc7229-sc7229)) |
| CP, 86.0 (+1.0) | SC7230 (9.0 Evo, −13.9 cc); SC7203 (9.5 Evo); SC7233 (10.5 Evo) | 1.37" CH | as above | Cutaway | current | [photo](https://cdn.shopify.com/s/files/1/0066/0370/2362/products/CPP_SC7203_001.jpg) (generic) | [Titan SC7230](https://titanmotorsports.com/products/cp-carrillo-pistons-for-mitsubishi-4g63-2g-86mm-8-5-1-or-evo-viii-evo-ix-9-1); [JDMuscle SC7203](https://jdmuscleusa.com/products/cp-pistons-rings-86-0mm-bore-1-0mm-over-for-03-06-evo-8-9) | US$885.15 / US$679 | RZ Crew S$1,060.80 ([SC7230](https://rzcrewgarage.com/products/cp-pistons-kit-9-0-1cr-86mm-bore-mitsubishi-4g63-7-bolts-evo-8-9-head-sc7230-sc7230)) |
| CP, stroker | SC7216 (94 mm, 85.5, 9.5 Evo, 1.252" CH, −13.4 cc); SC7197 (100 mm, 85.0, 9.5 Evo, 1.134", −16.8 cc); SC7252 (100 mm, 85.0, 9.0 Evo); SC7254 (100 mm, 86.0, 9.0 Evo, −22.5 cc); SC7257 (100 mm, 86.0, 10.5 Evo, −14.2 cc) | 150 mm rod | as above | Cutaway | current | generic as above | [Titan SC7216](https://titanmotorsports.com/products/cp-carrillo-pistons-for-mitsubishi-4g63-2g-94mm-stroker-85-5mm-9-1-or-evo-viii-evo-ix-9-5-1); [SC7197](https://titanmotorsports.com/products/cp-carrillo-pistons-for-mitsubishi-4g63-2g-100mm-stroke-85mm-9-1-or-evo-viii-evo-ix-9-5-1); [SC7254](https://titanmotorsports.com/products/cp-carrillo-pistons-for-mitsubishi-4g63-2g-100mm-stroke-86mm-8-5-1-or-evo-viii-evo-ix-9-1); [SC7257](https://titanmotorsports.com/products/cp-carrillo-pistons-for-mitsubishi-4g63-2g-100mm-stroke-86mm-9-5-1-or-evo-viii-evo-ix-10-5-1) | US$885.15; SC7216 NZ$1,575 | RZ Crew SC7252/SC7254 S$1,060.80 |

- **Conflict over SC7201:**
  - JDMuscle and Import Image Racing copy says the Evo 8/9 pistons "retain a 9.0 compression ratio". — [JDMuscle](https://jdmuscleusa.com/products/cp-pistons-rings-85-5mm-bore-0-5mm-over-for-03-06-evo-8-9)
  - RZ Crew lists SC7201 twice: 9.0:1 (2G head) and 9.5:1 (Evo 8/9 head). — [RZ Crew 2G](https://rzcrewgarage.com/products/cp-pistons-kit-9-0-1cr-85-5mm-bore-mitsubishi-4g63-7-bolts-sc7201-sc7201); [RZ Crew Evo](https://rzcrewgarage.com/products/cp-pistons-kit-9-5-1cr-85-5mm-bore-mitsubishi-4g63-7-bolts-evo-8-9-head-sc7201-sc7201)
  - The RZ Crew reading matches CP's naming pattern for SC7199 and SC7203 ("9:1 or EVO VIII/EVO IX 9.5:1"). — [Titan SC7199](https://titanmotorsports.com/products/cp-carrillo-pistons-for-mitsubishi-4g63-2g-85mm-9-1-or-evo-viii-evo-ix-9-5-1)
- **CP shelf piston features:** 2618 forging, CNC machined and balanced to within 1 g, double pin oilers fed from the oil ring, pick-lock grooves. Rings, pins and locks are included. — [NZ Performance SC7201](https://nzperformance.co.nz/products/cpsc7201)
- **CP coatings are options, not standard:** CP lists moly dry-film skirt coat, ceramic crown coat, hard anodise, top-groove anodise, ASF finishing and WPC as available treatments. — [CP-Carrillo coatings](https://www.cp-carrillo.com/p-32904-coatings.html)

Cosworth forged pistons (for comparison). TDI lists:
- "Cosworth Forged Piston Kit – 85.50mm (8.8:1cr) 2.0ltr" (SKU 10001449)
- "4G63 Forged Pistons 10001489 85.5mm 8.8:1"
- "4G63 2.2ltr 85.5mm 8.1:1 cr 10001452" (for the 94 mm crank only)

Cosworth describes "anti scuff skirt coating, ultra-strong pins, polished top and patented anti-detonation bands". TDI's pages mix part numbers (title, SKU and text disagree) and use 4B11 piston photos, so treat them as unreliable. — [TDI 85.5 8.8:1](https://www.tdi-plc.com/product/cosworth-forged-piston-kit-85-50mm-8-8-1cr-2-0ltr-3/); [TDI 10001489](https://www.tdi-plc.com/product/cosworth-4g63-forged-pistons-10001489-85-5mm-8-81/); [TDI 2.2 L](https://www.tdi-plc.com/product/cosworth-forged-piston-kit-86-00mm-8-8-1cr-2-2ltr-94mm-crankshaft-only/)

HKS (2103-RM006, 85.5 mm, nickel plating plus moly coating) and Tomei (85.5/86.0 for its strokers): see earlier notes. The Tomei piston set is also sold in the US as follows ([STM](https://stmtuned.com/products/tomei-2-2l-2-3l-forged-pistons-4g63-mitsubishi-evo-4-9)):
- TA202A-MT01A: Tomei, 86 mm, A4032 alloy, 328.7 g
- TA202A-MT01AP: CP-made, 86 mm, A2618, 335.1 g
- TA202A-MT01B: Tomei, 85.5 mm, A4032, 322.4 g
- All have a 31.65 mm compression height, a 22 × 60 mm pin, a −19.5/−19.6 cc dish, and cost US$1,200.

#### B. Connecting rods (cutaway view)

| Brand / model | Evo IX part no. | Specs | Look | View | Status | Photo (checked) | Page | Price | Singapore |
|---|---|---|---|---|---|---|---|---|---|
| Eagle "ESP" 4340 H-beam (3D, 3rd-gen design) | CRS5900MB3D (set); CRS-5900MB3D-1 (single) | 5.9" c-c (Eagle; STM: "5.9"", i.e. the 150 mm Evo rod); 0.866" (22 mm) pin, bronze-bushed for a full-floating pin; 1.771" journal, 1.89" housing bore, 1.038" big-end width; 3/8" ARP 2000 bolts; 575 g; "900 HP" (STM) | Grey, fully machined and shot-peened H-beam with a bronze small-end bush | Cutaway | Current: "12 in stock", Southaven MS (Eagle) | [official photo, eaglerod.com](https://www.eaglerod.com/images/ea531f46-bfd3-11ea-bfd2-fc12ec51d8ff/jpg/59-4340-h-beam-mitsubishi-4g63-7-bolt-38-arp-2000-bolts/crs-5900mb3d-1.jpg) (~1 MB); [STM photo, white background](https://cdn.shopify.com/s/files/1/1893/9911/products/eagle-rods-4g63-7bolt-evo-dsm-1.jpg) | [Eagle](https://www.eaglerod.com/item/5523517-4340-rod-mitsubishi4g63-4); [STM](https://stmtuned.com/products/eagle-rods-4g63-7bolt-evo-dsm) | US$406.99 (Eagle); US$389.68 (STM); NZ$792.68 ([NZ Perf.](https://nzperformance.co.nz/products/eagle4g63evorods)) | Not found at RZ Crew; grey import |
| Eagle Extreme Duty H-beam | CRS5900MBXD | As above, with 3/8" ARP Custom Age 625+ bolts; "fully machined, shot-peened, and polished"; 580 g; "1200 HP" (STM) | Polished H-beam | Cutaway | current (listed) | no Eagle photo (Eagle shows "no-photo") | [Eagle](https://www.eaglerod.com/item/5524251-mitsubishi-4g63-93-extreme-duty-rod-4) | US$698.99 (Eagle); US$668.64 (STM) | grey import |
| Manley H-Beam (economical) | 14022-4 (150 mm); 14020-4 (156 mm) | 4340; 5.905" / 6.142"; 22 mm pin; 1.890" big-end bore; 3/8" ARP 2000; 580 / 545 g; 600+ hp | Grey shot-peened H-beam, "MANLEY" engraved on the beam | Cutaway | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/manley-h-beam-rods.jpg) | [STM](https://stmtuned.com/products/manley-4g63-economical-h-beam-steel-connecting-rods-150mm-standard-stroke-4g63) | US$554.27 | RZ Crew S$694.32 ([14022-4](https://rzcrewgarage.com/products/manley-h-beam-conrod-kit-mitsubishi-4g63t-3rd-gen-mivec-14022-4-14022-4)) |
| Manley H-Tuff | 15022-4 (150); 15020-4 (156); 15020-1 single | Wider beam; ARP 2000; 635 g; 750 hp | Wider beam engraved "MANLEY H-TUFF SERIES" | Cutaway | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/manley-h-tuff-rods-4.jpg); [single rod, 1400 px](https://cdn.shopify.com/s/files/1/1893/9911/files/15020-manley-4g63-h-tuff-steel-rod-156mm-single.jpg) | [STM](https://stmtuned.com/products/manley-4g63-h-tuff-steel-connecting-rods-150mm-standard-stroke-4g63) | US$618.57 | — |
| Manley H-Tuff Plus | 15022R6-4; 15020R6-4 | ARP 625+ bolts; 635 g; 950 hp | as H-Tuff ("H-TUFF PLUS SERIES") | Cutaway | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/manley-h-tuff-plus-rods-4.jpg) | [STM](https://stmtuned.com/products/manley-h-tuff-plus-steel-rods-for-7-bolt-4g63-dsm-evo) | US$973.48 | — |
| Manley Pro Series Turbo Tuff I-beam | 14403-4 / 14403R6-4 (150); 15403-4 / R6 (300M); 14400-4 (lightweight); 14421-4 (156); 14422-4 (162) | 4340 or 300M; 675 g (14403); 1,000 hp (4340) / 1,400 hp (300M) | Darker grey I-beam | Cutaway | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/manley-turbo-tuff-i-beam-rods.jpg) | [STM](https://stmtuned.com/products/manley-i-beam-turbo-tuff-rods-for-7-bolt-4g63-dsm-evo) | US$1,028.90–1,684.73 | RZ Crew S$1,332.48 ([14403-4](https://rzcrewgarage.com/products/manley-turbo-tuff-pro-series-i-beam-conrod-kit-mitsubishi-4g63t-3rd-gen-mivec-14403-4-14403-4)) |
| Cosworth forged steel rods, Evo 8/9 | 20002632 | "Special order only… 4–8 weeks" | Grey H-beam with bronze bushes (LancerShop photo, 400 px) | Cutaway | special order | [photo](https://cdn.shopify.com/s/files/1/0701/0405/5868/files/image_d8ec715f-48dc-499d-9afb-dac9b43c9c3f.jpg) | [LancerShop](https://lancershop.com/products/cosworth-forged-steel-connecting-rods-evo-8-9) | US$1,465.27 | grey import |

- Eagle's H-beam page says "Recommended for competition use", and its Extreme Duty page says "For extreme competition use". Eagle also files both rods under "4G63, 7 bolt (1998 up)". — [Eagle MB3D](https://www.eaglerod.com/item/5523517-4340-rod-mitsubishi4g63-4); [Eagle MBXD](https://www.eaglerod.com/item/5524251-mitsubishi-4g63-93-extreme-duty-rod-4)
- CRS5900MC3D is the 6-bolt rod with a 22 mm pin, a "combo" for VR4 and early cars. It is not for the Evo IX. — [Eagle MC3D](https://www.eaglerod.com/item/5523946-4340-rod-mitsu-4g63-early-w-late-pstn-4)
- Brian Crower also makes 7-bolt rods (ProH625+ BC6108; Sportsman BC6109, S$750.27 at RZ Crew). Tomei and HKS H-beam rods are in the earlier notes. — [RZ Crew BC6109](https://rzcrewgarage.com/products/brian-crower-mitsubishi-dsm-4g63-2nd-gen-7-bolt-sportsman-w-arp2000-fasteners-forged-conrods-kit-bc6109-bc6109); [STM BC0128](https://stmtuned.com/products/bc-brian-crower-2-2l-stroker-kit-7-bolt-4g63-evo-dsm-bc0128)

#### C. Camshafts, Evo IX MIVEC only (open-head view)

| Brand / model | Evo IX part no. | Duration / lift (IN/EX) | Look | View | Status | Photo (checked) | Page | Price | Singapore |
|---|---|---|---|---|---|---|---|---|---|
| Brian Crower Stage 2+ (LancerShop: "Stage 2 3/4") | BC0124 | 276/276°; lift 11.13/11.13 mm (LancerShop) **or** .436"/11.07 mm (JDMuscle): conflict | Ground lobes and journals on dark cores (small photo) | Open head | Listed (US$453–570); BC's site unreadable | [photo (329 px, small)](https://cdn.shopify.com/s/files/1/0075/8703/7237/products/brian-crower-276276-camshafts-mitsubishi-evo-9-cams-brian-crower-bc0124.jpg) | [JDMuscle](https://jdmuscleusa.com/products/brian-crower-276-276-camshafts-mitsubishi-evo-9); [LancerShop](https://lancershop.com/products/brian-crower-stage-2-3-4-276-cams-set-evo-9) | US$453.25 / US$570.34 | Not at RZ Crew (it lists BC Evo IV–VIII cams BC0111/BC0114 at S$635.46) |
| GSC Power-Division S1 (billet) | 7009S1 | 268/268°; 11.0 / 10.5 mm (RSD); stock springs OK; 3,000–8,000 rpm; 300–450 whp | Smooth, fully turned billet cams, dark nitrided finish | Open head | current | [photo, STM](https://cdn.shopify.com/s/files/1/1893/9911/products/gsc-s1-s2-s3-r2-evo-9-mivec-camshafts-1.jpg); [close-up, LancerShop](https://cdn.shopify.com/s/files/1/0701/0405/5868/files/b4dbafb1-f94a-48c0-916e-75a2257a9900-800_f7da1b6e-3b65-4965-a2a3-60bd1eaa955b.jpg) | [STM](https://stmtuned.com/products/gsc-s1-s2-s3-r2-evo-9-mivec-camshafts); [RSD](https://www.rallysportdirect.com/products/7009s1-gsc-bilet-core-intake-exhaust-cams); [LancerShop](https://lancershop.com/products/gsc-power-division-4g63t-mivec-s1-cams-268-268-billet-evo-9) | US$653.23 | Not at RZ Crew; grey import |
| GSC S2 | 7009S2 | 274/274°; 11.20 / 11.00 mm; 226° / 230° @ .040"; centreline 128° IN / 113° EX; 400–700 whp; GSC beehive springs suggested | as S1; the [second STM photo](https://cdn.shopify.com/s/files/1/1893/9911/products/gsc-s1-s2-s3-r2-evo-9-mivec-camshafts-2.jpg) shows laser etching ("7009 S3 EXHAUST") | Open head | current | as above | [RSD](https://www.rallysportdirect.com/products/7009s2-gsc-power-division-mivec-s2-camshafts) | US$653.23 | grey |
| GSC S3 | 7009S3 | 280/280°; 11.7 / 11.7 mm (LancerShop); for 800+ whp (STM), "700+hp" (LancerShop) | as S1 | Open head | current | as above | [LancerShop](https://lancershop.com/products/gsc-p-d-4g63t-mivec-s3-cams-evo-9) | US$653.23 | grey |
| GSC R2 (stroker) | 7009R2 | 274/274°; 12.0 mm both; 4,000–8,500 rpm, for 2.2–2.4 L; needs GSC 5040/5041 Ti spring kits | as S1 | Open head | current | as above | [STM](https://stmtuned.com/products/gsc-s1-s2-s3-r2-evo-9-mivec-camshafts) | US$653.23 | grey |
| Kelford "TX" (hydraulic) | 9-TX258; 9-TX264; 9-TX268; 9-TX272; 9-TX272-L; 9-TX272R; 9-TX280; 9-TX280R; 9-TX288 | 258/264 10.5/10.5; 264/260 11.0/10.35; 264/268 11.0/10.5; 272/272 11.0/11.0; 272/272 10.0/10.0 (stock springs); 272/272 11.75/11.75; 280/276 11.5/11.0; 280/288 11.5/11.5; 288/280 12.0/11.5 | Ground lobes on dark cores, green paint marks (STM photo shows TX280) | Open head | current; **9-TX278 (272/278) discontinued** | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/kelford-cams-4g63-evo-9-mivec-1.jpg) | [STM](https://stmtuned.com/products/kelford-cams-4g63-evo-9-mivec) | US$400–683.05 (STM); US$634.95–752.04 ([LancerShop](https://lancershop.com/products/kelford-272-272-race-cams-set-evo-9)) | **RZ Crew S$784.32–910.08** ([9-TX272](https://rzcrewgarage.com/products/kelford-9-tx272-272-272-lift-11-00mm-11-00mm-mitsubishi-4g63t-mivec-evo-9-9-tx272)) |
| Kelford "SLX" (solid-lifter conversion) | 9-SLX260; 9-SLX272; 9-SLX282; 9-SLX294 (NZ) | 260/264 10.5/10.5; 272/274 11/11; 282/288 11.5/11.5 | as TX | Open head | Special order, "2–4 months" | as above | [STM](https://stmtuned.com/products/kelford-cams-4g63-evo-9-mivec); [NZ Perf. 9-SLX294](https://nzperformance.co.nz/products/kelford9slx294) | US$683.05; NZ$976.52 | grey |

- **Kelford:** cams are ground on a Toyoda CNC masterless grinder. The box holds two cams, cam lube and a spec sheet. — [STM Kelford Evo 9](https://stmtuned.com/products/kelford-cams-4g63-evo-9-mivec)
- **GSC billet cores** start as "cold-forged alloy steel bars" and get a nitride treatment for case hardening. — [STM GSC Evo 9](https://stmtuned.com/products/gsc-s1-s2-s3-r2-evo-9-mivec-camshafts)
- **Fitment caveats:**
  - BC0124 "does NOT fit the Evolution VIII". — [JDMuscle BC0124](https://jdmuscleusa.com/products/brian-crower-276-276-camshafts-mitsubishi-evo-9)
  - RSD's title for 7009S1 says "Evo 8/9"; STM and LancerShop say Evo 9 MIVEC. — [RSD](https://www.rallysportdirect.com/products/7009s1-gsc-bilet-core-intake-exhaust-cams)
- **Tomei EVO9 Poncam, US numbers** (adds to `tomei.md`, which had these from snippets only), from RZ Crew:
  - TA301B-MT01B: 272-10.70/10.20 set, S$714.56
  - TA301D-MT01B: intake, S$357.28
  - TA301F-MT01B: exhaust, S$357.28
  - Sources: [RZ Crew set](https://rzcrewgarage.com/products/tomei-usa-type-poncam-4g63-evo9-272-10-70-10-20-intake-exhaust-camshafts-mitsubishi-4g63t-mivec-ta301b-mt01b-ta301b-mt01); [RZ Crew EX](https://rzcrewgarage.com/products/tomei-usa-type-poncam-4g63-evo9-ex-272-10-20-exhaust-camshafts-mitsubishi-4g63t-mivec-ta301f-mt01b-ta301f-mt01b)
- **The IX's MIVEC intake cam gear stays factory.** STM sells it as a part: Mitsubishi 1147A003, US$1,022.28. — [STM search listing "OEM MIVEC Intake Cam Gear for Evo 9 (1147A003)"](https://stmtuned.com/products/oem-mitsubishi-cam-gear-evo-9-mivec-intake)
- **Cosworth M1/M2 cams** are listed for the Evo 8 only (KK3805 at TDI; US$817.65 at LancerShop). No Cosworth Evo 9 cam was found. — [LancerShop M1](https://lancershop.com/products/cosworth-m1-camshaft-set-evo-8); [TDI M1](https://www.tdi-plc.com/product/cosworth-high-performance-camshafts-pair-m1-grind/)

#### D. Valve springs and retainers that go with these cams (open-head view)

| Brand / model | Part no. | Specs | Look | Status | Photo (checked) | Page | Price |
|---|---|---|---|---|---|---|---|
| GSC beehive springs, Evo 8/9 only | GSC5039 | 16 ovate-wire beehive springs; use the factory seat and retainer; 85/92 lb seat, 223/237 lb open; max lift .539"; 8,200 rpm; 25 psi | Dark beehive springs | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/GSC5039-4g63-evo-8-9-valve-springs.jpg) | [STM](https://stmtuned.com/products/gsc5039-4g63-evo-8-9-valve-springs) | US$216.05 |
| Kelford PACALOY beehive + Ti retainers | KVS63-BTK | 16 beehive springs, seat locators, Ti retainers; max lift 13.5 mm | Grey beehive springs, titanium retainers | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/KVS63-BTK-kelford-valve-spring-retainer-set-4g63-1.jpg) | [STM](https://stmtuned.com/products/kvs63-btk-kelford-valve-spring-retainer-kit-4g63) | US$470.25 |
| Brian Crower single spring + Ti retainer | BC0100 (BC0120 dual kit discontinued) | 1.550" @ 84 lb seat; 1.000" @ 235 lb open; net lift 13.2 mm | Silver springs, Ti retainers | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/BC0100-bc-springs-titanium-retainers-4g63-evo-dsm-1.jpg) | [STM](https://stmtuned.com/products/bc0100-bc-springs-titanium-retainers-4g63-evo-dsm) | US$300 (RZ Crew S$342.65, [link](https://rzcrewgarage.com/products/brian-crower-single-spring-titanium-retainer-kit-mitsubishi-4g63-eclipse-evo-bc0100-bc0100)) |

#### E. Head studs and main studs (open head: nuts/washers at the head-bolt positions; cutaway: main caps)

| Brand / model | Evo IX part no. | Specs / thread | Look | Status | Photo (checked) | Page | Price | Singapore |
|---|---|---|---|---|---|---|---|---|
| ARP head stud kit (8740 chromoly) | 207-4203 | 7-bolt 4G63 Evo I–IX; 10 studs, 10 parallel-ground washers, 10 12-point nuts, Ultra-Torque lube; "11 mm (7/16")" (STM) / "M11" (RSD, LancerShop titles); 200,000 psi; replaces OEM MD191470 | Black-oxide studs, 12-point nuts | current | [photo, white background, ARP lube pack in shot](https://cdn.shopify.com/s/files/1/1893/9911/products/207-4203-arp-head-studs-4g63-7bolt-dsm-evo-1.jpg) | [STM](https://stmtuned.com/products/207-4203-arp-head-studs-4g63-7bolt-dsm-evo) | US$146.75 | **RZ Crew S$189.54** ([link](https://rzcrewgarage.com/products/arp-head-stud-kit-mitsubishi-94-evo-7-8-9-4g63t-7-bolt-207-4203-207-4203)) |
| ARP Custom Age 625+ head studs | 207-4302 | 7-bolt Evo IV–IX; CA625+ studs with 8740 nuts; 270,000 psi; "55% increase in tensile strength over the OEM TTY head bolts" | Bright natural-steel studs | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/207-4302-arp-head-studs-4g63-7bolt-625-1.jpg); [NZ photo with ARP logo](https://cdn.shopify.com/s/files/1/0848/9576/0691/files/ARP207-4302_1-1.jpg) | [STM](https://stmtuned.com/products/207-4302-arp-head-studs-4g63-7bolt-625); [NZ Perf. ("M11")](https://nzperformance.co.nz/products/arp2074302) | US$413.54; NZ$840.28 | **RZ Crew S$533.52** ([link](https://rzcrewgarage.com/products/arp-head-stud-kit-625-custom-age-mitsubishi-dsm-4g63-2nd-gen-eclipse-evo-all-7-bolts-207-4302-207-4302-207-4302)) |
| ARP L19 head studs | "ARP-L19-7B" (STM's SKU, not confirmed as an ARP catalogue number) | 11 mm; L19 steel, 260,000 psi tensile; must be kept oiled; handle with gloves | Gold/bronze-tone studs in STM's photo | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/arp-l19-7-bolt-4g63-head-studs-1.jpg) | [STM](https://stmtuned.com/products/arp-l19-7-bolt-4g63-head-studs) | US$277.69 | — |
| ARP main stud kit | 207-5401 | Evo I–IX, 6- and 7-bolt; 10 studs, nuts, washers; 8740, 190,000 psi; M10 × 1.25 (Speeding.fi, via search); replaces MD153368 and others | Black-oxide studs | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/207-5401-arp-main-studs-4g63-evo-dsm-1.jpg) | [STM](https://stmtuned.com/products/207-5401-arp-main-studs-4g63-evo-dsm) | US$81.04; NZ$164.68 ([NZ](https://nzperformance.co.nz/products/arp2075401)) | **RZ Crew S$104.52** ([link](https://rzcrewgarage.com/products/arp-main-stud-kit-mitsubishi-dsm-4g63-207-5401-207-5401-207-5401)) |
| Cosworth head studs (high performance / ultra) | PR7843 / "Ultra High Performance" | 180,000 psi / 260,000 psi | Black studs and 12-point nuts (TDI photo, Cosworth and tdi-plc.com watermark) | listed | [photo](https://www.tdi-plc.com/wp-content/uploads/2009/11/p-19071-Hardware.jpg) | [TDI PR7843](https://www.tdi-plc.com/product/cosworth-4g63-head-stud-kit-pr7843/); [TDI Ultra](https://www.tdi-plc.com/product/cosworth-head-stud-kit-ultra-high-performance-3/) | TDI shows £180 / £426 (first price on page) | grey |
| Cosworth main stud kit | PR7425 | — | — | listed | — | [TDI](https://www.tdi-plc.com/product/cosworth-main-stud-kit-4/) | £84 (TDI) | grey |

- **Thread size:** search results confirm 207-4203 as "M11"/"11mm" but not the pitch; the 1.25 pitch is unconfirmed. Speeding.fi lists 207-5401 as M10x1.25. — [RSD "Head Studs Kit M11"](https://www.rallysportdirect.com/products/arp-207-4203-arp-head-stud-kit); [Speeding.fi](https://speeding.fi/p/arp-main-studsmitsubishi-4g63.html)
- Tomei's own head studs (193114, ¥76,000) are in `tomei.md`. Blackhawk Japan Singapore lists them at S$591.50 (search snippet). — [Blackhawk Japan](https://www.blackhawkjapan.sg/products/tomei-193114)

#### F. Stroker kits (cutaway view)

| Brand / model | Part no. | Displacement / spec | Kit contents | Look | Status | Photo (checked) | Page | Price |
|---|---|---|---|---|---|---|---|---|
| Tomei 2.3 L (US numbers) | TA201A-MT01B (Tomei 86 mm pistons); TA201A-MT01BP (CP 86 mm pistons); TA201A-MT01D (Tomei 85.5 mm). JP numbers 252002/252003 and 250016/250017 are in `tomei.md` | 100 mm stroke (OEM +12); 147 mm rods (OEM −3); CH 31.65 mm; 2,323.5 cc (86) / 2,296.6 cc (85.5); CR 9.25 / 9.11 / 8.92 / 8.73 with 1.0 / 1.2 / 1.5 / 1.8 mm Tomei gaskets (86 mm) | Forged crank, forged pistons, forged H-beam rods (STM; Tomei JP calls the crank "billet") | Dark-grey crank, polished pistons, grey H-beam rods | Tomei JP: "contact for delivery" (`tomei.md`) | [US kit render](https://cdn.shopify.com/s/files/1/1893/9911/files/tomei-2-3l-stroker-kit-4g63-mitsubishi-evo-1-9.jpg); [contents shot](https://cdn.shopify.com/s/files/1/1893/9911/files/tomei-2-3l-stroker-kit-4g63-mitsubishi-evo-1-9-included.jpg); [Tomei JP studio photo, 2500 px, light grey](https://www.tomei-p.co.jp/search/img/searchimage/open/252002.jpg) | [STM](https://stmtuned.com/products/tomei-2-3l-stroker-kit-4g63-mitsubishi-evo-1-9) | US$4,320 |
| Tomei 2.2 L (US numbers) | TA201A-MT01A; TA201A-MT01AP (CP); TA201A-MT01C (85.5); previous P/N 221041 | 94 mm stroke; 150 mm rod; 2,184.1 / 2,158.8 cc; CR 8.76–8.27 (86 mm) | as 2.3 | as 2.3 | as 2.3 | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/TA201A-MT01A-tomei-4g63-evo-stroker-kit-2.jpg) | [STM](https://stmtuned.com/products/ta201a-mt01a-tomei-4g63-evo-stroker-kit) | US$4,320 |
| Brian Crower 2.2 L | BC0128 (ProH625+ rods); also BC0127, BC0129 | BC5101 94 mm 4340 billet 7-bolt crank; BC6108 ProH625+ rods, 5.906" (1,000 hp); BC7109 custom CP/JE pistons, any bore/CR; system balanced | crank, rods, pistons, pins, rings | Dark nitrided billet crank, dark H-beam rods | Made to order (50% deposit) | [photo](https://cdn.shopify.com/s/files/1/1893/9911/files/bc-brian-crower-2-2l-stroker-kit-7-bolt-4g63-evo-dsm-bc0128.jpg) | [STM](https://stmtuned.com/products/bc-brian-crower-2-2l-stroker-kit-7-bolt-4g63-evo-dsm-bc0128) | US$4,029 (BC0127 US$4,116; BC0129 US$3,805) |
| Brian Crower 2.4 L | BC0119 (I-beam rods); also BC0108, BC0109 | BC5109 102 mm billet crank; BC6107 I-beam rods, 5.906", ARP2000; custom pistons | as above | as above | made to order | [photo](https://cdn.shopify.com/s/files/1/1893/9911/files/bc-brian-crower-2-4l-stroker-kit-7-bolt-4g63-evo-dsm-bc0119.jpg) | [STM](https://stmtuned.com/products/bc-brian-crower-2-4l-stroker-kit-7-bolt-4g63-evo-dsm-bc0119) | US$4,116 (BC0108 US$4,029; BC0109 US$3,805) |
| Eagle Competition Assembly | KIT-86254860 | 2,324 cc; 100 mm forged 4340 crank; 5.900" 4340 H-beam rods, ARP 2000; Traum 2618 −16 cc inverted-dome 86.0 mm pistons, 1.138" pin height; plasma-moly rings; King XP bearings; unbalanced | full rotating assembly | — | listed | no photo on Eagle's page | [Eagle](https://www.eaglerod.com/item/12104157-competition-assembly-mitsu-4g63-98-up) | US$2,285.99 |
| Eagle 100 mm crank alone | CRS-2039375900B7 | 3.937" stroke, internal balance, 7-bolt flange, 34 lb, nitrided, micropolished | — | Bare forged-steel crank | listed | [official photo](https://www.eaglerod.com/images/b394224e-bfd2-11ea-a5c6-4c1083d0bef4/jpg/3937-stroke-internal-balance-forged-4340-steel-mitsubishi-4g63/crs-2039375900b7-1.jpg) | [Eagle](https://www.eaglerod.com/item/5523331-4340-crank-mitsubishi-100mm) | US$984.99 |
| Cosworth lightweight racing stroker crank, Evo 8/9 | 20020632 | "new light weight racing stroker crankshaft for the Mitsubishi 4G63"; stroke not stated | crank only | Polished, machined counterweights (400 px photo) | "Special order only… 4–8 weeks" | [photo](https://cdn.shopify.com/s/files/1/0701/0405/5868/files/image_71c8b18a-d7b5-4570-a3aa-27490d46cbad.jpg) | [LancerShop](https://lancershop.com/products/cosworth-crankshaft-evo-8-9) | US$4,151.50 |

- **No Cosworth-branded complete 2.3 L or 2.4 L 4G63 stroker kit was found.** The only Cosworth 4G63 items found are listed below; a search for "Cosworth 4G63 stroker kit" returned other makers' kits (Tomioka, HKS, BC, AMS) only.
  - At LancerShop: the stroker crank, forged rods, ring sets, Evo 9 head gaskets and a Kevlar timing belt.
  - At TDI: 2.0 L and 2.2 L pistons, bearings, studs, gaskets and a belt.
  - Sources: [LancerShop Cosworth search results (crank, rods, gaskets)](https://lancershop.com/products/cosworth-crankshaft-evo-8-9); [TDI Cosworth Mitsubishi list](https://www.tdi-plc.com/product-category/japanese-car-high-performance-components/mitsubishi-performance-components/page/6)
- A search snippet tags the Cosworth M1 cam for 2003–05 Evos and a Cosworth 4G63 oil scraper as discontinued. This is retailer and eBay data only. — [Real Street Performance oil scraper](https://www.realstreetperformance.com/cosworth-mitsubishi-evo-4g63-2-0l-crankshaft-oil-scraper.html)
- **HKS 2.3 L kit:** STEP1 is 85.5 × 96 mm, 2,204.7 cc; STEP2 is 2,231 cc. A retailer gives 21004-AM004 (STEP1) and 21004-AM005 (STEP2). See `hks_engine_powertrain.md`. — [JDM Garage UK 21004-AM004](https://www.jdmgarageuk.com/21004-am004.html)

#### G. Head gaskets (cutaway view: the layer between head and block)

| Brand | Part no. | Spec | Look | Photo (checked) | Page | Price |
|---|---|---|---|---|---|---|
| Cometic MLS, Evo 4–9 | C4157 (85 mm), C4156 (86 mm), C4591 (87 mm), each in -036 (0.91 mm, 3 layers), -051 (1.29 mm, OEM thickness, 3 layers) and -075 (1.90 mm, 5 layers); 88 mm H1528SP4051S discontinued | Stainless layers with Viton-type coated outer layers | Grey/black multi-layer steel | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/cometic-evo-4g63-head-gasket-1.jpg) | [STM](https://stmtuned.com/products/cometic-evo-4g63-head-gasket) | US$96.52–123.78; NZ$177.82 ([C4156-051](https://nzperformance.co.nz/products/c4156051)) |
| Brian Crower, Evo 9 specific | BC8213 | 0.8 mm, 86 mm bore; made in Japan; stainless layers with a 0.2-micron nitrile coating | Black gasket | [photo](https://cdn.shopify.com/s/files/1/1893/9911/files/bc-brian-crower-head-gasket-4g63-mitsubishi-evo-9-bc8213.jpg) | [STM](https://stmtuned.com/products/bc-brian-crower-head-gasket-4g63-mitsubishi-evo-9-bc8213) | US$171.99 |
| Cosworth, Evo 9 specific | 20001689 (86 × 1.3 mm); 20001690 (86 × 1.5 mm); Evo 7/8 versions are 20000909 / 20000910 | — | Black MLS | [photo](https://cdn.shopify.com/s/files/1/0701/0405/5868/files/image_3eb94ae3-cdf8-423d-84f4-6f06b2ce9a26.jpg) | [LancerShop](https://lancershop.com/products/cosworth-high-performance-head-gasket-evo-9-4g63-86mm-1-3mm-evo-8-9); [TDI](https://www.tdi-plc.com/product/cosworth-evo-9-head-gasket-20001689-86x1-3mm/) | US$189 (special order, 4–8 weeks) |

Tomei metal gaskets (86.5 mm, 1.0–1.8 mm) and HKS stopper gaskets (23001-AM003/4/5) are in the earlier notes.

#### H. Balance-shaft delete / race balance shaft (cutaway view, only if the shafts are drawn)

| Brand / model | Part no. | What it is | Look | Status | Photo (checked) | Page | Price |
|---|---|---|---|---|---|---|---|
| Kelford balance shaft delete | KBS63 | Deletes one balance shaft "while still supporting your oil pump". EN30b steel shaft, ground surfaces under 7 Ra, Nitreg+ONC black nitride. Kit: shaft, 2 block-off bearings, shaft bearing, rubber plug, CNC crank spacer, bolt and washer. Evo I–IX | Black nitrided shaft | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/files/KBS63-kelford-balance-shaft-delete-kit-4g63-1.jpg) | [STM](https://stmtuned.com/products/kbs63-kelford-balance-shaft-delete-kit-4g63) | US$199.50 |
| GSC race balance shaft | 8042 | Replaces the OEM balance shaft and supports the oil pump "even at extreme rpms". Zero-balanced, CNC machined; ACL bearings, delete cap, pulley-delete spacer, bolt | Polished steel shaft | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/80420-gsc-power-division-race-balance-shaft-4g63-1.jpg) | [STM](https://stmtuned.com/products/gsc-power-division-race-balance-shaft-4g63); [LancerShop US$256.95](https://lancershop.com/products/gsc-race-balance-shaft-evo-8-9) | US$210.38 |
| STM balance shaft eliminator kit | STMKIT-MIT-BSD | OEM stub shaft MD098626, OEM cap MD092785, ACL bearings 3BS8389-STD | OEM parts | current | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/stm-4g63-balance-shaft-removal-kit-evo-dsm-1g-2g.jpg) | [STM](https://stmtuned.com/products/stm-4g63-balance-shaft-removal-kit) | US$69.99 |

- STM lists an Evo 9-specific OEM right-hand balance shaft (MN163473), separate from the Evo 1–8 part (MN137236). This suggests the IX's shaft differs, though all three delete kits say they fit Evo I–IX. — [STM OEM RH shaft Evo 9](https://stmtuned.com/products/mitsubishi-oem-balance-shaft-rh-for-evo-9-mn163473)

#### I. Timing belts (behind the timing cover; visible only if the front of the engine is shown with the covers off)

| Brand / model | Part no. | Spec | Look | Photo (checked) | Page | Price | Singapore |
|---|---|---|---|---|---|---|---|
| Gates Racing (RPM) timing belt | T167RB1 (timing only); T167RB (timing + balancer belt) | HNBR, nylon-faced teeth, "up to 300% stronger than stock", up to 3× heat resistance; 4G63 Evo I–IX | **Blue** back with printed text | [T167RB1](https://cdn.shopify.com/s/files/1/1893/9911/products/T167RB1-gates-racing-blue-timing-belt-4g63-1.jpg); [T167RB](https://cdn.shopify.com/s/files/1/1893/9911/products/T167RB-gates-racing-blue-timing-balance-belt-4g63-1.jpg) | [STM T167RB1](https://stmtuned.com/products/t167rb1-gates-racing-blue-timing-belt-4g63); [STM T167RB](https://stmtuned.com/products/t167rb-gates-racing-blue-timing-balance-belt-4g63) | US$210.00 / US$235.38 | **RZ Crew S$295.96 / S$360.36** ([T167RB1](https://rzcrewgarage.com/products/gates-racing-timing-belt-kit-mitsubishi-4g63t-all-t167rb1-t167rb1)) |
| STM Evo 9 timing kit (Gates blue) | STM-EVO9-TBRK-GATB (-BS, -P, -PBS) | T167RB1 or T167RB plus Gates tensioner T43130, OEM tensioner pulley MD369999, idler MD156604, balance-shaft pulley MD352473, optional water pump 1300A067; "2006 Evolution IX MIVEC" | — | [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/STM-EVO9-TBRK-GATB.jpg) | [STM](https://stmtuned.com/products/stm-timing-belt-replacement-kits-gates-blue-evo-9) | US$506.45–1,037.35 | — |
| Cosworth Kevlar timing belt | 20004950 | "300% stronger than original equipment" | Blue back printed "COSWORTH" | [LancerShop photo](https://cdn.shopify.com/s/files/1/0701/0405/5868/files/image_7dc85963-bbb7-4414-831e-77fcfa32207e.jpg); [TDI photo (watermarked)](https://www.tdi-plc.com/wp-content/uploads/2009/11/p-19083-20004950.jpg) | [LancerShop](https://lancershop.com/products/cosworth-kevlar-high-performance-timing-belts-evo-8-9); [TDI](https://www.tdi-plc.com/product/cosworth-4g63-timing-belt-20004950/) | US$287.44; £168 (TDI) | grey |

Tomei timing belt 154003 and HKS Fine Tune belt 24999-AM001 are in the earlier notes.

### Inferences
- **For an Evo IX configurator, the "brand × model" choice that matters is the camshafts.** Bottom-end parts are the same 7-bolt Evo IV–IX parts across brands, so an "Evo IX" label adds nothing there. A cam set from the Evo IV–VIII range (BC0111/BC0114, GSC's Evo 4–8 cams, Kelford's "Evo 4-8" cams, Tomei's VII–VIII Poncam, HKS 22002-AM009) should never be offered.
- **CP and Manley piston numbers:** the compression ratio a customer gets depends on reading the "Evo head" column. A configurator that shows CR should take Manley's "for EVO" and CP's "EVO VIII/IX" figures, not the 2G/DSM figures retailers sometimes quote.
- **Cosworth:** if the client wants a "Cosworth" stroker option, it would have to be presented as a Cosworth crank, rods and pistons combination built by the workshop. It should not be presented as a catalogued Cosworth kit, because none was found.

### Gaps
- **Manufacturer pages could not be read:** Manley, ARP, Kelford, GSC, Brian Crower and Gates have no readable official pages from this session. Their specs come from retailers that reproduce the manufacturer tables. Current production status on the makers' own sites is unverified.
- **BC0124 lift:** 11.13 mm vs 11.07 mm, unresolved.
- **GSC lifts:** S1 figures come from an RSD page whose title says Evo 8/9.
- **SC7201 dome volume and compression height** weren't captured. CP's own site search is JavaScript only.
- **ARP 207-4203 thread pitch** is not confirmed by an ARP source.
- **Cosworth Evo 9 parts:** TDI's part numbers and photos are inconsistent; current availability is unclear ("special order" at LancerShop).
- **Stock Evo IX compression ratio** and the factory piston and rod construction (cast or forged, I-beam rod) were not confirmed from a source this session.

## Key question 2: Which parts would visibly differ from stock in the open-head and cutaway views, and how

### Takeaway
- **Big differences, and only in the cutaway:** pistons (crown shape, skirt colour, logos, gas ports), rods (H-beam vs I-beam, bronze bushes, engraved names), stroker cranks (pin position, rod length, counterweights) and head studs/main studs.
- **Open head:** cams differ only subtly. GSC's smooth dark billet cams with etched text are the most distinctive. The beehive springs, titanium retainers, 12-point ARP nuts and a blue timing belt (if the front is shown) give stronger visual cues.

### Cited Findings
- **Manley pistons:** STM's photos show polished crowns with dark coated skirts and a Manley logo on the skirt. Manley/STM list "Moly coated skirts" for the STM-Spec piston and vertical gas ports for Turbo Tuff. Crowns range from −12 cc dish to −2.5 cc flat top. — [STM Manley table](https://stmtuned.com/products/manley-4g63-7-bolt-pistons); [STM-Spec](https://stmtuned.com/products/stm-spec-manley-evo-4g63-pistons); [photo](https://cdn.shopify.com/s/files/1/1893/9911/products/manley-pistons_241a321c-9023-4efc-8907-600e6c8b4c8a.jpg)
- **CP shelf pistons** are shown bright-machined with plain skirts. CP's coatings, including the moly skirt coat, are listed as options. — [Titan SC7201 photo](https://cdn.shopify.com/s/files/1/0066/0370/2362/products/CPP_SC7201_001.jpg); [CP coatings](https://www.cp-carrillo.com/p-32904-coatings.html)
- **Rods:**
  - Eagle H-beam rods are "fully machined and shot-peened"; Extreme Duty rods are also "polished". Both are bushed for a full-floating pin (bronze bush visible in photos). — [Eagle MB3D](https://www.eaglerod.com/item/5523517-4340-rod-mitsubishi4g63-4); [Eagle MBXD](https://www.eaglerod.com/item/5524251-mitsubishi-4g63-93-extreme-duty-rod-4)
  - Manley's H-Tuff "has a wider beam than the standard H-Beam rods"; Turbo Tuff is an I-beam. Photos show "MANLEY" / "H-TUFF SERIES" engraved on the beam. — [STM H-Tuff](https://stmtuned.com/products/manley-4g63-h-tuff-steel-connecting-rods-150mm-standard-stroke-4g63); [STM Turbo Tuff](https://stmtuned.com/products/manley-i-beam-turbo-tuff-rods-for-7-bolt-4g63-dsm-evo)
- **Strokers:**
  - Tomei's 2.3 L kit shortens the rod by 3 mm (147 mm) and the piston compression height by 3.35 mm (31.65 mm) while adding 12 mm of stroke. — [STM Tomei 2.3](https://stmtuned.com/products/tomei-2-3l-stroker-kit-4g63-mitsubishi-evo-1-9)
  - Manley's 100 mm-stroke pistons have a 1.130" compression distance against 1.375" for stock stroke. — [STM Manley table](https://stmtuned.com/products/manley-4g63-7-bolt-pistons)
  - BC cranks are nitrided billet 4340 with "fully profiled counterweights". — [STM BC0128](https://stmtuned.com/products/bc-brian-crower-2-2l-stroker-kit-7-bolt-4g63-evo-dsm-bc0128)
- **Cams:**
  - GSC's Evo 9 cams are fully turned billet with a nitride finish; STM's photo shows laser etching such as "7009 S3 EXHAUST". — [STM GSC](https://stmtuned.com/products/gsc-s1-s2-s3-r2-evo-9-mivec-camshafts)
  - Kelford's photo shows ground lobes with paint marks. — [STM Kelford](https://stmtuned.com/products/kelford-cams-4g63-evo-9-mivec)
- **Valvetrain:** GSC5039 and Kelford KVS63-BTK are beehive (tapered) springs; Kelford and BC kits add titanium retainers. — [GSC5039](https://stmtuned.com/products/gsc5039-4g63-evo-8-9-valve-springs); [KVS63-BTK](https://stmtuned.com/products/kvs63-btk-kelford-valve-spring-retainer-kit-4g63); [BC0100](https://stmtuned.com/products/bc0100-bc-springs-titanium-retainers-4g63-evo-dsm)
- **ARP studs:**
  - Kits use 12-point nuts and parallel-ground washers in place of the OEM torque-to-yield head bolts.
  - 207-4203 and 207-5401 are black (8740); 207-4302 (CA625+) is bright steel; L19 shows a gold tone in STM's photo.
  - Sources: [207-4203](https://stmtuned.com/products/207-4203-arp-head-studs-4g63-7bolt-dsm-evo); [207-4302](https://stmtuned.com/products/207-4302-arp-head-studs-4g63-7bolt-625); [L19](https://stmtuned.com/products/arp-l19-7-bolt-4g63-head-studs); [207-5401](https://stmtuned.com/products/207-5401-arp-main-studs-4g63-evo-dsm)
- **Timing belts:** the Gates Racing and Cosworth belts are blue-backed. — [STM T167RB1](https://stmtuned.com/products/t167rb1-gates-racing-blue-timing-belt-4g63); [LancerShop Cosworth belt](https://lancershop.com/products/cosworth-kevlar-high-performance-timing-belts-evo-8-9)

### Inferences

**Open-head view (cam cover off):**
- **Cams:** a cam swap barely changes the silhouette.
  - Show it as a finish change: GSC as smooth, uniformly dark-grey nitrided billet with an etched part number; Kelford/BC/Tomei/HKS as dark cast cores with bright ground lobes and journals, close to stock.
  - Lobe-height differences (10–12 mm lift) are too small to read in a photo. A label or callout will do more than the render.
  - On the IX, the intake cam gear stays the factory MIVEC phaser for every brand. Only the exhaust gear could become an adjustable aftermarket gear (e.g. Tomei's red 152012 in `tomei.md`).
- **Springs and retainers:** beehive springs (narrower at the top) and titanium retainers are a real visual cue where the springs show between the rockers.
- **Head studs:** ARP nuts with washers at the head-bolt positions would replace the OEM bolt heads. On the 4G63 the head bolts are reached with the cam cover off. That is general engine knowledge, not sourced here, so check it against the existing cover-off photo.
- **Timing belt:** blue Gates/Cosworth belt vs a black OEM belt, only if the front timing cover is drawn removed.

**Cutaway view:**
- **Pistons:** the crown profile (dish vs flat top) and skirt colour (Manley/Cosworth dark-coated vs CP bright-machined) are the clearest differences.
- **Rods:** H-beam (Eagle, Manley H-beam/H-Tuff, Tomei, HKS, BC ProH) vs I-beam (Manley Turbo Tuff, BC I-beam). Bronze small-end bushes and engraved names show on aftermarket rods. Stock-rod appearance wasn't sourced this session.
- **Strokers:** a longer throw on the crank, the gudgeon pin moved up the piston (CH −3.35 mm on Tomei), and a heavier fully counterweighted crank. Crank finish varies: dark nitrided on BC/Tomei, bright on Cosworth and Eagle.
- **Head gasket:** a thicker MLS line (Cometic -075 is 1.90 mm) is barely visible at configurator scale.
- **Main studs:** 12-point nuts on the main caps.
- **Balance-shaft delete:** shows only if the cutaway draws the balance shafts. A removed or stub shaft could be shown as an empty bore.
- **Oil pan:** none of these parts changes the pan (Tomei's baffle is in `tomei.md`).

### Gaps
- No source was found for exactly where the 4G63 head bolts sit relative to the cams, or for what the factory Evo IX piston and rod look like. Use RZER's own cover-off and cutaway base images as the reference.
- No in-engine photos of these parts fitted to an Evo IX were collected.

## Key question 3: Official product photo per model (direct URL, page, curl-verified)

### Takeaway
All 47 photo URLs in the tables were verified on 26 Nov 2026 with `curl -sIL`: every one returned HTTP 200 with `image/jpeg`. Manufacturer-hosted photos are available only for Eagle (eaglerod.com) and Tomei (tomei-p.co.jp). The rest are retailer-hosted copies of studio shots, mostly STM Tuned's consistent 1400 × 930 white-background images. Several are generic images, and some carry logos or watermarks.

### Cited Findings
- **Manufacturer-hosted:**
  - Eagle CRS5900MB3D: 992 KB JPEG. — [image](https://www.eaglerod.com/images/ea531f46-bfd3-11ea-bfd2-fc12ec51d8ff/jpg/59-4340-h-beam-mitsubishi-4g63-7-bolt-38-arp-2000-bolts/crs-5900mb3d-1.jpg); [page](https://www.eaglerod.com/item/5523517-4340-rod-mitsubishi4g63-4)
  - Eagle 100 mm crank: 527 KB. — [image](https://www.eaglerod.com/images/b394224e-bfd2-11ea-a5c6-4c1083d0bef4/jpg/3937-stroke-internal-balance-forged-4340-steel-mitsubishi-4g63/crs-2039375900b7-1.jpg); [page](https://www.eaglerod.com/item/5523331-4340-crank-mitsubishi-100mm)
  - Tomei 23KIT: 2500 × 1667, light grey. — [image](https://www.tomei-p.co.jp/search/img/searchimage/open/252002.jpg)
- **No Eagle photo:** Eagle's Extreme Duty rod page and Competition Assembly page show "no-photo". — [MBXD](https://www.eaglerod.com/item/5524251-mitsubishi-4g63-93-extreme-duty-rod-4); [assembly](https://www.eaglerod.com/item/12104157-competition-assembly-mitsu-4g63-98-up)
- **Generic or reused images, not the exact part:**
  - STM's Manley piston pages say "Pistons will vary by application. Images are for reference". The same 21,004-byte image appears on the overview and on 606105C-4. — [STM 606105C-4](https://stmtuned.com/products/606105c-4-manley-pistons-4g63-7-bolt)
  - Titan's SC7201 and SC7203 use the same 53,293-byte image. — [Titan SC7201](https://titanmotorsports.com/products/sport-compact-pistons-for-mitsubishi-4g63-2g); [Titan SC7203](https://titanmotorsports.com/products/sport-compact-pistons-for-mitsubishi-4g63-2g-1)
  - Titan's SC7229 image carries the caption "IMAGE MAY NOT REFLECT ACTUAL PRODUCT". — [Titan SC7229](https://titanmotorsports.com/products/cp-carrillo-pistons-for-mitsubishi-4g63-2g-85-5mm-8-5-1-or-evo-viii-evo-ix-9-1)
  - Kelford: "TX280 Evo 9 MIVEC cams are pictured" for every Kelford Evo 9 variant. — [STM Kelford](https://stmtuned.com/products/kelford-cams-4g63-evo-9-mivec)
- **Logos and watermarks:**
  - TDI's Cosworth images carry a "COSWORTH" banner and a "www.tdi-plc.com" watermark. — [TDI belt image](https://www.tdi-plc.com/wp-content/uploads/2009/11/p-19083-20004950.jpg)
  - NZ Performance's SC7201 shot includes a CP Carrillo branded card. — [image](https://cdn.shopify.com/s/files/1/0848/9576/0691/files/CPSC7201.jpg)
  - ARP shots include the blue ARP lube packet; NZ Performance's 207-4302 image shows the ARP logo. — [image](https://cdn.shopify.com/s/files/1/0848/9576/0691/files/ARP207-4302_1-1.jpg)
- **Small images:** BC0124 at 329 px and the LancerShop Cosworth photos at 400 px are too small for a large layer. — [BC0124 image](https://cdn.shopify.com/s/files/1/0075/8703/7237/products/brian-crower-276276-camshafts-mitsubishi-evo-9-cams-brian-crower-bc0124.jpg)

### Inferences
- **Best clean cut-outs:** STM's 1400 × 930 white-background shots of the Eagle rods, Manley H-Tuff single rod, GSC cams, Kelford cams, ARP kits, Kelford/GSC balance shafts and Gates belts, plus Eagle's own photos and Tomei JP's light-grey shots.
- **Logos on the parts themselves** (Manley engraving, GSC etching, Cosworth belt print, ARP packets) conflict with the site's "no text on the car" brief in the same way the HKS/Tomei logos already do. The client should confirm.
- **Copyright:** these are manufacturers' or retailers' copyrighted photos. As with the existing parts photos, they are for review only until dealer assets are obtained.

### Gaps
- No official Manley, CP, Brian Crower, GSC, Kelford, ARP or Gates-hosted image URLs could be verified, because their sites are blocked from this session.
- No usable BC0124 photo larger than 329 px was found.

## Key question 4: Rough price and how each brand is sold in Singapore

### Takeaway
None of these brands has an authorised Singapore distributor that this session could find. They reach Singapore as grey imports.
- **RZ Crew Garage** (rzcrewgarage.com, SGD, "all import taxes are included" for SG/MY) stocks:
  - Manley pistons and rods, CP Evo pistons, Kelford Evo 9 cams, ARP head and main studs, Gates Racing belts, Brian Crower Evo IV–VIII cams/springs/rods, and Tomei USA Evo 9 Poncams.
  - It does not list GSC, Eagle 4G63 rods, BC0124 or the Kelford/GSC balance-shaft parts.
- Everything else comes from US retailers (STM, Titan, LancerShop, RSD, JDMuscle), NZ Performance (NZD), TDI in the UK (Cosworth) or Blackhawk Japan SG (Tomei).

### Cited Findings
- RZ Crew Garage's storefront currency is SGD with country SG. Its product pages state that import taxes are included for Singapore and Malaysia. — [RZ Crew Garage](https://rzcrewgarage.com/); confirmed by the parallel note `singapore_sourcing_lta.md`
- **SGD prices at RZ Crew (26 Nov 2026), all shown as "available":**
  - ARP 207-4203: S$189.54
  - ARP 207-4302: S$533.52
  - ARP 207-5401: S$104.52
  - Manley piston sets: S$950.36
  - Manley 14022-4 rods: S$694.32
  - Manley 14403-4 rods: S$1,332.48
  - CP Evo-head piston sets (SC7199/7201/7228/7229/7230/7252/7254): S$1,060.80
  - Kelford 9-TX cams: S$784.32 to S$910.08
  - Gates T167RB1: S$295.96; T167RB: S$360.36
  - BC0100 springs: S$342.65
  - Tomei Poncam EVO9 set TA301B-MT01B: S$714.56
  - Sources: links in the tables above (e.g. [ARP 207-4203](https://rzcrewgarage.com/products/arp-head-stud-kit-mitsubishi-94-evo-7-8-9-4g63t-7-bolt-207-4203-207-4203), [Kelford 9-TX272R](https://rzcrewgarage.com/products/kelford-9-tx272r-272-272-lift-11-75mm-11-75mm-mitsubishi-4g63t-mivec-evo-9-9-tx272r), [Gates T167RB](https://rzcrewgarage.com/products/gates-racing-timing-belt-and-balance-shaft-belt-mitsubishi-4g63t-all-t167rb-t167rb))
- **Searches of RZ Crew** for "gsc 7009", "BC0124", "CRS5900MB3D" and "KBS63" returned no products. (Site search results, 26 Nov 2026.)
- **Kelford** lists dealer locations for the UK, USA and Canada; no Singapore stockist was found. — [Kelford UK dealers](https://kelfordcams.com/uk-dealer-locations) (search result; page blocked)
- **US reference prices (USD):**
  - Manley pistons: 741.18–873.01
  - Manley rods: 554.27–1,684.73
  - CP pistons: 679–885.15
  - Eagle rods: 389.68–406.99 (MB3D), 668.64–698.99 (MBXD)
  - GSC cams: 653.23
  - Kelford cams: 400–752.04
  - BC0124: 453.25–570.34
  - ARP: 81.04–413.54
  - Gates: 210–235.38
  - Kelford KBS63: 199.50; GSC 8042: 210.38
  - Tomei kits: 4,320; BC kits: 3,805–4,116; Eagle 2,324 cc assembly: 2,285.99
  - Cosworth crank: 4,151.50; Cosworth rods: 1,465.27
  - Sources: page links in the tables
- **NZD (NZ Performance):** CP SC7201 NZ$1,575; Eagle CRS5900MB3D NZ$792.68; ARP 207-4302 NZ$840.28; ARP 207-5401 NZ$164.68; Kelford 9-SLX294 NZ$976.52. — [NZ Performance](https://nzperformance.co.nz/products/cpsc7201)
- **GBP (TDI, Cosworth's UK distributor):** prices as shown on the pages, e.g. timing belt £168, Evo 9 gasket £102, head studs PR7843 £180. Several numbers appear on each page, so check each one. — [TDI belt](https://www.tdi-plc.com/product/cosworth-4g63-timing-belt-20004950/)
- **Blackhawk Japan SG** lists Tomei head studs 193114 at S$591.50 (search snippet). — [Blackhawk Japan](https://www.blackhawkjapan.sg/products/tomei-193114)

### Inferences
- **For quoting**, RZ Crew's SGD prices run about 1.2–1.3× the US price for the same item (e.g. ARP 207-4203: US$146.75 → S$189.54; Kelford 9-TX272: US$626.05 → S$784.32). That is a usable rule of thumb for items RZ Crew doesn't list.
- **GSC, Eagle and Brian Crower's Evo 9 cam** would have to be ordered from US retailers (STM, LancerShop, RSD, Titan) and shipped in. Cosworth Evo parts come via TDI (UK) or LancerShop, as special orders of 4–8 weeks.

### Gaps
- No authorised Singapore distributor was confirmed for Manley, CP-Carrillo, Eagle, Brian Crower, GSC, Kelford, ARP, Cosworth or Gates. The manufacturers' dealer locators couldn't be read.
- Carousell couldn't be opened (HTTP 403).

## Key question 5: Singapore / LTA rules for stroker kits and other internals (engine capacity, approval, road tax)

### Takeaway
- **LTA's own modification page lists "Increasing Engine capacity" under "Modifications that are not allowed".** Its example is "enlarging the cylinder bore of the engine". So every stroker kit (2.2/2.3/2.4 L) and, strictly read, every oversize piston (85.5 mm → 2,021 cc; 86 mm → 2,045 cc) cannot be legalised on a Singapore-registered Evo IX.
- **Same-capacity internals** (standard-bore 85.0 mm pistons, rods, cams, studs) are modifications to the engine. Under LTA's 2025 circular, they need a Change of Vehicle Particulars (CVP) application before the work. Road tax is set by engine capacity, so a capacity change would also change the tax; this is moot, because the change is not allowed.

### Cited Findings
- **"Modifications that are not allowed"** on OneMotoring includes "Increasing Engine capacity": "Increasing the engine capacity, such as enlarging the cylinder bore of the engine, may damage the engine. It may also adversely affect the safety and exhaust emissions of the vehicle." The same list includes chassis changes, nitrous injection devices, tow hooks and crash bars. — [LTA OneMotoring, Vehicle Technologies and Modifications](https://onemotoring.lta.gov.sg/content/onemotoring/home/owning/modification.html) (page read directly, 26 Nov 2026)
- **Engines, under "Modifications that need LTA's approval":**
  - "LTA allows the change of engine if the replacement engine is the same type as the original."
  - Documents: the supplier's invoice and a manufacturer or local-agent certification that the engine is the same type.
  - Engine swaps between two registered vehicles need the same type and the same engine capacity, and one vehicle must then be scrapped.
  - Source: [LTA OneMotoring](https://onemotoring.lta.gov.sg/content/onemotoring/home/owning/modification.html)
- **LTA circular VAC 34/2025 (30 Sep 2025):**
  - "power train modifications are already considered major modifications requiring LTA's prior approval".
  - Footnote 3: "A CVP application is required when modifying any power train component (… engine, fuel tank, or transmission), or when replacing specific components (… or engine) even if they are of the same specifications."
  - The CVP is filed through VITAS with a S$66.00 fee.
  - Footnote 2 lists ancillary parts that need no CVP: "drive belt, motorcycle chains and sprockets, spark plugs and spark plug cables, intake air filter, intake manifolds, cooling system".
  - Source: [LTA VAC 34/2025 (PDF)](https://onemotoring.lta.gov.sg/content/dam/onemotoring/pdf/Circulars%20to%20ESAs/2025/VAC_34_2025.pdf)
- **Road tax** is calculated on engine capacity. For a petrol car with 1,600 < EC ≤ 3,000 cc, the 6-monthly road tax is [S$475 + S$0.75 × (EC − 1,600)] × 0.782. — [LTA OneMotoring, tax structure](https://onemotoring.lta.gov.sg/content/onemotoring/home/buying/upfront-vehicle-costs/tax-structure.html)
- **Surcharge for older cars:** cars more than 10 years old pay a road tax surcharge of 10%, rising to 50% for cars more than 14 years old. — [LTA OneMotoring, road tax](https://onemotoring.lta.gov.sg/content/onemotoring/home/owning/ongoing-car-costs/road-tax.html)
- **Penalties and workshop prosecutions** from Feb 2026 are covered in `singapore_market_and_lta.md`. The parallel note `singapore_sourcing_lta.md` reaches the same "stroker kits not road-legal" conclusion from secondary sources (Motorist); the official text above confirms it.

### Inferences
- **Capacities computed from bore × stroke** (π/4 × bore² × stroke × 4), with the 6-monthly road tax from LTA's formula before any age surcharge:

  | Bore × stroke | Capacity | 6-monthly road tax |
  |---|---|---|
  | 85.0 × 88 (stock) | 1,997 cc | S$604.54 |
  | 85.5 × 88 | 2,021 cc | S$618.36 |
  | 86.0 × 88 | 2,045 cc | S$632.27 |
  | 85.5 × 94 (Tomei 2.2) | 2,159 cc | S$699.18 |
  | 85.5 × 96 (HKS STEP1) | 2,205 cc | S$726.12 |
  | 85.5 × 100 (Tomei 2.3) | 2,297 cc | S$780.00 |
  | 86.0 × 100 (Tomei / Eagle) | 2,324 cc | S$795.80 |
  | 86.0 × 102 (BC "2.4") | 2,370 cc | S$823.05 |

  The 50% surcharge for cars over 14 years old (every Evo IX, built 2005–07) multiplies these by 1.5. Because the capacity increase itself is banned, these figures only show what the tax change would have been.
- **Configurator flags:**
  - All stroker kits (Tomei 2.2/2.3, BC 2.2/2.4, Eagle 2,324 cc, HKS 2.3 L, the Cosworth stroker crank): "not road-legal in Singapore (capacity increase) — track/export only".
  - Oversize pistons (85.5/86.0 mm Manley, CP, Cosworth, HKS, Tomei): the same "capacity increase" flag. Offer the standard 85.0 mm bore for road cars: Manley 606000C-4/606100C-4/606200C-4, CP SC7199/SC7228, Cosworth 85.0 mm 8.8:1.
  - Rods, cams, valve springs, studs, head gaskets, balance-shaft deletes: "engine modification, CVP/LTA approval required" under VAC 34/2025's "modifying any power train component".
  - Timing belts: replacement belts are routine maintenance and probably fall under the CVP exemption for a "drive belt". The circular doesn't define "drive belt", so this is not certain.

### Gaps
- Whether LTA in practice processes CVPs for like-for-like internal upgrades (forged pistons at the stock bore, cams, studs), or what evidence it asks for, was not found. The circular's Annex B covers only traction batteries and motors.
- How LTA would detect or treat a +0.5 mm rebore (a common repair size, 2,021 cc vs 1,997 cc) was not found. The rule text bans "enlarging the cylinder bore" without a tolerance.
- Whether an Evo IX on the Classic or Vintage vehicle schemes pays different road tax was not checked.
