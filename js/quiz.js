/* Quiz engine. Question types:
   tf    { type:'tf', q, items:[{ s, a:true|false, why }], pts }
   mc    { type:'mc', q, opts:[...], a:[indices], why, pts }   (several indices = multiple answers)
   match { type:'match', q, items:[{ s, a }], choices:[...], why, pts }
   open  { type:'open', q, model:'html', pts, hint }            (self-scored after seeing the model answer)
   Optional on every question: ctx (small text under the question), later (note: "Stoff ab ...")
   cfg: { id, title, exam:false, minutes:0, questions:[...] }
*/
const Quiz = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const round = x => Math.round(x * 2) / 2;

  function mount(el, cfg) {
    if (typeof el === 'string') el = document.querySelector(el);
    const qs = cfg.questions;
    const state = qs.map(() => ({ checked: false, score: null }));
    const total = qs.reduce((a, q) => a + q.pts, 0);
    let submitted = false, timerId = null;

    const head = '<div class="quiz-head">' + esc(cfg.title) +
      (cfg.minutes ? '<span class="timer" data-timer>⏱ ' + cfg.minutes + ':00</span>' : '') +
      '<span class="score" data-score>0 / ' + total + ' P.</span></div>';
    const body = qs.map((q, i) => renderQ(q, i, cfg.exam)).join('');
    const prev = Store.get('quiz.' + cfg.id, null);
    const foot = '<div class="quiz-foot">' +
      (cfg.exam ? '<button class="btn primary" data-submit>Abgeben & korrigieren</button>' : '<button class="btn primary" data-checkall>Alle prüfen</button>') +
      '<button class="btn" data-reset>Neu starten</button>' +
      '<span data-result></span>' +
      (prev ? '<span class="src" style="margin-left:auto">Bestes Resultat bisher: ' + prev.best + ' %</span>' : '') + '</div>';
    el.classList.add('quiz');
    el.innerHTML = head + body + foot;

    // interactions
    el.querySelectorAll('.tf-row').forEach(row => {
      row.querySelectorAll('button').forEach(b => b.onclick = () => {
        if (row.classList.contains('checked')) return;
        row.querySelectorAll('button').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
      });
    });
    el.querySelectorAll('[data-check]').forEach(b => b.onclick = () => check(+b.dataset.check));
    el.querySelectorAll('[data-reveal]').forEach(b => b.onclick = () => check(+b.dataset.reveal));
    el.querySelectorAll('.self button').forEach(b => b.onclick = () => {
      const i = +b.closest('.q').dataset.i;
      b.parentNode.querySelectorAll('button').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      state[i].score = qs[i].pts * parseFloat(b.dataset.f);
      update();
    });
    const sub = el.querySelector('[data-submit]');
    if (sub) sub.onclick = () => { qs.forEach((_, i) => check(i)); submitted = true; sub.disabled = true; stopTimer(); update(); el.querySelector('[data-result]').scrollIntoView({ block: 'center' }); };
    const ca = el.querySelector('[data-checkall]');
    if (ca) ca.onclick = () => qs.forEach((_, i) => check(i));
    el.querySelector('[data-reset]').onclick = () => { stopTimer(); mount(el, cfg); el.scrollIntoView(); };

    if (cfg.minutes) startTimer(cfg.minutes * 60);

    function startTimer(sec) {
      const t = el.querySelector('[data-timer]');
      let left = sec;
      timerId = setInterval(() => {
        left--;
        t.textContent = '⏱ ' + Math.floor(Math.max(left, 0) / 60) + ':' + String(Math.max(left, 0) % 60).padStart(2, '0');
        if (left <= 0) { stopTimer(); t.textContent = '⏱ Zeit abgelaufen'; }
      }, 1000);
    }
    function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }

    function check(i) {
      const q = qs[i], qe = el.querySelector('.q[data-i="' + i + '"]');
      if (state[i].checked) return;
      state[i].checked = true;
      const fb = qe.querySelector('.fb');
      if (q.type === 'tf') {
        let ok = 0;
        qe.querySelectorAll('.tf-row').forEach((row, j) => {
          const sel = row.querySelector('button.sel');
          const val = sel ? sel.dataset.v === 'true' : null;
          const good = val === q.items[j].a;
          if (good) ok++;
          row.classList.add('checked', good ? 'right' : 'wrong');
          if (!good) row.querySelector('.tf-why').insertAdjacentHTML('afterbegin', '<b>Richtig wäre: ' + (q.items[j].a ? 'richtig' : 'falsch') + '.</b> ');
        });
        state[i].score = round(q.pts * ok / q.items.length);
        showFb(fb, ok === q.items.length, ok + ' von ' + q.items.length + ' korrekt.', q.why);
      } else if (q.type === 'mc') {
        const inputs = [...qe.querySelectorAll('input')];
        let ok = 0;
        inputs.forEach((inp, j) => {
          const should = q.a.includes(j);
          if (inp.checked === should) ok++;
          if (should) inp.closest('label').classList.add('right');
          else if (inp.checked) inp.closest('label').classList.add('wrong');
          inp.disabled = true;
        });
        const full = ok === inputs.length;
        // single choice: all or nothing; multiple choice: each wrong tick cancels a right one
        state[i].score = full ? q.pts : (q.a.length > 1 ? round(q.pts * Math.max(0, (ok - (inputs.length - ok)) / inputs.length)) : 0);
        showFb(fb, full, full ? 'Richtig.' : 'Nicht ganz. Grün markiert = richtig.', q.why);
      } else if (q.type === 'match') {
        let ok = 0;
        qe.querySelectorAll('.match-row').forEach((row, j) => {
          const s = row.querySelector('select');
          const good = s.value === q.items[j].a;
          if (good) ok++;
          row.classList.add(good ? 'right' : 'wrong');
          if (!good) row.insertAdjacentHTML('beforeend', '<div style="grid-column:1/-1;font-size:12px;color:var(--red)">Richtig: ' + esc(q.items[j].a) + '</div>');
          s.disabled = true;
        });
        state[i].score = round(q.pts * ok / q.items.length);
        showFb(fb, ok === q.items.length, ok + ' von ' + q.items.length + ' korrekt.', q.why);
      } else if (q.type === 'open') {
        qe.querySelector('.model').classList.add('show');
        qe.querySelector('.self').style.display = 'flex';
        const b = qe.querySelector('[data-reveal]'); if (b) b.style.display = 'none';
      }
      const cb = qe.querySelector('[data-check]'); if (cb) cb.style.display = 'none';
      update();
    }

    function showFb(fb, ok, msg, why) {
      fb.className = 'fb show ' + (ok ? 'ok' : 'no');
      fb.innerHTML = (ok ? '✅ ' : '❌ ') + msg + (why ? '<div style="margin-top:4px">' + why + '</div>' : '');
    }

    function update() {
      const earned = state.reduce((a, s) => a + (s.score || 0), 0);
      const done = state.every(s => s.score !== null);
      el.querySelector('[data-score]').textContent = round(earned) + ' / ' + total + ' P.';
      const r = el.querySelector('[data-result]');
      if (done) {
        const pct = Math.round(100 * earned / total);
        const grade = Math.min(6, Math.max(1, Math.round((earned / total * 5 + 1) * 2) / 2));
        r.innerHTML = '<span class="result-big">' + round(earned) + ' / ' + total + ' P. (' + pct + ' %)</span> · Note ca. ' + grade.toFixed(1) +
          (pct >= 80 ? ' · 🎯 Ziel 80+ erreicht' : ' · Ziel: 80 %. Falsche Fragen nochmals anschauen.');
        const p = Store.get('quiz.' + cfg.id, { best: 0 });
        Store.set('quiz.' + cfg.id, { best: Math.max(p.best || 0, pct), last: pct, at: todayISO() });
      } else if (cfg.exam && submitted) {
        r.innerHTML = 'Offene Fragen: Musterlösung lesen und dich selbst bewerten (0 / ½ / voll), dann siehst du das Total.';
      }
    }
  }

  function renderQ(q, i, exam) {
    let inner = '';
    if (q.type === 'tf') {
      inner = q.items.map((it, j) => '<div class="tf-row"><div>' + it.s + '</div><div class="tf-btns"><button data-v="true">richtig</button><button data-v="false">falsch</button></div><div class="tf-why">' + (it.why || '') + '</div></div>').join('');
    } else if (q.type === 'mc') {
      const multi = q.a.length > 1;
      const name = 'q' + i + '_' + Math.random().toString(36).slice(2, 7);
      inner = (multi ? '<div class="q-ctx">Mehrere Antworten möglich.</div>' : '') + q.opts.map(o =>
        '<label class="opt"><input type="' + (multi ? 'checkbox' : 'radio') + '" name="' + name + '"> <span>' + o + '</span></label>').join('');
    } else if (q.type === 'match') {
      inner = q.items.map(it => '<div class="match-row"><div>' + it.s + '</div><select><option value="">wählen</option>' +
        q.choices.map(c => '<option>' + esc(c) + '</option>').join('') + '</select></div>').join('');
    } else if (q.type === 'open') {
      inner = '<textarea placeholder="Deine Antwort (schreib sie wirklich aus, das trainiert die Prüfung)"></textarea>' +
        (q.hint ? '<div class="q-ctx" style="margin-top:6px">💡 ' + q.hint + '</div>' : '') +
        '<div class="model"><div class="mt">Musterlösung</div>' + q.model + '</div>' +
        '<div class="self" style="display:none">Wie viele Punkte gibst du dir? <button class="btn red" data-f="0">0</button><button class="btn orange" data-f="0.5">½</button><button class="btn green" data-f="1">voll</button></div>';
    }
    const action = exam ? '' : (q.type === 'open'
      ? '<div class="q-actions"><button class="btn" data-reveal="' + i + '">Musterlösung zeigen</button></div>'
      : '<div class="q-actions"><button class="btn" data-check="' + i + '">Prüfen</button></div>');
    return '<div class="q" data-i="' + i + '"><div class="q-top"><span class="q-num">' + (q.num || ('Frage ' + (i + 1))) + '</span><span class="q-pts">' + q.pts + ' P.</span></div>' +
      (q.later ? '<div class="later-note">📅 ' + q.later + '</div>' : '') +
      '<div class="q-text">' + q.q + '</div>' + (q.ctx ? '<div class="q-ctx">' + q.ctx + '</div>' : '') +
      inner + action + '<div class="fb"></div></div>';
  }

  return { mount };
})();
