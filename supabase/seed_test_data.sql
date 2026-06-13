DO $$
DECLARE
  v_kuldeep    UUID; v_jay      UUID; v_anubhav   UUID; v_ravinder UUID;
  v_ashutosh   UUID; v_milan    UUID; v_anupam    UUID; v_deepender UUID;
  v_gazali     UUID; v_shreya   UUID; v_jasbir    UUID; v_sourabh  UUID;
  v_jitendra   UUID; v_himanshu UUID;
BEGIN
  SELECT id INTO v_kuldeep   FROM profiles WHERE email = 'kuldeep@htc.test';
  SELECT id INTO v_jay       FROM profiles WHERE email = 'jay@htc.test';
  SELECT id INTO v_anubhav   FROM profiles WHERE email = 'anubhav@htc.test';
  SELECT id INTO v_ravinder  FROM profiles WHERE email = 'ravinder@htc.test';
  SELECT id INTO v_ashutosh  FROM profiles WHERE email = 'ashutosh@htc.test';
  SELECT id INTO v_milan     FROM profiles WHERE email = 'milan@htc.test';
  SELECT id INTO v_anupam    FROM profiles WHERE email = 'anupam@htc.test';
  SELECT id INTO v_deepender FROM profiles WHERE email = 'deepender@htc.test';
  SELECT id INTO v_gazali    FROM profiles WHERE email = 'mohammad@htc.test';
  SELECT id INTO v_shreya    FROM profiles WHERE email = 'shreya@htc.test';
  SELECT id INTO v_jasbir    FROM profiles WHERE email = 'jasbir@htc.test';
  SELECT id INTO v_sourabh   FROM profiles WHERE email = 'sourabh@htc.test';
  SELECT id INTO v_jitendra  FROM profiles WHERE email = 'jitendra@htc.test';
  SELECT id INTO v_himanshu  FROM profiles WHERE email = 'himanshu@htc.test';

  -- ────────────────────────────────────────────────────────────────
  -- GOALS (ON CONFLICT DO NOTHING preserves any manually set goals)
  -- ────────────────────────────────────────────────────────────────
  INSERT INTO member_goals(member_id,month,category,goal_type,target,unit,definition,coach_note,is_primary) VALUES
  -- Kuldeep: nutrition_days(20,primary), logging_days(25)
  (v_kuldeep,'2026-06-01','nutrition_days','days',20,'days','Protein > 100g. All meals count.','Nutrition is your #1 lever right now.',true),
  (v_kuldeep,'2026-06-01','logging_days','days',25,'days','Log every day — even rest days count.','Consistency builds the habit.',false),
  -- Jay: monthly_mileage(80,primary), workout_days(20)
  (v_jay,'2026-06-01','monthly_mileage','cumulative',80,'km','Every run km counts toward this.','You''re building your aerobic base.',true),
  (v_jay,'2026-06-01','workout_days','days',20,'days','Any Push/Pull/Legs session counts.','Strength supports your running.',false),
  -- Anubhav: workout_days(20,primary), nutrition_days(20)
  (v_anubhav,'2026-06-01','workout_days','days',20,'days','Any Push/Pull/Legs day counts.','Build the movement habit first.',true),
  (v_anubhav,'2026-06-01','nutrition_days','days',20,'days','Protein > 120g and no junk after 9pm.','Fuel matches your training load.',false),
  -- Ravinder: workout_days(16,primary)
  (v_ravinder,'2026-06-01','workout_days','days',16,'days','Any strength session counts.','16 days is very achievable — stay consistent.',true),
  -- Ashutosh: mindfulness_days(20,primary), running_days(16)
  (v_ashutosh,'2026-06-01','mindfulness_days','days',20,'days','Any breathwork > 0 min counts.','Your stress management is the priority.',true),
  (v_ashutosh,'2026-06-01','running_days','days',16,'days','Any run, any distance counts.','Running is your second anchor.',false),
  -- Milan: workout_days(18,primary), nutrition_days(22), running_days(12)
  (v_milan,'2026-06-01','workout_days','days',18,'days','Any Push/Pull/Legs session counts.','Consistency over intensity.',true),
  (v_milan,'2026-06-01','nutrition_days','days',22,'days','Clean eating — no processed food on this day.','22 of 30 days is realistic for you.',false),
  (v_milan,'2026-06-01','running_days','days',12,'days','Any run counts.','Running 3 per week gets you there.',false),
  -- Anupam: monthly_mileage(90,primary), strength_sessions(12), recovery_days(8)
  (v_anupam,'2026-06-01','monthly_mileage','cumulative',90,'km','Total km from all runs.','You''re training for a half — build the base.',true),
  (v_anupam,'2026-06-01','strength_sessions','cumulative',12,'sessions','Every Push/Pull/Legs entry counts.','Strength supports your long runs.',false),
  (v_anupam,'2026-06-01','recovery_days','days',8,'days','Any day with Mobility logged.','Recovery is training.',false),
  -- Deepender: logging_days(25,primary), workout_days(16)
  (v_deepender,'2026-06-01','logging_days','days',25,'days','Log every single day.','Just show up and log.',true),
  (v_deepender,'2026-06-01','workout_days','days',16,'days','Any strength session counts.','16 days, 4 per week.',false),
  -- Gazali: monthly_mileage(80,primary), workout_days(20), nutrition_days(20)
  (v_gazali,'2026-06-01','monthly_mileage','cumulative',80,'km','Every run km counts.','80km is 2-3 runs per week.',true),
  (v_gazali,'2026-06-01','workout_days','days',20,'days','Any Push/Pull/Legs day.','Strength plus running.',false),
  (v_gazali,'2026-06-01','nutrition_days','days',20,'days','No sugar + adequate protein.','Clean fuel for training.',false),
  -- Shreya: nutrition_days(20,primary), mindfulness_days(20), sleep_days(18)
  (v_shreya,'2026-06-01','nutrition_days','days',20,'days','No processed food. Home-cooked counts.','Nutrition is your foundation.',true),
  (v_shreya,'2026-06-01','mindfulness_days','days',20,'days','Any breathwork session counts.','Daily stillness reduces cortisol.',false),
  (v_shreya,'2026-06-01','sleep_days','days',18,'days','In bed by 10:30pm, 7+ hours sleep.','Sleep is your recovery tool.',false),
  -- Jasbir: workout_days(12,primary), running_days(10)
  (v_jasbir,'2026-06-01','workout_days','days',12,'days','Any Push/Pull/Legs counts.','3 per week gets you there.',true),
  (v_jasbir,'2026-06-01','running_days','days',10,'days','Any run counts.','Run 2-3x per week.',false),
  -- Sourabh: nutrition_days(20,primary), workout_days(16)
  (v_sourabh,'2026-06-01','nutrition_days','days',20,'days','Protein first every meal.','Protein drives everything for you.',true),
  (v_sourabh,'2026-06-01','workout_days','days',16,'days','Any Push/Pull/Legs counts.','4 sessions per week.',false),
  -- Jitendra: workout_days(20,primary), nutrition_days(20)
  (v_jitendra,'2026-06-01','workout_days','days',20,'days','Any Push/Pull/Legs counts.','5 days per week is the goal.',true),
  (v_jitendra,'2026-06-01','nutrition_days','days',20,'days','Track calories. 2200 kcal target.','Fuel matches your training.',false),
  -- Himanshu: running_days(15,primary), mindfulness_days(20)
  (v_himanshu,'2026-06-01','running_days','days',15,'days','Any run, any pace counts.','Build the running habit.',true),
  (v_himanshu,'2026-06-01','mindfulness_days','days',20,'days','Any breathwork > 0 counts.','5 min daily is enough.',false)
  ON CONFLICT (member_id, month, category) DO NOTHING;

  -- ────────────────────────────────────────────────────────────────
  -- LOG ENTRIES  (ON CONFLICT DO NOTHING preserves existing entries)
  -- ────────────────────────────────────────────────────────────────

  -- KULDEEP — 11 days, nutrition 9/11, streak Jun 7-13
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_kuldeep,'2026-06-01',ARRAY['Rest']::text[],0,0,null,true,null),
  (v_kuldeep,'2026-06-02',ARRAY['Mobility']::text[],40,0,null,true,null),
  (v_kuldeep,'2026-06-03',ARRAY['Push']::text[],60,0,null,true,null),
  (v_kuldeep,'2026-06-05',ARRAY['Pull']::text[],50,0,null,false,null),
  (v_kuldeep,'2026-06-07',ARRAY['Legs']::text[],55,0,null,true,null),
  (v_kuldeep,'2026-06-08',ARRAY['Rest']::text[],0,0,null,true,null),
  (v_kuldeep,'2026-06-09',ARRAY['Push']::text[],60,0,null,true,null),
  (v_kuldeep,'2026-06-10',ARRAY['Mobility']::text[],45,0,null,true,null),
  (v_kuldeep,'2026-06-11',ARRAY['Pull']::text[],50,0,null,false,null),
  (v_kuldeep,'2026-06-12',ARRAY['Legs']::text[],55,0,null,true,null),
  (v_kuldeep,'2026-06-13',ARRAY['Push']::text[],60,0,null,true,null)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- nutrition=9, logging=11 → both On Track

  -- JAY — 13 days, mileage 35km (On Track), workout 8 days (Keep Going), streak 13
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_jay,'2026-06-01',ARRAY['Push']::text[],65,0,null,null,null),
  (v_jay,'2026-06-02',ARRAY['Run']::text[],35,0,6,null,null),
  (v_jay,'2026-06-03',ARRAY['Pull']::text[],60,0,null,null,null),
  (v_jay,'2026-06-04',ARRAY['Run']::text[],38,0,7,null,null),
  (v_jay,'2026-06-05',ARRAY['Legs']::text[],65,0,null,null,null),
  (v_jay,'2026-06-06',ARRAY['Run']::text[],40,0,7,null,null),
  (v_jay,'2026-06-07',ARRAY['Push']::text[],60,0,null,null,null),
  (v_jay,'2026-06-08',ARRAY['Run']::text[],42,0,8,null,null),
  (v_jay,'2026-06-09',ARRAY['Pull']::text[],60,0,null,null,null),
  (v_jay,'2026-06-10',ARRAY['Legs']::text[],65,0,null,null,null),
  (v_jay,'2026-06-11',ARRAY['Run']::text[],45,0,7,null,null),
  (v_jay,'2026-06-12',ARRAY['Push']::text[],60,0,null,null,null),
  (v_jay,'2026-06-13',ARRAY['Pull']::text[],60,0,null,null,null)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- km=6+7+7+8+7=35 On Track, workout=8 Keep Going, streak=13

  -- ANUBHAV — 8 days, workout 8 (Keep Going), nutrition 5 (Push Harder), streak 4
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_anubhav,'2026-06-01',ARRAY['Push']::text[],65,0,null,true,null),
  (v_anubhav,'2026-06-03',ARRAY['Legs']::text[],60,0,null,false,null),
  (v_anubhav,'2026-06-05',ARRAY['Pull']::text[],55,0,null,true,null),
  (v_anubhav,'2026-06-07',ARRAY['Push']::text[],65,0,null,true,null),
  (v_anubhav,'2026-06-10',ARRAY['Pull']::text[],60,0,null,false,null),
  (v_anubhav,'2026-06-11',ARRAY['Legs']::text[],60,0,null,true,null),
  (v_anubhav,'2026-06-12',ARRAY['Push']::text[],65,0,null,false,null),
  (v_anubhav,'2026-06-13',ARRAY['Pull']::text[],60,0,null,false,null)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- workout=8 Keep Going, nutrition=4 Push Harder, streak=4

  -- RAVINDER — 12 days, workout 11 days (On Track for 16), streak 12
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_ravinder,'2026-06-02',ARRAY['Push']::text[],75,0,null,null,null),
  (v_ravinder,'2026-06-03',ARRAY['Pull']::text[],70,0,null,null,null),
  (v_ravinder,'2026-06-04',ARRAY['Rest']::text[],0,0,null,null,null),
  (v_ravinder,'2026-06-05',ARRAY['Legs']::text[],75,0,null,null,null),
  (v_ravinder,'2026-06-06',ARRAY['Push']::text[],70,0,null,null,null),
  (v_ravinder,'2026-06-07',ARRAY['Pull']::text[],75,0,null,null,null),
  (v_ravinder,'2026-06-08',ARRAY['Legs']::text[],70,0,null,null,null),
  (v_ravinder,'2026-06-09',ARRAY['Push']::text[],75,0,null,null,null),
  (v_ravinder,'2026-06-10',ARRAY['Pull']::text[],70,0,null,null,null),
  (v_ravinder,'2026-06-11',ARRAY['Legs']::text[],75,0,null,null,null),
  (v_ravinder,'2026-06-12',ARRAY['Push']::text[],70,0,null,null,null),
  (v_ravinder,'2026-06-13',ARRAY['Pull']::text[],75,0,null,null,null)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- workout=11 On Track, streak=12 (Jun2-13 consecutive, Jun4 Rest still logs)

  -- ASHUTOSH — 8 days, run 4 (Push Harder for 16), mindfulness 5 (Push Harder for 20), streak 2
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_ashutosh,'2026-06-01',ARRAY['Run']::text[],30,0,5,null,null),
  (v_ashutosh,'2026-06-03',ARRAY['Mobility']::text[],40,15,null,null,null),
  (v_ashutosh,'2026-06-05',ARRAY['Run']::text[],32,0,5,null,null),
  (v_ashutosh,'2026-06-07',ARRAY['Mobility']::text[],40,20,null,null,null),
  (v_ashutosh,'2026-06-09',ARRAY['Run']::text[],30,10,4,null,null),
  (v_ashutosh,'2026-06-11',ARRAY['Mobility']::text[],40,0,null,null,null),
  (v_ashutosh,'2026-06-12',ARRAY['Run']::text[],30,15,5,null,null),
  (v_ashutosh,'2026-06-13',ARRAY['Mobility']::text[],40,10,null,null,null)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- run=4 Push Harder, mindfulness=5 (breathwork>0 days: Jun3,7,9,12,13) Push Harder, streak=2

  -- MILAN — 11 days, workout 9 (On Track for 18), nutrition 8 (Keep Going for 22), run 5 (On Track for 12), streak 5
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_milan,'2026-06-01',ARRAY['Run','Push']::text[],90,0,4,true,null),
  (v_milan,'2026-06-02',ARRAY['Legs']::text[],60,0,null,false,null),
  (v_milan,'2026-06-03',ARRAY['Pull']::text[],55,0,null,true,null),
  (v_milan,'2026-06-05',ARRAY['Run','Pull']::text[],80,0,5,true,null),
  (v_milan,'2026-06-06',ARRAY['Legs']::text[],65,0,null,false,null),
  (v_milan,'2026-06-07',ARRAY['Push']::text[],60,0,null,true,null),
  (v_milan,'2026-06-09',ARRAY['Run']::text[],38,0,5,false,null),
  (v_milan,'2026-06-10',ARRAY['Legs']::text[],60,0,null,true,null),
  (v_milan,'2026-06-11',ARRAY['Run','Push']::text[],85,0,5,false,null),
  (v_milan,'2026-06-12',ARRAY['Pull']::text[],55,0,null,true,null),
  (v_milan,'2026-06-13',ARRAY['Run','Legs']::text[],80,0,5,true,null)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- run=5 On Track, workout=9 On Track, nutrition=8 Keep Going, streak=5

  -- ANUPAM — 13 days (all!), mileage 43km (On Track 90), strength 7 (On Track 12), recovery 7 (On Track 8), streak 13
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_anupam,'2026-06-01',ARRAY['Run','Mobility']::text[],90,10,6,null,null),
  (v_anupam,'2026-06-02',ARRAY['Push']::text[],70,0,null,null,null),
  (v_anupam,'2026-06-03',ARRAY['Run','Mobility']::text[],85,0,7,null,null),
  (v_anupam,'2026-06-04',ARRAY['Pull']::text[],65,0,null,null,null),
  (v_anupam,'2026-06-05',ARRAY['Run']::text[],40,0,6,null,null),
  (v_anupam,'2026-06-06',ARRAY['Mobility']::text[],45,0,null,null,null),
  (v_anupam,'2026-06-07',ARRAY['Run','Legs']::text[],95,0,7,null,null),
  (v_anupam,'2026-06-08',ARRAY['Mobility']::text[],45,0,null,null,null),
  (v_anupam,'2026-06-09',ARRAY['Run','Push']::text[],85,0,5,null,null),
  (v_anupam,'2026-06-10',ARRAY['Mobility']::text[],45,0,null,null,null),
  (v_anupam,'2026-06-11',ARRAY['Run','Pull']::text[],85,0,6,null,null),
  (v_anupam,'2026-06-12',ARRAY['Legs','Mobility']::text[],75,0,null,null,null),
  (v_anupam,'2026-06-13',ARRAY['Run','Push']::text[],90,0,6,null,null)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- km=6+7+6+7+5+6+6=43 On Track, strength_sessions=7 On Track, recovery_days=7 On Track, streak=13

  -- DEEPENDER — 4 days, logging 4 (Push Harder 25), workout 4 (Push Harder 16), streak 1
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_deepender,'2026-06-03',ARRAY['Push']::text[],60,0,null,null,null),
  (v_deepender,'2026-06-07',ARRAY['Pull']::text[],55,0,null,null,null),
  (v_deepender,'2026-06-10',ARRAY['Legs']::text[],60,0,null,null,null),
  (v_deepender,'2026-06-13',ARRAY['Push']::text[],60,0,null,null,null)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- logging=4 Push Harder, workout=4 Push Harder, streak=1

  -- GAZALI — 12 days, mileage 43km (On Track 80), workout 8 (Keep Going 20), nutrition 9 (On Track 20), streak 6
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_gazali,'2026-06-01',ARRAY['Run']::text[],35,0,7,true,null),
  (v_gazali,'2026-06-02',ARRAY['Push']::text[],60,0,null,false,null),
  (v_gazali,'2026-06-03',ARRAY['Pull']::text[],55,0,null,true,null),
  (v_gazali,'2026-06-04',ARRAY['Run']::text[],38,0,8,true,null),
  (v_gazali,'2026-06-05',ARRAY['Legs']::text[],60,0,null,false,null),
  (v_gazali,'2026-06-06',ARRAY['Run','Legs']::text[],90,0,8,true,null),
  (v_gazali,'2026-06-08',ARRAY['Push']::text[],60,0,null,true,null),
  (v_gazali,'2026-06-09',ARRAY['Run']::text[],42,0,9,true,null),
  (v_gazali,'2026-06-10',ARRAY['Pull']::text[],55,0,null,false,null),
  (v_gazali,'2026-06-11',ARRAY['Run']::text[],45,0,11,true,null),
  (v_gazali,'2026-06-12',ARRAY['Legs']::text[],60,0,null,true,null),
  (v_gazali,'2026-06-13',ARRAY['Push']::text[],60,0,null,false,null)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- km=7+8+8+9+11=43 On Track, workout=8 Keep Going, nutrition=9 On Track, streak=6

  -- SHREYA — 11 days, nutrition 10 (On Track 20), mindfulness 9 (On Track 20), sleep 8 (On Track 18), streak 7
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_shreya,'2026-06-01',ARRAY['Rest']::text[],0,0,null,true,true),
  (v_shreya,'2026-06-03',ARRAY['Mobility']::text[],40,15,null,true,true),
  (v_shreya,'2026-06-05',ARRAY['Rest']::text[],0,20,null,true,true),
  (v_shreya,'2026-06-06',ARRAY['Mobility']::text[],40,10,null,true,false),
  (v_shreya,'2026-06-07',ARRAY['Rest']::text[],0,15,null,true,true),
  (v_shreya,'2026-06-08',ARRAY['Mobility']::text[],40,20,null,false,true),
  (v_shreya,'2026-06-09',ARRAY['Rest']::text[],0,10,null,true,false),
  (v_shreya,'2026-06-10',ARRAY['Mobility']::text[],40,15,null,true,true),
  (v_shreya,'2026-06-11',ARRAY['Rest']::text[],0,20,null,true,true),
  (v_shreya,'2026-06-12',ARRAY['Mobility']::text[],40,10,null,true,false),
  (v_shreya,'2026-06-13',ARRAY['Rest']::text[],0,15,null,true,true)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- nutrition=10 On Track, mindfulness=9 (breathwork>0) On Track, sleep=8 On Track, streak=7

  -- JASBIR — 7 days, workout 5 (On Track 12), run 3 (Push Harder 10), streak 3
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_jasbir,'2026-06-02',ARRAY['Push']::text[],60,0,null,null,null),
  (v_jasbir,'2026-06-04',ARRAY['Run','Push']::text[],75,0,5,null,null),
  (v_jasbir,'2026-06-06',ARRAY['Pull']::text[],55,0,null,null,null),
  (v_jasbir,'2026-06-09',ARRAY['Legs']::text[],60,0,null,null,null),
  (v_jasbir,'2026-06-11',ARRAY['Run']::text[],30,0,4,null,null),
  (v_jasbir,'2026-06-12',ARRAY['Push']::text[],60,0,null,null,null),
  (v_jasbir,'2026-06-13',ARRAY['Run']::text[],32,0,5,null,null)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- workout=5 On Track, run=3 Push Harder, streak=3

  -- SOURABH — 13 days (all), workout 12 (On Track 16), nutrition 8 (Keep Going 20), streak 13
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_sourabh,'2026-06-01',ARRAY['Push']::text[],65,0,null,true,null),
  (v_sourabh,'2026-06-02',ARRAY['Pull']::text[],60,0,null,false,null),
  (v_sourabh,'2026-06-03',ARRAY['Legs']::text[],65,0,null,true,null),
  (v_sourabh,'2026-06-04',ARRAY['Push']::text[],60,0,null,true,null),
  (v_sourabh,'2026-06-05',ARRAY['Rest']::text[],0,0,null,false,null),
  (v_sourabh,'2026-06-06',ARRAY['Pull']::text[],60,0,null,true,null),
  (v_sourabh,'2026-06-07',ARRAY['Legs']::text[],65,0,null,false,null),
  (v_sourabh,'2026-06-08',ARRAY['Push']::text[],60,0,null,true,null),
  (v_sourabh,'2026-06-09',ARRAY['Pull']::text[],65,0,null,false,null),
  (v_sourabh,'2026-06-10',ARRAY['Legs']::text[],60,0,null,true,null),
  (v_sourabh,'2026-06-11',ARRAY['Push']::text[],65,0,null,true,null),
  (v_sourabh,'2026-06-12',ARRAY['Pull']::text[],60,0,null,false,null),
  (v_sourabh,'2026-06-13',ARRAY['Legs']::text[],65,0,null,true,null)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- workout=12 On Track, nutrition=8 Keep Going, streak=13

  -- JITENDRA — 10 days, workout 10 (On Track 20), nutrition 5 (Push Harder 20), streak 10
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_jitendra,'2026-06-04',ARRAY['Push']::text[],65,0,null,false,null),
  (v_jitendra,'2026-06-05',ARRAY['Pull']::text[],60,0,null,true,null),
  (v_jitendra,'2026-06-06',ARRAY['Legs']::text[],65,0,null,false,null),
  (v_jitendra,'2026-06-07',ARRAY['Push']::text[],65,0,null,false,null),
  (v_jitendra,'2026-06-08',ARRAY['Pull']::text[],60,0,null,true,null),
  (v_jitendra,'2026-06-09',ARRAY['Legs']::text[],65,0,null,false,null),
  (v_jitendra,'2026-06-10',ARRAY['Push']::text[],65,0,null,true,null),
  (v_jitendra,'2026-06-11',ARRAY['Pull']::text[],60,0,null,false,null),
  (v_jitendra,'2026-06-12',ARRAY['Legs']::text[],65,0,null,true,null),
  (v_jitendra,'2026-06-13',ARRAY['Push']::text[],65,0,null,true,null)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- workout=10 On Track, nutrition=5 Push Harder, streak=10

  -- HIMANSHU — 10 days, run 7 (On Track 15), mindfulness 5 (Push Harder 20), streak 7
  INSERT INTO log_entries(user_id,entry_date,session_types,session_duration_minutes,breathwork_minutes,km,nutrition,sleep_goal) VALUES
  (v_himanshu,'2026-06-01',ARRAY['Run']::text[],32,0,6,null,null),
  (v_himanshu,'2026-06-03',ARRAY['Run']::text[],30,0,5,null,null),
  (v_himanshu,'2026-06-05',ARRAY['Run']::text[],35,10,6,null,null),
  (v_himanshu,'2026-06-07',ARRAY['Mobility']::text[],40,15,null,null,null),
  (v_himanshu,'2026-06-08',ARRAY['Run']::text[],32,0,5,null,null),
  (v_himanshu,'2026-06-09',ARRAY['Mobility']::text[],40,20,null,null,null),
  (v_himanshu,'2026-06-10',ARRAY['Run']::text[],35,0,6,null,null),
  (v_himanshu,'2026-06-11',ARRAY['Mobility']::text[],40,15,null,null,null),
  (v_himanshu,'2026-06-12',ARRAY['Run']::text[],30,0,5,null,null),
  (v_himanshu,'2026-06-13',ARRAY['Run']::text[],35,10,6,null,null)
  ON CONFLICT (user_id,entry_date) DO NOTHING;
  -- run=7 On Track, mindfulness=5 Push Harder, streak=7

END $$;
