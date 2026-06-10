/* =====================================================================
   exercises.js  —  The workout knowledge base
   ---------------------------------------------------------------------
   This file is plain data. Anyone can read or extend it without code
   experience: copy an existing block, change the words, save.

   EQUIPMENT: every piece of gear the app knows about. "bodyweight" is
   special — you always own it, so it never appears in the search list.

   EXERCISES: each move is tagged with:
     muscles   -> muscle groups it trains (first one is the MAIN target)
     equipment -> gear required (must be one you own to be suggested)
     category  -> push / pull / legs / core  (used to build splits)
     sets/reps -> sensible defaults the planner starts you with
   ===================================================================== */

window.WApp = window.WApp || {};

/* The muscle groups the whole app reasons about. */
WApp.MUSCLES = [
  "chest", "back", "shoulders", "biceps", "triceps",
  "quads", "hamstrings", "glutes", "calves", "core"
];

/* Friendly labels for muscle ids. */
WApp.MUSCLE_LABELS = {
  chest: "Chest", back: "Back", shoulders: "Shoulders",
  biceps: "Biceps", triceps: "Triceps", quads: "Quads",
  hamstrings: "Hamstrings", glutes: "Glutes", calves: "Calves", core: "Core"
};

/* Searchable equipment. id is used internally; label is what you see. */
WApp.EQUIPMENT = [
  { id: "dumbbells",      label: "Dumbbells" },
  { id: "barbell",        label: "Barbell" },
  { id: "bench",          label: "Flat Bench" },
  { id: "incline_bench",  label: "Incline Bench" },
  { id: "squat_rack",     label: "Squat / Power Rack" },
  { id: "pullup_bar",     label: "Pull-up Bar" },
  { id: "dip_bars",       label: "Dip Bars / Station" },
  { id: "kettlebell",     label: "Kettlebell" },
  { id: "bands",          label: "Resistance Bands" },
  { id: "cable",          label: "Cable Machine" },
  { id: "lat_pulldown",   label: "Lat Pulldown Machine" },
  { id: "leg_press",      label: "Leg Press Machine" },
  { id: "leg_curl",       label: "Leg Curl Machine" },
  { id: "leg_extension",  label: "Leg Extension Machine" },
  { id: "smith",          label: "Smith Machine" },
  { id: "ez_bar",         label: "EZ Curl Bar" },
  { id: "bosu",           label: "Stability / Bosu Ball" },
  { id: "med_ball",       label: "Medicine Ball" }
];

/* Which equipment can stand in for which, so a plan rarely comes up empty.
   Not used to suggest gear you don't own — only to know that, e.g., a
   barbell move could instead be done with dumbbells when picking subs. */

WApp.EXERCISES = [
  /* ---------------- PUSH: chest / shoulders / triceps ---------------- */
  { id: "pushup",            name: "Push-up",                    category: "push", muscles: ["chest","triceps","shoulders"], equipment: "bodyweight", sets: 3, reps: "10-15", note: "Hands under shoulders, body in a straight line." },
  { id: "incline_pushup",    name: "Incline Push-up",            category: "push", muscles: ["chest","triceps"],            equipment: "bodyweight", sets: 3, reps: "12-15", note: "Hands raised on a sturdy surface — easier than a floor push-up." },
  { id: "pike_pushup",       name: "Pike Push-up",               category: "push", muscles: ["shoulders","triceps"],        equipment: "bodyweight", sets: 3, reps: "8-12",  note: "Hips high, head aims at the floor — hits the shoulders." },
  { id: "dips",              name: "Parallel Bar Dips",          category: "push", muscles: ["chest","triceps","shoulders"], equipment: "dip_bars",   sets: 3, reps: "8-12",  note: "Lean slightly forward for chest, upright for triceps." },
  { id: "bench_press",       name: "Barbell Bench Press",        category: "push", muscles: ["chest","triceps","shoulders"], equipment: "barbell",    needs: ["bench"], sets: 4, reps: "6-10", note: "Lower the bar to mid-chest, drive up. Use a spotter if heavy." },
  { id: "db_bench_press",    name: "Dumbbell Bench Press",       category: "push", muscles: ["chest","triceps","shoulders"], equipment: "dumbbells",  needs: ["bench"], sets: 4, reps: "8-12", note: "Lower until you feel a stretch, press back up." },
  { id: "db_incline_press",  name: "Incline Dumbbell Press",     category: "push", muscles: ["chest","shoulders"],          equipment: "dumbbells",  needs: ["incline_bench"], sets: 3, reps: "8-12", note: "Targets the upper chest." },
  { id: "db_floor_press",    name: "Dumbbell Floor Press",       category: "push", muscles: ["chest","triceps"],            equipment: "dumbbells",  sets: 3, reps: "8-12", note: "No bench needed — press while lying on the floor." },
  { id: "ohp",               name: "Overhead Press",             category: "push", muscles: ["shoulders","triceps"],        equipment: "barbell",    sets: 4, reps: "6-10", note: "Press the bar overhead, squeeze glutes to protect the back." },
  { id: "db_shoulder_press", name: "Dumbbell Shoulder Press",    category: "push", muscles: ["shoulders","triceps"],        equipment: "dumbbells",  sets: 3, reps: "8-12", note: "Seated or standing, press overhead." },
  { id: "lateral_raise",     name: "Lateral Raise",              category: "push", muscles: ["shoulders"],                  equipment: "dumbbells",  sets: 3, reps: "12-15", note: "Raise to shoulder height, slight bend in the elbow." },
  { id: "band_lateral",      name: "Band Lateral Raise",         category: "push", muscles: ["shoulders"],                  equipment: "bands",      sets: 3, reps: "15-20", note: "Stand on the band, raise arms out to the sides." },
  { id: "cable_fly",         name: "Cable Chest Fly",            category: "push", muscles: ["chest"],                      equipment: "cable",      sets: 3, reps: "12-15", note: "Bring the handles together in a hugging motion." },
  { id: "tricep_dip_bench",  name: "Bench Tricep Dip",           category: "push", muscles: ["triceps"],                    equipment: "bench",      sets: 3, reps: "10-15", note: "Hands on a bench behind you, dip and press up." },
  { id: "tricep_pushdown",   name: "Cable Tricep Pushdown",      category: "push", muscles: ["triceps"],                    equipment: "cable",      sets: 3, reps: "12-15", note: "Keep elbows pinned to your sides." },
  { id: "db_overhead_tri",   name: "Overhead Dumbbell Extension",category: "push", muscles: ["triceps"],                    equipment: "dumbbells",  sets: 3, reps: "10-12", note: "One dumbbell behind the head, extend up." },

  /* ---------------- PULL: back / biceps ---------------- */
  { id: "pullup",            name: "Pull-up",                    category: "pull", muscles: ["back","biceps"],              equipment: "pullup_bar", sets: 3, reps: "5-10",  note: "Palms away, pull chin over the bar." },
  { id: "chinup",            name: "Chin-up",                    category: "pull", muscles: ["back","biceps"],              equipment: "pullup_bar", sets: 3, reps: "5-10",  note: "Palms toward you — more biceps." },
  { id: "band_pulldown",     name: "Band Lat Pulldown",          category: "pull", muscles: ["back","biceps"],              equipment: "bands",      sets: 3, reps: "12-15", note: "Anchor the band high, pull down to the chest." },
  { id: "lat_pulldown",      name: "Lat Pulldown",               category: "pull", muscles: ["back","biceps"],              equipment: "lat_pulldown", sets: 3, reps: "10-12", note: "Pull the bar to the upper chest, control the return." },
  { id: "barbell_row",       name: "Barbell Bent-over Row",      category: "pull", muscles: ["back","biceps"],              equipment: "barbell",    sets: 4, reps: "6-10", note: "Hinge at the hips, pull to the belly button." },
  { id: "db_row",            name: "One-arm Dumbbell Row",       category: "pull", muscles: ["back","biceps"],              equipment: "dumbbells",  sets: 3, reps: "8-12", note: "One knee on a bench (or hand on a chair), row to the hip." },
  { id: "band_row",          name: "Seated Band Row",            category: "pull", muscles: ["back","biceps"],              equipment: "bands",      sets: 3, reps: "12-15", note: "Anchor low, pull elbows back, squeeze shoulder blades." },
  { id: "cable_row",         name: "Seated Cable Row",           category: "pull", muscles: ["back","biceps"],              equipment: "cable",      sets: 3, reps: "10-12", note: "Pull to the stomach, keep the chest up." },
  { id: "face_pull",         name: "Band Face Pull",             category: "pull", muscles: ["back","shoulders"],           equipment: "bands",      sets: 3, reps: "15-20", note: "Pull toward the face, great for posture." },
  { id: "db_curl",           name: "Dumbbell Biceps Curl",       category: "pull", muscles: ["biceps"],                     equipment: "dumbbells",  sets: 3, reps: "10-12", note: "Curl without swinging the body." },
  { id: "ez_curl",           name: "EZ-Bar Curl",                category: "pull", muscles: ["biceps"],                     equipment: "ez_bar",     sets: 3, reps: "10-12", note: "Easier on the wrists than a straight bar." },
  { id: "band_curl",         name: "Band Biceps Curl",           category: "pull", muscles: ["biceps"],                     equipment: "bands",      sets: 3, reps: "15-20", note: "Stand on the band, curl up." },
  { id: "hammer_curl",       name: "Hammer Curl",                category: "pull", muscles: ["biceps","forearms"],          equipment: "dumbbells",  sets: 3, reps: "10-12", note: "Palms face each other the whole way." },

  /* ---------------- LEGS: quads / hamstrings / glutes / calves ------- */
  { id: "bw_squat",          name: "Bodyweight Squat",           category: "legs", muscles: ["quads","glutes"],             equipment: "bodyweight", sets: 3, reps: "15-20", note: "Sit back and down, knees tracking over the toes." },
  { id: "lunge",             name: "Walking / Reverse Lunge",    category: "legs", muscles: ["quads","glutes","hamstrings"], equipment: "bodyweight", sets: 3, reps: "10/leg", note: "Step back, drop the back knee, drive up." },
  { id: "bulgarian_split",   name: "Bulgarian Split Squat",      category: "legs", muscles: ["quads","glutes"],             equipment: "bodyweight", sets: 3, reps: "8-12/leg", note: "Back foot raised on a bench/chair." },
  { id: "glute_bridge",      name: "Glute Bridge",               category: "legs", muscles: ["glutes","hamstrings"],        equipment: "bodyweight", sets: 3, reps: "15-20", note: "Drive hips up, squeeze the glutes at the top." },
  { id: "back_squat",        name: "Barbell Back Squat",         category: "legs", muscles: ["quads","glutes","hamstrings"], equipment: "barbell",    needs: ["squat_rack"], sets: 4, reps: "5-8", note: "Bar on the upper back, squat to at least parallel." },
  { id: "front_squat",       name: "Barbell Front Squat",        category: "legs", muscles: ["quads","glutes"],             equipment: "barbell",    needs: ["squat_rack"], sets: 4, reps: "6-8", note: "Bar racked on the front shoulders, torso upright." },
  { id: "goblet_squat",      name: "Goblet Squat",               category: "legs", muscles: ["quads","glutes"],             equipment: "dumbbells",  sets: 3, reps: "10-15", note: "Hold one dumbbell at the chest." },
  { id: "kb_goblet_squat",   name: "Kettlebell Goblet Squat",    category: "legs", muscles: ["quads","glutes"],             equipment: "kettlebell", sets: 3, reps: "10-15", note: "Hold the kettlebell by the horns at the chest." },
  { id: "rdl",               name: "Barbell Romanian Deadlift",  category: "legs", muscles: ["hamstrings","glutes"],        equipment: "barbell",    sets: 4, reps: "8-10", note: "Hinge at the hips, slight knee bend, feel the hamstrings." },
  { id: "db_rdl",            name: "Dumbbell Romanian Deadlift", category: "legs", muscles: ["hamstrings","glutes"],        equipment: "dumbbells",  sets: 3, reps: "10-12", note: "Push the hips back, keep the back flat." },
  { id: "kb_swing",          name: "Kettlebell Swing",           category: "legs", muscles: ["glutes","hamstrings"],        equipment: "kettlebell", sets: 4, reps: "15-20", note: "Hinge and snap the hips to swing to chest height." },
  { id: "leg_press_ex",      name: "Leg Press",                  category: "legs", muscles: ["quads","glutes"],             equipment: "leg_press",  sets: 3, reps: "10-12", note: "Don't lock the knees at the top." },
  { id: "leg_curl_ex",       name: "Hamstring Curl",             category: "legs", muscles: ["hamstrings"],                 equipment: "leg_curl",   sets: 3, reps: "12-15", note: "Curl the heels toward the glutes." },
  { id: "leg_ext_ex",        name: "Leg Extension",              category: "legs", muscles: ["quads"],                      equipment: "leg_extension", sets: 3, reps: "12-15", note: "Squeeze the quads at the top." },
  { id: "calf_raise_bw",     name: "Standing Calf Raise",        category: "legs", muscles: ["calves"],                     equipment: "bodyweight", sets: 4, reps: "15-20", note: "Rise onto the toes, pause, lower slowly." },
  { id: "db_calf_raise",     name: "Dumbbell Calf Raise",        category: "legs", muscles: ["calves"],                     equipment: "dumbbells",  sets: 4, reps: "15-20", note: "Hold dumbbells for extra load." },

  /* ---------------- CORE ---------------- */
  { id: "plank",             name: "Plank",                      category: "core", muscles: ["core"],                      equipment: "bodyweight", sets: 3, reps: "30-60s", note: "Straight line head to heels, brace the abs." },
  { id: "side_plank",        name: "Side Plank",                 category: "core", muscles: ["core"],                      equipment: "bodyweight", sets: 3, reps: "20-40s/side", note: "Stack the feet, lift the hips." },
  { id: "deadbug",           name: "Dead Bug",                   category: "core", muscles: ["core"],                      equipment: "bodyweight", sets: 3, reps: "8-10/side", note: "Lower opposite arm and leg, keep the low back flat." },
  { id: "hanging_knee",      name: "Hanging Knee Raise",         category: "core", muscles: ["core"],                      equipment: "pullup_bar", sets: 3, reps: "10-15", note: "Hang from the bar, raise the knees to the chest." },
  { id: "russian_twist",     name: "Russian Twist",              category: "core", muscles: ["core"],                      equipment: "med_ball",   sets: 3, reps: "20 total", note: "Rotate side to side, feet off the floor if able." },
  { id: "mountain_climber",  name: "Mountain Climbers",          category: "core", muscles: ["core"],                      equipment: "bodyweight", sets: 3, reps: "30s", note: "Drive the knees in quickly from a plank." }
];
