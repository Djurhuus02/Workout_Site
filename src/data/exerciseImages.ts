const PHOTO_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises'
const photo = (id: string, frame = 0) => `${PHOTO_BASE}/${id}/${frame}.jpg`
const illus = (id: string) => `/exercise_illustrations/${id}.svg`

// Most exercises use a hand-drawn illustration (consistent style, transparent
// background — see public/exercise_illustrations). Most are sourced from the
// Everkinetic project via bryllim/workout-guide (CC BY-SA 4.0, credited in
// README); the ~18 with no free source available (mostly Olympic lifts) got a
// custom illustration instead, built to match the same visual style. Only 2
// exercises (decline_crunch, turkish_get_up) still use a photo — a custom
// illustration was attempted repeatedly for both but never reached a legible
// standard (a bent/hinged-spine or multi-point pose is a real weak spot of
// this hand-drawn technique), so the photo stays until a better source or
// approach turns up.
export const exerciseImageMap: Record<string, string> = {
  // ─── CHEST ────────────────────────────────────────────────────────────────
  bench_press:            illus('bench_press'),
  incline_bench_press:    illus('incline_bench_press'),
  decline_bench_press:    illus('decline_bench_press'),
  db_bench_press:         illus('db_bench_press'),
  incline_db_bench_press: illus('incline_db_bench_press'),
  decline_db_bench_press: illus('decline_db_bench_press'),
  db_fly:                 illus('db_fly'),
  incline_db_fly:         illus('incline_db_fly'),
  cable_fly_low:          illus('cable_fly_low'),
  cable_fly_high:         illus('cable_fly_high'),
  cable_fly_mid:          illus('cable_fly_mid'),
  chest_dip:              illus('chest_dip'),
  push_up:                illus('push_up'),
  wide_push_up:           illus('wide_push_up'),
  machine_chest_press:    illus('machine_chest_press'),

  // ─── BACK ─────────────────────────────────────────────────────────────────
  deadlift:               illus('deadlift'),
  sumo_deadlift:          illus('sumo_deadlift'),
  rack_pull:              illus('rack_pull'),
  barbell_row:            illus('barbell_row'),
  t_bar_row:              illus('t_bar_row'),
  cable_row:              illus('cable_row'),
  single_arm_db_row:      illus('single_arm_db_row'),
  lat_pulldown:           illus('lat_pulldown'),
  wide_lat_pulldown:      illus('wide_lat_pulldown'),
  close_grip_lat_pulldown:illus('close_grip_lat_pulldown'),
  pull_up:                illus('pull_up'),
  chin_up:                illus('chin_up'),
  face_pull:              illus('face_pull'),
  cable_pullover:         illus('cable_pullover'),
  straight_arm_pulldown:  illus('straight_arm_pulldown'),
  back_extension:         illus('back_extension'),
  good_morning:           illus('good_morning'),

  // ─── LEGS ─────────────────────────────────────────────────────────────────
  back_squat:             illus('back_squat'),
  front_squat:            illus('front_squat'),
  goblet_squat:           illus('goblet_squat'),
  leg_press:              illus('leg_press'),
  hack_squat:             illus('hack_squat'),
  bulgarian_split_squat:  illus('bulgarian_split_squat'),
  lunge:                  illus('lunge'),
  walking_lunge:          illus('walking_lunge'),
  romanian_deadlift:      illus('romanian_deadlift'),
  stiff_leg_deadlift:     illus('stiff_leg_deadlift'),
  leg_curl_lying:         illus('leg_curl_lying'),
  leg_curl_seated:        illus('leg_curl_seated'),
  leg_extension:          illus('leg_extension'),
  calf_raise_standing:    illus('calf_raise_standing'),
  calf_raise_seated:      illus('calf_raise_seated'),
  smith_squat:            illus('smith_squat'),
  step_up:                illus('step_up'),
  sumo_squat:             illus('sumo_squat'),
  nordics:                illus('nordics'),
  hip_thrust:             illus('hip_thrust'),
  glute_bridge:           illus('glute_bridge'),
  cable_pull_through:     illus('cable_pull_through'),

  // ─── SHOULDERS ────────────────────────────────────────────────────────────
  barbell_ohp:            illus('barbell_ohp'),
  db_ohp:                 illus('db_ohp'),
  arnold_press:           illus('arnold_press'),
  seated_db_press:        illus('seated_db_press'),
  lateral_raise:          illus('lateral_raise'),
  cable_lateral_raise:    illus('cable_lateral_raise'),
  front_raise:            illus('front_raise'),
  rear_delt_fly_db:       illus('rear_delt_fly_db'),
  rear_delt_fly_cable:    illus('rear_delt_fly_cable'),
  upright_row:            illus('upright_row'),
  barbell_shrug:          illus('barbell_shrug'),
  db_shrug:               illus('db_shrug'),
  machine_ohp:            illus('machine_ohp'),
  bradford_press:         illus('bradford_press'),
  push_press:             illus('push_press'),

  // ─── BICEPS ───────────────────────────────────────────────────────────────
  barbell_curl:           illus('barbell_curl'),
  ez_bar_curl:            illus('ez_bar_curl'),
  db_curl:                illus('db_curl'),
  incline_db_curl:        illus('incline_db_curl'),
  hammer_curl:            illus('hammer_curl'),
  preacher_curl:          illus('preacher_curl'),
  cable_curl:             illus('cable_curl'),
  concentration_curl:     illus('concentration_curl'),
  spider_curl:            illus('spider_curl'),
  reverse_curl:           illus('reverse_curl'),
  zottman_curl:           illus('db_curl'), // no dedicated illustration; same static pose as a standard dumbbell curl
  cable_hammer_curl:      illus('cable_hammer_curl'),

  // ─── TRICEPS ──────────────────────────────────────────────────────────────
  close_grip_bench:       illus('close_grip_bench'),
  skull_crusher_ez:       illus('skull_crusher_ez'),
  skull_crusher_barbell:  illus('skull_crusher_barbell'),
  tricep_pushdown_rope:   illus('tricep_pushdown_rope'),
  tricep_pushdown_bar:    illus('tricep_pushdown_bar'),
  overhead_tricep_rope:   illus('overhead_tricep_rope'),
  overhead_tricep_db:     illus('overhead_tricep_db'),
  tricep_kickback:        illus('tricep_kickback'),
  tricep_dip:             illus('tricep_dip'),
  jm_press:               illus('jm_press'),
  cable_overhead_extension: illus('cable_overhead_extension'),

  // ─── CORE ─────────────────────────────────────────────────────────────────
  plank:                  illus('plank'),
  side_plank:             illus('side_plank'),
  ab_rollout:             illus('ab_rollout'),
  cable_crunch:           illus('cable_crunch'),
  hanging_leg_raise:      illus('hanging_leg_raise'),
  hanging_knee_raise:     illus('hanging_knee_raise'),
  russian_twist:          illus('russian_twist'),
  bicycle_crunch:         illus('bicycle_crunch'),
  crunch:                 illus('crunch'),
  decline_crunch:         photo('Decline_Crunch'),
  leg_raise:              illus('leg_raise'),
  dragon_flag:            illus('dragon_flag'),
  pallof_press:           illus('pallof_press'),
  dead_bug:               illus('dead_bug'),
  v_up:                   illus('v_up'),

  // ─── OLYMPIC / FULL BODY ──────────────────────────────────────────────────
  power_clean:            illus('power_clean'),
  hang_power_clean:       illus('hang_power_clean'),
  clean_and_jerk:         illus('clean_and_jerk'),
  snatch:                 illus('snatch'),
  hang_snatch:            illus('hang_snatch'),
  split_jerk:             illus('split_jerk'),
  power_snatch:           illus('power_snatch'),
  clean_and_press:        illus('clean_and_press'),
  farmers_walk:           illus('farmers_walk'),
  turkish_get_up:         photo('Kettlebell_Turkish_Get-Up_Squat_style'),
  kettlebell_goblet_squat: illus('kettlebell_goblet_squat'),
  battle_ropes:           illus('battle_ropes'),
  box_jump:               illus('box_jump'),

  // ─── ADDITIONAL ───────────────────────────────────────────────────────────
  diamond_push_up:        illus('diamond_push_up'),
  push_jerk:              illus('push_jerk'),
  kettlebell_swing:       illus('kettlebell_swing'),
  landmine_press:         illus('landmine_press'),
  machine_row:            illus('machine_row'),
  thruster:                illus('thruster'),

  // ─── LOCAL FALLBACK (no photo or illustration source found) ──────────────
  burpee:                 illus('burpee'),
  neutral_pull_up:        illus('neutral_pull_up'),
  pec_deck:               illus('pec_deck'),
  pendlay_row:            illus('pendlay_row'),
  suitcase_carry:         illus('farmers_walk'), // no dedicated single-arm carry illustration exists; same close-match reasoning as the photo it replaces
}
