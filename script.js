// script.js - versão melhorada (acessibilidade e painel ADM funcional)
//
// Modelo de dados (localStorage):
// users: [{ gmail, user, pass, type }]
// agendamentos: [{ id, nome, turma, materia, data, horario, professor, status, reason, createdAt }]
// logged: { gmail, user, pass, type }

// ---------- util ----------
const $ = id => document.getElementById(id);
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = k => JSON.parse(localStorage.getItem(k) || "null");
const nowISO = () => new Date().toISOString();
const createId = () => 'a' + Date.now() + Math.floor(Math.random()*1000);

// ---------- dados iniciais ----------
let users = JSON.parse(localStorage.getItem("users")) || [];
let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

// ---------- hooks de navegação ----------
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(name + "-screen");
  if (el) {
    el.classList.add("active");
    el.querySelectorAll("input, button, select, textarea").forEach(i => i.setAttribute("tabindex","0"));
    // mover foco principal para o título
    const focusTarget = el.querySelector("h2, h1");
    if (focusTarget) focusTarget.focus();
  }
}

$("go-register-prof").onclick = () => showScreen("register-prof");
$("go-register-adm").onclick = () => showScreen("register-adm");
$("go-login1").onclick = (e)=>{ e.preventDefault(); showScreen("login"); };
$("go-login2").onclick = (e)=>{ e.preventDefault(); showScreen("login"); };

// adm code display
const loginType = $("login-type");
const admCodeInput = $("adm-code");
loginType.addEventListener("change", () => {
  if (loginType.value === "adm") {
    admCodeInput.style.display = "block";
    admCodeInput.setAttribute("aria-hidden","false");
  } else {
    admCodeInput.style.display = "none";
    admCodeInput.setAttribute("aria-hidden","true");
  }
});
if (loginType.value === "professor") admCodeInput.style.display = "none";

// ---------- cadastro professor ----------
$("btn-register-prof").onclick = () => {
  const gmail = $("regp-gmail").value.trim();
  const user = $("regp-user").value.trim();
  const pass = $("regp-pass").value;
  const confirm = $("regp-confirm").value;
  if (!gmail || !user || !pass || !confirm) return alert("Preencha todos os campos!");
  if (!gmail.includes("@")) return alert("Digite um Gmail válido!");
  if (pass !== confirm) return alert("As senhas não coincidem!");
  if (users.some(u => u.user === user)) return alert("Nome de usuário já existe!");
  users.push({ gmail, user, pass, type: "professor" });
  save("users", users);
  alert("Professor cadastrado!");
  showScreen("login");
};

// ---------- cadastro adm ----------
$("btn-register-adm").onclick = () => {
  const gmail = $("rega-gmail").value.trim();
  const user = $("rega-user").value.trim();
  const pass = $("rega-pass").value;
  const confirm = $("rega-confirm").value;
  const code = $("rega-code").value;
  if (!gmail || !user || !pass || !confirm || !code) return alert("Preencha todos os campos!");
  if (!gmail.includes("@")) return alert("Digite um Gmail válido!");
  if (pass !== confirm) return alert("As senhas não coincidem!");
  if (code !== "160409") return alert("Código ADM incorreto!");
  if (users.some(u => u.user === user)) return alert("Nome de usuário já existe!");
  users.push({ gmail, user, pass, type: "adm" });
  save("users", users);
  alert("ADM cadastrado!");
  showScreen("login");
};

// ---------- login ----------
$("btn-login").onclick = () => {
  const user = $("login-user").value.trim();
  const pass = $("login-pass").value;
  const type = $("login-type").value;
  const code = $("adm-code").value;
  const found = users.find(u => u.user === user && u.pass === pass && u.type === type);
  if (!found) return alert("Usuário ou senha incorretos!");
  if (type === "adm" && code !== "160409") return alert("Código ADM incorreto!");
  localStorage.setItem("logged", JSON.stringify(found));
  initSystem();
};

// ---------- inicialização ----------
const horariosPadrao = [
  "07:10 - 08:00","08:00 - 08:50","08:50 - 09:40",
  "09:55 - 10:45","10:45 - 11:35","11:35 - 12:25"
];

function initSystem(){
  const user = load("logged");
  if (!user) { showScreen("login"); return; }
  if (user.type === "professor") {
    showScreen("professor");
    renderHorarios();
    renderPainelProfessor();
    // prefills (if available)
    $("prof-nome").value = user.user;
  } else {
    showScreen("adm");
    renderPainelAdm();
  }
  announce(`Bem-vindo ${user.user}. você está logado como ${user.type}.`);
}

// ---------- renderização horários (professor) ----------
function renderHorarios() {
  const div = $("horarios");
  div.innerHTML = "";
  const data = $("prof-data").value;
  horariosPadrao.forEach(h => {
    const btn = document.createElement("button");
    btn.className = "horario-btn";
    btn.textContent = h;
    btn.setAttribute("role","button");
    btn.setAttribute("aria-label", `Agendar horário ${h}`);
    // bloqueio se já aceito
    const bloqueado = agendamentos.some(a => a.data === data && a.horario === h && a.status === "aceito");
    if (bloqueado) {
      btn.disabled = true;
      btn.title = "Horário já reservado";
    }
    btn.addEventListener("click", () => handleSolicitarHorario(h));
    div.appendChild(btn);
  });
}

// função para solicitar horário
function handleSolicitarHorario(horario) {
  const nome = $("prof-nome").value.trim();
  const turma = $("prof-turma").value.trim();
  const materia = $("prof-materia").value.trim();
  const data = $("prof-data").value;
  const user = load("logged");
  if (!nome || !turma || !materia || !data) return alert("Preencha todos os campos do formulário!");
  // checar conflito com aceitos
  const conflito = agendamentos.find(a => a.data === data && a.horario === horario && a.status === "aceito");
  if (conflito) return alert("Esse horário já foi reservado e aceito!");
  const ag = {
    id: createId(),
    nome,
    turma,
    materia,
    data,
    horario,
    professor: user.user,
    status: "pendente",
    reason: "",
    createdAt: nowISO()
  };
  agendamentos.push(ag);
  save("agendamentos", agendamentos);
  renderPainelProfessor();
  renderHorarios();
  announce(`Agendamento solicitado para ${data} às ${horario}. Aguardando aprovação do administrador.`);
  alert("Agendamento solicitado! Aguarde a resposta do ADM.");
}

// atualizar painel do professor
function renderPainelProfessor() {
  const user = load("logged");
  const meus = agendamentos.filter(a => a.professor === user.user).sort((a,b)=> b.createdAt.localeCompare(a.createdAt));
  const outros = agendamentos.filter(a => a.professor !== user.user && a.status === "aceito");
  const meusDiv = $("meus-agendamentos");
  const outrosDiv = $("outros-agendamentos");
  meusDiv.innerHTML = meus.length ? "" : "<p>Nenhum agendamento ainda.</p>";
  meus.forEach(a => {
    const card = makeAgendamentoCard(a, { showAdminControls:false, showReason:true });
    meusDiv.appendChild(card);
  });
  outrosDiv.innerHTML = outros.length ? "" : "<p>Nenhum outro agendamento ativo.</p>";
  outros.forEach(a => {
    const card = makeAgendamentoCard(a, { showAdminControls:false, showReason:false });
    outrosDiv.appendChild(card);
  });
}

// ---------- ADM ----------

$("adm-search").addEventListener("input", renderPainelAdm);
$("adm-filter").addEventListener("change", renderPainelAdm);

function renderPainelAdm(){
  const pend = $("pendentes");
  const aceitos = $("aceitos");
  const recusados = $("recusados");
  const todos = $("todos");
  pend.innerHTML = aceitos.innerHTML = recusados.innerHTML = todos.innerHTML = "";

  const query = $("adm-search").value.trim().toLowerCase();
  const filter = $("adm-filter").value;

  const listado = agendamentos
    .filter(a => {
      if (filter !== "all" && a.status !== filter) return false;
      if (!query) return true;
      return [a.nome, a.turma, a.materia, a.professor, a.data, a.horario].some(field => String(field).toLowerCase().includes(query));
    })
    .sort((a,b)=> a.createdAt.localeCompare(b.createdAt));

  listado.forEach(a => {
    const card = makeAgendamentoCard(a, { showAdminControls:true, showReason:true });
    // colocar na coluna correta
    if (a.status === "pendente") pend.appendChild(card);
    else if (a.status === "aceito") aceitos.appendChild(card);
    else if (a.status.startsWith("recusado")) recusados.appendChild(card);
    todos.appendChild(makeAgendamentoCard(a, { showAdminControls:false, showReason:true }));
  });

  if (!pend.hasChildNodes()) pend.innerHTML = "<p>Sem pendências.</p>";
  if (!aceitos.hasChildNodes()) aceitos.innerHTML = "<p>Sem agendamentos aceitos.</p>";
  if (!recusados.hasChildNodes()) recusados.innerHTML = "<p>Sem recusas.</p>";
  if (!todos.hasChildNodes()) todos.innerHTML = "<p>Sem agendamentos.</p>";
}

// helper para criar card de agendamento
function makeAgendamentoCard(a, opts = {}) {
  const template = $("agendamento-template");
  const node = template.content.cloneNode(true);
  const article = node.querySelector(".agendamento");
  article.querySelector(".nome").textContent = a.nome;
  article.querySelector(".turma").textContent = `(${a.turma})`;
  article.querySelector(".data").textContent = a.data;
  article.querySelector(".horario").textContent = a.horario;
  article.querySelector(".materia").textContent = a.materia;

  const statusRow = article.querySelector(".status-row");
  // status badge
  const badge = document.createElement("span");
  badge.classList.add("badge");
  badge.classList.add(a.status === "pendente" ? "pendente" : a.status === "aceito" ? "aceito" : "recusado");
  badge.textContent = a.status === "pendente" ? "Pendente" : a.status === "aceito" ? "Aceito" : "Recusado";
  statusRow.appendChild(badge);

  // info meta
  const metaInfo = document.createElement("small");
  metaInfo.style.marginLeft = "8px";
  metaInfo.style.color = "var(--muted)";
  metaInfo.textContent = `Solicitado em ${new Date(a.createdAt).toLocaleString()}`;
  statusRow.appendChild(metaInfo);

  // mostrar motivo, se houver
  if (opts.showReason && a.reason) {
    const reasonEl = document.createElement("div");
    reasonEl.style.marginTop = "8px";
    reasonEl.innerHTML = `<strong>Motivo:</strong> ${a.reason}`;
    article.appendChild(reasonEl);
  }

  // admin controls (aceitar/recusar)
  if (opts.showAdminControls) {
    const acceptBtn = document.createElement("button");
    acceptBtn.textContent = "Aceitar";
    acceptBtn.className = "primary";
    acceptBtn.onclick = () => aceitarAgendamento(a.id);
    acceptBtn.setAttribute("aria-label", `Aceitar agendamento de ${a.nome} em ${a.data} ${a.horario}`);

    const recuseBtn = document.createElement("button");
    recuseBtn.textContent = "Recusar";
    recuseBtn.className = "secondary";
    recuseBtn.onclick = () => recusarAgendamento(a.id);
    recuseBtn.setAttribute("aria-label", `Recusar agendamento de ${a.nome} em ${a.data} ${a.horario}`);

    // mostrar apenas quando está pendente
    if (a.status === "pendente") {
      statusRow.appendChild(acceptBtn);
      statusRow.appendChild(recuseBtn);
    } else {
      // permitir reverter aceito->pendente ou recusa->pendente via confirmação
      const revertBtn = document.createElement("button");
      revertBtn.textContent = "Reverter para pendente";
      revertBtn.className = "link-like";
      revertBtn.onclick = () => revertToPending(a.id);
      statusRow.appendChild(revertBtn);
    }
  }

  // small keyboard focus
  article.tabIndex = 0;
  article.classList.add("card");

  return article;
}

// aceitar agendamento
function aceitarAgendamento(id) {
  const idx = agendamentos.findIndex(x=>x.id===id);
  if (idx === -1) return alert("Agendamento não encontrado");
  // verificar conflitos antes de aceitar
  const a = agendamentos[idx];
  const conflito = agendamentos.find(x => x.id !== a.id && x.data === a.data && x.horario === a.horario && x.status === "aceito");
  if (conflito) {
    alert(`Não é possível aceitar. O horário já foi aceito para ${conflito.nome}.`);
    return;
  }
  if (!confirm(`Aceitar agendamento de ${a.nome} em ${a.data} ${a.horario}?`)) return;
  agendamentos[idx].status = "aceito";
  agendamentos[idx].reason = "";
  save("agendamentos", agendamentos);
  renderPainelAdm();
  renderPainelProfessor();
  renderHorarios();
  announce(`Agendamento de ${a.nome} em ${a.data} ${a.horario} aceito.`);
}

// recusar com motivo
function recusarAgendamento(id) {
  const idx = agendamentos.findIndex(x=>x.id===id);
  if (idx === -1) return alert("Agendamento não encontrado");
  const motivo = prompt("Motivo da recusa (opcional):", "");
  if (motivo === null) return; // cancelou
  agendamentos[idx].status = `recusado`;
  agendamentos[idx].reason = motivo || "Sem motivo informado";
  save("agendamentos", agendamentos);
  renderPainelAdm();
  renderPainelProfessor();
  renderHorarios();
  announce(`Agendamento de ${agendamentos[idx].nome} em ${agendamentos[idx].data} ${agendamentos[idx].horario} foi recusado.`);
}

// reverter para pendente
function revertToPending(id) {
  const idx = agendamentos.findIndex(x=>x.id===id);
  if (idx === -1) return;
  if (!confirm("Reverter esse agendamento para pendente?")) return;
  agendamentos[idx].status = "pendente";
  agendamentos[idx].reason = "";
  save("agendamentos", agendamentos);
  renderPainelAdm();
  renderPainelProfessor();
  renderHorarios();
  announce("Agendamento revertido para pendente.");
}

// ---------- logout ----------
$("btn-logout-prof").onclick = logout;
$("btn-logout-adm").onclick = logout;
function logout(){
  localStorage.removeItem("logged");
  showScreen("login");
  announce("Sessão encerrada.");
}

// ---------- acessibilidade e preferências ----------
$("btn-darkmode").onclick = () => {
  document.body.classList.toggle("dark-mode");
  const pressed = document.body.classList.contains("dark-mode");
  $("btn-darkmode").setAttribute("aria-pressed", pressed);
  localStorage.setItem("pref_dark", pressed ? "1" : "0");
};
$("btn-daltonic").onclick = () => {
  document.body.classList.toggle("daltonic-mode");
  const pressed = document.body.classList.contains("daltonic-mode");
  $("btn-daltonic").setAttribute("aria-pressed", pressed);
  localStorage.setItem("pref_daltonic", pressed ? "1" : "0");
};
// aplicar preferências salvas
if (localStorage.getItem("pref_dark") === "1") document.body.classList.add("dark-mode");
if (localStorage.getItem("pref_daltonic") === "1") document.body.classList.add("daltonic-mode");

// anúncio para leitores de tela
function announce(text) {
  const el = $("sr-status");
  el.textContent = "";
  setTimeout(()=> el.textContent = text, 50);
}

// ---------- init ----------
document.addEventListener("DOMContentLoaded", () => {
  // carregar agendamentos/users já salvos
  users = JSON.parse(localStorage.getItem("users")) || users;
  agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || agendamentos;
  initSystem();
  // re-render quando data muda
  $("prof-data").addEventListener("change", renderHorarios);
});
