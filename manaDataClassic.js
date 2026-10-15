/**
 * Classic (PipMint) mana symbol set — PNG pips under `public/mana/classic/`.
 * Data keys match picker / renderer lookup (slash-stripped lowercase).
 */
const manaMapClassic = {
  // Mono colors + colorless
  w: '/mana/classic/mana_white_w.png',
  u: '/mana/classic/mana_blue_u.png',
  b: '/mana/classic/mana_black_b.png',
  r: '/mana/classic/mana_red_r.png',
  g: '/mana/classic/mana_green_g.png',
  c: '/mana/classic/mana_colorless_c.png',

  // Generic 0–10, large numbers, variables
  '0': '/mana/classic/mana_generic_0.png',
  '1': '/mana/classic/mana_generic_1.png',
  '2': '/mana/classic/mana_generic_2.png',
  '3': '/mana/classic/mana_generic_3.png',
  '4': '/mana/classic/mana_generic_4.png',
  '5': '/mana/classic/mana_generic_5.png',
  '6': '/mana/classic/mana_generic_6.png',
  '7': '/mana/classic/mana_generic_7.png',
  '8': '/mana/classic/mana_generic_8.png',
  '9': '/mana/classic/mana_generic_9.png',
  '10': '/mana/classic/mana_generic_10.png',
  '100': '/mana/classic/mana_generic_100.png',
  '1000000': '/mana/classic/mana_generic_1000000.png',
  x: '/mana/classic/mana_generic_x.png',
  y: '/mana/classic/mana_generic_y.png',
  z: '/mana/classic/mana_generic_z.png',
  half: '/mana/classic/mana_generic_half.png',
  infinity: '/mana/classic/mana_generic_infinity.png',
  e: '/mana/classic/mana_utility_energy.png',

  // Two-generic hybrid {2/W}…{2/G}
  '2w': '/mana/classic/mana_two_w.png',
  '2u': '/mana/classic/mana_two_u.png',
  '2b': '/mana/classic/mana_two_b.png',
  '2r': '/mana/classic/mana_two_r.png',
  '2g': '/mana/classic/mana_two_g.png',

  // Two-color hybrids (legacy data keys + canonical aliases)
  wbu: '/mana/classic/mana_w_u.png',
  wu: '/mana/classic/mana_w_u.png',
  wb: '/mana/classic/mana_w_b.png',
  bub: '/mana/classic/mana_u_b.png',
  ub: '/mana/classic/mana_u_b.png',
  bur: '/mana/classic/mana_u_r.png',
  ur: '/mana/classic/mana_u_r.png',
  br: '/mana/classic/mana_b_r.png',
  bg: '/mana/classic/mana_b_g.png',
  rg: '/mana/classic/mana_r_g.png',
  rw: '/mana/classic/mana_r_w.png',
  gw: '/mana/classic/mana_g_w.png',
  gbu: '/mana/classic/mana_g_u.png',
  gu: '/mana/classic/mana_g_u.png',

  // Colorless hybrids {C/W}…{C/G}
  cw: '/mana/classic/mana_colorless_hybrid_c_w.png',
  cu: '/mana/classic/mana_colorless_hybrid_c_u.png',
  cbu: '/mana/classic/mana_colorless_hybrid_c_u.png',
  cb: '/mana/classic/mana_colorless_hybrid_c_b.png',
  cr: '/mana/classic/mana_colorless_hybrid_c_r.png',
  cg: '/mana/classic/mana_colorless_hybrid_c_g.png',

  // Phyrexian mono {W/P}…{G/P}
  wp: '/mana/classic/mana_phyrexian_w.png',
  up: '/mana/classic/mana_phyrexian_u.png',
  bp: '/mana/classic/mana_phyrexian_b.png',
  rp: '/mana/classic/mana_phyrexian_r.png',
  gp: '/mana/classic/mana_phyrexian_g.png',

  // Hybrid Phyrexian {W/U/P}… (slash-stripped keys)
  wup: '/mana/classic/mana_phyrexian_w_u.png',
  wbp: '/mana/classic/mana_phyrexian_w_b.png',
  ubp: '/mana/classic/mana_phyrexian_u_b.png',
  urp: '/mana/classic/mana_phyrexian_u_r.png',
  brp: '/mana/classic/mana_phyrexian_b_r.png',
  bgp: '/mana/classic/mana_phyrexian_b_g.png',
  rgp: '/mana/classic/mana_phyrexian_r_g.png',
  rwp: '/mana/classic/mana_phyrexian_r_w.png',
  gwp: '/mana/classic/mana_phyrexian_g_w.png',
  gup: '/mana/classic/mana_phyrexian_g_u.png',
  // Legacy-style phyrexian hybrid keys used elsewhere in the app
  prw: '/mana/classic/mana_phyrexian_w_u.png',
  pwb: '/mana/classic/mana_phyrexian_w_b.png',
  pub: '/mana/classic/mana_phyrexian_u_b.png',
  pur: '/mana/classic/mana_phyrexian_u_r.png',
  pbr: '/mana/classic/mana_phyrexian_b_r.png',
  pbg: '/mana/classic/mana_phyrexian_b_g.png',
  prg: '/mana/classic/mana_phyrexian_r_g.png',
  pwr: '/mana/classic/mana_phyrexian_r_w.png',
  pgw: '/mana/classic/mana_phyrexian_g_w.png',
  pgbu: '/mana/classic/mana_phyrexian_g_u.png',
  pgu: '/mana/classic/mana_phyrexian_g_u.png',

  // Special
  tap: '/mana/classic/mana_tap.png',
  q: '/mana/classic/mana_untap.png',
  s: '/mana/classic/mana_snow.png',

  // Basic land / wastes pips (picker extras; not cost tokens)
  plains: '/mana/classic/mana_land_plains_classic.png',
  island: '/mana/classic/mana_land_island_classic.png',
  swamp: '/mana/classic/mana_land_swamp_classic.png',
  mountain: '/mana/classic/mana_land_mountain_classic.png',
  forest: '/mana/classic/mana_land_forest_classic.png',
  wastes: '/mana/classic/mana_land_wastes_colorless.png',
}

export default manaMapClassic
