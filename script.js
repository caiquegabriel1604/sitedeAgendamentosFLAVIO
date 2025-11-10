function showScreen(name) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(name + "-screen").classList.add("active");
  }
  
  let users = JSON.parse(localStorage.getItem("users")) || [];
  let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
  
  document.getElementById("go-register-prof").onclick = () => showScreen("register-prof");
  document.getElementById("go-register-adm").onclick = () => showScreen("register-adm");
  document.getElementById("go-login1").onclick = () => showScreen("login");
  document.getElementById("go-login2").onclick = () => showScreen("login");
  
  const loginType = document.getElementById("login-type");
  const admCodeInput = document.getElementById("adm-code");
  loginType.addEventListener("change", () => {
    admCodeInput.style.display = (loginType.value === "adm") ? "block" : "none";
  });
  if (loginType.value === "professor") admCodeInput.style.display = "none";
  
  // ===== CADASTRO PROFESSOR =====
  document.getElementById("btn-register-prof").onclick = () => {
    const gmail = document.getElementById("regp-gmail").value;
    const user = document.getElementById("regp-user").value;
    const pass = document.getElementById("regp-pass").value;
    const confirm = document.getElementById("regp-confirm").value;
    if (!gmail || !user || !pass || !confirm) return alert("Preencha todos os campos!");
    if (!gmail.includes("@gmail.com")) return alert("Digite um Gmail válido!");
    if (pass !== confirm) return alert("As senhas não coincidem!");
    users.push({ gmail, user, pass, type: "professor" });
    localStorage.setItem("users", JSON.stringify(users));
    alert("Professor cadastrado!");
    showScreen("login");
  };
  
  // ===== CADASTRO ADM =====
  document.getElementById("btn-register-adm").onclick = () => {
    const gmail = document.getElementById("rega-gmail").value;
    const user = document.getElementById("rega-user").value;
    const pass = document.getElementById("rega-pass").value;
    const confirm = document.getElementById("rega-confirm").value;
    const code = document.getElementById("rega-code").value;
    if (!gmail || !user || !pass || !confirm || !code) return alert("Preencha todos os campos!");
    if (!gmail.includes("@gmail.com")) return alert("Digite um Gmail válido!");
    if (pass !== confirm) return alert("As senhas não coincidem!");
    if (code !== "160409") return alert("Código ADM incorreto!");
    users.push({ gmail, user, pass, type: "adm" });
    localStorage.setItem("users", JSON.stringify(users));
    alert("ADM cadastrado!");
    showScreen("login");
  };
  
  // ===== LOGIN =====
  document.getElementById("btn-login").onclick = () => {
    const user = document.getElementById("login-user").value;
    const pass = document.getElementById("login-pass").value;
    const type = document.getElementById("login-type").value;
    const code = document.getElementById("adm-code").value;
    const found = users.find(u => u.user === user && u.pass === pass && u.type === type);
    if (!found) return alert("Usuário ou senha incorretos!");
    if (type === "adm" && code !== "160409") return alert("Código ADM incorreto!");
    localStorage.setItem("logged", JSON.stringify(found));
    initSystem();
  };
  
  // ===== SISTEMA =====
  const horariosPadrao = [
    "07:10 - 08:00","08:00 - 08:50","08:50 - 09:40",
    "09:55 - 10:45","10:45 - 11:35","11:35 - 12:25"
  ];
  
  function initSystem() {
    const user = JSON.parse(localStorage.getItem("logged"));
    if (!user) return;
    if (user.type === "professor") {
      showScreen("professor");
      renderHorarios();
      renderPainelProfessor();
    } else {
      showScreen("adm");
      renderPainelAdm();
    }
  }
  
  // ===== PROFESSOR =====
  function renderHorarios() {
    const div = document.getElementById("horarios");
    div.innerHTML = "";
    const data = document.getElementById("prof-data").value;
  
    horariosPadrao.forEach(h => {
      const btn = document.createElement("button");
      btn.textContent = h;
      btn.classList.add("horario-btn");
  
      const bloqueado = agendamentos.some(a => a.data === data && a.horario === h && a.status === "aceito");
  
      if (bloqueado) {
        btn.disabled = true;
        btn.classList.add("ocupado");
        btn.title = "Horário já reservado";
      }
  
      btn.onclick = () => {
        const nome = document.getElementById("prof-nome").value;
        const turma = document.getElementById("prof-turma").value;
        const materia = document.getElementById("prof-materia").value;
        const data = document.getElementById("prof-data").value;
        const user = JSON.parse(localStorage.getItem("logged"));
        if (!nome || !turma || !materia || !data) return alert("Preencha todos os campos!");
  
        const conflito = agendamentos.find(a => a.data === data && a.horario === h && a.status === "aceito");
        if (conflito) return alert("Esse horário já foi reservado e aceito!");
  
        agendamentos.push({ nome, turma, materia, data, horario: h, professor: user.user, status: "pendente" });
        localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
        alert("Agendamento solicitado!");
        renderPainelProfessor();
        renderHorarios();
      };
      div.appendChild(btn);
    });
  
    document.getElementById("prof-data").onchange = renderHorarios;
  }
  
  function renderPainelProfessor() {
    const user = JSON.parse(localStorage.getItem("logged"));
    const meus = agendamentos.filter(a => a.professor === user.user);
    const outros = agendamentos.filter(a => a.professor !== user.user && a.status === "aceito");
    const meusDiv = document.getElementById("meus-agendamentos");
    const outrosDiv = document.getElementById("outros-agendamentos");
  
    meusDiv.innerHTML = meus.length ? "" : "<p>Nenhum agendamento ainda.</p>";
    meus.forEach(a => {
      const p = document.createElement("p");
      p.innerHTML = `<b>${a.data}</b> - ${a.horario} - ${a.materia} (${a.turma}) - <i>${a.status}</i>`;
      meusDiv.appendChild(p);
    });
  
    outrosDiv.innerHTML = outros.length ? "" : "<p>Nenhum outro agendamento ativo.</p>";
    outros.forEach(a => {
      const p = document.createElement("p");
      p.innerHTML = `<b>${a.data}</b> - ${a.horario} - ${a.nome} (${a.turma}) - ${a.materia}`;
      outrosDiv.appendChild(p);
    });
  }
  
  // ===== ADM =====
  function renderPainelAdm() {
    const pend = document.getElementById("pendentes");
    const aceitos = document.getElementById("aceitos");
    const recusados = document.getElementById("recusados");
    const todos = document.getElementById("todos");
  
    pend.innerHTML = aceitos.innerHTML = recusados.innerHTML = todos.innerHTML = "";
  
    agendamentos.forEach((a, i) => {
      const bloco = `<p><b>${a.nome}</b> (${a.turma}) - ${a.materia}<br>Data: ${a.data}<br>Horário: ${a.horario}</p>`;
      if (a.status === "pendente") {
        const div = document.createElement("div");
        div.innerHTML = bloco + `<button onclick="aceitar(${i})">Aceitar</button> <button onclick="recusar(${i})">Recusar</button>`;
        pend.appendChild(div);
      }
      if (a.status === "aceito") aceitos.innerHTML += bloco;
      if (a.status.startsWith("recusado")) recusados.innerHTML += bloco + `<p style="color:red"><b>Motivo:</b> ${a.status.split("(")[1].replace(")","")}</p>`;
      todos.innerHTML += bloco;
    });
  }
  
  function aceitar(i) {
    agendamentos[i].status = "aceito";
    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
    renderPainelAdm();
  }
  
  function recusar(i) {
    const motivo = prompt("Motivo da recusa:");
    agendamentos[i].status = `recusado (${motivo})`;
    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
    renderPainelAdm();
  }
  
  // ===== SAIR =====
  document.getElementById("btn-voltar1").onclick = logout;
  document.getElementById("btn-voltar2").onclick = logout;
  function logout() {
    localStorage.removeItem("logged");
    showScreen("login");
  }
  
  // ===== ACESSIBILIDADE =====
  document.getElementById("btn-darkmode").onclick = () => {
    document.body.classList.toggle("dark-mode");
  };
  document.getElementById("btn-daltonic").onclick = () => {
    document.body.classList.toggle("daltonic-mode");
  };
  