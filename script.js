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
  { id: 'lead-clientes',    rotulo: 'quantos clientes você atende por mês' },
  { id: 'lead-equipe',      rotulo: 'quantas pessoas trabalham na empresa' },
  { id: 'lead-organizacao', rotulo: 'como você se organiza hoje' }
];

/* Campos enviados na mensagem (independente de serem obrigatórios). */
var CAMPOS_MENSAGEM = [
  { id: 'lead-cidade',      prefixo: 'Cidade' },
  { id: 'lead-clientes',    prefixo: 'Clientes/mês' },
  { id: 'lead-equipe',      prefixo: 'Equipe' },
  { id: 'lead-organizacao', prefixo: 'Se organiza com' }
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

  linhas.push('Quero conhecer o Vectari.');
  return linhas.join('\n');
}

/* ─── Modal ────────────────────────────────────────────────── */

var modalEl, focoAnterior;

function ctaClick() {
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

  /* ─── Reveal on scroll (comportamento original) ─── */
  function check() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll('[data-reveal]:not(.in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh - 60 && r.bottom > 0) el.classList.add('in');
    });
  }
  requestAnimationFrame(check);
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
});
