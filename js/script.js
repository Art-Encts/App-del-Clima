/* ==========================================
   SCRIPT - APP DEL CLIMA
   Conexión con OpenWeatherMap
   ========================================== */

// Clave de acceso a la API
const clave = '74304fa48c1f0774ffeb301e941a47b3';

// Referencias a elementos de la página
const formulario = document.getElementById('formu');
const cajaCiudad = document.getElementById('caja');
const mensaje = document.getElementById('texto');
const cajaResultado = document.getElementById('cajaResultado');

// Elementos donde se mostrarán los datos
const elementoNombreCiudad = document.getElementById('nombreCiudad');
const elementoTemperatura = document.getElementById('temperatura');
const elementoDescripcion = document.getElementById('descripcion');
const elementoSensacion = document.getElementById('sensacion');
const elementoHumedad = document.getElementById('humedad');

// Cuando se envía el formulario
formulario.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Obtener el texto escrito por el usuario
    let ciudad = cajaCiudad.value.trim();
    
    // Validar que no esté vacío
    if (!ciudad) {
        mensaje.textContent = 'Por favor escribe el nombre de una ciudad.';
        return;
    }
    
    // Llamar a la función que busca los datos
    buscarClima(ciudad);
});

// Función principal para consultar la API
async function buscarClima(ciudad) {
    // Mostrar mensaje de búsqueda
    mensaje.textContent = 'Buscando información...';
    
    // Ocultar resultados anteriores
    cajaResultado.style.display = 'none';
    
    // Construir la dirección completa de la API
    let direccion = 'https://api.openweathermap.org/data/2.5/weather?q=' + 
                    encodeURIComponent(ciudad) + 
                    '&appid=' + clave + 
                    '&units=metric' + 
                    '&lang=es';
    
    try {
        // Hacer la petición al servidor
        let respuesta = await fetch(direccion);
        
        // Si la respuesta no es correcta
        if (!respuesta.ok) {
            if (respuesta.status === 404) {
                throw new Error('Ciudad no encontrada. Revisa el nombre.');
            }
            if (respuesta.status === 401) {
                throw new Error('La clave aún no está activa. Espera unos minutos.');
            }
            throw new Error('Error: ' + respuesta.status);
        }
        
        // Convertir los datos recibidos a formato legible
        let datos = await respuesta.json();
        
        // Mostrar los datos en la página
        mostrarResultados(datos);
        
        // Mensaje de confirmación
        mensaje.textContent = 'Datos cargados correctamente.';
        
    } catch (error) {
        // Mostrar el error si algo sale mal
        mensaje.textContent = error.message;
    }
}

// Función para colocar los datos en la página
function mostrarResultados(datos) {
    // Extraer cada dato del objeto recibido
    let nombre = datos.name;
    let temperatura = Math.round(datos.main.temp);
    let descripcion = datos.weather[0].description;
    let sensacion = Math.round(datos.main.feels_like);
    let humedad = datos.main.humidity;
    let estado = datos.weather[0].main.toLowerCase();
    
    // Colocar cada dato en su lugar correspondiente
    elementoNombreCiudad.textContent = nombre;
    elementoTemperatura.textContent = temperatura + '°C';
    elementoDescripcion.textContent = descripcion;
    elementoSensacion.textContent = 'Sensación: ' + sensacion + '°C';
    elementoHumedad.textContent = 'Humedad: ' + humedad + '%';
    
    // Cambiar el color de fondo según el clima
    document.body.classList.remove('soleado', 'nublado', 'lluvioso');
    
    if (estado.includes('clear')) {
        document.body.classList.add('soleado');
    } else if (estado.includes('cloud')) {
        document.body.classList.add('nublado');
    } else if (estado.includes('rain') || estado.includes('drizzle') || estado.includes('thunder')) {
        document.body.classList.add('lluvioso');
    }
    
    // Mostrar la caja con los resultados
    cajaResultado.style.display = 'block';
}