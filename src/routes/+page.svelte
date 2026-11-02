
<script>
	import { onMount } from 'svelte';
	import { supabase } from '../lib/supabase.js';

	let estado = $state('Verificando conexión...');
	let usuario = $state(null);

	let vista = $state('inicio');
	let modoRegistro = $state(false);

	let nombre = $state('');
	let email = $state('');
	let password = $state('');

	let cargando = $state(false);
	let mensaje = $state('');
	let tipoMensaje = $state('info');

	let capacitacionesRealizadas = $state([]);
	let cursoActual = $state(null);
	let respuestas = $state([]);
	let resultadoActual = $state(null);

	const cursos = [
		{
			id: 'contraseñas',
			numero: '01',
			categoria: 'FUNDAMENTOS',
			icono: '🔑',
			titulo: 'Contraseñas seguras',
			descripcion: 'Aprende a crear contraseñas fuertes y proteger tus cuentas.',
			preguntas: [
				{
					pregunta: '¿Cuál de estas contraseñas es más segura?',
					opciones: ['12345678', 'raimer123', 'T!g8#pL92@x', 'password'],
					correcta: 'T!g8#pL92@x'
				},
				{
					pregunta: '¿Por qué no debemos utilizar la misma contraseña en todas nuestras cuentas?',
					opciones: [
						'Porque es más difícil recordarla',
						'Porque si una cuenta es comprometida, las demás también pueden estar en riesgo',
						'Porque Internet no lo permite',
						'Porque ocupa más espacio'
					],
					correcta: 'Porque si una cuenta es comprometida, las demás también pueden estar en riesgo'
				},
				{
					pregunta: '¿Qué es la autenticación de dos factores?',
					opciones: [
						'Utilizar dos contraseñas iguales',
						'Compartir la contraseña con otra persona',
						'Agregar una segunda verificación de identidad',
						'Cambiar el nombre de usuario'
					],
					correcta: 'Agregar una segunda verificación de identidad'
				},
				{
					pregunta: '¿Dónde es recomendable guardar nuestras contraseñas?',
					opciones: [
						'En una publicación de redes sociales',
						'En un administrador de contraseñas confiable',
						'En un mensaje público',
						'En cualquier página desconocida'
					],
					correcta: 'En un administrador de contraseñas confiable'
				}
			]
		},
		{
			id: 'phishing',
			numero: '02',
			categoria: 'PREVENCIÓN',
			icono: '🎣',
			titulo: 'Detecta el phishing',
			descripcion: 'Identifica mensajes falsos, enlaces peligrosos y posibles estafas.',
			preguntas: [
				{
					pregunta: '¿Qué es el phishing?',
					opciones: [
						'Un programa para editar fotografías',
						'Un intento de engaño para robar información personal',
						'Una red social',
						'Un sistema operativo'
					],
					correcta: 'Un intento de engaño para robar información personal'
				},
				{
					pregunta: 'Recibes un correo que dice que ganaste un premio y debes abrir un enlace. ¿Qué debes hacer?',
					opciones: [
						'Abrirlo inmediatamente',
						'Compartir tus datos',
						'Verificar el mensaje antes de realizar cualquier acción',
						'Enviar el mensaje a todos tus contactos'
					],
					correcta: 'Verificar el mensaje antes de realizar cualquier acción'
				},
				{
					pregunta: '¿Cuál es una señal de un posible mensaje fraudulento?',
					opciones: [
						'Errores ortográficos y urgencia sospechosa',
						'Un saludo normal',
						'Una dirección oficial verificada',
						'Una notificación esperada'
					],
					correcta: 'Errores ortográficos y urgencia sospechosa'
				},
				{
					pregunta: '¿Qué debes hacer si recibes un enlace sospechoso?',
					opciones: [
						'Abrirlo para comprobarlo',
						'Introducir tu contraseña',
						'Ignorarlo y verificar el remitente por otro medio',
						'Descargar todos sus archivos'
					],
					correcta: 'Ignorarlo y verificar el remitente por otro medio'
				}
			]
		},
		{
			id: 'privacidad',
			numero: '03',
			categoria: 'PRIVACIDAD',
			icono: '🛡️',
			titulo: 'Protección de datos',
			descripcion: 'Descubre cómo cuidar tu información personal en Internet.',
			preguntas: [
				{
					pregunta: '¿Qué se considera información personal?',
					opciones: [
						'El color de una página web',
						'Tu dirección, teléfono y documento de identidad',
						'El nombre de una aplicación',
						'El tamaño de una pantalla'
					],
					correcta: 'Tu dirección, teléfono y documento de identidad'
				},
				{
					pregunta: '¿Qué debes evitar al utilizar una red Wi-Fi pública?',
					opciones: [
						'Leer noticias',
						'Consultar información pública',
						'Realizar operaciones sensibles sin protección',
						'Visitar páginas informativas'
					],
					correcta: 'Realizar operaciones sensibles sin protección'
				},
				{
					pregunta: '¿Por qué debemos revisar los permisos de las aplicaciones?',
					opciones: [
						'Para controlar qué información pueden utilizar',
						'Para aumentar el brillo',
						'Para cambiar el fondo de pantalla',
						'Para eliminar Internet'
					],
					correcta: 'Para controlar qué información pueden utilizar'
				},
				{
					pregunta: '¿Qué es recomendable hacer con la información que publicamos en redes sociales?',
					opciones: [
						'Publicar todos nuestros datos',
						'Compartir nuestra ubicación en todo momento',
						'Pensar antes de publicar y limitar los datos personales',
						'Compartir nuestras contraseñas'
					],
					correcta: 'Pensar antes de publicar y limitar los datos personales'
				}
			]
		}
	];

	onMount(() => {
		iniciar();

		const { data } = supabase.auth.onAuthStateChange((_event, session) => {
			usuario = session?.user ?? null;
		});

		return () => {
			data.subscription.unsubscribe();
		};
	});

	async function iniciar() {
		try {
			const { data, error } = await supabase.auth.getSession();

			if (error) throw error;

			usuario = data.session?.user ?? null;

			if (usuario) {
				await cargarHistorial();
			}

			estado = 'Sistema conectado correctamente';
		} catch (error) {
			console.error(error);
			estado = 'Plataforma preparada';
		}
	}

	function mostrarMensaje(texto, tipo = 'info') {
		mensaje = texto;
		tipoMensaje = tipo;
	}

	async function autenticar() {
		if (!email.trim() || !password) {
			mostrarMensaje('Completa el correo y la contraseña.', 'error');
			return;
		}

		if (modoRegistro && !nombre.trim()) {
			mostrarMensaje('Escribe tu nombre completo.', 'error');
			return;
		}

		if (password.length < 6) {
			mostrarMensaje('La contraseña debe tener al menos 6 caracteres.', 'error');
			return;
		}

		cargando = true;
		mensaje = '';

		try {
			if (modoRegistro) {
				const { data, error } = await supabase.auth.signUp({
					email: email.trim(),
					password,
					options: {
						data: {
							nombre: nombre.trim()
						}
					}
				});

				if (error) throw error;

				if (data.session) {
					usuario = data.session.user;
					await cargarHistorial();
					vista = 'inicio';
					mostrarMensaje('¡Tu cuenta ha sido creada correctamente!', 'exito');
				} else {
					mostrarMensaje(
						'Registro realizado. Revisa tu correo para confirmar la cuenta.',
						'exito'
					);
				}
			} else {
				const { data, error } = await supabase.auth.signInWithPassword({
					email: email.trim(),
					password
				});

				if (error) throw error;

				usuario = data.user;
				await cargarHistorial();
				vista = 'inicio';
				mostrarMensaje('¡Bienvenido de nuevo!', 'exito');
			}
		} catch (error) {
			console.error(error);
			mostrarMensaje(error.message || 'Ocurrió un error al acceder.', 'error');
		} finally {
			cargando = false;
		}
	}

	async function cerrarSesion() {
		const { error } = await supabase.auth.signOut();

		if (error) {
			mostrarMensaje(error.message, 'error');
			return;
		}

		usuario = null;
		capacitacionesRealizadas = [];
		vista = 'inicio';
		mostrarMensaje('Has cerrado sesión correctamente.', 'exito');
	}

	async function cargarHistorial() {
		if (!usuario) return;

		const { data, error } = await supabase
			.from('capacitaciones')
			.select('id, tema, respuestas, puntuacion, created_at')
			.eq('usuario_id', usuario.id)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error cargando historial:', error);
			return;
		}

		capacitacionesRealizadas = data ?? [];
	}

	function abrirCurso(curso) {
		if (!usuario) {
			vista = 'acceso';
			modoRegistro = false;
			mostrarMensaje('Inicia sesión para comenzar una capacitación.', 'info');
			return;
		}

		cursoActual = curso;
		respuestas = Array(curso.preguntas.length).fill('');
		resultadoActual = null;
		vista = 'cuestionario';
		mensaje = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function responder(indice, opcion) {
		respuestas[indice] = opcion;
	}

	function calcularPuntuacion() {
		if (!cursoActual) return 0;

		let correctas = 0;

		cursoActual.preguntas.forEach((pregunta, indice) => {
			if (respuestas[indice] === pregunta.correcta) {
				correctas++;
			}
		});

		return Math.round((correctas / cursoActual.preguntas.length) * 100);
	}

	async function finalizarCuestionario() {
		if (respuestas.some((respuesta) => !respuesta)) {
			mostrarMensaje('Debes responder todas las preguntas antes de finalizar.', 'error');
			return;
		}

		cargando = true;
		mensaje = '';

		const puntuacion = calcularPuntuacion();

		const datosRespuestas = cursoActual.preguntas.map((pregunta, indice) => ({
			pregunta: pregunta.pregunta,
			respuesta: respuestas[indice],
			correcta: pregunta.correcta,
			acierto: respuestas[indice] === pregunta.correcta
		}));

		try {
			const { error } = await supabase.from('capacitaciones').insert({
				usuario_id: usuario.id,
				tema: cursoActual.titulo,
				respuestas: datosRespuestas,
				puntuacion
			});

			if (error) throw error;

			resultadoActual = {
				puntuacion,
				correctas: datosRespuestas.filter((r) => r.acierto).length,
				total: datosRespuestas.length
			};

			await cargarHistorial();

			vista = 'resultado';
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (error) {
			console.error(error);
			mostrarMensaje(
				'No se pudo guardar el resultado. Comprueba tu conexión y los permisos de Supabase.',
				'error'
			);
		} finally {
			cargando = false;
		}
	}

	function irA(nuevaVista) {
		vista = nuevaVista;
		mensaje = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:head>
	<title>CyberEducation | Seguridad digital</title>
	<meta name="description" content="Aprende ciberseguridad desde cero." />
</svelte:head>

<header>
	<a href="#inicio" class="logo" onclick={() => irA('inicio')}>
		CYBER<span>EDUCATION</span>
	</a>

	<nav>
		<a href="#cursos" onclick={() => irA('inicio')}>Capacitaciones</a>
		<a href="#nosotros" onclick={() => irA('inicio')}>Nosotros</a>

		{#if usuario}
			<button class="nav-button" onclick={() => irA('resultados')}>Mis resultados</button>
			<button class="login" onclick={cerrarSesion}>Salir</button>
		{:else}
			<button class="login" onclick={() => irA('acceso')}>Acceder →</button>
		{/if}
	</nav>
</header>

{#if vista === 'inicio'}
	<main id="inicio">
		<section class="hero">
			<div class="hero-content">
				<div class="tag"><span></span> CENTRO DE APRENDIZAJE DIGITAL</div>

				<h1>
					El conocimiento es tu
					<span>mejor defensa.</span>
				</h1>

				<p>
					Descubre cómo proteger tu información, reconocer amenazas
					y navegar por Internet con mayor seguridad.
				</p>

				<div class="actions">
					<button class="primary" onclick={() => document.getElementById('cursos')?.scrollIntoView({ behavior: 'smooth' })}>
						Explorar cursos ↗
					</button>
					{#if usuario}
						<button class="secondary" onclick={() => irA('resultados')}>Mi progreso</button>
					{:else}
						<button class="secondary" onclick={() => { modoRegistro = true; irA('acceso'); }}>
							Crear una cuenta
						</button>
					{/if}
				</div>

				<div class="status"><span></span> {estado}</div>
				{#if usuario}
					<p class="welcome">Bienvenido, {usuario.user_metadata?.nombre || usuario.email}</p>
				{/if}
			</div>

			<div class="visual">
				<div class="circle circle-one"></div>
				<div class="circle circle-two"></div>
				<div class="shield">
					<div>🛡️</div>
					<span>PROTECCIÓN DIGITAL</span>
					<strong>ACTIVA</strong>
				</div>
				<div class="floating float-one">🔒 Datos protegidos</div>
				<div class="floating float-two">✓ Aprende con seguridad</div>
			</div>
		</section>

		<section id="cursos" class="courses">
			<div class="section-heading">
				<div>
					<p class="eyebrow">NUESTROS CONTENIDOS</p>
					<h2>Aprende a defenderte.</h2>
				</div>
				<p>Conocimientos prácticos para enfrentar los riesgos del mundo digital.</p>
			</div>

			<div class="grid">
				{#each cursos as curso}
					<article>
						<span class="course-number">{curso.numero} / {curso.categoria}</span>
						<div class="course-icon">{curso.icono}</div>
						<h3>{curso.titulo}</h3>
						<p>{curso.descripcion}</p>
						<button class="course-link" onclick={() => abrirCurso(curso)}>
							Comenzar aprendizaje ↗
						</button>
					</article>
				{/each}
			</div>
		</section>

		<section id="nosotros" class="banner">
			<div>
				<p class="eyebrow">TU FUTURO DIGITAL COMIENZA AQUÍ</p>
				<h2>Aprende hoy. Protégete siempre.</h2>
				<p>Desarrolla habilidades para utilizar la tecnología de forma responsable y segura.</p>
			</div>
			<button onclick={() => usuario ? irA('resultados') : (modoRegistro = true, irA('acceso'))}>
				{usuario ? 'Ver mi progreso →' : 'Unirme a CyberEducation →'}
			</button>
		</section>
	</main>

{:else if vista === 'acceso'}
	<main class="access-page">
		<div class="access-info">
			<p class="eyebrow">CYBEREDUCATION / CUENTA PERSONAL</p>
			<h1>{modoRegistro ? 'Comienza tu aprendizaje.' : 'Tu seguridad comienza aquí.'}</h1>
			<p>Accede a una plataforma diseñada para aprender, practicar y fortalecer tus conocimientos sobre ciberseguridad.</p>
			<div class="access-feature">🛡️ Aprende sobre seguridad digital</div>
			<div class="access-feature">🔐 Protege tus cuentas e información</div>
			<div class="access-feature">📊 Consulta tu progreso</div>
		</div>

		<div class="form-card">
			<button class="back-link" onclick={() => irA('inicio')}>← Volver al inicio</button>

			<p class="eyebrow">ÁREA DE USUARIO</p>
			<h2>{modoRegistro ? 'Crear una cuenta' : 'Iniciar sesión'}</h2>
			<p class="form-description">
				{modoRegistro ? 'Regístrate para comenzar tus capacitaciones.' : 'Ingresa tus datos para continuar aprendiendo.'}
			</p>

			<form onsubmit={(e) => { e.preventDefault(); autenticar(); }}>
				{#if modoRegistro}
					<label for="nombre">Nombre completo</label>
					<input id="nombre" type="text" placeholder="Tu nombre" bind:value={nombre} required />
				{/if}

				<label for="email">Correo electrónico</label>
				<input id="email" type="email" placeholder="ejemplo@correo.com" bind:value={email} required />

				<label for="password">Contraseña</label>
				<input id="password" type="password" placeholder="Mínimo 6 caracteres" bind:value={password} minlength="6" required />

				<button class="primary form-submit" type="submit" disabled={cargando}>
					{cargando ? 'Procesando...' : modoRegistro ? 'Crear mi cuenta →' : 'Iniciar sesión →'}
				</button>
			</form>

			{#if mensaje}
				<div class:success={tipoMensaje === 'exito'} class:error={tipoMensaje === 'error'} class="notice">
					{mensaje}
				</div>
			{/if}

			<div class="switch-mode">
				{modoRegistro ? '¿Ya tienes una cuenta?' : '¿Todavía no tienes una cuenta?'}
				<button onclick={() => { modoRegistro = !modoRegistro; mensaje = ''; }}>
					{modoRegistro ? 'Inicia sesión' : 'Regístrate aquí'}
				</button>
			</div>

			<p class="security">🔒 Tus datos se gestionan de forma segura mediante Supabase.</p>
		</div>
	</main>

{:else if vista === 'cuestionario' && cursoActual}
	<main class="quiz-page">
		<button class="back-link" onclick={() => irA('inicio')}>← Volver a las capacitaciones</button>

		<div class="quiz-header">
			<p class="eyebrow">CAPACITACIÓN / {cursoActual.categoria}</p>
			<div class="quiz-icon">{cursoActual.icono}</div>
			<h1>{cursoActual.titulo}</h1>
			<p>Lee cada pregunta y selecciona la respuesta que consideres correcta.</p>
			<div class="progress-track">
				<div style={`width: ${(respuestas.filter(Boolean).length / cursoActual.preguntas.length) * 100}%`}></div>
			</div>
			<p class="progress-label">{respuestas.filter(Boolean).length} de {cursoActual.preguntas.length} preguntas respondidas</p>
		</div>

		<div class="questions">
			{#each cursoActual.preguntas as pregunta, i}
				<section class="question-card">
					<span class="question-number">PREGUNTA {i + 1}</span>
					<h3>{pregunta.pregunta}</h3>
					<div class="options">
						{#each pregunta.opciones as opcion}
							<button
								class:chosen={respuestas[i] === opcion}
								class="option"
								onclick={() => responder(i, opcion)}
							>
								<span>{respuestas[i] === opcion ? '●' : '○'}</span>
								{opcion}
							</button>
						{/each}
					</div>
				</section>
			{/each}
		</div>

		{#if mensaje}
			<div class="notice error">{mensaje}</div>
		{/if}

		<button class="primary finish-button" onclick={finalizarCuestionario} disabled={cargando}>
			{cargando ? 'Guardando resultado...' : 'Finalizar capacitación →'}
		</button>
	</main>

{:else if vista === 'resultado' && resultadoActual}
	<main class="result-page">
		<div class="result-card">
			<p class="eyebrow">CAPACITACIÓN COMPLETADA</p>
			<div class="result-icon">🏆</div>
			<h1>¡Buen trabajo!</h1>
			<p>Has completado la capacitación de <strong>{cursoActual.titulo}</strong>.</p>

			<div class="score">{resultadoActual.puntuacion}<span>%</span></div>
			<p class="score-label">Tu puntuación final</p>

			<div class="score-details">
				<div><strong>{resultadoActual.correctas}</strong><span>Respuestas correctas</span></div>
				<div><strong>{resultadoActual.total}</strong><span>Total de preguntas</span></div>
			</div>

			<p class="result-message">
				{resultadoActual.puntuacion >= 75
					? '¡Excelente! Has demostrado buenos conocimientos sobre este tema.'
					: '¡Sigue practicando! Repasa el contenido e intenta mejorar tu puntuación.'}
			</p>

			<button class="primary" onclick={() => irA('inicio')}>Volver al inicio</button>
			<button class="secondary" onclick={() => irA('resultados')}>Ver mi historial</button>
		</div>
	</main>

{:else if vista === 'resultados'}
	<main class="history-page">
		<button class="back-link" onclick={() => irA('inicio')}>← Volver al inicio</button>
		<p class="eyebrow">TU ACTIVIDAD</p>
		<h1>Mi progreso</h1>
		<p class="history-description">Consulta las capacitaciones que has completado y tus puntuaciones.</p>

		<div class="history-summary">
			<div><strong>{capacitacionesRealizadas.length}</strong><span>Capacitaciones realizadas</span></div>
			<div>
				<strong>
					{capacitacionesRealizadas.length
						? Math.round(capacitacionesRealizadas.reduce((s, c) => s + Number(c.puntuacion || 0), 0) / capacitacionesRealizadas.length)
						: 0}%
				</strong>
				<span>Promedio general</span>
			</div>
		</div>

		{#if capacitacionesRealizadas.length > 0}
			<div class="history-list">
				{#each capacitacionesRealizadas as registro}
					<article class="history-item">
						<div>
							<h3>{registro.tema}</h3>
							<p>{new Date(registro.created_at).toLocaleDateString('es-DO')}</p>
						</div>
						<strong class="history-score">{registro.puntuacion}%</strong>
					</article>
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<div>📚</div>
				<h2>Aún no tienes capacitaciones</h2>
				<p>Cuando completes tu primer cuestionario, tus resultados aparecerán aquí.</p>
				<button class="primary" onclick={() => irA('inicio')}>Explorar capacitaciones</button>
			</div>
		{/if}
	</main>
{/if}

{#if mensaje && vista === 'inicio'}
	<div class="global-message" class:success={tipoMensaje === 'exito'} class:error={tipoMensaje === 'error'}>
		{mensaje}
		<button onclick={() => mensaje = ''}>×</button>
	</div>
{/if}

<footer>
	<a href="#inicio" class="logo" onclick={() => irA('inicio')}>CYBER<span>EDUCATION</span></a>
	<p>© 2026 CyberEducation. Aprende. Protege. Conecta.</p>
</footer>

<style>
	:global(*) { box-sizing: border-box; }
	:global(html) { scroll-behavior: smooth; }
	:global(body) {
		margin: 0;
		background: #080d19;
		color: #edf4ff;
		font-family: Arial, sans-serif;
	}
	:global(button), :global(input) { font-family: inherit; }
	header {
		min-height: 82px;
		padding: 0 9%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		border-bottom: 1px solid #1b2940;
		background: #080d19;
		position: relative;
		z-index: 2;
	}
	.logo {
		color: white;
		font-size: 19px;
		font-weight: 900;
		letter-spacing: 1px;
		text-decoration: none;
		white-space: nowrap;
	}
	.logo span { color: #36d9ee; }
	nav { display: flex; align-items: center; gap: 25px; }
	nav a, .nav-button {
		color: #a9b8ce;
		text-decoration: none;
		font-size: 13px;
		background: none;
		border: 0;
		cursor: pointer;
	}
	nav a:hover, .nav-button:hover { color: #36d9ee; }
	.login {
		color: #36d9ee;
		border: 1px solid #286078;
		padding: 11px 18px;
		border-radius: 7px;
		background: transparent;
		cursor: pointer;
	}
	.hero {
		min-height: 570px;
		padding: 90px 10%;
		display: grid;
		grid-template-columns: 1.2fr .8fr;
		align-items: center;
		gap: 40px;
		background: radial-gradient(ellipse at 75% 45%, #102a45 0%, #080d19 65%);
	}
	.hero-content { max-width: 650px; }
	.tag, .eyebrow {
		color: #36d9ee;
		font-size: 11px;
		font-weight: bold;
		letter-spacing: 2px;
	}
	.tag span, .status span {
		display: inline-block;
		width: 7px;
		height: 7px;
		background: #36d9ee;
		border-radius: 50%;
		margin-right: 8px;
	}
	h1 {
		font-size: clamp(43px, 6vw, 72px);
		line-height: 1.08;
		letter-spacing: -2px;
		margin: 27px 0;
	}
	.hero h1 span { display: block; color: #36d9ee; }
	.hero-content > p, .banner p {
		color: #a5b5ca;
		font-size: 16px;
		line-height: 1.8;
		max-width: 520px;
	}
	.actions { display: flex; gap: 14px; margin-top: 30px; flex-wrap: wrap; }
	.primary, .secondary {
		display: inline-block;
		padding: 14px 20px;
		border-radius: 7px;
		text-decoration: none;
		font-size: 13px;
		font-weight: bold;
		cursor: pointer;
	}
	.primary { background: #36d9ee; color: #07111b; border: 1px solid #36d9ee; }
	.primary:hover { background: #6ceafa; }
	.secondary { border: 1px solid #31455e; color: white; background: transparent; }
	.primary:disabled { opacity: .6; cursor: wait; }
	.status { margin-top: 30px; font-size: 12px; color: #879ab2; }
	.welcome { color: #36d9ee !important; font-size: 13px !important; }
	.visual { height: 350px; position: relative; display: grid; place-items: center; }
	.circle { position: absolute; border: 1px solid #1b4961; border-radius: 50%; }
	.circle-one { width: 300px; height: 300px; }
	.circle-two { width: 230px; height: 230px; border-style: dashed; }
	.shield {
		width: 190px; height: 190px; border: 1px solid #28758b;
		border-radius: 30px; background: linear-gradient(145deg, #153c55, #0b1a2a);
		box-shadow: 0 0 65px #22cce333; display: flex; flex-direction: column;
		align-items: center; justify-content: center; gap: 12px;
	}
	.shield div { font-size: 53px; }
	.shield span { color: #91b4c8; font-size: 9px; letter-spacing: 2px; }
	.shield strong { color: #36d9ee; font-size: 12px; }
	.floating {
		position: absolute; padding: 12px 15px; background: #13263b;
		border: 1px solid #29445c; border-radius: 8px; font-size: 11px; color: #dcecff;
	}
	.float-one { top: 35px; right: 0; }
	.float-two { bottom: 35px; left: 0; }
	.courses { padding: 85px 10%; }
	.section-heading {
		display: flex; align-items: end; justify-content: space-between;
		gap: 25px; margin-bottom: 35px;
	}
	h2 { font-size: 34px; margin: 12px 0 0; }
	.section-heading > p { color: #91a3b9; max-width: 340px; font-size: 14px; line-height: 1.7; }
	.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
	.grid article {
		padding: 28px; border: 1px solid #20334b; border-radius: 12px;
		background: linear-gradient(145deg, #111f32, #0c1524);
		transition: transform .2s, border-color .2s;
	}
	.grid article:hover { transform: translateY(-5px); border-color: #36d9ee; }
	.course-number { color: #36d9ee; font-size: 10px; letter-spacing: 1px; }
	.course-icon { margin-top: 27px; font-size: 35px; }
	.grid article h3 { font-size: 19px; margin-top: 22px; }
	.grid article p { color: #9aacc1; font-size: 13px; line-height: 1.8; min-height: 70px; }
	.course-link {
		color: #36d9ee; background: none; border: 0; padding: 0;
		font-size: 12px; font-weight: bold; cursor: pointer;
	}
	.banner {
		margin: 0 10% 75px; padding: 40px; border: 1px solid #20516a;
		border-radius: 13px; background: linear-gradient(110deg, #102b43, #101c30);
		display: flex; align-items: center; justify-content: space-between; gap: 25px;
	}
	.banner h2 { font-size: 27px; }
	.banner p { font-size: 13px; }
	.banner button {
		background: #36d9ee; color: #07111b; padding: 14px 18px;
		border: 0; border-radius: 7px; font-size: 12px; font-weight: bold;
		white-space: nowrap; cursor: pointer;
	}
	.access-page {
		min-height: 740px; padding: 75px 10%; display: grid;
		grid-template-columns: 1fr 440px; align-items: center; gap: 65px;
		background: radial-gradient(ellipse at 20% 45%, #102a45, #080d19 65%);
	}
	.access-info h1 { font-size: clamp(38px, 5vw, 60px); max-width: 600px; }
	.access-info > p:not(.eyebrow) { color: #a5b5ca; line-height: 1.8; max-width: 490px; }
	.access-feature { color: #c5d5e8; margin-top: 25px; font-size: 14px; }
	.form-card {
		background: #101b2b; border: 1px solid #263b53; border-radius: 14px;
		padding: 35px; box-shadow: 0 20px 70px #0005;
	}
	.back-link {
		display: block; margin-bottom: 30px; background: none; border: 0;
		color: #36d9ee; cursor: pointer; font-size: 13px; padding: 0;
	}
	.form-card h2 { font-size: 29px; margin: 12px 0; }
	.form-description { color: #9aacc1; font-size: 13px; line-height: 1.7; margin-bottom: 25px; }
	form { display: flex; flex-direction: column; gap: 12px; }
	form label { color: #c9d8e9; font-size: 12px; margin-top: 8px; }
	form input {
		width: 100%; padding: 14px; background: #091321; color: white;
		border: 1px solid #31455e; border-radius: 7px; outline: none;
	}
	form input:focus { border-color: #36d9ee; }
	.form-submit { margin-top: 15px; width: 100%; }
	.switch-mode { margin-top: 25px; color: #a5b5ca; font-size: 12px; text-align: center; }
	.switch-mode button {
		display: block; margin: 10px auto 0; background: none; border: 0;
		color: #36d9ee; cursor: pointer; font-weight: bold;
	}
	.security { color: #71869e; font-size: 10px; text-align: center; line-height: 1.6; margin-top: 25px; }
	.notice { margin-top: 17px; padding: 12px; border-radius: 7px; font-size: 12px; line-height: 1.6; }
	.notice.success { color: #83e5bd; background: #123329; border: 1px solid #28644d; }
	.notice.error { color: #ff9b9b; background: #391c27; border: 1px solid #773345; }
	.notice:not(.success):not(.error) { color: #a8d9f0; background: #142b40; border: 1px solid #28516d; }
	.quiz-page, .history-page { max-width: 1000px; margin: auto; padding: 55px 7% 90px; min-height: 700px; }
	.quiz-header { text-align: center; max-width: 650px; margin: 35px auto; }
	.quiz-icon { font-size: 45px; margin-top: 25px; }
	.quiz-header h1 { font-size: 43px; margin: 15px 0; }
	.quiz-header > p:not(.eyebrow) { color: #9aacc1; line-height: 1.7; }
	.progress-track { height: 7px; background: #1b2b40; border-radius: 10px; overflow: hidden; margin-top: 30px; }
	.progress-track div { height: 100%; background: #36d9ee; transition: width .2s; }
	.progress-label { font-size: 11px !important; }
	.questions { display: grid; gap: 20px; }
	.question-card { background: #101b2b; border: 1px solid #263b53; border-radius: 12px; padding: 27px; }
	.question-number { color: #36d9ee; font-size: 10px; letter-spacing: 1px; }
	.question-card h3 { font-size: 17px; line-height: 1.6; margin: 14px 0 20px; }
	.options { display: grid; gap: 10px; }
	.option {
		text-align: left; padding: 14px; border-radius: 7px;
		background: #0a1422; color: #b8c9dc; border: 1px solid #263b53;
		cursor: pointer; font-size: 13px; line-height: 1.5;
	}
	.option span { color: #36d9ee; margin-right: 10px; }
	.option.chosen { background: #12354a; border-color: #36d9ee; color: white; }
	.finish-button { display: block; margin: 30px auto 0; }
	.result-page { min-height: 700px; display: grid; place-items: center; padding: 60px 7%; }
	.result-card {
		width: min(100%, 520px); text-align: center; background: #101b2b;
		border: 1px solid #263b53; border-radius: 16px; padding: 40px;
	}
	.result-icon { font-size: 55px; margin-top: 20px; }
	.result-card h1 { font-size: 38px; margin: 15px 0; }
	.result-card > p { color: #9aacc1; font-size: 13px; line-height: 1.7; }
	.score { font-size: 75px; color: #36d9ee; font-weight: bold; margin-top: 25px; }
	.score span { font-size: 30px; }
	.score-label { margin-top: 0; }
	.score-details, .history-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 30px 0; }
	.score-details div, .history-summary div {
		background: #0a1422; border: 1px solid #263b53; padding: 20px; border-radius: 9px;
	}
	.score-details strong, .history-summary strong { display: block; color: #36d9ee; font-size: 25px; }
	.score-details span, .history-summary span { display: block; color: #9aacc1; font-size: 11px; margin-top: 8px; }
	.result-message { margin: 25px 0 !important; }
	.result-card .secondary { margin-left: 8px; }
	.history-page h1 { font-size: 45px; margin: 15px 0; }
	.history-description { color: #9aacc1; font-size: 14px; }
	.history-list { display: grid; gap: 12px; }
	.history-item {
		display: flex; justify-content: space-between; align-items: center; gap: 15px;
		background: #101b2b; border: 1px solid #263b53; border-radius: 9px; padding: 20px;
	}
	.history-item h3 { margin: 0; font-size: 15px; }
	.history-item p { color: #8598b0; font-size: 11px; }
	.history-score { color: #36d9ee; font-size: 23px; }
	.empty-state { text-align: center; padding: 55px 20px; background: #101b2b; border: 1px solid #263b53; border-radius: 12px; }
	.empty-state > div { font-size: 45px; }
	.empty-state p { color: #9aacc1; font-size: 13px; line-height: 1.7; }
	.empty-state h2 { font-size: 22px; margin: 18px 0; }
	.global-message {
		position: fixed; bottom: 20px; right: 20px; z-index: 5;
		max-width: 380px; padding: 15px 45px 15px 18px;
		border-radius: 8px; background: #142b40; border: 1px solid #28516d;
		color: #a8d9f0; font-size: 13px; line-height: 1.5;
	}
	.global-message.success { background: #123329; border-color: #28644d; color: #83e5bd; }
	.global-message.error { background: #391c27; border-color: #773345; color: #ff9b9b; }
	.global-message button {
		position: absolute; right: 12px; top: 8px; color: inherit;
		background: none; border: 0; font-size: 22px; cursor: pointer;
	}
	footer {
		border-top: 1px solid #1b2940; padding: 28px 9%;
		display: flex; justify-content: space-between; align-items: center; gap: 20px;
	}
	footer p { color: #7588a1; font-size: 11px; }

	@media (max-width: 850px) {
		.hero { grid-template-columns: 1fr; padding: 75px 7%; }
		.visual { height: 300px; }
		.grid { grid-template-columns: 1fr; }
		.section-heading, .banner { align-items: flex-start; flex-direction: column; }
		.access-page { grid-template-columns: 1fr; padding: 55px 7%; }
		.access-info h1 { font-size: 42px; }
		.form-card { width: 100%; max-width: 520px; margin: auto; }
	}
	@media (max-width: 550px) {
		header { padding: 18px 5%; align-items: flex-start; flex-direction: column; }
		nav { width: 100%; gap: 13px; flex-wrap: wrap; }
		nav a, .nav-button { font-size: 11px; }
		.courses { padding: 65px 7%; }
		.banner { margin: 0 7% 50px; padding: 25px; }
		footer { padding: 25px 7%; flex-direction: column; }
		.quiz-header h1 { font-size: 34px; }
		.question-card { padding: 20px; }
		.result-card { padding: 25px 18px; }
		.result-card .secondary { margin: 12px 0 0; }
		.history-page h1 { font-size: 36px; }
	}
</style>
