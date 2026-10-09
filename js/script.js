const clave = '74304fa48c1f0774ffeb301e941a47b3';

// Elementos del DOM
const formulario = document.getElementById('formu');
const cajaCiudad = document.getElementById('caja');
const mensaje = document.getElementById('texto');
const cajaResultado = document.getElementById('cajaResultado');
const botonLimpiar = document.getElementById('botonLimpiar');
const botonUbicacion = document.getElementById('botonUbicacion');
const botonTema = document.getElementById('botonTema');
const botonCompartir = document.getElementById('botonCompartir');
const contenedorHistorial = document.getElementById('historial');
const seccionPronostico = document.getElementById('pronostico');

// Elementos de datos
const elementoNombreCiudad = document.getElementById('nombreCiudad');
const elementoTemperatura = document.getElementById('temperatura');
const elementoDescripcion = document.getElementById('descripcion');
const elementoSensacion = document.getElementById('sensacion');
const elementoHumedad = document.getElementById('humedad');
const elementoPresion = document.getElementById('presion');
const elementoViento = document.getElementById('viento');
const elementoAmanecer = document.getElementById('amanecer');
const elementoAtardecer = document.getElementById('atardecer');
const elementoRecomendacion = document.getElementById('recomendacion');

let ciudadActual = '';
let temperaturaActual = '';

// Cargar historial al iniciar
mostrarHistorial();

// RETO 4: Cambiar tema
botonTema.addEventListener('click', function() {
    document.body.classList.toggle('claro');
});

// Envio del formulario
formulario.addEventListener('submit', function(e) {
    e.preventDefault();
    let ciudad = cajaCiudad.value.trim();
    if (!ciudad) {
        mensaje.textContent = 'Por favor escribe el nombre de una ciudad.';
        return;
    }
    buscarClima(ciudad);
});

// RETO 1: Geolocalizacion
botonUbicacion.addEventListener('click', function() {
    if (!navigator.geolocation) {
        mensaje.textContent = 'Tu navegador no soporta ubicacion.';
        return;
    }
    mensaje.textContent = 'Obteniendo tu ubicacion...';
    navigator.geolocation.getCurrentPosition(
        async function(posicion) {
            const lat = posicion.coords.latitude;
            const lon = posicion.coords.longitude;
            buscarClimaPorCoordenadas(lat, lon);
        },
        function(error) {
            mensaje.textContent = 'No se pudo obtener tu ubicacion.';
        }
    );
});

// RETO 5: Compartir en WhatsApp
botonCompartir.addEventListener('click', function() {
    if (!ciudadActual) {
        mensaje.textContent = 'Primero consulta una ciudad.';
        return;
    }
    const texto = encodeURIComponent('El clima en ' + ciudadActual + ' es ' + temperaturaActual);
    window.open('https://wa.me/?text=' + texto, '_blank');
});

// Boton Limpiar
botonLimpiar.addEventListener('click', function() {
    cajaCiudad.value = '';
    mensaje.textContent = '';
    cajaResultado.style.display = 'none';
    seccionPronostico.style.display = 'none';
    elementoRecomendacion.style.display = 'none';
    document.body.classList.remove('soleado', 'nublado', 'lluvioso', 'noche');
    ciudadActual = '';
    temperaturaActual = '';
    cajaCiudad.focus();
});

// Buscar por nombre de ciudad
async function buscarClima(ciudad) {
    mensaje.textContent = 'Buscando informacion...';
    prepararBusqueda();
    
    let direccion = 'https://api.openweathermap.org/data/2.5/weather?q=' + 
                    encodeURIComponent(ciudad) + 
                    '&appid=' + clave + '&units=metric&lang=es';
    
    try {
        let respuesta = await fetch(direccion);
        if (!respuesta.ok) manejarError(respuesta);
        let datos = await respuesta.json();
        
        // RETO 3: Guardar en historial
        guardarEnHistorial(datos.name);
        
        mostrarResultados(datos);
        buscarPronostico(ciudad);
        mensaje.textContent = 'Datos cargados correctamente.';
    } catch (error) {
        mensaje.textContent = error.message;
    }
}

// Buscar por coordenadas (geolocalizacion)
async function buscarClimaPorCoordenadas(lat, lon) {
    mensaje.textContent = 'Cargando clima de tu ubicacion...';
    prepararBusqueda();
    
    let direccion = 'https://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + 
                    '&appid=' + clave + '&units=metric&lang=es';
    
    try {
        let respuesta = await fetch(direccion);
        if (!respuesta.ok) throw new Error('No se pudo cargar tu ubicacion.');
        let datos = await respuesta.json();
        mostrarResultados(datos);
        buscarPronostico(datos.name);
        mensaje.textContent = 'Ubicacion cargada: ' + datos.name;
    } catch (error) {
        mensaje.textContent = error.message;
    }
}

// RETO 2: Obtener pronostico de 5 dias
async function buscarPronostico(ciudad) {
    let direccion = 'https://api.openweathermap.org/data/2.5/forecast?q=' + 
                    encodeURIComponent(ciudad) + 
                    '&appid=' + clave + '&units=metric&lang=es';
    
    try {
        let respuesta = await fetch(direccion);
        if (!respuesta.ok) return;
        let datos = await respuesta.json();
        mostrarPronostico(datos);
    } catch (error) {
        console.log('Pronostico no disponible');
    }
}

// Mostrar pronostico
function mostrarPronostico(datos) {
    seccionPronostico.innerHTML = '<h3>Pronostico de 5 dias</h3><div class="pronostico-dias"></div>';
    const contenedorDias = seccionPronostico.querySelector('.pronostico-dias');
    
    // Tomar un solo registro por dia (cada 8 horas = un dia)
    const diasUnicos = [];
    const fechasVistas = new Set();
    
    datos.list.forEach(function(item) {
        const fecha = item.dt_txt.split(' ')[0];
        if (!fechasVistas.has(fecha) && diasUnicos.length < 5) {
            fechasVistas.add(fecha);
            diasUnicos.push(item);
        }
    });
    
    diasUnicos.forEach(function(dia) {
        const fecha = new Date(dia.dt_txt);
        const nombreDia = fecha.toLocaleDateString('es-ES', {weekday:'long', day:'numeric', month:'numeric'});
        const temp = Math.round(dia.main.temp);
        const desc = dia.weather[0].description;
        
        contenedorDias.innerHTML += `
            <div class="dia">
                <p class="dia-fecha">${nombreDia}</p>
                <p class="dia-temp">${temp}°C</p>
                <p>${desc}</p>
            </div>
        `;
    });
    
    seccionPronostico.style.display = 'block';
}

// Mostrar resultados del clima actual
function mostrarResultados(datos) {
    ciudadActual = datos.name;
    temperaturaActual = Math.round(datos.main.temp) + '°C';
    
    let nombre = datos.name;
    let temperatura = Math.round(datos.main.temp);
    let descripcion = datos.weather[0].description;
    let sensacion = Math.round(datos.main.feels_like);
    let humedad = datos.main.humidity;
    let presion = datos.main.pressure;
    let viento = datos.wind.speed;
    let amanecer = new Date(datos.sys.sunrise * 1000);
    let atardecer = new Date(datos.sys.sunset * 1000);
    let estado = datos.weather[0].main.toLowerCase();
    
    elementoNombreCiudad.textContent = nombre;
    elementoTemperatura.textContent = temperatura + '°C';
    elementoDescripcion.textContent = descripcion;
    elementoSensacion.textContent = sensacion + '°C';
    elementoHumedad.textContent = humedad + '%';
    elementoPresion.textContent = presion + ' hPa';
    elementoViento.textContent = viento + ' m/s';
    elementoAmanecer.textContent = amanecer.toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'});
    elementoAtardecer.textContent = atardecer.toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'});
    
    // Cambiar fondo segun clima
    document.body.classList.remove('soleado', 'nublado', 'lluvioso', 'noche');
    if (estado.includes('clear')) document.body.classList.add('soleado');
    else if (estado.includes('cloud')) document.body.classList.add('nublado');
    else if (estado.includes('rain') || estado.includes('drizzle') || estado.includes('thunder')) {
        document.body.classList.add('lluvioso');
    }
    
    generarRecomendacion(temperatura);
    cajaResultado.style.display = 'block';
}

// Recomendacion segun temperatura
function generarRecomendacion(temp) {
    elementoRecomendacion.style.display = 'block';
    elementoRecomendacion.className = 'recomendacion';
    
    if (temp >= 30) {
        elementoRecomendacion.textContent = 'Hace mucho calor. Lleva agua, protector solar y ropa ligera.';
        elementoRecomendacion.classList.add('peligro');
    } else if (temp >= 20 && temp < 30) {
        elementoRecomendacion.textContent = 'Dia agradable. Perfecto para salir, no olvides tu agua.';
        elementoRecomendacion.classList.add('bueno');
    } else if (temp >= 10 && temp < 20) {
        elementoRecomendacion.textContent = 'Clima fresco. Lleva una chaqueta ligera.';
        elementoRecomendacion.classList.add('cuidado');
    } else if (temp >= 0 && temp < 10) {
        elementoRecomendacion.textContent = 'Hace frio. Abrigate bien con sueter y chamarra.';
        elementoRecomendacion.classList.add('cuidado');
    } else {
        elementoRecomendacion.textContent = 'Mucho frio. Usa ropa gruesa, bufanda y guantes.';
        elementoRecomendacion.classList.add('peligro');
    }
}

// RETO 3: Historial de busquedas
function guardarEnHistorial(ciudad) {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    
    // Quitar si ya existe para no duplicar
    historial = historial.filter(function(item) {
        return item !== ciudad;
    });
    
    historial.push(ciudad);
    
    // Mantener solo las ultimas 5
    if (historial.length > 5) {
        historial.shift();
    }
    
    localStorage.setItem('historial', JSON.stringify(historial));
    mostrarHistorial();
}

function mostrarHistorial() {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    
    if (historial.length === 0) {
        contenedorHistorial.innerHTML = '';
        return;
    }
    
    contenedorHistorial.innerHTML = '<p class="historial-titulo">Busquedas recientes:</p>';
    historial.forEach(function(ciudad) {
        const boton = document.createElement('button');
        boton.className = 'historial-boton';
        boton.textContent = ciudad;
        boton.addEventListener('click', function() {
            cajaCiudad.value = ciudad;
            buscarClima(ciudad);
        });
        contenedorHistorial.appendChild(boton);
    });
}

// Funciones auxiliares
function prepararBusqueda() {
    cajaResultado.style.display = 'none';
    seccionPronostico.style.display = 'none';
    elementoRecomendacion.style.display = 'none';
}

function manejarError(respuesta) {
    if (respuesta.status === 404) {
        throw new Error('Ciudad no encontrada. Revisa el nombre.');
    }
    if (respuesta.status === 401) {
        throw new Error('La clave aun no esta activa. Espera unos minutos.');
    }
    throw new Error('Error: ' + respuesta.status);
}
