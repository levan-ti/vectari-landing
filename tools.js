/* Ferramentas grátis (modelo de OS, modelo de comprovante, calculadora).
   Tudo roda no navegador: nada do que a pessoa digita sai da página. */

(function () {
  var brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function track(evento, extra) {
    window.dataLayer = window.dataLayer || [];
    var dados = { event: evento };
    for (var k in extra || {}) dados[k] = extra[k];
    window.dataLayer.push(dados);
  }

  function num(v) {
    // Campos type="number" já entregam "1.5"; vírgula só aparece se digitada em texto.
    var n = parseFloat(String(v || "").replace(",", "."));
    return isFinite(n) ? n : 0;
  }

  function formatar(valor, fmt) {
    if (!valor) return "";
    if (fmt === "date") {
      var p = valor.split("-");
      return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : valor;
    }
    if (fmt === "brl") return brl.format(num(valor));
    if (fmt === "dias") return valor + " dias";
    return valor;
  }

  function escrever(el, texto) {
    var vazio = !texto;
    el.textContent = vazio ? el.getAttribute("data-ph") || "—" : texto;
    el.classList.toggle("doc-empty", vazio);
  }

  /* ─── Documento (OS e comprovante) ─────────────────────────── */
  var form = document.querySelector("[data-doc-form]");
  if (form) {
    var tracked = false;

    function valorDe(chave) {
      var grupo = form.querySelectorAll('input[type="checkbox"][data-k="' + chave + '"]');
      if (grupo.length) {
        var marcados = [];
        grupo.forEach(function (c) {
          if (c.checked) marcados.push(c.value);
        });
        var outro = form.querySelector('[data-k="' + chave + '_outro"]');
        if (outro && outro.value.trim()) marcados.push(outro.value.trim());
        return marcados.join(", ");
      }
      var campo = form.querySelector('[data-k="' + chave + '"]');
      if (!campo) return "";
      return formatar(campo.value.trim(), campo.getAttribute("data-fmt"));
    }

    function atualizarProdutos() {
      var corpo = document.querySelector("[data-produtos-out]");
      if (!corpo) return;
      corpo.innerHTML = "";
      var linhas = form.querySelectorAll(".product-row");
      var algum = false;
      linhas.forEach(function (linha) {
        var tr = document.createElement("tr");
        var preenchida = false;
        ["produto", "principio", "grupo", "concentracao", "quantidade"].forEach(function (c) {
          var td = document.createElement("td");
          var campo = linha.querySelector('[data-p="' + c + '"]');
          var v = campo ? campo.value.trim() : "";
          if (v) preenchida = true;
          td.textContent = v;
          tr.appendChild(td);
        });
        if (preenchida || linhas.length === 1) {
          corpo.appendChild(tr);
          algum = true;
        }
      });
      if (!algum) {
        var tr = document.createElement("tr");
        for (var i = 0; i < 5; i++) tr.appendChild(document.createElement("td"));
        corpo.appendChild(tr);
      }
    }

    function atualizar() {
      document.querySelectorAll("[data-o]").forEach(function (el) {
        escrever(el, valorDe(el.getAttribute("data-o")));
      });
      atualizarProdutos();
    }

    form.addEventListener("input", function () {
      atualizar();
      if (!tracked) {
        tracked = true;
        track("tool_start", { tool: form.getAttribute("data-doc-form") });
      }
    });
    form.addEventListener("change", atualizar);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
    });

    // Data de hoje como padrão
    form.querySelectorAll('input[type="date"][data-today]').forEach(function (d) {
      if (!d.value) {
        var hoje = new Date();
        var mes = String(hoje.getMonth() + 1).padStart(2, "0");
        var dia = String(hoje.getDate()).padStart(2, "0");
        d.value = hoje.getFullYear() + "-" + mes + "-" + dia;
      }
    });

    // Logo: lido localmente, nunca enviado
    var logoInput = form.querySelector("[data-logo-input]");
    var logoImg = document.querySelector("[data-logo]");
    if (logoInput && logoImg) {
      logoInput.addEventListener("change", function () {
        var arquivo = logoInput.files && logoInput.files[0];
        if (!arquivo || !/^image\//.test(arquivo.type)) {
          logoImg.hidden = true;
          logoImg.removeAttribute("src");
          return;
        }
        var leitor = new FileReader();
        leitor.onload = function () {
          logoImg.src = leitor.result;
          logoImg.hidden = false;
        };
        leitor.readAsDataURL(arquivo);
      });
    }

    // Linhas de produto (comprovante)
    var addBtn = form.querySelector("[data-add-produto]");
    var lista = form.querySelector("[data-produtos]");
    if (addBtn && lista) {
      addBtn.addEventListener("click", function () {
        var modelo = lista.querySelector(".product-row");
        var nova = modelo.cloneNode(true);
        nova.querySelectorAll("input").forEach(function (i) {
          i.value = "";
          if (i.id) i.id = i.id.replace(/\d+$/, "") + (lista.children.length + 1);
        });
        nova.querySelectorAll("label[for]").forEach(function (l) {
          l.htmlFor = l.htmlFor.replace(/\d+$/, "") + (lista.children.length + 1);
        });
        lista.appendChild(nova);
        atualizar();
        var primeiro = nova.querySelector("input");
        if (primeiro) primeiro.focus();
      });
      lista.addEventListener("click", function (e) {
        var btn = e.target.closest(".remove-row");
        if (!btn) return;
        if (lista.children.length > 1) btn.closest(".product-row").remove();
        else btn.closest(".product-row").querySelectorAll("input").forEach(function (i) { i.value = ""; });
        atualizar();
      });
    }

    document.querySelectorAll("[data-print]").forEach(function (b) {
      b.addEventListener("click", function () {
        track("tool_print", { tool: form.getAttribute("data-doc-form") });
        window.print();
      });
    });

    atualizar();
  }

  /* ─── Calculadora de preço ─────────────────────────────────── */
  var calc = document.querySelector("[data-calc]");
  if (calc) {
    var usou = false;
    function v(id) {
      var el = document.getElementById(id);
      return el ? num(el.value) : 0;
    }
    function set(id, texto) {
      var el = document.getElementById(id);
      if (el) el.textContent = texto;
    }

    function calcular() {
      var produto = v("c-produto");
      var horas = v("c-horas");
      var tecnicos = Math.max(1, v("c-tecnicos"));
      var custoHora = v("c-custo-hora");
      var km = v("c-km");
      var custoKm = v("c-custo-km");
      var fixo = v("c-fixo");
      var imposto = v("c-imposto") / 100;
      var margem = v("c-margem") / 100;
      var area = v("c-area");

      var maoDeObra = horas * tecnicos * custoHora;
      var deslocamento = km * custoKm;
      var custo = produto + maoDeObra + deslocamento + fixo;

      var aviso = document.getElementById("c-aviso");
      var divisor = 1 - imposto - margem;
      if (divisor < 0.05) {
        aviso.hidden = false;
        aviso.textContent = "Imposto + margem passam de 95% do preço. Diminua a margem para ver o cálculo.";
        set("c-preco", "—");
        return;
      }
      aviso.hidden = true;

      var preco = custo / divisor;
      var precoMinimo = imposto < 1 ? custo / (1 - imposto) : custo;

      set("c-preco", brl.format(preco));
      set("c-m2", area > 0 ? brl.format(preco / area) + " por m²" : "informe a área para ver o preço por m²");
      set("c-custo", brl.format(custo));
      set("c-mao", brl.format(maoDeObra));
      set("c-desloc", brl.format(deslocamento));
      set("c-imp", brl.format(preco * imposto));
      set("c-lucro", brl.format(preco * margem));
      set("c-minimo", brl.format(precoMinimo));
    }

    calc.addEventListener("input", function () {
      calcular();
      if (!usou) {
        usou = true;
        track("tool_start", { tool: "calculadora" });
      }
    });
    calc.addEventListener("submit", function (e) {
      e.preventDefault();
    });
    calcular();
  }
})();
