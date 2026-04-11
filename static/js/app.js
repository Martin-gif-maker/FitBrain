// ── State ──────────────────────────────────────────────────────────
let currentProfile = {};
let currentPlan = null;
let completedDays = new Set();

// ── Pill selection ─────────────────────────────────────────────────
document.querySelectorAll('.pill-group').forEach(group => {
  group.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      group.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
    });
  });
});

// ── Days counter ───────────────────────────────────────────────────
let daysValue = 4;
document.getElementById('days-minus').addEventListener('click', () => {
  if (daysValue > 2) { daysValue--; document.getElementById('days-display').textContent = daysValue; document.getElementById('days').value = daysValue; }
});
document.getElementById('days-plus').addEventListener('click', () => {
  if (daysValue < 6) { daysValue++; document.getElementById('days-display').textContent = daysValue; document.getElementById('days').value = daysValue; }
});

// ── Form submit ────────────────────────────────────────────────────
document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const goal = document.querySelector('.pill-group[data-name="goal"] .pill.selected')?.dataset.value;
  const level = document.querySelector('.pill-group[data-name="level"] .pill.selected')?.dataset.value;
  const equipment = document.querySelector('.pill-group[data-name="equipment"] .pill.selected')?.dataset.value;
  const age = parseInt(document.getElementById('age').value);
  const days = parseInt(document.getElementById('days').value);
  const notes = document.getElementById('notes').value;

  const errorEl = document.getElementById('form-error');
  if (!goal || !level || !equipment || !age) {
    errorEl.classList.remove('hidden');
    return;
  }
  errorEl.classList.add('hidden');

  currentProfile = { goal, level, equipment, age, days, notes };

  const btn = document.getElementById('generate-btn');
  const btnText = document.getElementById('btn-text');
  const btnLoader = document.getElementById('btn-loader');
  btn.disabled = true;
  btnText.classList.add('hidden');
  btnLoader.classList.remove('hidden');

  try {
    const res = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentProfile)
    });
    const plan = await res.json();
    currentPlan = plan;
    completedDays = new Set();
    renderPlan(plan);
    showScreen('plan-screen');
  } catch (err) {
    alert('Something went wrong generating your plan. Please try again.');
    console.error(err);
  } finally {
    btn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  }
});

// ── Back button ────────────────────────────────────────────────────
document.getElementById('back-btn').addEventListener('click', () => {
  showScreen('onboarding-screen');
});

// ── Render plan ────────────────────────────────────────────────────
function renderPlan(plan) {
  // Intro
  document.getElementById('plan-intro').innerHTML = `
    <h1>${plan.plan_title}</h1>
    <p>${plan.plan_description}</p>
  `;

  // Progress tracker
  const tracker = document.getElementById('progress-tracker');
  tracker.innerHTML = '';
  plan.weekly_plan.forEach((day, i) => {
    const isRest = day.exercises?.length === 0 || day.focus?.toLowerCase().includes('rest');
    const el = document.createElement('div');
    el.className = 'progress-day' + (isRest ? ' rest-day' : '');
    el.dataset.index = i;
    el.innerHTML = `
      <span class="day-check">${isRest ? '😴' : '○'}</span>
      <span class="day-label">${day.day.slice(0, 3)}</span>
    `;
    if (!isRest) {
      el.addEventListener('click', () => {
        const card = document.querySelector(`.day-card[data-index="${i}"]`);
        card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    tracker.appendChild(el);
  });

  // Week grid
  const grid = document.getElementById('week-grid');
  grid.innerHTML = '';
  plan.weekly_plan.forEach((day, i) => {
    const isRest = !day.exercises || day.exercises.length === 0 || day.focus?.toLowerCase().includes('rest') || day.focus?.toLowerCase().includes('recovery');
    const card = document.createElement('div');
    card.className = 'day-card' + (isRest ? ' rest' : '');
    card.dataset.index = i;

    const duration = day.duration_minutes ? `${day.duration_minutes} min` : '';

    card.innerHTML = `
      <div class="day-card-header">
        <div class="day-info">
          <span class="day-name">${day.day}</span>
          <span class="day-focus">${day.focus || 'Rest'}</span>
        </div>
        <div class="day-actions">
          ${!isRest ? `
            <span class="day-meta">${duration}</span>
            <button class="btn-regen" data-index="${i}">🔄 Different</button>
            <button class="btn-done" data-index="${i}">✓ Done</button>
          ` : ''}
          ${!isRest ? `<span class="chevron">▼</span>` : `<span class="day-meta">Rest day 😴</span>`}
        </div>
      </div>
      ${!isRest ? `
        <div class="day-body">
          <div class="exercises-list">
            ${day.exercises.map((ex, ei) => renderExercise(ex, i, ei)).join('')}
          </div>
        </div>
      ` : ''}
    `;

    // Toggle expand
    if (!isRest) {
      card.querySelector('.day-card-header').addEventListener('click', (e) => {
        if (e.target.closest('.btn-regen') || e.target.closest('.btn-done')) return;
        card.classList.toggle('open');
      });

      // Regenerate day
      card.querySelector('.btn-regen').addEventListener('click', async (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.textContent = '⏳ Loading...';
        try {
          const res = await fetch('/regenerate-day', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              day: day.day,
              focus: day.focus,
              goal: currentProfile.goal,
              level: currentProfile.level,
              equipment: currentProfile.equipment
            })
          });
          const newDay = await res.json();
          currentPlan.weekly_plan[i] = { ...currentPlan.weekly_plan[i], ...newDay };
          renderPlan(currentPlan);
          // Re-open the card
          setTimeout(() => {
            const newCard = document.querySelector(`.day-card[data-index="${i}"]`);
            newCard?.classList.add('open');
          }, 50);
        } catch (err) {
          alert('Could not regenerate. Try again.');
        } finally {
          btn.disabled = false;
          btn.textContent = '🔄 Different';
        }
      });

      // Mark done
      card.querySelector('.btn-done').addEventListener('click', (e) => {
        e.stopPropagation();
        if (completedDays.has(i)) {
          completedDays.delete(i);
          card.classList.remove('done');
        } else {
          completedDays.add(i);
          card.classList.add('done');
        }
        updateProgressTracker();
      });
    }

    grid.appendChild(card);

    // Re-apply done state
    if (completedDays.has(i)) {
      card.classList.add('done');
    }
  });
}

function renderExercise(ex, dayIndex, exIndex) {
  return `
    <div class="exercise-item" data-day="${dayIndex}" data-ex="${exIndex}">
      <div class="ex-checkbox"></div>
      <div class="ex-info">
        <div class="ex-name">${ex.name}</div>
        <div class="ex-stats">
          <span class="ex-stat">${ex.sets} sets</span>
          <span class="ex-stat">${ex.reps} reps</span>
          <span class="ex-stat">⏱ ${ex.rest_seconds}s rest</span>
        </div>
        <div class="ex-why">${ex.why}</div>
      </div>
    </div>
  `;
}

// ── Exercise checkboxes (delegated) ───────────────────────────────
document.getElementById('week-grid').addEventListener('click', (e) => {
  const checkbox = e.target.closest('.ex-checkbox');
  if (!checkbox) return;
  const item = checkbox.closest('.exercise-item');
  item.classList.toggle('checked');
});

// ── Progress tracker update ────────────────────────────────────────
function updateProgressTracker() {
  document.querySelectorAll('.progress-day').forEach(el => {
    const i = parseInt(el.dataset.index);
    const isRest = el.classList.contains('rest-day');
    if (isRest) return;
    if (completedDays.has(i)) {
      el.classList.add('done');
      el.querySelector('.day-check').textContent = '✅';
    } else {
      el.classList.remove('done');
      el.querySelector('.day-check').textContent = '○';
    }
  });
}

// ── Screen switching ───────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
