// NazaGarden — interacción de la web.
// Patrón IIFE sin módulos; cada bloque va dentro de safe() para que un fallo no rompa el resto.
// El contenido está escrito en el HTML: el JS solo lo anima. A los 6 s todo lo oculto se muestra igualmente.
(() => {
  const safe = (fn, nombre) => { try { fn(); } catch (e) { console.warn('[nazagarden]', nombre, e); } };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const raiz = document.documentElement;
  raiz.classList.add('js');
  const hayGSAP = !!(window.gsap && window.ScrollTrigger);
  const finoPuntero = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ancho = () => innerWidth;

  // Red de seguridad: pase lo que pase, a los 6 s se muestra todo
  setTimeout(() => {
    raiz.classList.add('listo');
    document.querySelectorAll('.revela:not(.visible), .cierre-titulo:not(.visible), .pie-marca:not(.visible)').forEach((e) => e.classList.add('visible'));
  }, 6000);

  // ---------- telón con contador ----------
  safe(() => {
    const telon = document.getElementById('telon');
    const cifra = document.getElementById('telonCifra');
    const linea = document.getElementById('telonLinea');
    const imgs = [...document.images].filter((i) => !i.loading || i.loading !== 'lazy');
    let cargadas = 0, mostrado = 0, fin = false;
    const total = Math.max(1, imgs.length);
    imgs.forEach((i) => { if (i.complete) cargadas++; else { i.addEventListener('load', () => cargadas++); i.addEventListener('error', () => cargadas++); } });
    const t0 = performance.now();
    const paso = () => {
      const tiempo = clamp((performance.now() - t0) / 1600);
      const meta = Math.min(cargadas / total, tiempo) * 100;
      mostrado = lerp(mostrado, meta, 0.12);
      if (meta >= 99.5 && mostrado > 98.5) mostrado = 100;
      cifra.textContent = String(Math.round(mostrado)).padStart(3, '0');
      linea.style.transform = `scaleX(${mostrado / 100})`;
      if (mostrado >= 100) return salir();
      if (!fin) requestAnimationFrame(paso);
    };
    const salir = () => {
      if (fin) return;
      fin = true;
      telon.classList.add('fuera');
      setTimeout(() => raiz.classList.add('listo'), 250);
      setTimeout(() => telon.remove(), 1300);
    };
    requestAnimationFrame(paso);
    setTimeout(salir, 3800);
  }, 'telón');

  // ---------- barra: cambia de color según la sección y se esconde al bajar ----------
  safe(() => {
    const barra = document.getElementById('barra');
    const claras = [...document.querySelectorAll('.manifiesto, .casa, .paseo, .visita, .preguntas')];
    let ultimo = scrollY;
    const actualizar = () => {
      const y = scrollY;
      barra.classList.toggle('compacta', y > 60);
      barra.classList.toggle('oculta', y > ultimo && y > innerHeight * 0.8 && !document.getElementById('menu').classList.contains('abierto'));
      ultimo = y;
      const mitad = 40;
      barra.classList.toggle('clara', claras.some((s) => { const r = s.getBoundingClientRect(); return r.top <= mitad && r.bottom > mitad; }));
      document.getElementById('whats').classList.toggle('visible', y > innerHeight * 0.9);
    };
    addEventListener('scroll', () => requestAnimationFrame(actualizar), { passive: true });
    actualizar();
    // Enlace activo
    const enlaces = [...document.querySelectorAll('.barra-nav a')];
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) enlaces.forEach((a) => a.classList.toggle('actual', a.getAttribute('href') === `#${e.target.id}`));
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['casa', 'colecciones', 'almanaque', 'visita', 'inicio', 'manifiesto', 'paseo', 'preguntas'].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }, 'barra');

  // ---------- menú ----------
  safe(() => {
    const b = document.getElementById('hamburguesa');
    const menu = document.getElementById('menu');
    const cerrar = () => {
      menu.classList.remove('abierto'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Abrir menú');
      document.body.style.overflow = '';
      setTimeout(() => { if (!menu.classList.contains('abierto')) menu.hidden = true; }, 900);
    };
    b.addEventListener('click', () => {
      if (menu.classList.contains('abierto')) return cerrar();
      menu.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('abierto')));
      b.setAttribute('aria-expanded', 'true'); b.setAttribute('aria-label', 'Cerrar menú');
      document.body.style.overflow = 'hidden';
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', cerrar));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
  }, 'menú');

  // ---------- aparición al entrar en pantalla ----------
  safe(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), { threshold: 0.01, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.revela, .cierre-titulo, .pie-marca').forEach((e) => io.observe(e));
    // Letras del logotipo del pie, escalonadas
    document.querySelectorAll('#pieMarca span').forEach((s, i) => { s.style.transitionDelay = `${i * 0.04}s`; });
  }, 'aparición');

  // ---------- cursor propio ----------
  safe(() => {
    if (!finoPuntero) return;
    raiz.classList.add('con-cursor');
    const c = document.getElementById('cursor');
    const punto = c.querySelector('.cursor-punto'), aro = c.querySelector('.cursor-aro'), texto = document.getElementById('cursorTexto');
    let x = innerWidth / 2, y = innerHeight / 2, ax = x, ay = y;
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    const bucle = () => {
      ax = lerp(ax, x, 0.16); ay = lerp(ay, y, 0.16);
      punto.style.transform = `translate(${x}px, ${y}px)`;
      aro.style.transform = `translate(${ax}px, ${ay}px)`;
      requestAnimationFrame(bucle);
    };
    bucle();
    document.querySelectorAll('[data-cursor]').forEach((el) => {
      el.addEventListener('pointerenter', () => { texto.textContent = el.dataset.cursor; c.classList.add('grande'); });
      el.addEventListener('pointerleave', () => c.classList.remove('grande'));
    });
  }, 'cursor');

  // ---------- botones magnéticos ----------
  safe(() => {
    if (!finoPuntero) return;
    document.querySelectorAll('.magnetico').forEach((el) => {
      const fuerza = el.classList.contains('boton-redondo') || el.classList.contains('paseo-fin') ? 0.35 : 0.25;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * fuerza}px, ${(e.clientY - r.top - r.height / 2) * fuerza}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1)';
        el.style.transform = '';
        setTimeout(() => { el.style.transition = ''; }, 800);
      });
    });
  }, 'magnéticos');

  // ---------- hoja de monstera en 3D: flota, sigue al ratón y gira con el scroll ----------
  safe(() => {
    const giro = document.getElementById('hojaGiro');
    const portada = document.getElementById('inicio');
    const postales = [...document.querySelectorAll('.postal')];
    let mx = 0, my = 0, sx = 0, sy = 0;
    if (finoPuntero) addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
    const t0 = performance.now();
    const bucle = () => {
      requestAnimationFrame(bucle);
      const r = portada.getBoundingClientRect();
      if (r.bottom < 0) return;
      const t = (performance.now() - t0) / 1000;
      const p = clamp(-r.top / r.height);
      sx = lerp(sx, mx, 0.06); sy = lerp(sy, my, 0.06);
      const rx = -sy * 18 + Math.sin(t * 0.7) * 4 + p * 25;
      const ry = sx * 24 + Math.cos(t * 0.5) * 5 - p * 30;
      const rz = Math.sin(t * 0.4) * 3 - 8 + p * 40;
      giro.style.transform = `translate3d(${sx * 30}px, ${sy * 20 + Math.sin(t * 0.9) * 10 + p * 140}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${1 + p * 0.25})`;
      postales.forEach((el) => {
        const v = parseFloat(el.dataset.velocidad || 0);
        el.style.transform = `translate3d(${sx * -24}px, ${r.top * v + sy * -16}px, 0)`;
      });
    };
    bucle();
  }, 'hoja');

  // ---------- manifiesto palabra a palabra ----------
  safe(() => {
    const t = document.getElementById('manifiestoTexto');
    if (t.querySelector('.p')) return;
    const acentos = ['2009', 'Montequinto.', 'dure', 'años.'];
    t.innerHTML = t.textContent.trim().split(/\s+/).map((w) => `<span class="p${acentos.includes(w) ? ' acento' : ''}">${w}</span>`).join(' ');
    const ps = [...t.querySelectorAll('.p')];
    const act = () => {
      const r = t.getBoundingClientRect();
      const avance = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35));
      const n = Math.round(avance * ps.length * 1.1);
      ps.forEach((p, i) => p.classList.toggle('on', i < n));
    };
    addEventListener('scroll', () => requestAnimationFrame(act), { passive: true });
    act();
  }, 'manifiesto');

  // ---------- la casa: la imagen fija cambia con el paso activo ----------
  safe(() => {
    const pasos = [...document.querySelectorAll('.paso')];
    const imgs = [...document.querySelectorAll('.casa-img')];
    const num = document.getElementById('casaNum');
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = +e.target.dataset.paso;
      pasos.forEach((p) => p.classList.toggle('activo', p === e.target));
      imgs.forEach((im) => im.classList.toggle('activa', +im.dataset.paso <= i));
      imgs.forEach((im) => { im.style.zIndex = +im.dataset.paso + 1; });
      num.textContent = String(i + 1).padStart(2, '0');
    }), { rootMargin: '-45% 0px -45% 0px' });
    pasos.forEach((p) => io.observe(p));
    pasos[0].classList.add('activo');
  }, 'casa');

  // ---------- colecciones: la foto sigue al cursor ----------
  safe(() => {
    if (!finoPuntero) return;
    const vista = document.getElementById('vista'), img = document.getElementById('vistaImg');
    const lista = document.getElementById('lista');
    let x = 0, y = 0, vx = 0, vy = 0, rot = 0, dentro = false;
    lista.querySelectorAll('a').forEach((a) => a.addEventListener('pointerenter', () => { img.src = a.dataset.img; }));
    lista.addEventListener('pointerenter', () => { dentro = true; vista.classList.add('on'); });
    lista.addEventListener('pointerleave', () => { dentro = false; vista.classList.remove('on'); });
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    const bucle = () => {
      requestAnimationFrame(bucle);
      if (!dentro && !vista.classList.contains('on')) return;
      const nx = lerp(vx, x, 0.12), ny = lerp(vy, y, 0.12);
      rot = lerp(rot, clamp((nx - vx) * 0.6, -12, 12), 0.1);
      vx = nx; vy = ny;
      vista.style.transform = `translate(${vx}px, ${vy}px) translate(-50%, -50%) rotate(${rot}deg) scale(${dentro ? 1 : 0.6})`;
    };
    bucle();
  }, 'colecciones');

  // ---------- cinta: se mueve sola y acelera con el scroll ----------
  safe(() => {
    const pista = document.getElementById('cintaPista');
    let pos = 0, vel = 0, ultimo = scrollY;
    const bucle = () => {
      const d = scrollY - ultimo; ultimo = scrollY;
      vel = lerp(vel, d * 0.6, 0.1);
      pos -= 0.6 + Math.abs(vel);
      const mitad = pista.scrollWidth / 2;
      if (-pos >= mitad) pos += mitad;
      pista.style.transform = `translate3d(${pos}px, 0, 0) skewX(${clamp(-vel * 0.4, -10, 10)}deg)`;
      requestAnimationFrame(bucle);
    };
    bucle();
  }, 'cinta');

  // ---------- paseo horizontal fijo (escritorio) ----------
  safe(() => {
    if (!hayGSAP || ancho() <= 760) return;
    gsap.registerPlugin(ScrollTrigger);
    const pista = document.getElementById('paseoPista');
    const distancia = () => Math.max(0, pista.scrollWidth - innerWidth);
    const tween = gsap.to(pista, {
      x: () => -distancia(), ease: 'none',
      scrollTrigger: { trigger: '#paseo', start: 'top top', end: () => `+=${distancia()}`, pin: '.paseo-fijo', scrub: 0.8, invalidateOnRefresh: true },
    });
    // Parallax de cada foto dentro de su marco
    pista.querySelectorAll('.cuadro-marco img').forEach((img) => {
      gsap.fromTo(img, { xPercent: -8 }, {
        xPercent: 8, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
      });
    });
    addEventListener('load', () => ScrollTrigger.refresh());
  }, 'paseo');

  // ---------- parallax del cierre ----------
  safe(() => {
    const fondo = document.querySelector('.cierre-fondo');
    const sec = document.getElementById('cierre');
    const act = () => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      fondo.style.transform = `translate3d(0, ${(r.top / innerHeight) * -80}px, 0) scale(1.05)`;
    };
    addEventListener('scroll', () => requestAnimationFrame(act), { passive: true });
    act();
  }, 'cierre');

  // ---------- almanaque ----------
  safe(() => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const estaciones = ['Invierno', 'Invierno', 'Primavera', 'Primavera', 'Primavera', 'Verano', 'Verano', 'Verano', 'Otoño', 'Otoño', 'Otoño', 'Invierno'];
    const datos = [
      [['Frutales a raíz desnuda', 'Rosales', 'Pensamientos y prímulas'], ['Podar rosales y frutales', 'Proteger del frío las tropicales', 'Regar poco y por la mañana'], 'Es el mejor mes para plantar un frutal: en reposo arraiga sin estrés.'],
      [['Rosales y trepadoras', 'Aromáticas', 'Bulbos de verano'], ['Abonar naranjos y limoneros', 'Último repaso de poda', 'Preparar la tierra del huerto'], 'Abona ahora los cítricos y tendrás una buena floración en primavera.'],
      [['Cítricos', 'Geranios y gitanillas', 'Césped'], ['Trasplantar las de interior', 'Empezar a abonar', 'Vigilar el pulgón en los brotes'], 'La primavera llega pronto a Sevilla: si tu planta pide maceta nueva, trasplántala ya.'],
      [['Petunias y buganvillas', 'Jazmines', 'Hortalizas de verano'], ['Abonar cada quince días', 'Tratar el pulgón', 'Revisar el riego automático'], 'Revisa el riego antes del primer golpe de calor, no después.'],
      [['Flor de verano', 'Hibiscos y palmeras', 'Crasas'], ['Acolchar las macetas con corteza', 'Quitar flores secas', 'Regar a primera hora'], 'Un acolchado de corteza en la maceta ahorra mucha agua en verano.'],
      [['Crasas y cactus', 'Palmeras', 'Buganvillas'], ['Regar al caer la tarde', 'Pasar a semisombra las delicadas', 'Vigilar la araña roja'], 'Con más de 35 grados, mejor no trasplantar ni abonar: la planta solo intenta aguantar.'],
      [['Crasas y plantas de sol', 'Poco más: es mes de cuidar'], ['Regar más a menudo', 'Sombrear las macetas oscuras', 'No abonar con calor'], 'Si te vas de vacaciones, agrupa las macetas a la sombra y pregúntanos por un goteo sencillo.'],
      [['Semilleros de coles y lechugas', 'Crasas'], ['Mantener el riego', 'Quitar flores pasadas', 'Vigilar la cochinilla'], 'Riega siempre la tierra y no las hojas: con este sol se queman.'],
      [['Césped', 'Aromáticas', 'Hortalizas de otoño'], ['Abonar suave', 'Recortar los setos', 'Preparar el huerto de otoño'], 'Septiembre es la segunda primavera en Sevilla: buen momento para sembrar césped.'],
      [['Crisantemos y ciclámenes', 'Tulipanes y narcisos', 'Árboles y arbustos'], ['Reducir el riego', 'Meter en casa las tropicales', 'Último abonado del año'], 'El otoño es el mejor momento para plantar árboles: llegan al verano con raíces fuertes.'],
      [['Olivos y frutales', 'Rosales', 'Pensamientos'], ['Recoger hojas caídas', 'Regar lo justo en interior', 'Proteger del frío las delicadas'], 'La flor de Pascua quiere luz y nada de corrientes: lejos de la puerta y del radiador.'],
      [['Flor de Pascua', 'Coníferas para Navidad', 'Árboles a raíz desnuda'], ['Regar muy poco', 'Limpiar el polvo de las hojas', 'Planear el jardín de primavera'], 'Riega la flor de Pascua solo cuando el sustrato esté seco al tacto.'],
    ];
    const sec = document.getElementById('almanaque');
    const cont = document.getElementById('meses');
    const el = (id) => document.getElementById(id);
    ['almNum', 'almNombre', 'almEstacion', 'almPlantar', 'almHacer', 'almConsejo'].forEach((id) => el(id).setAttribute('data-anim', ''));
    if (cont.children.length === 0) {
      meses.forEach((m, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = m.slice(0, 3); b.setAttribute('aria-label', m);
        b.addEventListener('click', () => elegir(i, true));
        cont.appendChild(b);
      });
    }
    const botones = [...cont.children];
    let actual = -1;
    const lista = (id, items) => { el(id).innerHTML = items.map((t) => `<li>${t}</li>`).join(''); };
    function elegir(i, animar) {
      i = (i + 12) % 12;
      if (i === actual) return;
      actual = i;
      botones.forEach((b, k) => { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; });
      const pintar = () => {
        el('almNum').textContent = String(i + 1).padStart(2, '0');
        el('almNombre').textContent = meses[i];
        el('almEstacion').textContent = estaciones[i];
        lista('almPlantar', datos[i][0]);
        lista('almHacer', datos[i][1]);
        el('almConsejo').textContent = datos[i][2];
        sec.classList.remove('cambia');
      };
      if (animar) { sec.classList.add('cambia'); setTimeout(pintar, 320); } else pintar();
    }
    el('mesAnterior').addEventListener('click', () => elegir(actual - 1, true));
    el('mesSiguiente').addEventListener('click', () => elegir(actual + 1, true));
    cont.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault(); elegir(actual + (e.key === 'ArrowRight' ? 1 : -1), true); botones[actual].focus();
    });
    elegir(new Date().getMonth(), false);
  }, 'almanaque');

  // ---------- horario en vivo (hora de Madrid) ----------
  safe(() => {
    const partes = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const dias = { lun: 1, mar: 2, mié: 3, jue: 4, vie: 5, sáb: 6, dom: 0 };
    const dTxt = ((partes.find((p) => p.type === 'weekday') || {}).value || '').replace('.', '').toLowerCase();
    const dia = dTxt in dias ? dias[dTxt] : new Date().getDay();
    const h = +partes.find((p) => p.type === 'hour').value + +partes.find((p) => p.type === 'minute').value / 60;
    const tramos = dia === 0 ? [[9, 14]] : [[9, 14], [16, 20]];
    const abierto = tramos.find(([a, b]) => h >= a && h < b);
    const siguiente = tramos.find(([a]) => h < a);
    const corto = abierto ? 'Abierto ahora' : 'Cerrado ahora';
    const largo = abierto ? `Abierto ahora · cerramos a las ${abierto[1]}:00` : siguiente ? `Cerrado ahora · abrimos a las ${siguiente[0]}:00` : 'Cerrado ahora · mañana desde las 9:00';
    const barra = document.getElementById('estadoBarra'), grande = document.getElementById('estadoGrande');
    barra.querySelector('span').textContent = corto;
    grande.querySelector('span').textContent = largo;
    if (!abierto) { barra.classList.add('cerrado'); grande.classList.add('cerrado'); }
    document.querySelectorAll('#horario tr').forEach((tr) => tr.classList.toggle('hoy', tr.dataset.dias.split(',').map(Number).includes(dia)));
  }, 'horario');

  // ---------- mapa diferido ----------
  safe(() => {
    const f = document.querySelector('.arco iframe');
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return;
      o.disconnect();
      f.addEventListener('load', () => setTimeout(() => f.classList.add('cargado'), 600));
      f.src = f.dataset.src;
    }, { rootMargin: '300px' }).observe(f);
  }, 'mapa');

  // ---------- anclas: scroll nativo suave sin que la barra tape el título ----------
  safe(() => {
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const d = id.length > 1 && document.querySelector(id);
      if (!d) return;
      e.preventDefault();
      scrollTo({ top: d.getBoundingClientRect().top + scrollY, behavior: 'smooth' });
    }));
  }, 'anclas');

  safe(() => { document.getElementById('anio').textContent = new Date().getFullYear(); }, 'año');
})();
