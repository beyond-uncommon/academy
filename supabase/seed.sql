-- =============================================================
-- Academy Platform – Seed Data
-- Run AFTER schema.sql
-- Seeds: Skill Tree Nodes + Badge definitions
-- =============================================================

-- ─── Skill Tree Nodes ─────────────────────────────────────────
insert into public.skill_tree_nodes (id, label, prerequisite_node_id, position_x, position_y) values
  ('foundations',          'Foundations',          null,                   0, 0),
  ('research_ready',       'Research Ready',       'foundations',          1, 0),
  ('prototype_builder',    'Prototype Builder',    'research_ready',       1, 1),
  ('ui_craftsman',         'UI Craftsman',         'prototype_builder',    1, 2),
  ('research_specialist',  'Research Specialist',  'research_ready',       2, 0),
  ('systems_thinker',      'Systems Thinker',      'ui_craftsman',         2, 1),
  ('strategist',           'Strategist',           'systems_thinker',      2, 2),
  ('portfolio_ready',      'Portfolio Ready',      'strategist',           3, 1);

-- ─── Badges ───────────────────────────────────────────────────
insert into public.badges (id, name, description, rarity, xp_bonus) values
  ('first_step',       '🌱 First Step',          'Complete your first lesson.',                  'common',    25),
  ('bookworm',         '📖 Bookworm',             'Complete 10 lessons.',                         'common',    50),
  ('builder',          '📦 Builder',              'Submit your first project.',                   'common',    50),
  ('quiz_ace',         '🧠 Quiz Ace',             'Score 100% on any quiz.',                      'uncommon',  50),
  ('on_fire',          '🔥 On Fire',              'Maintain a 3-day streak.',                     'uncommon',  25),
  ('researcher',       '🔬 Researcher',           'Complete the UX Research module.',             'uncommon', 100),
  ('prototype_badge',  '🎨 Prototype Builder',    'Complete the Wireframing module.',             'rare',     100),
  ('ui_badge',         '🖥️ UI Craftsman',          'Complete the UI Design module.',               'rare',     100),
  ('week_warrior',     '⚔️ Week Warrior',          'Maintain a 7-day streak.',                     'rare',      75),
  ('perfectionist',    '🎯 Perfectionist',        'Score 100% on 3 different quizzes.',           'epic',     100),
  ('explorer_badge',   '🚀 Explorer',             'Complete the full Crash Course.',              'epic',     250),
  ('fortnight_focus',  '💪 Fortnight Focus',      'Maintain a 14-day streak.',                    'epic',     150),
  ('specialist_badge', '🏆 Specialist',           'Complete all of Specialist Phase 1.',          'legendary', 500),
  ('monthly_legend',   '🌙 Monthly Legend',       'Maintain a 30-day streak.',                    'legendary', 300),
  ('portfolio_ready',  '🌟 Portfolio Ready',      'Submit all 5 course projects.',                'legendary', 300);
