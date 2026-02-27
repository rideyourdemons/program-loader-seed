/* work/platform-v1/public/app/index.js */
(() => {
  'use strict';

  // =========
  // Utilities
  // =========
  const APP_ID = 'ryd-platform-v1';
  const LS_KEY = `${APP_ID}:state`;
  const MAX_TITLE = 70;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const nowISO = () => new Date().toISOString();

  const safeJsonParse = (s, fallback) => {
    try {
      const v = JSON.parse(s);
      return v && typeof v === 'object' ? v : fallback;
    } catch {
      return fallback;
    }
  };

  const safeStorageGet = () => {
    try {
      return safeJsonParse(localStorage.getItem(LS_KEY) || '', null) || null;
    } catch {
      return null;
    }
  };

  const safeStorageSet = (obj) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(obj));
      return true;
    } catch {
      return false;
    }
  };

  const uid = () => {
    if (typeof crypto !== 'undefined' && crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  };

  const el = (tag, attrs, ...children) => {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === null || v === undefined) continue;
        if (k === 'class') node.className = String(v);
        else if (k === 'text') node.textContent = String(v);
        else if (k === 'html') node.innerHTML = String(v);
        else if (k === 'dataset' && v && typeof v === 'object') {
          for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = String(dv);
        } else if (k.startsWith('aria-')) node.setAttribute(k, String(v));
        else if (k === 'role') node.setAttribute('role', String(v));
        else if (k === 'tabindex') node.tabIndex = Number(v);
        else if (k in node) {
          try {
            node[k] = v;
          } catch {
            node.setAttribute(k, String(v));
          }
        } else node.setAttribute(k, String(v));
      }
    }
    for (const c of children) {
      if (c === null || c === undefined) continue;
      if (Array.isArray(c)) {
        for (const cc of c) node.appendChild(cc instanceof Node ? cc : document.createTextNode(String(cc)));
      } else node.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return node;
  };

  const escapeText = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  const focusMain = () => {
    const main = document.getElementById('app-main');
    if (!main) return;
    const focusTarget =
      main.querySelector('[data-autofocus="true"]') ||
      main.querySelector('h1, h2, a, button, [tabindex="0"], input, select, textarea');
    if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus({ preventScroll: false });
    else main.focus({ preventScroll: false });
  };

  // ==========
  // GA4 Safe
  // ==========
  const ga = (() => {
    const noop = () => {};
    const isFn = (f) => typeof f === 'function';
    const gtag = (typeof window !== 'undefined' && window) ? window.gtag : undefined;

    const event = (name, params) => {
      if (isFn(gtag)) {
        try {
          gtag('event', name, params || {});
        } catch {
          // no-op
        }
      }
    };

    const pageview = (path, title) => {
      if (isFn(gtag)) {
        try {
          gtag('event', 'page_view', { page_path: path, page_title: title });
        } catch {
          // no-op
        }
      }
    };

    return { event: event || noop, pageview: pageview || noop };
  })();

  // ======================
  // Domain Model (Static)
  // ======================
  const DATA = (() => {
    const gate = (id, name, intro, disclaimer, numerology) => ({
      id,
      name,
      intro,
      disclaimer,
      numerology,
      painPoints: []
    });

    const painPoint = (id, name, brief, whyItMatters, tools) => ({
      id,
      name,
      brief,
      whyItMatters,
      tools
    });

    const tool = (id, name, quickWhy, howWhyWorks, variants, cautions) => ({
      id,
      name,
      quickWhy,
      howWhyWorks,
      variants,
      cautions
    });

    const variant = (minutes, steps, howWhy, reflection) => ({
      minutes,
      steps,
      howWhy,
      reflection
    });

    const commonSafety = [
      'If you feel unsafe or at risk right now, pause this and reach out to a trusted person immediately.',
      'Canada/US: dial or text 988 for immediate support (24/7). If you are in immediate danger, call local emergency services.'
    ];

    const loneliness = gate(
      'loneliness',
      'Loneliness',
      'Loneliness hits hardest when your brain starts treating “no signal” like “no value.” This gate gives you simple, practical moves that create connection momentum without forcing fake confidence.',
      commonSafety,
      {
        title: 'Numerology Layer (reflective + ethical)',
        body: [
          'Loneliness often shows up as a “missing count” feeling: not enough messages, not enough plans, not enough proof you matter.',
          'This layer uses numbers as a *reflection tool*, not a prediction. If a number helps you notice patterns and choose kinder actions, keep it. If it adds pressure or superstition, skip it.',
          'Theme numbers here: **1 (initiate)**, **2 (reconnect)**, **3 (signal)** — small counts that create real motion.'
        ]
      }
    );

    loneliness.painPoints.push(
      painPoint(
        'no-one-texts',
        'No one texts me first',
        'It feels like you’re always the one reaching out.',
        'When you stop initiating, it can look like people “don’t care,” even if they do. The goal is to create a clean, low-pressure signal so you get real data and reduce mind-reading.',
        [
          tool(
            'three-signal-ping',
            'Three-Signal Ping',
            'You send three small, specific pings (not one long message) to reduce rejection fear and increase reply odds.',
            'Short, specific asks reduce ambiguity, which lowers the other person’s “what do I say?” friction. Three pings spaced out prevents all-or-nothing interpretation from one silence.',
            [
              variant(
                5,
                [
                  'Pick 1 person who is “safe enough” (not perfect).',
                  'Send a **one-line** message: “Yo — quick question: got 2 min today?”',
                  'If no reply in 2 hours, send: “All good if busy — what’s your week look like?”',
                  'If still no reply by end of day, send: “No stress — just wanted to say hi. Hope you’re alright.”',
                  'Stop there. You’ve done clean outreach.'
                ],
                'Three short touches reduce pressure, protect your self-respect, and give the other person an easy entry point.',
                {
                  numerology: {
                    number: 3,
                    meaning: '3 = signal + response loops',
                    prompt: 'Where do you treat one silence as a “final verdict”? What changes when you collect three signals instead?'
                  }
                }
              ),
              variant(
                15,
                [
                  'Choose 2 people (A and B) you’d like more connection with.',
                  'For each, write a 10-word “easy yes” invitation: (coffee / quick walk / meme trade / game).',
                  'Send the “2 min today?” ping to A. Send the “easy yes” invite to B.',
                  'If someone replies vaguely, respond with **two options**: “Want Tue 6 or Thu 7?”',
                  'If no reply, do the second and third pings (like the 5-min plan).',
                  'Log outcomes: Reply / No reply / Warm / Cold — no stories, just data.'
                ],
                'Specific options reduce decision load and turn vague connection wishes into scheduled reality. Logging outcomes prevents your brain from rewriting history in a darker direction.',
                {
                  numerology: {
                    number: 2,
                    meaning: '2 = pairing + simple choice',
                    prompt: 'What’s one relationship where offering two options would make it easier for both of you?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Pick 3 people: one close, one medium, one “used to be close.”',
                  'Draft three messages that fit the relationship level (keep each under 2 sentences).',
                  'Send the first round now. Then set a timer for 20 minutes.',
                  'During the 20 minutes, prep a “micro plan” for each: two time options + a low-stakes activity.',
                  'Send follow-ups only if needed, and only as short pings.',
                  'After replies land, schedule **one** real connection for the next 7 days.',
                  'Finish by writing: “What did I do that was brave + clean?”'
                ],
                'You’re building a connection pipeline: outreach → low-friction invite → scheduling. The last step (naming your clean effort) is how you prevent shame from hijacking the outcome.',
                {
                  numerology: {
                    number: 7,
                    meaning: '7 = weekly rhythm',
                    prompt: 'If connection was a weekly rhythm, what would “one honest rep per week” look like for you?'
                  }
                }
              )
            ],
            ['Avoid sending long paragraphs when you feel rejected. Keep messages short and calm.']
          ),
          tool(
            'social-proof-audit',
            'Social Proof Audit',
            'You separate “I feel alone” from “I am alone” by auditing what’s actually true in your life.',
            'Loneliness amplifies negative filtering. A quick audit restores accuracy: who has shown care, what patterns exist, and what you can influence this week.',
            [
              variant(
                5,
                [
                  'Open notes. Write 3 names of people who have shown any care in the last 60 days.',
                  'Next to each, write one proof (a ride, a call, a laugh, a check-in).',
                  'Circle the easiest person to contact today.',
                  'Send a one-line “hi” plus a tiny context: “Been in my head lately — wanted to say what’s up.”'
                ],
                'Naming proofs interrupts the brain’s “nobody cares” shortcut and makes outreach feel less like begging and more like reconnecting.',
                {
                  numerology: {
                    number: 60,
                    meaning: '60 = a realistic window',
                    prompt: 'What changes when you use a 60-day window instead of judging your whole life from today’s feeling?'
                  }
                }
              ),
              variant(
                15,
                [
                  'List 5 “proof moments” of care in the last year (big or small).',
                  'Mark which ones were initiated by you vs them.',
                  'Write a fair statement: “Some connections need me to initiate; that doesn’t mean I’m unwanted.”',
                  'Pick 1 proof-person and propose a low-pressure meet: “Quick walk this week?”',
                  'End with one “self-care action” you can do today that doesn’t involve a screen.'
                ],
                'This reduces mind-reading and converts it into fair, actionable statements. The self-care action keeps you from using attention as your only fuel.',
                {
                  numerology: {
                    number: 5,
                    meaning: '5 = evidence set',
                    prompt: 'If you had to prove care in five examples, what would count as real proof for you?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Create two columns: “Connection Sources” and “Connection Drains.”',
                  'List 6 sources (people, places, routines) and 6 drains (apps, late nights, doomscroll, self-talk loops).',
                  'Pick 2 drains to reduce for 7 days (set one simple boundary each).',
                  'Pick 2 sources to increase for 7 days (one scheduled, one spontaneous).',
                  'Write a one-sentence plan for each day this week: “I will do one source.”',
                  'Set a reminder for the first scheduled source right now.'
                ],
                'Loneliness is often a systems problem. Reducing drains and increasing sources changes your inputs, which changes your mood baseline without needing willpower heroics.',
                {
                  numerology: {
                    number: 6,
                    meaning: '6 = balance + support',
                    prompt: 'Where do you need more support inputs than you currently allow yourself to have?'
                  }
                }
              )
            ],
            ['If this turns into self-criticism, shorten it: just write 3 names + 3 proofs.']
          ),
          tool(
            'body-to-signal',
            'Body-to-Signal Reset',
            'You use your body to drop the intensity so connection feels possible again.',
            'When loneliness spikes, your nervous system can go into threat mode. Small physical resets reduce threat signals so you can think and reach out more cleanly.',
            [
              variant(
                5,
                [
                  'Stand up. Roll shoulders back 10 times slowly.',
                  'Do 6 slow breaths: in 4 seconds, out 6 seconds.',
                  'Drink water (at least a few sips).',
                  'Open a window or step outside for 60 seconds.',
                  'Send one short message to someone (even “thinking of you”).'
                ],
                'Breathing + posture shifts can reduce threat arousal. One message right after creates a new association: “I can move while I feel this.”',
                {
                  numerology: {
                    number: 6,
                    meaning: '6 = regulation set',
                    prompt: 'Which part of the 6-step reset changes your state fastest?'
                  }
                }
              ),
              variant(
                15,
                [
                  'Do a 5-minute walk (inside or outside).',
                  'During the walk, name 5 things you see, 4 you hear, 3 you feel physically, 2 you smell, 1 you taste.',
                  'Back home, set a timer for 3 minutes: tidy one small zone (desk corner, sink, floor patch).',
                  'Send one short invite: “Want to catch up this week?”'
                ],
                'Grounding + movement shifts attention out of the internal spiral and reduces urgency. A tiny environment win restores agency, making outreach feel less desperate.',
                {
                  numerology: {
                    number: 5,
                    meaning: '5 = senses re-ground',
                    prompt: 'When you use your senses, does the story in your head get quieter or louder?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Choose: 20-minute walk OR 15-minute strength circuit (pushups to a wall, squats, light carry).',
                  'After movement, take a shower or wash face/hands slowly for 2 minutes.',
                  'Eat something with protein (even small).',
                  'Write a 3-line message to yourself: “I’m feeling ___. It makes sense because ___. Next right move is ___.”',
                  'Then send one clean outreach message.'
                ],
                'Movement + basic care reduces the physiological “danger” signal. The 3-line script prevents emotional reasoning from steering your choices.',
                {
                  numerology: {
                    number: 3,
                    meaning: '3 = clarity lines',
                    prompt: 'What happens when you limit your self-talk to three honest lines?'
                  }
                }
              )
            ],
            ['If movement isn’t possible, do the breathing + window + water steps only.']
          )
        ]
      ),
      painPoint(
        'crowds-alone',
        'I can be around people and still feel alone',
        'Being in a room doesn’t guarantee connection.',
        'This pain point is about “contact vs connection.” The goal is to build small moments of real exchange so your brain stops treating social spaces like proof you don’t belong.',
        [
          tool(
            'two-minute-bridge',
            'Two-Minute Bridge',
            'You create a tiny bridge conversation that doesn’t require charm.',
            'Short, low-stakes exchanges lower the cost of social risk. You’re training “micro belonging” instead of waiting for a perfect vibe.',
            [
              variant(
                5,
                [
                  'Pick one person you can approach safely (cashier, coworker, acquaintance).',
                  'Ask one simple question: “How’s your day going?” or “Busy today?”',
                  'Reflect back one word: “Yeah, that sounds hectic.”',
                  'End clean: “Hope it eases up — take care.”'
                ],
                'A question + reflection is enough to create a real exchange. Ending clean prevents overreaching when you feel anxious.',
                {
                  numerology: {
                    number: 2,
                    meaning: '2 = bridge pair',
                    prompt: 'What’s one “two-part” exchange you can do today: ask + reflect?'
                  }
                }
              ),
              variant(
                15,
                [
                  'Do 3 micro-bridges with 3 different people (same pattern: question + reflection + clean close).',
                  'After each one, rate your anxiety 1–10. Watch it shift.',
                  'Pick the easiest person and add a second question: “How long you been into that?”',
                  'Stop after 15 minutes — leave on a win.'
                ],
                'Repeated reps teach your nervous system that small social risk is survivable. Leaving on a win is how you build consistency.',
                {
                  numerology: {
                    number: 3,
                    meaning: '3 = reps',
                    prompt: 'If you did three reps per week, how would your social confidence look in a month?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Choose one recurring place (gym, café, work break spot).',
                  'Make a 7-day plan: one micro-bridge per day in that same place.',
                  'Today, do 2 micro-bridges, then write down the exact line that worked best.',
                  'End by texting one person you know: “Quick check-in — what’s new with you?”'
                ],
                'Consistency turns strangers into familiar faces, and familiarity reduces loneliness even before friendships form.',
                {
                  numerology: {
                    number: 7,
                    meaning: '7 = repetition week',
                    prompt: 'What’s one place you can “show up” to seven times so you stop feeling invisible there?'
                  }
                }
              )
            ],
            ['Keep it short. Over-sharing when lonely can feel worse after.']
          ),
          tool(
            'connection-anchor',
            'Connection Anchor',
            'You pick one small role in a social space so you’re not “floating.”',
            'Roles reduce uncertainty. When you have a role, you’re participating, not auditioning.',
            [
              variant(
                5,
                [
                  'Name the space you’re in (school, work, event, online).',
                  'Pick one role you can do in 2 minutes: greet, ask one question, offer help, share one useful thing.',
                  'Do the role once, then stop.'
                ],
                'Roles create structure. Structure reduces the “I don’t belong” spiral.',
                {
                  numerology: {
                    number: 1,
                    meaning: '1 = one role',
                    prompt: 'What’s the single smallest role you could do today that proves you’re part of the room?'
                  }
                }
              ),
              variant(
                15,
                [
                  'Pick a role for the next 15 minutes: “ask one person about themselves.”',
                  'Use a simple prompt: “How’d you get into that?”',
                  'Listen for one detail. Repeat it back once.',
                  'Exit clean: “Good talking — catch you later.”'
                ],
                'Listening creates connection faster than performing. A clean exit prevents your brain from interpreting awkwardness as failure.',
                {
                  numerology: {
                    number: 15,
                    meaning: '15 = bounded effort',
                    prompt: 'How does your confidence change when effort has a clear end time?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Pick a weekly social setting and commit to one role each time.',
                  'Write 3 role options you can rotate: greeter, helper, asker.',
                  'Today, do your chosen role twice with two different people.',
                  'After, write one sentence: “Next time I will do ___ again.”'
                ],
                'Repetition with a role builds identity: “I’m someone who can connect.” Identity beats motivation.',
                {
                  numerology: {
                    number: 3,
                    meaning: '3 = role rotation',
                    prompt: 'Which three roles fit you without feeling fake?'
                  }
                }
              )
            ],
            ['If you feel overstimulated, choose “helper” roles that require fewer words.']
          ),
          tool(
            'post-event-debrief',
            'Post-Event Debrief',
            'You prevent the after-social crash from rewriting the whole night as failure.',
            'After social time, your brain can scan for mistakes. A short debrief locks in what actually happened and protects you from unnecessary shame.',
            [
              variant(
                5,
                [
                  'Write 1 win (even tiny).',
                  'Write 1 neutral fact (what happened, no story).',
                  'Write 1 next move (small).'
                ],
                'Three lines keep it real: win, fact, next. That’s enough to stop the spiral.',
                {
                  numerology: {
                    number: 3,
                    meaning: '3 = debrief lines',
                    prompt: 'What happens when you limit the review to three lines instead of replaying everything?'
                  }
                }
              ),
              variant(
                15,
                [
                  'List 3 moments you were included (a look, a laugh, a response).',
                  'List 1 moment you felt awkward and rewrite it as a neutral description.',
                  'Pick 1 follow-up action: send a “good seeing you” message to one person.'
                ],
                'You’re training accurate memory. Follow-up turns a moment into continuity.',
                {
                  numerology: {
                    number: 4,
                    meaning: '4 = stable frame',
                    prompt: 'How do you create a stable frame (4 sides) around your memory so it doesn’t collapse into shame?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Write a “scoreboard” with three categories: effort, presence, connection.',
                  'Give yourself a 1–10 in each and one reason why.',
                  'Choose one skill for next time: ask, reflect, exit clean, role.',
                  'Schedule your next social rep (even small).'
                ],
                'Separating categories prevents all-or-nothing judgments. Scheduling keeps momentum.',
                {
                  numerology: {
                    number: 10,
                    meaning: '10 = measurable scale',
                    prompt: 'Which category matters most to you right now: effort, presence, or connection?'
                  }
                }
              )
            ],
            ['If messaging feels scary, use one line: “Good seeing you — hope your week’s solid.”']
          )
        ]
      )
    );

    const breakup = gate(
      'breakup',
      'Breakup / Missing Someone',
      'When someone is gone, your brain keeps searching for the old pattern. This gate gives you clean steps to reduce the pull without pretending you don’t care.',
      commonSafety,
      {
        title: 'Numerology Layer (reflective + ethical)',
        body: [
          'Missing someone can feel like your day is broken into “before and after.” Numbers can help you build a humane structure: tiny counts, repeated daily.',
          'This is not fate. It’s a way to measure progress when your emotions are loud.',
          'Theme numbers here: **4 (stability)**, **8 (boundaries)**, **21 (three weeks of reps)**.'
        ]
      }
    );

    breakup.painPoints.push(
      painPoint(
        'urge-to-text-ex',
        'I want to text them right now',
        'The urge spikes fast and feels urgent.',
        'Urges are waves. The goal is not to “kill the feeling,” but to ride it long enough for your logic to return — then act in a way you won’t regret.',
        [
          tool(
            'delay-and-replace',
            'Delay & Replace',
            'You delay contact long enough to regain choice, then replace it with a safe action.',
            'A delay breaks the automatic loop. Replacement gives your nervous system a different completion signal.',
            [
              variant(
                5,
                [
                  'Set a timer for 5 minutes. No texting during the timer.',
                  'Write the exact text you want to send — in notes, not messages.',
                  'Under it, write: “If I send this, what do I hope happens?”',
                  'Pick one replacement action: drink water, 10 pushups, short walk, quick shower.',
                  'When the timer ends, decide again. No rush.'
                ],
                'Writing the message externalizes it. The “hope” question reveals the emotional need behind the urge. The replacement action gives your body a new end-state.',
                {
                  numerology: {
                    number: 5,
                    meaning: '5 = urge wave window',
                    prompt: 'What does the urge do after five minutes if you don’t feed it instantly?'
                  }
                }
              ),
              variant(
                15,
                [
                  'Set a 15-minute timer.',
                  'Do a “three-line truth” in notes: (1) What I feel. (2) What I miss. (3) What I know is real about the relationship.',
                  'Delete any drafted message from the messaging app (keep it in notes only).',
                  'Text a safe person instead: “Having an urge to reach out — can you distract me for a bit?”',
                  'Do one replacement action (movement or cleanup).'
                ],
                'Truth lines reduce fantasy escalation. Moving the impulse to a safe person creates social support without reopening the wound.',
                {
                  numerology: {
                    number: 3,
                    meaning: '3 = truth lines',
                    prompt: 'Which truth line is hardest: what you feel, what you miss, or what you know is real?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Do a 10-minute walk with your phone on Do Not Disturb.',
                  'Come back and write a “regret forecast”: If I text them, how will I feel in 1 hour? 1 day? 1 week?',
                  'Write a “need translation”: “I’m not missing the text — I’m missing ___.”',
                  'Choose a replacement that actually matches the need (connection, comfort, closure).',
                  'Commit to 24 hours no contact, then reassess.'
                ],
                'Regret forecasting restores long-term thinking. Translating the need reduces the compulsion to chase the person as the only solution.',
                {
                  numerology: {
                    number: 24,
                    meaning: '24 = one full cycle',
                    prompt: 'What changes when you give yourself one full day to let the wave pass?'
                  }
                }
              )
            ],
            ['If contact is necessary (shared responsibilities), keep messages factual and short, and avoid emotional processing by text.']
          ),
          tool(
            'memory-reframe',
            'Memory Reframe',
            'You keep the good memories without using them as a reason to reopen contact.',
            'The brain highlights highs and edits out costs. Balanced memory reduces craving and restores self-respect.',
            [
              variant(
                5,
                [
                  'Write 2 good moments you miss (short).',
                  'Write 2 hard moments you’re relieved to not be in (short).',
                  'Write 1 sentence: “Both can be true.”'
                ],
                'Balanced recall interrupts idealization. “Both can be true” prevents the mind from turning love into a trap.',
                {
                  numerology: {
                    number: 2,
                    meaning: '2 = two-sided memory',
                    prompt: 'Which side do you avoid: the good or the hard?'
                  }
                }
              ),
              variant(
                15,
                [
                  'Make two columns: “What I Miss” and “What It Cost Me.”',
                  'List 5 items in each.',
                  'Circle one cost you don’t want again.',
                  'Write a boundary sentence: “I don’t go back to ___.”'
                ],
                'Cost listing is not bitterness — it’s accuracy. One boundary sentence becomes a lever when the urge spikes.',
                {
                  numerology: {
                    number: 5,
                    meaning: '5 = balanced list',
                    prompt: 'What’s the one cost that matters most to protect yourself from?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Write a “relationship summary” in 8 lines max: 4 good truths + 4 hard truths.',
                  'Read it out loud once.',
                  'Save it as a note called “Accuracy.”',
                  'When you want to text, read “Accuracy” first.'
                ],
                'Speaking it out loud makes it more real and less negotiable. The note becomes a friction tool that protects you from impulse.',
                {
                  numerology: {
                    number: 8,
                    meaning: '8 = boundary strength',
                    prompt: 'What would “8-line accuracy” stop you from doing when you’re triggered?'
                  }
                }
              )
            ],
            ['If writing makes you spiral, shrink it to “2 good + 2 hard + both true.”']
          ),
          tool(
            'reclaim-routine',
            'Reclaim Routine',
            'You rebuild daily structure so your mind has fewer empty spaces to obsess in.',
            'Routine is grief-proofing. It reduces unstructured time, which is when missing someone can hit hardest.',
            [
              variant(
                5,
                [
                  'Pick one small routine you can do today: make bed, shower, 10-minute tidy, short walk.',
                  'Do it now.',
                  'After, write: “I moved my life forward 1% today.”'
                ],
                'Action creates proof. Proof reduces helplessness.',
                {
                  numerology: {
                    number: 1,
                    meaning: '1 = one rep',
                    prompt: 'What’s the one rep you can do today that proves you’re still steering your life?'
                  }
                }
              ),
              variant(
                15,
                [
                  'Pick a “4-block day”: (1) body, (2) food/water, (3) task, (4) connection.',
                  'Do one tiny item in each block today.',
                  'Write the blocks down and check them off.'
                ],
                'Four blocks create stability without perfection. Checking off reinforces identity: “I take care of me.”',
                {
                  numerology: {
                    number: 4,
                    meaning: '4 = stability blocks',
                    prompt: 'Which block is weakest right now: body, food/water, task, or connection?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Build a 7-day mini plan using the 4 blocks.',
                  'Schedule one connection rep (friend, family, group, activity).',
                  'Add one “no-contact guardrail” for the week (mute, delete thread, DND windows).',
                  'End by doing 10 minutes of physical movement.'
                ],
                'Plans reduce decision fatigue. Guardrails reduce relapse into contact. Movement lowers emotional intensity.',
                {
                  numerology: {
                    number: 21,
                    meaning: '21 = three weeks of reps',
                    prompt: 'If you did four blocks per day for 21 days, what would be different about you?'
                  }
                }
              )
            ],
            ['If you share a space or responsibilities, keep routines focused on what you control.']
          )
        ]
      ),
      painPoint(
        'scrolling-old-photos',
        'I keep looking at old photos / chats',
        'You get pulled into the loop even when you know it hurts.',
        'This is a cue-driven habit loop. The goal is to reduce cue exposure and replace it with something that gives your brain a new closure signal.',
        [
          tool(
            'cue-block',
            'Cue Block',
            'You remove the easiest triggers so the loop stops starting automatically.',
            'If the cue is always available, willpower gets taxed. Blocking cues is not weakness — it’s smart design.',
            [
              variant(
                5,
                [
                  'Mute or archive the chat thread.',
                  'Move photos into a hidden folder (or off your home screen).',
                  'Set Do Not Disturb for 1 hour.',
                  'Do a 2-minute room reset (trash, dishes, floor patch).'
                ],
                'Removing cues reduces automatic urges. A tiny reset gives a clean “new scene” signal.',
                {
                  numerology: {
                    number: 1,
                    meaning: '1 = one hour boundary',
                    prompt: 'What happens when you protect one hour from cues?'
                  }
                }
              ),
              variant(
                15,
                [
                  'Turn off “memories” style notifications if you have them.',
                  'Create a folder named “Later” and move the photos there.',
                  'Write one sentence: “I can remember without reopening.”',
                  'Do a replacement activity that uses your hands (dishes, fold laundry, fix something).'
                ],
                'Hands-on tasks reduce rumination and give a completion signal your brain respects.',
                {
                  numerology: {
                    number: 8,
                    meaning: '8 = boundary loop',
                    prompt: 'What boundary protects you most: moving the cue, muting it, or reducing notifications?'
                  }
                }
              ),
              variant(
                30,
                [
                  'List your top 3 cues (time of day, place, app, emotion).',
                  'For each cue, write one rule: “When X happens, I do Y instead.”',
                  'Make Y physical and short: walk, shower, tidy, stretch, water.',
                  'Set a 7-day streak tracker for cue replacements.'
                ],
                'Implementation rules reduce decision load. A short streak tracker builds momentum without pressure.',
                {
                  numerology: {
                    number: 3,
                    meaning: '3 = cue set',
                    prompt: 'Which three cues pull you in hardest — and what’s your one replacement for each?'
                  }
                }
              )
            ],
            ['Avoid “just one more look” — it restarts the loop.']
          ),
          tool(
            'closure-letter',
            'Closure Letter (Not Sent)',
            'You get emotional closure without reopening contact.',
            'Your brain wants completion. A letter gives completion without risking a new wound.',
            [
              variant(
                5,
                [
                  'Write 5 lines: (1) what I miss, (2) what hurt, (3) what I learned, (4) what I want next, (5) goodbye.',
                  'Save it. Do not send it.'
                ],
                'Short structured writing creates an ending your brain can accept.',
                {
                  numerology: {
                    number: 5,
                    meaning: '5 = closure lines',
                    prompt: 'Which of the five lines gives you the most relief?'
                  }
                }
              ),
              variant(
                15,
                [
                  'Write the 5-line letter.',
                  'Then write a 3-line future vow: “I choose ___ / I protect ___ / I build ___.”',
                  'Read both out loud once.'
                ],
                'Vows redirect energy from loss into direction. Reading out loud locks it into the body.',
                {
                  numerology: {
                    number: 3,
                    meaning: '3 = future vow',
                    prompt: 'What are your three future vows after this relationship?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Write the letter and the vows.',
                  'Then do a “symbolic close”: delete one shortcut, remove one item from sight, or change one routine.',
                  'Finish with a 10-minute walk.'
                ],
                'Symbolic closes tell your brain “the chapter changed,” which reduces compulsive checking.',
                {
                  numerology: {
                    number: 10,
                    meaning: '10 = closure walk',
                    prompt: 'What symbolic close would feel real without being dramatic?'
                  }
                }
              )
            ],
            ['If writing makes you spiral, do only the 5 lines and stop.']
          ),
          tool(
            'replacement-reward',
            'Replacement Reward',
            'You swap the photo-scroll dopamine with a healthier reward that still feels like relief.',
            'Your brain seeks a reward. If you don’t replace it, you’ll return to the old loop.',
            [
              variant(
                5,
                [
                  'Choose one quick reward: warm drink, favorite song, short funny clip, 5-minute game.',
                  'Do it once, then stop.',
                  'Write: “I can soothe without reopening.”'
                ],
                'You’re building a new soothing pathway that doesn’t depend on the person.',
                {
                  numerology: {
                    number: 1,
                    meaning: '1 = one reward',
                    prompt: 'What’s one reward that soothes you without dragging you backward?'
                  }
                }
              ),
              variant(
                15,
                [
                  'Make a “Relief Menu” of 10 items (music, movement, shower, snack, call, hobby).',
                  'Pick 2 and do them back to back.',
                  'Mark which one worked best.'
                ],
                'A menu reduces the “nothing works” feeling and gives you options when you’re triggered.',
                {
                  numerology: {
                    number: 10,
                    meaning: '10 = menu size',
                    prompt: 'If you had 10 relief options, would you still reach for the same one every time?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Choose a longer reward that creates progress: cook, gym, clean, build, learn.',
                  'Set a 25-minute timer. Work until the timer ends.',
                  'After, give yourself a small treat reward.'
                ],
                'Progress rewards create longer-lasting relief than nostalgia loops.',
                {
                  numerology: {
                    number: 25,
                    meaning: '25 = focused sprint',
                    prompt: 'What can you build in 25 minutes that makes tomorrow easier?'
                  }
                }
              )
            ],
            ['Avoid rewards that keep you stuck in the same app where the cues live.']
          )
        ]
      )
    );

    const urge = gate(
      'urge',
      'Urge / Impulse',
      'Impulses aren’t “bad character.” They’re fast survival programs. This gate gives you clean, practical ways to slow the spike and choose what you actually want.',
      commonSafety,
      {
        title: 'Numerology Layer (reflective + ethical)',
        body: [
          'Impulses often feel like “now or never.” Numbers help you create a tiny time structure so “now” isn’t the boss.',
          'This is about timing and reps, not magic.',
          'Theme numbers here: **10 (seconds)**, **90 (seconds)**, **4 (stability)**.'
        ]
      }
    );

    urge.painPoints.push(
      painPoint(
        'doomscroll',
        'I can’t stop scrolling',
        'You reach for the feed even when it makes you feel worse.',
        'Scrolling is a quick relief loop: cue → scroll → numb → regret. The goal is to put a speed bump in the loop and replace it with a better relief action.',
        [
          tool(
            'ten-second-brake',
            '10-Second Brake',
            'You install a tiny pause that breaks autopilot.',
            'A short pause is enough to move from reflex to choice.',
            [
              variant(
                5,
                [
                  'When you notice scrolling, stop and count 10 slow seconds.',
                  'Lock the phone or switch tabs.',
                  'Do one physical move: stand up, stretch, or drink water.',
                  'Ask: “What am I actually needing?” (rest, distraction, connection, stimulation).',
                  'Choose one need-matching action for 2 minutes.'
                ],
                'The 10-second pause interrupts habit momentum. A need-based replacement prevents bounce-back into the same loop.',
                {
                  numerology: {
                    number: 10,
                    meaning: '10 = brake',
                    prompt: 'Where could 10 seconds change the outcome today?'
                  }
                }
              ),
              variant(
                15,
                [
                  'Put your phone on a surface (not in your hand) for 15 minutes.',
                  'Set a timer. During the timer, do a “hands task” (dishes, tidy, make snack).',
                  'After 15 minutes, decide: scroll with a limit (5 minutes) or stop.',
                  'If you scroll, set a 5-minute timer first.'
                ],
                'Removing the phone from your hand reduces automatic re-engagement. Timers convert vague control into real control.',
                {
                  numerology: {
                    number: 15,
                    meaning: '15 = reset window',
                    prompt: 'What changes when your break has a clear boundary?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Identify your top 2 scrolling triggers (bored, stressed, lonely, tired).',
                  'Pick one replacement per trigger (movement, snack, text a friend, quick chore).',
                  'Set a 7-day rule: “When trigger hits, I do replacement first.”',
                  'Create one “scroll window” per day with a timer (10 minutes).'
                ],
                'Trigger mapping reduces shame and increases accuracy. A scroll window prevents deprivation backlash while keeping control.',
                {
                  numerology: {
                    number: 7,
                    meaning: '7 = week test',
                    prompt: 'If you ran a 7-day experiment, what would you measure: time, mood, sleep, or focus?'
                  }
                }
              )
            ],
            ['If scrolling is tied to anxiety, prioritize body resets (breath + movement) before trying to “think” your way out.']
          ),
          tool(
            'urge-surf-90',
            'Urge Surf 90',
            'You ride the peak of the urge for 90 seconds without acting.',
            'Many urges peak and fall quickly if you don’t feed them. 90 seconds is a realistic minimum surf.',
            [
              variant(
                5,
                [
                  'Set a 90-second timer.',
                  'Name the urge out loud: “This is an urge.”',
                  'Locate it in your body (chest, jaw, hands).',
                  'Breathe out longer than in until the timer ends.',
                  'When done, choose one tiny action that aligns with your goal.'
                ],
                'Labeling separates you from the urge. Body-location reduces mental spiral. Long exhales reduce arousal.',
                {
                  numerology: {
                    number: 90,
                    meaning: '90 = peak ride',
                    prompt: 'What does the urge do after 90 seconds if you don’t act?'
                  }
                }
              ),
              variant(
                15,
                [
                  'Do three rounds of 90 seconds (total 4.5 minutes) with 60 seconds rest between.',
                  'During rests, sip water or stretch.',
                  'After round three, write one sentence: “The urge rose, peaked, and changed.”'
                ],
                'Multiple rounds train your nervous system to tolerate discomfort without action. The sentence locks in the lesson.',
                {
                  numerology: {
                    number: 3,
                    meaning: '3 = rounds',
                    prompt: 'How many rounds does it take before the urge stops feeling like an emergency?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Choose one “urge category” you want to reduce this week (scrolling, spending, angry text).',
                  'Commit to Urge Surf 90 every time it hits.',
                  'Track 5 events: time, trigger, intensity 1–10, what you did, outcome.',
                  'At the end, pick one trigger to design around.'
                ],
                'Tracking turns chaos into patterns. Designing around triggers reduces reliance on willpower.',
                {
                  numerology: {
                    number: 5,
                    meaning: '5 = tracking events',
                    prompt: 'If you captured five urge events, what pattern would you expect to see?'
                  }
                }
              )
            ],
            ['If an urge relates to safety risk, reach out to a trusted person immediately instead of surfing alone.']
          ),
          tool(
            'four-corners-plan',
            'Four Corners Plan',
            'You stabilize your day using four essentials so impulses have fewer openings.',
            'Impulses spike when basics are missing. Four corners builds a stable base.',
            [
              variant(
                5,
                [
                  'Check four corners: water, food, movement, connection.',
                  'Fix one corner in the next 5 minutes.',
                  'Then re-check the urge intensity.'
                ],
                'Meeting a basic need can drop impulse intensity fast. You’re solving the real input.',
                {
                  numerology: {
                    number: 4,
                    meaning: '4 = stability corners',
                    prompt: 'Which corner is the first to fall when you’re stressed?'
                  }
                }
              ),
              variant(
                15,
                [
                  'Do one action in each corner: water (drink), food (snack), movement (walk), connection (text someone).',
                  'Keep each action short.',
                  'After, set a 10-minute focus timer for one task you’ve been avoiding.'
                ],
                'Balancing corners reduces internal noise. Focus timer uses the calmer state to build forward motion.',
                {
                  numerology: {
                    number: 10,
                    meaning: '10 = focus timer',
                    prompt: 'What task becomes easier after your four corners are handled?'
                  }
                }
              ),
              variant(
                30,
                [
                  'Design your “default day” with four corners built in.',
                  'Write a simple schedule: morning corner check, midday movement, afternoon food/water, evening connection.',
                  'Pick one impulse you want to reduce and attach a corner fix first.'
                ],
                'Defaults reduce decision fatigue. Attaching corner fixes creates a reliable pre-impulse intervention.',
                {
                  numerology: {
                    number: 1,
                    meaning: '1 = one default day',
                    prompt: 'If you had one default day that worked, what would it look like?'
                  }
                }
              )
            ],
            ['If your environment is chaotic, start with water + a 2-minute tidy.']
          )
        ]
      )
    );

    const gates = [loneliness, breakup, urge];

    // Build lookup maps without duplicating templates elsewhere.
    const map = {
      gatesById: new Map(),
      painPointsById: new Map(),
      toolsById: new Map()
    };

    for (const g of gates) {
      map.gatesById.set(g.id, g);
      for (const p of g.painPoints) {
        map.painPointsById.set(`${g.id}:${p.id}`, p);
        for (const t of p.tools) {
          map.toolsById.set(`${g.id}:${p.id}:${t.id}`, t);
        }
      }
    }

    return { gates, map };
  })();

  // ==========================
  // App State (localStorage)
  // ==========================
  const State = (() => {
    const base = {
      v: 1,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      completed: {
        // key: `${gateId}:${painPointId}:${toolId}:${minutes}` -> { at, note }
      }
    };

    const load = () => {
      const s = safeStorageGet();
      if (!s || s.v !== 1 || !s.completed || typeof s.completed !== 'object') return { ...base };
      return {
        v: 1,
        createdAt: typeof s.createdAt === 'string' ? s.createdAt : base.createdAt,
        updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : base.updatedAt,
        completed: s.completed
      };
    };

    let current = load();

    const save = () => {
      current.updatedAt = nowISO();
      safeStorageSet(current);
    };

    const keyFor = (gateId, painPointId, toolId, minutes) => `${gateId}:${painPointId}:${toolId}:${minutes}`;

    const isComplete = (gateId, painPointId, toolId, minutes) => {
      const k = keyFor(gateId, painPointId, toolId, minutes);
      return !!current.completed[k];
    };

    const markComplete = (gateId, painPointId, toolId, minutes) => {
      const k = keyFor(gateId, painPointId, toolId, minutes);
      if (!current.completed[k]) current.completed[k] = { at: nowISO() };
      save();
    };

    const unmarkComplete = (gateId, painPointId, toolId, minutes) => {
      const k = keyFor(gateId, painPointId, toolId, minutes);
      if (current.completed[k]) delete current.completed[k];
      save();
    };

    const statsForGate = (gateId) => {
      let done = 0;
      let total = 0;
      const gate = DATA.map.gatesById.get(gateId);
      if (!gate) return { done: 0, total: 0 };
      for (const p of gate.painPoints) {
        for (const t of p.tools) {
          for (const v of t.variants) {
            total += 1;
            if (isComplete(gateId, p.id, t.id, v.minutes)) done += 1;
          }
        }
      }
      return { done, total };
    };

    const statsAll = () => {
      let done = 0;
      let total = 0;
      for (const g of DATA.gates) {
        const s = statsForGate(g.id);
        done += s.done;
        total += s.total;
      }
      return { done, total };
    };

    return {
      load: () => current,
      save,
      keyFor,
      isComplete,
      markComplete,
      unmarkComplete,
      statsForGate,
      statsAll
    };
  })();

  // ==========
  // Routing
  // ==========
  const Router = (() => {
    const parseHash = () => {
      const raw = (location.hash || '').replace(/^#/, '');
      const parts = raw.split('/').filter(Boolean).map(decodeURIComponent);
      const [a, b, c, d] = parts;
      // Routes:
      // #/                       -> home
      // #/gate/:gateId           -> gate
      // #/gate/:gateId/:ppId     -> pain point
      // #/gate/:gateId/:ppId/:toolId -> tool
      // #/gate/:gateId/:ppId/:toolId/:minutes -> variant
      if (!a) return { name: 'home', params: {} };
      if (a !== 'gate') return { name: 'home', params: {} };
      if (!b) return { name: 'home', params: {} };
      if (!c) return { name: 'gate', params: { gateId: b } };
      if (!d) return { name: 'pain', params: { gateId: b, painPointId: c } };
      const minutes = parts[4];
      if (!minutes) return { name: 'tool', params: { gateId: b, painPointId: c, toolId: d } };
      return { name: 'variant', params: { gateId: b, painPointId: c, toolId: d, minutes: minutes } };
    };

    const to = (path) => {
      const clean = String(path || '').replace(/^#/, '');
      location.hash = clean.startsWith('/') ? `#${clean}` : `#/${clean}`;
    };

    const replace = (path) => {
      const clean = String(path || '').replace(/^#/, '');
      const target = clean.startsWith('/') ? `#${clean}` : `#/${clean}`;
      const url = `${location.pathname}${location.search}${target}`;
      try {
        history.replaceState(null, '', url);
      } catch {
        location.hash = target;
      }
    };

    return { parseHash, to, replace };
  })();

  // =====================
  // Layout + Styling (JS)
  // =====================
  const Style = (() => {
    const css = `
:root{
  --bg0:#070A10;
  --bg1:#0B1020;
  --card:#0E1730;
  --card2:#0C142B;
  --text:#EAF0FF;
  --muted:#B9C4E6;
  --muted2:#97A4CC;
  --line:rgba(255,255,255,.10);
  --accent:#6FE6FF;
  --accent2:#A78BFA;
  --good:#8BFFB8;
  --warn:#FFD38B;
  --bad:#FF8BB0;
  --shadow:0 10px 28px rgba(0,0,0,.35);
  --r:18px;
  --r2:24px;
  --pad:16px;
  --max:1100px;
  --tap:44px;
  color-scheme: dark;
}
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
  background:
    radial-gradient(1200px 800px at 12% 10%, rgba(111,230,255,.18), transparent 55%),
    radial-gradient(900px 700px at 85% 25%, rgba(167,139,250,.20), transparent 55%),
    radial-gradient(800px 500px at 55% 90%, rgba(111,255,184,.10), transparent 60%),
    linear-gradient(180deg, var(--bg0), var(--bg1));
  color:var(--text);
}
a{color:inherit}
a:focus, button:focus{outline:2px solid rgba(111,230,255,.65); outline-offset:2px}
#app-shell{min-height:100%; display:flex; flex-direction:column}
header{
  position:sticky; top:0; z-index:10;
  backdrop-filter: blur(10px);
  background: linear-gradient(180deg, rgba(7,10,16,.95), rgba(7,10,16,.65));
  border-bottom: 1px solid var(--line);
}
.navbar{max-width:var(--max); margin:0 auto; padding:12px var(--pad); display:flex; gap:12px; align-items:center; justify-content:space-between}
.brand{display:flex; gap:10px; align-items:center; text-decoration:none}
.logo{
  width:34px; height:34px; border-radius:12px;
  background: radial-gradient(circle at 30% 30%, rgba(111,230,255,.95), rgba(167,139,250,.90));
  box-shadow: 0 10px 28px rgba(111,230,255,.10);
}
.brand h1{font-size:14px; margin:0; letter-spacing:.6px; text-transform:uppercase}
.brand .sub{font-size:12px; color:var(--muted2); margin-top:2px}
.actions{display:flex; gap:10px; align-items:center}
.chip{
  display:inline-flex; align-items:center; gap:8px;
  padding:8px 10px;
  border:1px solid var(--line);
  background: rgba(14,23,48,.55);
  border-radius:999px;
  box-shadow: 0 6px 16px rgba(0,0,0,.18);
  font-size:12px; color:var(--muted);
}
.btn{
  appearance:none; border:1px solid var(--line);
  background: rgba(14,23,48,.72);
  color:var(--text);
  border-radius: 999px;
  padding:10px 12px;
  min-height: var(--tap);
  font-size: 13px;
  cursor:pointer;
}
.btn:hover{border-color: rgba(111,230,255,.35)}
.btn.primary{
  border-color: rgba(111,230,255,.45);
  background: linear-gradient(180deg, rgba(111,230,255,.22), rgba(167,139,250,.12));
}
main{
  flex:1;
  max-width:var(--max);
  margin:0 auto;
  width:100%;
  padding: 18px var(--pad) 80px;
}
.skip{
  position:absolute;
  left:-999px; top:auto;
  width:1px; height:1px; overflow:hidden;
}
.skip:focus{
  left:12px; top:12px;
  width:auto; height:auto;
  padding:10px 12px;
  background: rgba(14,23,48,.95);
  border:1px solid rgba(111,230,255,.45);
  border-radius: 12px;
  z-index: 9999;
}
.hero{
  display:grid;
  gap:12px;
  padding: 16px;
  border:1px solid var(--line);
  background: linear-gradient(180deg, rgba(14,23,48,.72), rgba(12,20,43,.68));
  border-radius: var(--r2);
  box-shadow: var(--shadow);
}
.hero h2{margin:0; font-size:22px; letter-spacing:.2px}
.hero p{margin:0; color:var(--muted); line-height:1.4}
.grid{
  margin-top:14px;
  display:grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 12px;
}
.card{
  grid-column: span 12;
  border:1px solid var(--line);
  background: linear-gradient(180deg, rgba(14,23,48,.72), rgba(12,20,43,.70));
  border-radius: var(--r2);
  box-shadow: var(--shadow);
  overflow:hidden;
}
.card .in{padding: 14px}
.card h3{margin:0 0 8px; font-size:16px}
.card p{margin:0; color:var(--muted); line-height:1.45}
.card .meta{margin-top:10px; display:flex; gap:8px; flex-wrap:wrap}
.pill{
  display:inline-flex; align-items:center; gap:8px;
  padding:6px 10px;
  border:1px solid var(--line);
  border-radius: 999px;
  background: rgba(7,10,16,.35);
  color: var(--muted);
  font-size:12px;
}
.row{display:flex; gap:10px; flex-wrap:wrap; align-items:center}
.kicker{color:var(--muted2); font-size:12px; letter-spacing:.5px; text-transform:uppercase}
.section-title{margin:18px 0 10px; display:flex; align-items:center; justify-content:space-between; gap:10px}
.section-title h2{margin:0; font-size:16px; letter-spacing:.2px}
.list{
  display:grid;
  gap: 10px;
}
.item{
  border:1px solid var(--line);
  background: rgba(14,23,48,.55);
  border-radius: var(--r2);
  padding: 12px;
  display:flex;
  gap: 10px;
  align-items:flex-start;
  justify-content:space-between;
}
.item .left{min-width:0}
.item h4{margin:0 0 6px; font-size:14px}
.item .sub{margin:0; color:var(--muted); font-size:13px; line-height:1.4}
.item .right{display:flex; gap:8px; align-items:center; flex-shrink:0}
.linkbtn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height: var(--tap);
  padding: 10px 12px;
  border-radius: 999px;
  border:1px solid var(--line);
  background: rgba(7,10,16,.28);
  text-decoration:none;
  font-size: 13px;
}
.linkbtn:hover{border-color: rgba(111,230,255,.35)}
.panel{
  border:1px solid var(--line);
  background: rgba(14,23,48,.48);
  border-radius: var(--r2);
  padding: 12px;
}
.panel h3{margin:0 0 8px; font-size:14px}
.panel p, .panel li{color:var(--muted); line-height:1.45}
.panel ul{margin:8px 0 0 18px; padding:0}
.breadcrumbs{display:flex; gap:8px; flex-wrap:wrap; align-items:center; color:var(--muted2); font-size:12px}
.breadcrumbs a{text-decoration:none; border-bottom:1px dashed rgba(185,196,230,.35)}
.hr{height:1px; background: var(--line); margin: 14px 0}
.badge{
  display:inline-flex; align-items:center; gap:8px;
  padding:6px 10px;
  border-radius: 999px;
  border:1px solid var(--line);
  background: rgba(7,10,16,.35);
  font-size:12px;
}
.badge.good{border-color: rgba(139,255,184,.35)}
.badge.warn{border-color: rgba(255,211,139,.35)}
.badge.bad{border-color: rgba(255,139,176,.35)}
.footer{
  max-width:var(--max);
  margin:0 auto;
  padding: 16px var(--pad) 30px;
  color: var(--muted2);
  font-size:12px;
}
@media (min-width: 760px){
  .card.span6{grid-column: span 6}
  .card.span4{grid-column: span 4}
  .hero{grid-template-columns: 2fr 1fr; align-items:start}
}
@media (prefers-reduced-motion: reduce){
  *{scroll-behavior:auto !important}
}
    `.trim();

    const mount = () => {
      const existing = document.getElementById(`${APP_ID}-style`);
      if (existing) return;
      document.head.appendChild(el('style', { id: `${APP_ID}-style`, text: css }));
    };

    return { mount };
  })();

  // =================
  // Shell + Rendering
  // =================
  const App = (() => {
    const root = document.getElementById('app') || document.body;

    const ensureShell = () => {
      Style.mount();

      let shell = document.getElementById('app-shell');
      if (shell) return shell;

      const skip = el('a', { class: 'skip', href: '#app-main', text: 'Skip to content' });

      const header = el(
        'header',
        null,
        el(
          'div',
          { class: 'navbar' },
          el(
            'a',
            { class: 'brand', href: '#/', 'aria-label': 'Ride Your Demons home' },
            el('div', { class: 'logo', 'aria-hidden': 'true' }),
            el(
              'div',
              null,
              el('h1', { text: 'Ride Your Demons' }),
              el('div', { class: 'sub', text: 'Platform v1 — static-first' })
            )
          ),
          el(
            'div',
            { class: 'actions' },
            el('span', { class: 'chip', id: 'chip-progress', role: 'status', 'aria-live': 'polite', text: 'Progress: 0/0' }),
            el('button', { class: 'btn', id: 'btn-reset', type: 'button', text: 'Reset view' })
          )
        )
      );

      const main = el('main', { id: 'app-main', role: 'main', tabindex: '-1' });
      const footer = el(
        'div',
        { class: 'footer' },
        el(
          'div',
          { class: 'panel' },
          el('h3', { text: 'Safety + intent' }),
          el('p', {
            text:
              'RYD v1 is practical self-help guidance, not medical care. If you feel unsafe or at risk, reach out to a trusted person or local emergency services right now. Canada/US: dial or text 988.'
          })
        )
      );

      shell = el('div', { id: 'app-shell' }, skip, header, main, footer);
      root.innerHTML = '';
      root.appendChild(shell);

      const resetBtn = document.getElementById('btn-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          Router.to('/'); // soft reset to home
        });
      }

      return shell;
    };

    const setProgressChip = () => {
      const chip = document.getElementById('chip-progress');
      if (!chip) return;
      const s = State.statsAll();
      chip.textContent = `Progress: ${s.done}/${s.total}`;
    };

    const setTitle = (t) => {
      const title = String(t || 'Ride Your Demons').slice(0, MAX_TITLE);
      document.title = title;
    };

    const breadcrumbs = (items) => {
      // items: [{label, href}]
      const wrap = el('nav', { class: 'breadcrumbs', 'aria-label': 'Breadcrumb' });
      const parts = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (i > 0) parts.push(el('span', { text: '›', 'aria-hidden': 'true' }));
        if (it.href) parts.push(el('a', { href: it.href, text: it.label }));
        else parts.push(el('span', { text: it.label }));
      }
      wrap.appendChild(el('span', { class: 'kicker', text: 'Path' }));
      wrap.appendChild(el('span', { text: ':' }));
      wrap.appendChild(el('span', { 'aria-hidden': 'true', text: ' ' }));
      wrap.appendChild(el('span', { 'aria-hidden': 'true', text: '' }));
      for (const p of parts) wrap.appendChild(p);
      return wrap;
    };

    const renderHome = () => {
      ensureShell();
      setProgressChip();

      const main = document.getElementById('app-main');
      if (!main) return;

      setTitle('RYD v1 — Gates');

      const sAll = State.statsAll();
      ga.pageview('/#/', 'RYD v1 — Gates');

      const hero = el(
        'section',
        { class: 'hero' },
        el(
          'div',
          null,
          el('div', { class: 'kicker', text: 'Flow' }),
          el('h2', { 'data-autofocus': 'true', text: 'Gate → Pain Point → Tool → 5 / 15 / 30' }),
          el('p', { text: 'Pick a gate. Each pain point has three tools. Each tool has 5/15/30-minute variants. Mark complete to track progress.' })
        ),
        el(
          'div',
          { class: 'panel' },
          el('h3', { text: 'Your progress' }),
          el('p', { text: `Completed variants: ${sAll.done} / ${sAll.total}` }),
          el('p', { text: 'Tip: Use the back button freely — deep links render directly.' })
        )
      );

      const grid = el('div', { class: 'grid' });

      for (const g of DATA.gates) {
        const st = State.statsForGate(g.id);
        const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;

        grid.appendChild(
          el(
            'section',
            { class: 'card span4', role: 'region', 'aria-label': `${g.name} gate` },
            el(
              'div',
              { class: 'in' },
              el('div', { class: 'kicker', text: 'Gate' }),
              el('h3', { text: g.name }),
              el('p', { text: g.intro }),
              el(
                'div',
                { class: 'meta' },
                el('span', { class: 'pill', text: `${g.painPoints.length} pain points` }),
                el('span', { class: 'pill', text: `Progress ${st.done}/${st.total} (${pct}%)` })
              ),
              el(
                'div',
                { class: 'hr' }
              ),
              el(
                'div',
                { class: 'row' },
                el('a', { class: 'linkbtn', href: `#/gate/${encodeURIComponent(g.id)}`, text: 'Open gate' }),
                el('span', { class: 'pill', text: 'Numerology: reflective only' })
              )
            )
          )
        );
      }

      main.innerHTML = '';
      main.appendChild(hero);
      main.appendChild(grid);

      focusMain();
    };

    const renderGate = (gateId) => {
      ensureShell();
      setProgressChip();

      const main = document.getElementById('app-main');
      const gate = DATA.map.gatesById.get(gateId);

      if (!main) return;

      if (!gate) {
        setTitle('RYD v1 — Not found');
        ga.pageview(`/#/gate/${escapeText(gateId)}`, 'RYD v1 — Not found');
        main.innerHTML = '';
        main.appendChild(
          el(
            'section',
            { class: 'card' },
            el(
              'div',
              { class: 'in' },
              breadcrumbs([{ label: 'Home', href: '#/' }, { label: 'Not found' }]),
              el('div', { class: 'hr' }),
              el('h3', { 'data-autofocus': 'true', text: 'Gate not found' }),
              el('p', { text: 'That gate link doesn’t exist in v1.' }),
              el('div', { class: 'row' }, el('a', { class: 'linkbtn', href: '#/', text: 'Back to gates' }))
            )
          )
        );
        focusMain();
        return;
      }

      const st = State.statsForGate(gateId);
      const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;

      setTitle(`RYD v1 — ${gate.name}`);
      ga.pageview(`/#/gate/${gateId}`, `RYD v1 — ${gate.name}`);

      const top = el(
        'section',
        { class: 'card' },
        el(
          'div',
          { class: 'in' },
          breadcrumbs([{ label: 'Home', href: '#/' }, { label: gate.name }]),
          el('div', { class: 'hr' }),
          el('div', { class: 'kicker', text: 'Gate overview' }),
          el('h3', { 'data-autofocus': 'true', text: gate.name }),
          el('p', { text: gate.intro }),
          el(
            'div',
            { class: 'meta' },
            el('span', { class: 'pill', text: `${gate.painPoints.length} pain points` }),
            el('span', { class: 'pill', text: `Progress ${st.done}/${st.total} (${pct}%)` })
          ),
          el('div', { class: 'hr' }),
          el(
            'div',
            { class: 'panel' },
            el('h3', { text: gate.numerology.title }),
            el('ul', null, ...gate.numerology.body.map((t) => el('li', { text: t })))
          )
        )
      );

      const list = el('div', { class: 'list' });

      for (const p of gate.painPoints) {
        const toolsCount = p.tools.length;
        const variantsCount = p.tools.reduce((acc, t) => acc + (t.variants ? t.variants.length : 0), 0);

        list.appendChild(
          el(
            'div',
            { class: 'item' },
            el(
              'div',
              { class: 'left' },
              el('div', { class: 'kicker', text: 'Pain point' }),
              el('h4', { text: p.name }),
              el('p', { class: 'sub', text: p.brief })
            ),
            el(
              'div',
              { class: 'right' },
              el('span', { class: 'pill', text: `${toolsCount} tools` }),
              el('span', { class: 'pill', text: `${variantsCount} variants` }),
              el('a', { class: 'linkbtn', href: `#/gate/${encodeURIComponent(gate.id)}/${encodeURIComponent(p.id)}`, text: 'Open' })
            )
          )
        );
      }

      const safetyPanel = el(
        'section',
        { class: 'panel', role: 'note', 'aria-label': 'Safety' },
        el('h3', { text: 'Safety' }),
        el('ul', null, ...gate.disclaimer.map((t) => el('li', { text: t })))
      );

      main.innerHTML = '';
      main.appendChild(top);
      main.appendChild(el('div', { class: 'section-title' }, el('h2', { text: 'Pain points' })));
      main.appendChild(list);
      main.appendChild(el('div', { class: 'hr' }));
      main.appendChild(safetyPanel);

      focusMain();
    };

    const renderPainPoint = (gateId, painPointId) => {
      ensureShell();
      setProgressChip();

      const main = document.getElementById('app-main');
      if (!main) return;

      const gate = DATA.map.gatesById.get(gateId);
      const pain = DATA.map.painPointsById.get(`${gateId}:${painPointId}`);

      if (!gate || !pain) {
        setTitle('RYD v1 — Not found');
        ga.pageview(`/#/gate/${escapeText(gateId)}/${escapeText(painPointId)}`, 'RYD v1 — Not found');
        main.innerHTML = '';
        main.appendChild(
          el(
            'section',
            { class: 'card' },
            el(
              'div',
              { class: 'in' },
              breadcrumbs([{ label: 'Home', href: '#/' }, { label: gate ? gate.name : 'Gate', href: gate ? `#/gate/${gateId}` : '#/' }, { label: 'Not found' }]),
              el('div', { class: 'hr' }),
              el('h3', { 'data-autofocus': 'true', text: 'Pain point not found' }),
              el('p', { text: 'That pain point link doesn’t exist in v1.' }),
              el('div', { class: 'row' }, el('a', { class: 'linkbtn', href: gate ? `#/gate/${gateId}` : '#/', text: 'Back' }))
            )
          )
        );
        focusMain();
        return;
      }

      setTitle(`RYD v1 — ${gate.name} — ${pain.name}`);
      ga.pageview(`/#/gate/${gateId}/${painPointId}`, `RYD v1 — ${gate.name} — ${pain.name}`);

      const top = el(
        'section',
        { class: 'card' },
        el(
          'div',
          { class: 'in' },
          breadcrumbs([{ label: 'Home', href: '#/' }, { label: gate.name, href: `#/gate/${gateId}` }, { label: pain.name }]),
          el('div', { class: 'hr' }),
          el('div', { class: 'kicker', text: 'Pain point' }),
          el('h3', { 'data-autofocus': 'true', text: pain.name }),
          el('p', { text: pain.brief }),
          el('div', { class: 'hr' }),
          el('div', { class: 'panel' }, el('h3', { text: 'Why this matters' }), el('p', { text: pain.whyItMatters }))
        )
      );

      const list = el('div', { class: 'list' });

      for (const t of pain.tools) {
        const variantsLabel = t.variants.map((v) => `${v.minutes}`).join('/');
        list.appendChild(
          el(
            'div',
            { class: 'item' },
            el(
              'div',
              { class: 'left' },
              el('div', { class: 'kicker', text: 'Tool' }),
              el('h4', { text: t.name }),
              el('p', { class: 'sub', text: t.quickWhy })
            ),
            el(
              'div',
              { class: 'right' },
              el('span', { class: 'pill', text: `${variantsLabel} min` }),
              el('a', { class: 'linkbtn', href: `#/gate/${encodeURIComponent(gateId)}/${encodeURIComponent(painPointId)}/${encodeURIComponent(t.id)}`, text: 'Open tool' })
            )
          )
        );
      }

      main.innerHTML = '';
      main.appendChild(top);
      main.appendChild(el('div', { class: 'section-title' }, el('h2', { text: 'Three tools' })));
      main.appendChild(list);

      focusMain();
    };

    const renderTool = (gateId, painPointId, toolId) => {
      ensureShell();
      setProgressChip();

      const main = document.getElementById('app-main');
      if (!main) return;

      const gate = DATA.map.gatesById.get(gateId);
      const pain = DATA.map.painPointsById.get(`${gateId}:${painPointId}`);
      const toolObj = DATA.map.toolsById.get(`${gateId}:${painPointId}:${toolId}`);

      if (!gate || !pain || !toolObj) {
        setTitle('RYD v1 — Not found');
        ga.pageview(`/#/gate/${escapeText(gateId)}/${escapeText(painPointId)}/${escapeText(toolId)}`, 'RYD v1 — Not found');
        main.innerHTML = '';
        main.appendChild(
          el(
            'section',
            { class: 'card' },
            el(
              'div',
              { class: 'in' },
              breadcrumbs([{ label: 'Home', href: '#/' }, { label: gate ? gate.name : 'Gate', href: gate ? `#/gate/${gateId}` : '#/' }, { label: pain ? pain.name : 'Pain point', href: gate && pain ? `#/gate/${gateId}/${painPointId}` : '#/' }, { label: 'Not found' }]),
              el('div', { class: 'hr' }),
              el('h3', { 'data-autofocus': 'true', text: 'Tool not found' }),
              el('p', { text: 'That tool link doesn’t exist in v1.' }),
              el('div', { class: 'row' }, el('a', { class: 'linkbtn', href: gate && pain ? `#/gate/${gateId}/${painPointId}` : '#/', text: 'Back' }))
            )
          )
        );
        focusMain();
        return;
      }

      setTitle(`RYD v1 — ${toolObj.name}`);
      ga.pageview(`/#/gate/${gateId}/${painPointId}/${toolId}`, `RYD v1 — ${toolObj.name}`);

      const top = el(
        'section',
        { class: 'card' },
        el(
          'div',
          { class: 'in' },
          breadcrumbs([{ label: 'Home', href: '#/' }, { label: gate.name, href: `#/gate/${gateId}` }, { label: pain.name, href: `#/gate/${gateId}/${painPointId}` }, { label: toolObj.name }]),
          el('div', { class: 'hr' }),
          el('div', { class: 'kicker', text: 'Tool' }),
          el('h3', { 'data-autofocus': 'true', text: toolObj.name }),
          el('p', { text: toolObj.quickWhy }),
          el('div', { class: 'hr' }),
          el('div', { class: 'panel' }, el('h3', { text: 'How & Why this works' }), el('p', { text: toolObj.howWhyWorks })),
          toolObj.cautions && toolObj.cautions.length
            ? el('div', { class: 'hr' })
            : null,
          toolObj.cautions && toolObj.cautions.length
            ? el('div', { class: 'panel' }, el('h3', { text: 'Cautions' }), el('ul', null, ...toolObj.cautions.map((t) => el('li', { text: t }))))
            : null
        )
      );

      const variants = el('div', { class: 'list' });
      for (const v of toolObj.variants) {
        const complete = State.isComplete(gateId, painPointId, toolId, v.minutes);
        variants.appendChild(
          el(
            'div',
            { class: 'item' },
            el(
              'div',
              { class: 'left' },
              el('div', { class: 'kicker', text: 'Variant' }),
              el('h4', { text: `${v.minutes}-minute` }),
              el('p', { class: 'sub', text: 'Practical steps + reflective numerology + how/why.' })
            ),
            el(
              'div',
              { class: 'right' },
              el('span', { class: `badge ${complete ? 'good' : 'warn'}`, text: complete ? 'Completed' : 'Not completed' }),
              el('a', { class: 'linkbtn', href: `#/gate/${encodeURIComponent(gateId)}/${encodeURIComponent(painPointId)}/${encodeURIComponent(toolId)}/${encodeURIComponent(String(v.minutes))}`, text: 'Open' })
            )
          )
        );
      }

      main.innerHTML = '';
      main.appendChild(top);
      main.appendChild(el('div', { class: 'section-title' }, el('h2', { text: 'Choose a time length' })));
      main.appendChild(variants);

      focusMain();
    };

    const renderVariant = (gateId, painPointId, toolId, minutesRaw) => {
      ensureShell();
      setProgressChip();

      const main = document.getElementById('app-main');
      if (!main) return;

      const gate = DATA.map.gatesById.get(gateId);
      const pain = DATA.map.painPointsById.get(`${gateId}:${painPointId}`);
      const toolObj = DATA.map.toolsById.get(`${gateId}:${painPointId}:${toolId}`);

      const minutes = clamp(parseInt(String(minutesRaw), 10) || 0, 0, 999);

      if (!gate || !pain || !toolObj) {
        setTitle('RYD v1 — Not found');
        ga.pageview(`/#/gate/${escapeText(gateId)}/${escapeText(painPointId)}/${escapeText(toolId)}/${escapeText(minutesRaw)}`, 'RYD v1 — Not found');
        main.innerHTML = '';
        main.appendChild(
          el(
            'section',
            { class: 'card' },
            el(
              'div',
              { class: 'in' },
              breadcrumbs([{ label: 'Home', href: '#/' }, { label: gate ? gate.name : 'Gate', href: gate ? `#/gate/${gateId}` : '#/' }, { label: pain ? pain.name : 'Pain point', href: gate && pain ? `#/gate/${gateId}/${painPointId}` : '#/' }, { label: toolObj ? toolObj.name : 'Tool', href: gate && pain && toolObj ? `#/gate/${gateId}/${painPointId}/${toolId}` : '#/' }, { label: 'Not found' }]),
              el('div', { class: 'hr' }),
              el('h3', { 'data-autofocus': 'true', text: 'Variant not found' }),
              el('p', { text: 'That variant link doesn’t exist in v1.' }),
              el('div', { class: 'row' }, el('a', { class: 'linkbtn', href: gate && pain && toolObj ? `#/gate/${gateId}/${painPointId}/${toolId}` : '#/', text: 'Back' }))
            )
          )
        );
        focusMain();
        return;
      }

      const variantObj = toolObj.variants.find((v) => v.minutes === minutes);
      if (!variantObj) {
        setTitle('RYD v1 — Not found');
        ga.pageview(`/#/gate/${gateId}/${painPointId}/${toolId}/${minutes}`, 'RYD v1 — Not found');
        main.innerHTML = '';
        main.appendChild(
          el(
            'section',
            { class: 'card' },
            el(
              'div',
              { class: 'in' },
              breadcrumbs([{ label: 'Home', href: '#/' }, { label: gate.name, href: `#/gate/${gateId}` }, { label: pain.name, href: `#/gate/${gateId}/${painPointId}` }, { label: toolObj.name, href: `#/gate/${gateId}/${painPointId}/${toolId}` }, { label: 'Not found' }]),
              el('div', { class: 'hr' }),
              el('h3', { 'data-autofocus': 'true', text: 'Variant not found' }),
              el('p', { text: 'Use 5, 15, or 30-minute variants for v1.' }),
              el('div', { class: 'row' }, el('a', { class: 'linkbtn', href: `#/gate/${gateId}/${painPointId}/${toolId}`, text: 'Back to tool' }))
            )
          )
        );
        focusMain();
        return;
      }

      const completed = State.isComplete(gateId, painPointId, toolId, minutes);
      setTitle(`RYD v1 — ${toolObj.name} — ${minutes} min`);
      ga.pageview(`/#/gate/${gateId}/${painPointId}/${toolId}/${minutes}`, `RYD v1 — ${toolObj.name} — ${minutes} min`);

      const markBtnId = `btn-mark-${uid()}`;
      const badgeId = `badge-${uid()}`;

      const top = el(
        'section',
        { class: 'card' },
        el(
          'div',
          { class: 'in' },
          breadcrumbs([
            { label: 'Home', href: '#/' },
            { label: gate.name, href: `#/gate/${gateId}` },
            { label: pain.name, href: `#/gate/${gateId}/${painPointId}` },
            { label: toolObj.name, href: `#/gate/${gateId}/${painPointId}/${toolId}` },
            { label: `${minutes}-minute` }
          ]),
          el('div', { class: 'hr' }),
          el('div', { class: 'kicker', text: 'Variant' }),
          el('h3', { 'data-autofocus': 'true', text: `${toolObj.name} — ${minutes}-minute` }),
          el(
            'div',
            { class: 'row', style: 'margin-top:10px' },
            el('span', { id: badgeId, class: `badge ${completed ? 'good' : 'warn'}`, role: 'status', 'aria-live': 'polite', text: completed ? 'Completed (saved on this device)' : 'Not completed yet' }),
            el('button', { class: 'btn primary', id: markBtnId, type: 'button', text: completed ? 'Unmark complete' : 'Mark complete' }),
            el('a', { class: 'linkbtn', href: `#/gate/${gateId}/${painPointId}/${toolId}`, text: 'Back to tool' })
          )
        )
      );

      const stepsPanel = el(
        'section',
        { class: 'panel', role: 'region', 'aria-label': 'Practical execution steps' },
        el('h3', { text: 'Practical execution steps' }),
        el('ul', null, ...variantObj.steps.map((s) => el('li', { text: s })))
      );

      const howWhyPanel = el(
        'section',
        { class: 'panel', role: 'region', 'aria-label': 'How & Why this works' },
        el('h3', { text: 'How & Why this works' }),
        el('p', { text: variantObj.howWhy })
      );

      const num = variantObj.reflection && variantObj.reflection.numerology ? variantObj.reflection.numerology : null;

      const numerologyPanel = el(
        'section',
        { class: 'panel', role: 'region', 'aria-label': 'Numerology layer' },
        el('h3', { text: 'Numerology layer (reflective + ethical)' }),
        num
          ? el(
              'div',
              null,
              el('p', { text: `${num.number} — ${num.meaning}` }),
              el('p', { text: num.prompt })
            )
          : el('p', { text: 'Optional: If numbers help you reflect, use them. If not, skip this section completely.' })
      );

      const safetyPanel = el(
        'section',
        { class: 'panel', role: 'note', 'aria-label': 'Safety' },
        el('h3', { text: 'Safety' }),
        el('ul', null, ...gate.disclaimer.map((t) => el('li', { text: t })))
      );

      const wrap = el('div', { class: 'grid' });
      const left = el('div', { class: 'card span6' }, el('div', { class: 'in' }, stepsPanel));
      const right = el(
        'div',
        { class: 'card span6' },
        el(
          'div',
          { class: 'in' },
          el('div', { class: 'kicker', text: 'Support' }),
          el('h3', { text: 'Keep it real' }),
          el('p', { text: 'No perfect performance needed. Do the next right step, then stop. Consistency wins.' }),
          el('div', { class: 'hr' }),
          howWhyPanel,
          el('div', { class: 'hr' }),
          numerologyPanel,
          el('div', { class: 'hr' }),
          safetyPanel
        )
      );

      wrap.appendChild(left);
      wrap.appendChild(right);

      main.innerHTML = '';
      main.appendChild(top);
      main.appendChild(wrap);

      const markBtn = document.getElementById(markBtnId);
      const badge = document.getElementById(badgeId);

      if (markBtn && badge) {
        markBtn.addEventListener('click', () => {
          const isDone = State.isComplete(gateId, painPointId, toolId, minutes);
          if (isDone) {
            State.unmarkComplete(gateId, painPointId, toolId, minutes);
            badge.className = 'badge warn';
            badge.textContent = 'Not completed yet';
            markBtn.textContent = 'Mark complete';
            ga.event('ryd_unmark_complete', { gate_id: gateId, pain_point_id: painPointId, tool_id: toolId, minutes: minutes });
          } else {
            State.markComplete(gateId, painPointId, toolId, minutes);
            badge.className = 'badge good';
            badge.textContent = 'Completed (saved on this device)';
            markBtn.textContent = 'Unmark complete';
            ga.event('ryd_mark_complete', { gate_id: gateId, pain_point_id: painPointId, tool_id: toolId, minutes: minutes });
          }
          setProgressChip();
        });
      }

      focusMain();
    };

    const render = () => {
      const route = Router.parseHash();
      setProgressChip();

      if (route.name === 'home') return renderHome();
      if (route.name === 'gate') return renderGate(route.params.gateId);
      if (route.name === 'pain') return renderPainPoint(route.params.gateId, route.params.painPointId);
      if (route.name === 'tool') return renderTool(route.params.gateId, route.params.painPointId, route.params.toolId);
      if (route.name === 'variant') return renderVariant(route.params.gateId, route.params.painPointId, route.params.toolId, route.params.minutes);
      return renderHome();
    };

    return { render };
  })();

  // ==========
  // Bootstrap
  // ==========
  const boot = () => {
    // Ensure a predictable root if the HTML uses <div id="app"></div>
    if (!document.getElementById('app') && document.body) {
      const d = el('div', { id: 'app' });
      document.body.appendChild(d);
    }

    // First render: if hash is empty, normalize to home without pushing history.
    if (!location.hash || location.hash === '#') Router.replace('/');

    App.render();

    window.addEventListener('hashchange', () => {
      App.render();
    });

    // Defensive: handle BFCache restores without stale UI.
    window.addEventListener('pageshow', () => {
      App.render();
    });
    
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
