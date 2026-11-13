(function () {
  var cfg = window.SITE || {};
  var WA = 'https://api.whatsapp.com/send?phone=79117056190&text=';

  function encode(data) {
    return Object.keys(data).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
    }).join('&');
  }

  function toast(text) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 4000);
  }

  function goal(name) {
    try { if (typeof ym === 'function' && cfg.metrika) ym(cfg.metrika, 'reachGoal', name); } catch (e) {}
  }

  // Sends a lead via Netlify Forms; if that fails, opens WhatsApp with the same text.
  function sendLead(phone, comment, onDone) {
    var data = { 'form-name': 'lead', phone: phone, comment: comment, site: location.hostname };
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encode(data)
    }).then(function (r) {
      if (!r.ok) throw new Error('status ' + r.status);
      toast('Спасибо! Перезвоним в течение 15 минут');
      goal('formSubmit');
      onDone(true);
    }).catch(function () {
      window.open(WA + encodeURIComponent('Здравствуйте! Хочу узнать цену выкупа. Телефон: ' + phone + '. ' + comment), '_blank');
      onDone(false);
    });
  }

  // Phone mask +7 (___) ___-__-__
  function maskPhone(input) {
    input.addEventListener('input', function () {
      var d = input.value.replace(/\D/g, '');
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d && d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11);
      var out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 4) out += ') ' + d.slice(4, 7);
      if (d.length >= 7) out += '-' + d.slice(7, 9);
      if (d.length >= 9) out += '-' + d.slice(9, 11);
      input.value = out;
      input.classList.remove('invalid');
    });
  }
  function phoneOk(v) { return v.replace(/\D/g, '').length === 11; }

  // Quiz
  var quiz = document.getElementById('quiz');
  if (quiz && cfg.quiz) {
    var steps = cfg.quiz;
    var total = steps.length + 1;
    var step = 0;
    var answers = [];
    var stepEl = quiz.querySelector('.quiz-step');
    var bar = quiz.querySelector('.progress div');
    var body = quiz.querySelector('.quiz-body');

    function render() {
      stepEl.textContent = 'Шаг ' + (step + 1) + ' из ' + total + ' · бесплатно';
      bar.style.width = ((step + 1) / total * 100) + '%';
      body.innerHTML = '';
      if (step < steps.length) {
        var q = document.createElement('div');
        q.className = 'quiz-q';
        q.textContent = steps[step][0];
        body.appendChild(q);
        var opts = document.createElement('div');
        opts.className = 'options';
        steps[step][1].forEach(function (o) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'option';
          b.textContent = o;
          b.onclick = function () { answers[step] = o; step++; render(); };
          opts.appendChild(b);
        });
        body.appendChild(opts);
        if (step > 0) body.appendChild(backBtn());
        var note = document.createElement('div');
        note.className = 'quiz-note';
        note.textContent = 'Ответим в WhatsApp, Telegram или по телефону';
        body.appendChild(note);
      } else {
        body.innerHTML =
          '<div class="quiz-done">Готово! Мы подготовим цену и план сделки.</div>' +
          '<label class="quiz-q" for="quizPhone">Куда прислать цену?</label>' +
          '<input class="input" id="quizPhone" type="tel" placeholder="+7 (___) ___-__-__" autocomplete="tel">' +
          '<div class="error hidden">Пожалуйста, заполните телефон полностью</div>' +
          '<button type="button" class="btn btn-block form-gap">Получить цену за 15 минут</button>' +
          '<p class="legal">Нажимая кнопку, вы соглашаетесь с <a href="https://realyhelp.ru/policy/" target="_blank" rel="noopener">политикой конфиденциальности</a></p>';
        var input = body.querySelector('input');
        var err = body.querySelector('.error');
        var btn = body.querySelector('.btn');
        maskPhone(input);
        btn.onclick = function () {
          if (!phoneOk(input.value)) { input.classList.add('invalid'); err.classList.remove('hidden'); return; }
          btn.disabled = true;
          btn.textContent = 'Отправляем…';
          sendLead(input.value, 'Квиз: ' + answers.join('; '), function () {
            step = 0; answers = []; render();
          });
        };
        body.appendChild(backBtn());
      }
    }
    function backBtn() {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'back';
      b.textContent = '← Назад';
      b.onclick = function () { step--; render(); };
      return b;
    }
    render();
  }

  // Modal
  var modal = document.getElementById('modal');
  if (modal) {
    var title = modal.querySelector('.modal-title');
    var input = modal.querySelector('input');
    var err = modal.querySelector('.error');
    var btn = modal.querySelector('.btn');
    maskPhone(input);
    document.querySelectorAll('[data-modal]').forEach(function (el) {
      el.addEventListener('click', function () {
        title.textContent = el.getAttribute('data-modal') || 'Заказать звонок';
        modal.classList.remove('hidden');
        input.focus();
      });
    });
    function close() { modal.classList.add('hidden'); }
    modal.querySelector('.modal-close').onclick = close;
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    btn.onclick = function () {
      if (!phoneOk(input.value)) { input.classList.add('invalid'); err.classList.remove('hidden'); return; }
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = 'Отправляем…';
      sendLead(input.value, 'Форма: ' + title.textContent, function () {
        btn.disabled = false; btn.textContent = label; input.value = ''; err.classList.add('hidden'); close();
      });
    };
  }

  // Calculator
  var calc = document.getElementById('calc');
  if (calc) {
    var fmt = function (n) { return Math.round(n).toLocaleString('ru-RU') + ' ₽'; };
    var price = calc.querySelector('[name=price]');
    var monthly = calc.querySelector('[name=monthly]');
    function upd() {
      var p = +price.value, m = +monthly.value, months = 10;
      var agentPrice = p * 0.96, commission = 100000, waiting = m * months;
      var agentNet = agentPrice - commission - waiting, ourNet = p * 0.94, diff = ourNet - agentNet;
      var set = function (k, v) { calc.querySelector('[data-v=' + k + ']').textContent = v; };
      set('price', fmt(p)); set('monthly', fmt(m));
      set('agentPrice', fmt(agentPrice)); set('commission', '−' + fmt(commission));
      set('waiting', '−' + fmt(waiting)); set('agentNet', fmt(agentNet));
      set('ourNet', fmt(ourNet)); set('ourNet2', fmt(ourNet));
      calc.querySelector('[data-v=verdict]').innerHTML = diff > 0
        ? 'До <b>' + fmt(diff) + '</b> в вашу пользу — и деньги на 6–14 месяцев раньше.'
        : 'Разница в деньгах небольшая, а деньги вы получите <b>на 6–14 месяцев раньше</b>.';
    }
    price.oninput = upd; monthly.oninput = upd; upd();
  }

  // Phone click goal
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () { goal('phoneClick'); });
  });
})();
