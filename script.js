/* ───────────────────────────────────────────────────────────────
   Captura de ICP antes do WhatsApp.
   Sem backend: os dados viajam dentro da própria mensagem do wa.me.
   ─────────────────────────────────────────────────────────────── */

var WHATSAPP_NUMERO = '5588999112573';

/* ╔═══════════════════════════════════════════════════════════╗
   ║  ÚNICO PONTO DE VALIDAÇÃO                                 ║
   ║                                                           ║
   ║  Cada item desta lista é um campo OBRIGATÓRIO.            ║
   ║  Para tornar um campo opcional, basta apagar (ou comentar)║
   ║  a linha correspondente. Nada mais precisa ser mexido.    ║
   ║  Para exigir todos de novo, é só devolver a linha.        ║
   ╚═══════════════════════════════════════════════════════════╝ */
var CAMPOS_OBRIGATORIOS = [
  { id: 'lead-nome',        rotulo: 'seu nome' },
  { id: 'lead-cidade',      rotulo: 'sua cidade ou região' },
  { id: 'lead-clientes',    rotulo: 'quantos contratos com comércio você tem' },
  { id: 'lead-equipe',      rotulo: 'quantas pessoas trabalham na empresa' },
  { id: 'lead-organizacao', rotulo: 'onde ficam hoje os certificados' }
];

/* Campos enviados na mensagem (independente de serem obrigatórios). */
var CAMPOS_MENSAGEM = [
  { id: 'lead-cidade',      prefixo: 'Cidade' },
  { id: 'lead-clientes',    prefixo: 'Contratos com comércio' },
  { id: 'lead-equipe',      prefixo: 'Equipe' },
  { id: 'lead-organizacao', prefixo: 'Certificados e histórico em' }
];

/* ─── Abertura do WhatsApp ─────────────────────────────────── */

function abrirWhatsApp(mensagem) {
  window.open(
    'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(mensagem),
    '_blank'
  );
}

function montarMensagem() {
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  var nome = val('lead-nome');
  var linhas = [
    nome
      ? 'Olá! Sou ' + nome + ' e vim pela landing do Vectari.'
      : 'Olá! Vim pela landing do Vectari.'
  ];

  CAMPOS_MENSAGEM.forEach(function (campo) {
    var v = val(campo.id);
    if (v) linhas.push(campo.prefixo + ': ' + v);
  });

  linhas.push('Quero saber da vaga de fundador do Vectari.');
  return linhas.join('\n');
}

/* ─── Modal ────────────────────────────────────────────────── */

var modalEl, focoAnterior;

function ctaClick() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'cta_click' });
  abrirModal();
}

function abrirModal() {
  modalEl = modalEl || document.getElementById('lead-modal');
  if (!modalEl) return abrirWhatsApp(montarMensagem()); // fallback: sem modal, vai direto

  focoAnterior = document.activeElement;
  modalEl.hidden = false;
  document.body.classList.add('modal-aberto');

  var primeiro = document.getElementById('lead-nome');
  if (primeiro) primeiro.focus();
}

function fecharModal() {
  if (!modalEl || modalEl.hidden) return;
  modalEl.hidden = true;
  document.body.classList.remove('modal-aberto');
  limparErro();
  if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
}

function mostrarErro(texto) {
  var erro = document.getElementById('lead-erro');
  if (!erro) return;
  erro.textContent = texto;
  erro.hidden = false;
}

function limparErro() {
  var erro = document.getElementById('lead-erro');
  if (erro) { erro.hidden = true; erro.textContent = ''; }
  document.querySelectorAll('#lead-form .invalido').forEach(function (el) {
    el.classList.remove('invalido');
  });
}

/* Valida com base em CAMPOS_OBRIGATORIOS. Devolve o 1º campo vazio, ou null. */
function primeiroCampoInvalido() {
  for (var i = 0; i < CAMPOS_OBRIGATORIOS.length; i++) {
    var campo = CAMPOS_OBRIGATORIOS[i];
    var el = document.getElementById(campo.id);
    if (el && !el.value.trim()) return { el: el, rotulo: campo.rotulo };
  }
  return null;
}

/* ─── Ligações de evento ───────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  modalEl = document.getElementById('lead-modal');

  var form = document.getElementById('lead-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      limparErro();

      var invalido = primeiroCampoInvalido();
      if (invalido) {
        invalido.el.classList.add('invalido');
        invalido.el.focus();
        mostrarErro('Preencha ' + invalido.rotulo + ' para continuar.');
        return;
      }

      /* Só os selects: nome e cidade não vão para o analytics. */
      function valorSelect(id) {
        var el = document.getElementById(id);
        return el ? el.value : '';
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'lead_whatsapp',
        lead_clientes: valorSelect('lead-clientes'),
        lead_equipe: valorSelect('lead-equipe'),
        lead_organizacao: valorSelect('lead-organizacao')
      });

      abrirWhatsApp(montarMensagem());
      fecharModal();
    });

    /* Some com o erro assim que a pessoa corrige. */
    form.addEventListener('input', limparErro);
    form.addEventListener('change', limparErro);
  }

  var fechar = document.getElementById('lead-modal-close');
  if (fechar) fechar.addEventListener('click', fecharModal);

  /* Clique no overlay (fora do card) fecha. */
  if (modalEl) {
    modalEl.addEventListener('mousedown', function (e) {
      if (e.target === modalEl) fecharModal();
    });
  }

  /* ESC fecha; Tab fica preso dentro do modal. */
  document.addEventListener('keydown', function (e) {
    if (!modalEl || modalEl.hidden) return;

    if (e.key === 'Escape') { fecharModal(); return; }

    if (e.key === 'Tab') {
      var focaveis = modalEl.querySelectorAll('button, input, select, textarea, a[href]');
      if (!focaveis.length) return;
      var primeiro = focaveis[0];
      var ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault(); ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault(); primeiro.focus();
      }
    }
  });

  /* ─── Simulador "Faça a conta": horas/semana → dias/ano ─── */
  var chips = document.querySelectorAll('.chip[data-horas]');
  var saidaDias = document.getElementById('calc-dias');
  var saidaHoras = document.getElementById('calc-horas');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var horasSemana = Number(chip.getAttribute('data-horas'));
      var horasAno = horasSemana * 52;
      var dias = Math.round(horasAno / 8);
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      if (saidaDias) saidaDias.textContent = dias + ' dias';
      if (saidaHoras) saidaHoras.textContent = horasAno + ' horas';
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'calc_horas', calc_horas_semana: horasSemana });
    });
  });

  var semAnimacao = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temIO = 'IntersectionObserver' in window;

  /* ─── Faixa "Um dia de visitas": conclui uma por vez e recomeça.
         Só roda enquanto a faixa está visível na tela. ─── */
  var faixa = document.querySelector('.day-band');
  var visitas = document.querySelectorAll('.day-visit');
  if (faixa && visitas.length) {
    if (semAnimacao) {
      visitas.forEach(function (v) { v.classList.add('done'); });
    } else {
      var passo = 0, timer = null;
      var tick = function () {
        if (passo < visitas.length) {
          visitas[passo].classList.add('done');
        } else if (passo === visitas.length + 2) {
          visitas.forEach(function (v) { v.classList.remove('done'); });
          passo = -1;
        }
        passo++;
      };
      var ligar = function () { if (!timer) { tick(); timer = setInterval(tick, 1200); } };
      var desligar = function () { clearInterval(timer); timer = null; };
      if (temIO) {
        new IntersectionObserver(function (entries) {
          entries[0].isIntersecting ? ligar() : desligar();
        }).observe(faixa);
      } else {
        ligar();
      }
    }
  }

  /* ─── Elementos aparecem conforme o scroll ───────────────────
     [data-reveal]  → o bloco sobe e aparece ao entrar na tela.
     [data-stagger] → os filhos aparecem um depois do outro.
     A classe .js (posta no <head>) garante que, sem JavaScript,
     nada fica escondido. */
  document.querySelectorAll('[data-stagger]').forEach(function (grupo) {
    Array.prototype.forEach.call(grupo.children, function (filho, n) {
      filho.style.setProperty('--d', n);
    });
  });

  var alvos = document.querySelectorAll('[data-reveal], [data-stagger]');
  if (semAnimacao || !temIO) {
    alvos.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    alvos.forEach(function (el) { io.observe(el); });
  }
});
