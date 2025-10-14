// script.js - VERSIÓN CON FORMATO DE MONEDA

document.addEventListener('DOMContentLoaded', function() {
    
    // Función para formatear números como moneda
    function formatearMoneda(valor) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(valor);
    }
    
    const inputItem = document.getElementById('nuevoItem');
    const botonAgregar = document.getElementById('btnAgregar');
    const listaContainer = document.getElementById('listaContainer');
    
    let contadorItems = 0;
    let totalCompra = 0;
    
    actualizarContador();
    actualizarTotal();
    
    function agregarItem() {
        const texto = inputItem.value.trim();
        
        if (texto === '') {
            alert('¡Escribe algo primero! 📝');
            return;
        }
        
        // Crear nuevo item SIN costo inicial
        const nuevoItem = document.createElement('li');
        nuevoItem.className = 'item';
        nuevoItem.innerHTML = `
            <span class="texto-item">🛒 ${texto}</span>
            <div class="controles-item">
                <button class="btn-agregar-costo" title="Agregar costo">$</button>
                <button class="btn-completar">✅</button>
                <button class="btn-eliminar">❌</button>
            </div>
        `;
        
        let costo = 0;
        let costoElement = null;
        
        // AGREGAR COSTO con botón $
        const btnAgregarCosto = nuevoItem.querySelector('.btn-agregar-costo');
        btnAgregarCosto.addEventListener('click', function() {
            // Si ya tiene costo, editar. Si no, crear input
            if (costoElement) {
                // Ya tiene costo - convertir a input para editar
                const inputCosto = document.createElement('input');
                inputCosto.type = 'number';
                inputCosto.className = 'input-costo-item';
                inputCosto.placeholder = '$0';
                inputCosto.value = costo > 0 ? costo : '';
                inputCosto.min = '0';
                inputCosto.step = '100'; // Para que sea más fácil poner miles
                
                costoElement.replaceWith(inputCosto);
                inputCosto.focus();
                
                // Cuando presione ENTER o pierda el foco, guardar costo
                inputCosto.addEventListener('keypress', function(event) {
                    if (event.key === 'Enter') {
                        guardarCosto(inputCosto);
                    }
                });
                
                inputCosto.addEventListener('blur', function() {
                    guardarCosto(inputCosto);
                });
                
            } else {
                // No tiene costo - crear input nuevo
                const inputCosto = document.createElement('input');
                inputCosto.type = 'number';
                inputCosto.className = 'input-costo-item';
                inputCosto.placeholder = '$0';
                inputCosto.min = '0';
                inputCosto.step = '100';
                
                const textoItem = nuevoItem.querySelector('.texto-item');
                textoItem.appendChild(inputCosto);
                inputCosto.focus();
                
                // Cuando presione ENTER o pierda el foco, guardar costo
                inputCosto.addEventListener('keypress', function(event) {
                    if (event.key === 'Enter') {
                        guardarCosto(inputCosto);
                    }
                });
                
                inputCosto.addEventListener('blur', function() {
                    guardarCosto(inputCosto);
                });
            }
        });
        
        function guardarCosto(inputElement) {
            const nuevoCosto = parseFloat(inputElement.value) || 0;
            
            // Actualizar total (restar costo anterior, sumar nuevo)
            totalCompra -= costo;
            costo = nuevoCosto;
            totalCompra += costo;
            
            // Crear o actualizar display de costo
            if (costo > 0) {
                if (costoElement) {
                    // Actualizar existente
                    costoElement.textContent = `$${formatearMoneda(costo)}`;
                } else {
                    // Crear nuevo
                    costoElement = document.createElement('span');
                    costoElement.className = 'costo-display';
                    costoElement.textContent = `$${formatearMoneda(costo)}`;
                    inputElement.replaceWith(costoElement);
                }
                btnAgregarCosto.style.background = 'rgba(255, 215, 0, 0.4)';
                btnAgregarCosto.title = 'Editar costo';
            } else {
                // Si costo es 0, eliminar display
                if (costoElement) {
                    costoElement.remove();
                    costoElement = null;
                }
                inputElement.remove();
                btnAgregarCosto.style.background = 'rgba(255, 215, 0, 0.2)';
                btnAgregarCosto.title = 'Agregar costo';
            }
            
            actualizarTotal();
        }
        
        // Funcionalidad de COMPLETAR
        const btnCompletar = nuevoItem.querySelector('.btn-completar');
        const textoItem = nuevoItem.querySelector('.texto-item');
        
        btnCompletar.addEventListener('click', function() {
            textoItem.classList.toggle('completado');
            if (textoItem.classList.contains('completado')) {
                btnCompletar.textContent = '↩️';
            } else {
                btnCompletar.textContent = '✅';
            }
        });
        
        // Funcionalidad de ELIMINAR
        const btnEliminar = nuevoItem.querySelector('.btn-eliminar');
        btnEliminar.addEventListener('click', function() {
            // Restar el costo del total antes de eliminar
            totalCompra -= costo;
            actualizarTotal();
            
            nuevoItem.remove();
            contadorItems--;
            actualizarContador();
        });
        
        // Agregar a la lista
        listaContainer.appendChild(nuevoItem);
        
        // Actualizar contadores
        contadorItems++;
        actualizarContador();
        
        // Limpiar input
        inputItem.value = '';
        inputItem.focus();
        
        console.log('✅ Item agregado:', texto);
    }
    
    function actualizarContador() {
        const tituloLista = document.querySelector('.lista-items h2');
        tituloLista.textContent = `Mi Lista de Compras (${contadorItems})`;
    }
    
    function actualizarTotal() {
        let totalElement = document.getElementById('totalCompra');
        let totalContainer = document.querySelector('.total-container');
        
        if (!totalContainer && totalCompra > 0) {
            totalContainer = document.createElement('div');
            totalContainer.className = 'total-container';
            totalContainer.innerHTML = `
                <h3>Total de la compra:</h3>
                <div id="totalCompra">$${formatearMoneda(totalCompra)}</div>
            `;
            document.querySelector('.lista-items').appendChild(totalContainer);
        } else if (totalContainer) {
            totalElement.textContent = `$${formatearMoneda(totalCompra)}`;
            
            if (totalCompra > 0) {
                totalContainer.style.display = 'block';
            } else {
                totalContainer.style.display = 'none';
            }
        }
    }
    
    // Event listeners
    botonAgregar.addEventListener('click', agregarItem);
    inputItem.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            agregarItem();
        }
    });
    
    console.log('💰 Lista con formato de moneda lista!');
});