/* =========================================================================
   GOLDEN STEP — script.js
   -------------------------------------------------------------------------
   GUÍA RÁPIDA PARA LA SUSTENTACIÓN (dónde está cada indicador de la
   lista de cotejo):

     1. Valores, tipos y operadores ........ sección "VALORES Y OPERADORES"
     2. Estructuras de control ............. sección "ESTRUCTURAS DE CONTROL"
     3. Definición y uso de funciones ....... sección "FUNCIONES"
     4. Uso de objetos y arrays ............. sección "DATOS: PRODUCTOS"
     5. Encapsulamiento y métodos ........... clase Carrito (campo #items)
     6. Prototipos y clases ................. clases Zapato / subclases
     7. Mapas y polimorfismo ................ Map del carrito + obtenerEtiqueta()
     8. Manejo de eventos y DOM ............. sección "EVENTOS DEL DOM"
     9. Propagación de eventos .............. sección "PROPAGACIÓN DE EVENTOS"
    10. Interactividad y funcionalidad ...... todo el flujo del carrito
    11. Trabajo en equipo y proactividad .... completar en el informe .doc
    12. Diseño y maquetado coherente ........ index.html + styles.css

   NOVEDAD: el catálogo YA NO es una lista fija escrita aquí. Se carga desde
   Firestore (ver sección "CONEXIÓN CON FIREBASE"), para que el dueño de la
   tienda pueda agregar calzados desde admin.html sin tocar código.
   ========================================================================= */

'use strict';

/* =========================================================================
   CONEXIÓN CON FIREBASE
   -------------------------------------------------------------------------
   Estos datos NO son secretos: identifican tu proyecto de Firebase, igual
   que la dirección de una tienda. Deben ser EXACTAMENTE los mismos datos
   que usa admin.html, porque ambos leen y escriben en la misma base de
   datos (colección "productos").
   ========================================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyDbD9PUTBhx3qsC8rFYPUDhnNxzfzq4-eI",
  authDomain: "golden-step-74bcb.firebaseapp.com",
  projectId: "golden-step-74bcb",
  storageBucket: "golden-step-74bcb.firebasestorage.app",
  messagingSenderId: "267074238737",
  appId: "1:267074238737:web:cdbf19e03a167bf29534b0"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* =========================================================================
   1) VALORES, TIPOS Y OPERADORES
   ========================================================================= */
const NOMBRE_TIENDA = 'Golden Step';      // string (const: valor que no cambia)
let carritoAbierto = false;                // boolean (let: valor que cambia)
const IGV = 0.18;                          // number
const ENVIO_GRATIS_DESDE = 250;            // number
let ultimaBusqueda = '';                   // string vacío por defecto

// WhatsApp del negocio: código de país (51 = Perú) + número, sin "+" ni espacios.
// ⚠️ CAMBIA ESTE NÚMERO por el WhatsApp real de Golden Step.
const WHATSAPP_NUMERO = '51980222965';

// Logo de WhatsApp (SVG en línea, hereda el color del texto con currentColor)
const ICONO_WHATSAPP = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`;

// Operadores aritméticos, de comparación y lógicos en uso real:
function calcularEnvio(subtotal) {
  // operador de comparación (>=) + operador ternario (condicional)
  return subtotal >= ENVIO_GRATIS_DESDE ? 0 : 12.9;
}

// typeof (operador) para validar tipos antes de operar
function esNumeroValido(valor) {
  return typeof valor === 'number' && !Number.isNaN(valor) && valor > 0;
}

/* =========================================================================
   4) DATOS: PRODUCTOS (array de objetos)
   -------------------------------------------------------------------------
   "productos" y "catalogo" empiezan vacíos y se llenan cuando llega la
   respuesta de Firestore (función cargarProductosDesdeFirestore, más abajo).
   Por eso ahora son "let" en vez de "const": su contenido cambia una vez,
   al terminar de cargar.
   ========================================================================= */
let productos = [];
let catalogo = [];

// Emoji de respaldo según la categoría, por si un producto no tiene foto
// o la foto no llegó a cargar (ver Zapato.renderMiniatura más abajo).
const EMOJI_POR_CATEGORIA = { deportivo: '👟', casual: '👞', bota: '🥾' };

/* =========================================================================
   6) PROTOTIPOS Y CLASES  /  7) POLIMORFISMO
   ------------------------------------------------------------------------
   Zapato es la clase base. Cada subclase SOBRESCRIBE obtenerEtiqueta(),
   así que cuando recorremos un arreglo de distintos tipos de zapato y
   llamamos el MISMO método, cada objeto responde a su manera: eso es
   polimorfismo.
   ========================================================================= */
class Zapato {
  constructor({ id, nombre, categoria, precio, stock, emoji, imagen, etiquetas = [] }) {
    this.id = id;
    this.nombre = nombre;
    this.categoria = categoria;
    this.precio = precio;
    this.stock = stock;
    this.emoji = emoji;
    this.imagen = imagen; // ruta o URL a la foto real (opcional)
    this.etiquetas = etiquetas; // palabras clave para el buscador (ej. "futbol", "casual")
  }

  // Genera el HTML de la miniatura: <img> si hay foto; si la foto no carga,
  // el propio evento "error" de la imagen la reemplaza por el emoji.
  renderMiniatura(claseImg, claseFallback) {
    if (!this.imagen) return `<div class="${claseFallback}">${this.emoji}</div>`;
    return `<img src="${this.imagen}" alt="${this.nombre}" class="${claseImg}" loading="lazy"
      onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'${claseFallback}',textContent:'${this.emoji}'}))">`;
  }

  // Getter: se comporta como una propiedad, pero es un método (encapsulamiento)
  get precioFormateado() {
    return `S/ ${this.precio.toFixed(2)}`;
  }

  hayStock() {
    return this.stock > 0;
  }

  // Enlace de WhatsApp con el mensaje de consulta de precio.
  // WhatsApp NO permite adjuntar una foto desde un enlace: lo que se envía es
  // el mensaje con el LINK de la foto (solo funciona cuando la página está
  // publicada en internet; abierta desde tu PC no hay link público).
  enlaceConsulta() {
    let mensaje = `Hola Golden Step, quiero consultar el precio de este calzado: ${this.nombre}.`;
    if (this.imagen && window.location.protocol.startsWith('http')) {
      const urlFoto = new URL(this.imagen, window.location.href).href;
      mensaje += `\nFoto: ${urlFoto}`;
    }
    return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
  }

  // Método "genérico": las subclases lo sobrescriben (polimorfismo)
  obtenerEtiqueta() {
    return 'Calzado';
  }
}

class ZapatoDeportivo extends Zapato {
  obtenerEtiqueta() { return '⚡ Deportivo'; }
}

class ZapatoCasual extends Zapato {
  obtenerEtiqueta() { return '✨ Casual'; }
}

class ZapatoBota extends Zapato {
  obtenerEtiqueta() { return '🥾 Outdoor'; }
}

// Fábrica: decide qué subclase instanciar según la categoría (más POO)
function crearZapato(datos) {
  // Si el producto no trae emoji propio (por ejemplo, los agregados desde
  // admin.html), se le asigna uno por defecto según su categoría.
  const datosConDefecto = { ...datos, emoji: datos.emoji || EMOJI_POR_CATEGORIA[datos.categoria] || '👟' };

  switch (datosConDefecto.categoria) {                       // 2) estructura de control: switch
    case 'deportivo': return new ZapatoDeportivo(datosConDefecto);
    case 'casual':    return new ZapatoCasual(datosConDefecto);
    case 'bota':       return new ZapatoBota(datosConDefecto);
    default:           return new Zapato(datosConDefecto);
  }
}

/* =========================================================================
   CARGA DE PRODUCTOS DESDE FIRESTORE
   -------------------------------------------------------------------------
   Reemplaza a la antigua lista fija de productos. admin.html guarda cada
   calzado nuevo en la colección "productos" de Firestore; esta función lo
   lee y arma el catálogo con las mismas clases (Zapato, ZapatoDeportivo...)
   que usa el resto del código.
   ========================================================================= */
async function cargarProductosDesdeFirestore() {
  try {
    const snapshot = await db.collection('productos').orderBy('creado', 'desc').get();
    productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    catalogo = productos.map(crearZapato); // array de instancias polimórficas

    // Demostración de la cadena de prototipos (revisar en consola del navegador)
    if (catalogo.length > 0) {
      console.log(
        'Prototipo de catalogo[0]:',
        Object.getPrototypeOf(catalogo[0]) === ZapatoDeportivo.prototype
      );
      catalogo.forEach(z => console.log(z.nombre, '->', z.obtenerEtiqueta())); // polimorfismo en acción
    }
  } catch (error) {
    console.error('No se pudo cargar el catálogo desde Firestore:', error);
    mostrarToast('No se pudo cargar el catálogo. Revisa tu conexión a internet.', 'error');
  }
}

/* =========================================================================
   5) ENCAPSULAMIENTO Y MÉTODOS
   ------------------------------------------------------------------------
   El campo #items es PRIVADO (símbolo #): nadie fuera de la clase puede
   tocarlo directamente. Solo se manipula a través de los métodos públicos
   (agregar, quitar, actualizarCantidad...). Eso es encapsulamiento.

   7) MAPAS
   ------------------------------------------------------------------------
   #items es un Map<idProducto, cantidad>. Un Map, a diferencia de un
   objeto plano, mantiene el orden de inserción y permite cualquier tipo
   de clave (aquí usamos el id de Firestore, que es un texto).
   ========================================================================= */
class Carrito {
  #items = new Map(); // Map privado: id del zapato -> cantidad

  agregar(zapato, cantidad = 1) {
    if (!esNumeroValido(cantidad)) return false;      // 1) validación con typeof
    if (!zapato.hayStock()) return false;

    const actual = this.#items.get(zapato.id) ?? 0;
    this.#items.set(zapato.id, actual + cantidad);
    return true;
  }

  quitar(idProducto) {
    this.#items.delete(idProducto);
  }

  actualizarCantidad(idProducto, cantidad) {
    if (cantidad <= 0) {                              // 2) estructura de control: if
      this.quitar(idProducto);
    } else {
      this.#items.set(idProducto, cantidad);
    }
  }

  vaciar() {
    this.#items.clear();
  }

  estaVacio() {
    return this.#items.size === 0;
  }

  // Devuelve [{zapato, cantidad}] combinando el Map con el catálogo
  listar() {
    const filas = [];
    for (const [id, cantidad] of this.#items) {        // 2) estructura de control: for...of
      const zapato = catalogo.find(z => z.id === id);
      if (zapato) filas.push({ zapato, cantidad });
    }
    return filas;
  }

  cantidadTotal() {
    let total = 0;
    for (const cantidad of this.#items.values()) {     // 2) estructura de control: for...of
      total += cantidad;
    }
    return total;
  }

  subtotal() {
    // reduce + arrow function (function programming style)
    return this.listar().reduce((acc, fila) => acc + fila.zapato.precio * fila.cantidad, 0);
  }
}

const carrito = new Carrito();

/* =========================================================================
   3) FUNCIONES: normal, flecha, con "arguments", recursiva y "creciente"
   ========================================================================= */

// --- Función normal con estructura de control (if / else if / else) ---
function calcularDescuento(subtotal) {
  if (subtotal >= 600) {
    return subtotal * 0.15;
  } else if (subtotal >= 300) {
    return subtotal * 0.10;
  } else if (subtotal >= 150) {
    return subtotal * 0.05;
  } else {
    return 0;
  }
}

// --- Función de flecha ---
const formatearMoneda = (valor) => `S/ ${valor.toFixed(2)}`;

// --- Función que usa el objeto "arguments" (no es de flecha a propósito) ---
function sumarVarios() {
  let total = 0;
  for (let i = 0; i < arguments.length; i++) {   // arguments: objeto tipo-arreglo
    total += arguments[i];
  }
  return total;
}

// --- Función RECURSIVA: suma el total de una lista de filas del carrito ---
function calcularTotalRecursivo(filas, indice = 0) {
  if (indice >= filas.length) return 0;           // caso base
  const fila = filas[indice];
  const importe = fila.zapato.precio * fila.cantidad;
  return importe + calcularTotalRecursivo(filas, indice + 1); // llamada recursiva
}

// --- Función "creciente" (closure que va acumulando estado) ---
// Cada llamada "hace crecer" el contador interno; es la base de los
// generadores de ID y de los contadores de eventos usados más abajo.
function crearContador(inicio = 0) {
  let valor = inicio;
  return function siguiente(paso = 1) {
    valor += paso;
    return valor;
  };
}
const contadorClicsAgregar = crearContador(0);

// --- Función que "crece" por composición (currying) ---
// Genera funciones de descuento específicas por temporada.
function crearDescuentoPorTemporada(porcentaje) {
  return (precio) => precio - precio * (porcentaje / 100);
}
const descuentoNavidad = crearDescuentoPorTemporada(20); // ejemplo de uso disponible en consola

/* =========================================================================
   RENDER: pintar el catálogo y el carrito en el DOM
   ========================================================================= */
const gridProductos   = document.getElementById('grid-productos');
const resultadoInfo    = document.getElementById('resultado-info');
const itemsCarritoEl   = document.getElementById('items-carrito');
const contadorCarrito  = document.getElementById('contador-carrito');

let categoriaActiva = 'todos';

// Quita tildes y mayúsculas: "Fútbol" -> "futbol", para que el buscador
// encuentre resultados sin importar cómo se escriba.
const normalizar = (texto) =>
  texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function obtenerProductosFiltrados() {
  const busqueda = normalizar(ultimaBusqueda.trim());

  return catalogo.filter(z => {
    const coincideCategoria = categoriaActiva === 'todos' || z.categoria === categoriaActiva;

    // Textos contra los que se compara lo que escribe el usuario: nombre,
    // categoría y las etiquetas que se le hayan puesto al producto
    // (ej. "futbol", "dia a dia", "uso casual").
    const terminos = [z.nombre, z.categoria, ...z.etiquetas].map(normalizar);

    // Coincide si algún término contiene lo escrito ("run" -> "runner")
    // o si lo escrito contiene el término ("para futbol" -> "futbol")
    const coincideBusqueda = terminos.some(t => t.includes(busqueda) || busqueda.includes(t));

    return coincideCategoria && coincideBusqueda; // 1) operador lógico &&
  });
}

function renderCatalogo() {
  const lista = obtenerProductosFiltrados();
  gridProductos.innerHTML = '';

  if (catalogo.length === 0) {
    gridProductos.innerHTML = '<p class="vacio">Todavía no hay calzados en el catálogo.</p>';
    resultadoInfo.textContent = '';
    return;
  }

  // 2) estructura de control: while (recorrido alternativo, además del forEach)
  let i = 0;
  while (i < lista.length) {
    const z = lista[i];
    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta';
    tarjeta.dataset.id = z.id;
    tarjeta.innerHTML = `
      ${z.renderMiniatura('tarjeta__imagen', 'tarjeta__emoji')}
      <span class="tarjeta__etiqueta">${z.obtenerEtiqueta()}</span>
      <p class="tarjeta__stock ${z.stock <= 3 && z.stock > 0 ? 'tarjeta__stock--bajo' : ''}">
        ${z.hayStock() ? `${z.stock} disponibles` : 'Agotado'}
      </p>
      <button class="tarjeta__agregar tarjeta__consultar" data-accion="consultar" data-id="${z.id}" ${z.hayStock() ? '' : 'disabled'}>
        ${z.hayStock() ? `${ICONO_WHATSAPP} Consultar precio` : 'Sin stock'}
      </button>
    `;
    gridProductos.appendChild(tarjeta);
    i++;
  }

  resultadoInfo.textContent = `${lista.length} de ${catalogo.length} productos`;
}

function renderCarrito() {
  const filas = carrito.listar();
  contadorCarrito.textContent = carrito.cantidadTotal();

  if (filas.length === 0) {
    itemsCarritoEl.innerHTML = '<p class="vacio">Tu carrito está vacío.</p>';
  } else {
    itemsCarritoEl.innerHTML = filas.map(({ zapato, cantidad }) => `
      <div class="item-carrito" data-id="${zapato.id}">
        ${zapato.renderMiniatura('item-carrito__imagen', 'item-carrito__emoji')}
        <div class="item-carrito__info">
          <p class="item-carrito__nombre">${zapato.nombre}</p>
          <p>${zapato.precioFormateado}</p>
          <div class="item-carrito__controles">
            <button data-accion="restar" data-id="${zapato.id}">−</button>
            <span>${cantidad}</span>
            <button data-accion="sumar" data-id="${zapato.id}">+</button>
          </div>
        </div>
        <button class="item-carrito__quitar" data-accion="quitar" data-id="${zapato.id}">Quitar</button>
      </div>
    `).join('');
  }

  const subtotal   = carrito.subtotal();
  // Verificación cruzada: el total recursivo debe coincidir con reduce()
  const totalRec   = calcularTotalRecursivo(carrito.listar());
  console.assert(Math.abs(subtotal - totalRec) < 0.01, 'El total recursivo no coincide con el subtotal');

  const descuento  = calcularDescuento(subtotal);
  const envio      = calcularEnvio(subtotal - descuento);
  const total      = subtotal - descuento + envio;

  document.getElementById('res-subtotal').textContent = formatearMoneda(subtotal);
  document.getElementById('res-descuento').textContent = `- ${formatearMoneda(descuento)}`;
  document.getElementById('res-envio').textContent = envio === 0 ? 'Gratis' : formatearMoneda(envio);
  document.getElementById('res-total').textContent = formatearMoneda(total);
}

/* =========================================================================
   NOTIFICACIONES (toast) — usa setTimeout (temporizador)
   ========================================================================= */
function mostrarToast(mensaje, tipo = 'info') {
  const contenedor = document.getElementById('toast-contenedor');
  const toast = document.createElement('div');
  toast.className = `toast ${tipo === 'error' ? 'toast--error' : ''}`;
  toast.textContent = mensaje;
  contenedor.appendChild(toast);

  setTimeout(() => toast.remove(), 2600); // temporizador: desaparece solo
}

/* =========================================================================
   8) EVENTOS DEL DOM
   ========================================================================= */

// --- Evento "load": se dispara cuando toda la página terminó de cargar ---
// Es "async" porque adentro esperamos (await) a que lleguen los productos
// de Firestore antes de pintar el catálogo por primera vez.
window.addEventListener('load', async () => {
  await cargarProductosDesdeFirestore();
  document.getElementById('loader').classList.add('loader--oculto');
  mostrarToast(`Bienvenido a ${NOMBRE_TIENDA} 👋`);
  renderCatalogo();
  renderCarrito();
});

// --- Evento de scroll: encoge el header y muestra/oculta "volver arriba" ---
const header = document.getElementById('header');
const btnArriba = document.getElementById('btn-arriba');
window.addEventListener('scroll', () => {
  const desplazado = window.scrollY > 40;
  header.classList.toggle('header--con-scroll', desplazado);
  btnArriba.hidden = window.scrollY < 400;
});
btnArriba.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// --- Eventos de teclado en el buscador (keyup / keydown) ---
const buscador = document.getElementById('buscador');
buscador.addEventListener('keyup', (evento) => {
  ultimaBusqueda = evento.target.value;
  renderCatalogo();
});
buscador.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') {            // tecla especial: limpiar
    buscador.value = '';
    ultimaBusqueda = '';
    renderCatalogo();
  }
  if (evento.key === 'Enter') {
    mostrarToast(`Buscando "${evento.target.value}"...`);
  }
});

// --- Clic en la lupa: busca lo escrito y devuelve el foco al campo ---
document.getElementById('btn-buscar').addEventListener('click', () => {
  ultimaBusqueda = buscador.value;
  renderCatalogo();
  buscador.focus();
  // Solo baja al catálogo si el usuario escribió algo
  if (buscador.value.trim() !== '') {
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
  }
});

// --- Eventos de foco / desenfoque ---
buscador.addEventListener('focus', () => buscador.classList.add('buscador--enfocado'));
buscador.addEventListener('blur',  () => buscador.classList.remove('buscador--enfocado'));

// --- Filtro por categoría (delegación + switch visual con clases) ---
document.querySelectorAll('.nav__link').forEach(boton => {
  boton.addEventListener('click', () => {
    categoriaActiva = boton.dataset.categoria;
    document.querySelectorAll('.nav__link').forEach(b => b.classList.remove('nav__link--activo'));
    boton.classList.add('nav__link--activo');
    renderCatalogo();
  });
});

/* =========================================================================
   9) PROPAGACIÓN DE EVENTOS (burbujeo y captura)
   ------------------------------------------------------------------------
   - La tarjeta completa tiene un listener en fase de BURBUJEO que abre el
     modal de detalle al hacer clic en cualquier parte de ella.
   - El botón "Agregar al carrito" está DENTRO de la tarjeta. Si no se
     detuviera la propagación, un clic en el botón también activaría el
     listener de la tarjeta (porque el evento burbujea del botón hacia
     afuera). Por eso usamos evento.stopPropagation() dentro del botón.
   - Además registramos un listener en fase de CAPTURA en el contenedor
     para mostrar, en consola, que la captura ocurre ANTES que el burbujeo.
   ========================================================================= */
gridProductos.addEventListener('click', (evento) => {
  console.log('1) FASE DE CAPTURA en el grid'); // se ejecuta primero
}, true); // true = capturar

gridProductos.addEventListener('click', (evento) => {
  // "Consultar precio": abre WhatsApp y evita que el clic también abra el modal
  const consultar = evento.target.closest('[data-accion="consultar"]');
  if (consultar) {
    evento.stopPropagation();
    const zapatoConsulta = catalogo.find(z => z.id === consultar.dataset.id);
    window.open(zapatoConsulta.enlaceConsulta(), '_blank', 'noopener');
    return;
  }

  const boton = evento.target.closest('[data-accion="agregar"]');
  if (boton) {
    evento.stopPropagation(); // evita que el clic también "abra" la tarjeta
    const id = boton.dataset.id;
    const zapato = catalogo.find(z => z.id === id);
    const agregado = carrito.agregar(zapato, 1);

    contadorClicsAgregar(); // función "creciente": suma un clic más
    if (agregado) {
      mostrarToast(`${zapato.nombre} agregado al carrito`);
      renderCarrito();
      renderCatalogo();
    } else {
      mostrarToast('No se pudo agregar el producto', 'error');
    }
    return;
  }

  // Si el clic no fue en el botón, entonces sí abrimos el detalle
  const tarjeta = evento.target.closest('.tarjeta');
  if (tarjeta) {
    abrirModal(tarjeta.dataset.id);
  }
});

/* --- Delegación de eventos dentro del carrito (sumar/restar/quitar) --- */
itemsCarritoEl.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;
  const id = boton.dataset.id;
  const accion = boton.dataset.accion;
  const fila = carrito.listar().find(f => f.zapato.id === id);
  if (!fila) return;

  switch (accion) {                                      // 2) estructura de control: switch
    case 'sumar':
      carrito.actualizarCantidad(id, fila.cantidad + 1);
      break;
    case 'restar':
      carrito.actualizarCantidad(id, fila.cantidad - 1);
      break;
    case 'quitar':
      carrito.quitar(id);
      break;
  }
  renderCarrito();
});

document.getElementById('btn-vaciar').addEventListener('click', () => {
  carrito.vaciar();
  renderCarrito();
  mostrarToast('Carrito vaciado');
});

/* --- Abrir / cerrar carrito lateral --- */
const panelCarrito = document.getElementById('panel-carrito');
const overlay = document.getElementById('overlay');

function alternarCarrito(abrir) {
  carritoAbierto = abrir;
  panelCarrito.classList.toggle('panel-carrito--abierto', abrir);
  overlay.hidden = !abrir;
}
document.getElementById('btn-carrito').addEventListener('click', () => alternarCarrito(true));
document.getElementById('cerrar-carrito').addEventListener('click', () => alternarCarrito(false));
overlay.addEventListener('click', () => alternarCarrito(false));

/* --- Modal de detalle --- */
const modal = document.getElementById('modal');
function abrirModal(id) {
  const z = catalogo.find(p => p.id === id);
  if (!z) return;
  document.getElementById('modal-cuerpo').innerHTML = `
    <div class="modal-detalle__imagen-wrap">${z.renderMiniatura('modal-detalle__imagen', 'modal-detalle__emoji')}</div>
    <h3>${z.nombre}</h3>
    <p>${z.obtenerEtiqueta()} · ${z.precioFormateado}</p>
    <p>${z.hayStock() ? `Stock disponible: ${z.stock} pares` : 'Producto agotado por ahora'}</p>
    <button class="btn btn--primario" data-accion="agregar" data-id="${z.id}" ${z.hayStock() ? '' : 'disabled'}>
      Agregar al carrito
    </button>
  `;
  modal.hidden = false;
}
document.getElementById('cerrar-modal').addEventListener('click', () => (modal.hidden = true));
document.getElementById('modal-cuerpo').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-accion="agregar"]');
  if (!boton) return;
  const id = boton.dataset.id;
  const zapato = catalogo.find(z => z.id === id);
  if (carrito.agregar(zapato, 1)) {
    contadorClicsAgregar(); // función "creciente": suma un clic más
    mostrarToast(`${zapato.nombre} agregado al carrito`);
    renderCarrito();
    renderCatalogo();
    modal.hidden = true;
  }
});

/* =========================================================================
   TEMPORIZADOR: mensajes rotativos del hero (setInterval)
   ========================================================================= */
const mensajesHero = ['Precios cómodos', 'Envío gratis', 'Elige tu estilo'];
let indiceMensaje = 0;
setInterval(() => {
  indiceMensaje = (indiceMensaje + 1) % mensajesHero.length; // 2) operador módulo
  document.getElementById('hero-mensaje').textContent = mensajesHero[indiceMensaje];
}, 4000);

/* =========================================================================
   TEMPORIZADOR: carrusel de GIFs del hero (setInterval + setTimeout)
   -------------------------------------------------------------------------
   Rota los GIF de la carpeta imagenes/ cada 6 segundos con un desvanecimiento.
   Para agregar, quitar o reordenar GIF, edita solo la lista GIFS_HERO.
   ========================================================================= */
const imgHero = document.querySelector('.hero__vitrina img');
if (imgHero) {
  const GIFS_HERO = [
    'imagenes/foto1.gif',
    'imagenes/foto2.gif',
    'imagenes/pp1.gif',
  ];
  let indiceGif = 0;
  imgHero.src = GIFS_HERO[0];                                // arranca con el primero

  if (GIFS_HERO.length > 1) {
    GIFS_HERO.forEach(ruta => { new Image().src = ruta; }); // precarga para que no parpadee

    setInterval(() => {
      imgHero.classList.add('hero-gif--oculto');             // 1) se desvanece
      setTimeout(() => {                                     // 2) a los 0,5 s cambia el GIF
        indiceGif = (indiceGif + 1) % GIFS_HERO.length;      //    operador módulo: vuelve al primero
        imgHero.onload = imgHero.onerror = () => imgHero.classList.remove('hero-gif--oculto'); // 3) reaparece
        imgHero.src = GIFS_HERO[indiceGif];
      }, 500);
    }, 6000);                                                // cada 6 segundos
  }
}

/* =========================================================================
   Demostraciones adicionales en consola (para la sustentación oral)
   ========================================================================= */
console.log('Suma con "arguments":', sumarVarios(10, 20, 30));       // 30 -> 60
console.log('Descuento de temporada sobre S/200:', descuentoNavidad(200).toFixed(2));