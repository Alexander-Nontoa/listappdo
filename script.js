// =========================================
// INICIALIZACIÓN SEGURA Y VERIFICACIÓN
// =========================================

console.log("🔧 Iniciando Listappdo...");

// Variables globales seguras
let db, auth;
let listaActivaId = 'principal';
let listasUsuario = [];

// =========================================
// FUNCIÓN PARA FORMATEAR PESOS COLOMBIANOS
// =========================================
function formatearPesos(valor) {
    const numero = parseFloat(valor) || 0;
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numero);
}

// Esperar a que todo esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ DOM listo");
    
    // Inicializar Firebase seguro
    inicializarFirebase();
    inicializarApp();
});

function inicializarFirebase() {
    // VERIFICAR SI FIREBASE ESTÁ LISTO
    if (typeof firebase === 'undefined') {
        console.error("❌ Firebase no cargó");
        setTimeout(inicializarFirebase, 100);
        return;
    }
    
    try {
        // INICIALIZAR FIREBASE (sin const para evitar duplicados)
        db = firebase.firestore();
        auth = firebase.auth();
        console.log("✅ Firebase inicializado correctamente");
    } catch (error) {
        console.error("❌ Error inicializando Firebase:", error);
    }
}

function inicializarApp() {
    console.log("🚀 Inicializando aplicación...");
    
    // Verificar que Firebase esté listo
    if (!db || !auth) {
        console.log("⏳ Esperando Firebase...");
        setTimeout(inicializarApp, 100);
        return;
    }
    
    // ===== INICIALIZAR VARIABLES DEL DOM =====
    const modalListas = document.getElementById('modalListas');
    const btnGestionListas = document.getElementById('btnGestionListas');
    const btnCerrarModal = document.getElementById('btnCerrarModal');
    const listaDeListas = document.getElementById('listaDeListas');
    const inputNuevaLista = document.getElementById('inputNuevaLista');
    const btnCrearLista = document.getElementById('btnCrearLista');
    const nombreListaActiva = document.getElementById('nombreListaActiva');
    const authSection = document.getElementById('authSection');
    const btnShowAuth = document.getElementById('btnShowAuth');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const inputItem = document.getElementById('nuevoItem');
    const btnAgregar = document.getElementById('btnAgregar');
    const listaContainer = document.getElementById('listaContainer');

    // ===== VERIFICAR QUE TODOS LOS ELEMENTOS EXISTAN =====
    if (!btnAgregar || !inputItem) {
        console.error("❌ No se encontraron elementos críticos");
        return;
    }

    console.log("✅ Todos los elementos del DOM cargados");

    // ===== GESTIÓN DE LISTAS COLABORATIVAS =====
    btnGestionListas.addEventListener('click', function() {
        modalListas.style.display = 'flex';
        cargarListasUsuario();
    });

    btnCerrarModal.addEventListener('click', function() {
        modalListas.style.display = 'none';
    });

    // Cerrar modal al hacer clic fuera
    modalListas.addEventListener('click', function(e) {
        if (e.target === modalListas) {
            modalListas.style.display = 'none';
        }
    });

   // Función para cargar listas del usuario
function cargarListasUsuario() {
    const user = auth.currentUser;
    if (!user) {
        console.log("👤 No hay usuario logueado");
        return;
    }

    listaDeListas.innerHTML = '<p>Cargando listas...</p>';

    db.collection('listas')
        .where('usuariosCompartidos', 'array-contains', user.uid)
        .get()
        .then((querySnapshot) => {
            listasUsuario = [];
            listaDeListas.innerHTML = '';

            if (querySnapshot.empty) {
                listaDeListas.innerHTML = '<p>No hay listas. Crea una nueva!</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const lista = {
                    id: doc.id,
                    ...doc.data()
                };
                listasUsuario.push(lista);

                const itemLista = document.createElement('div');
                itemLista.className = `item-lista ${doc.id === listaActivaId ? 'activa' : ''}`;
                
                // NO permitir eliminar la lista principal
                const esListaPrincipal = doc.id === 'principal';
                
                itemLista.innerHTML = `
                    <div class="lista-info">
                        <span>${lista.nombre}</span>
                        <small>${esListaPrincipal ? 'Por defecto' : ''}</small>
                    </div>
                    ${!esListaPrincipal ? `
                        <button class="btn-eliminar-lista" onclick="eliminarLista('${doc.id}', '${lista.nombre}')">
                            🗑️
                        </button>
                    ` : ''}
                `;
                
                // Solo permitir cambiar lista al hacer clic en la info, no en el botón eliminar
                itemLista.querySelector('.lista-info').addEventListener('click', function() {
                    cambiarListaActiva(doc.id, lista.nombre);
                });

                listaDeListas.appendChild(itemLista);
            });
        })
        .catch((error) => {
            console.error('Error cargando listas:', error);
            listaDeListas.innerHTML = '<p>Error al cargar listas</p>';
        });
}
   
   
    // Crear lista principal por defecto
    function crearListaPrincipal(userId) {
        const listaPrincipal = {
            nombre: 'Lista Principal',
            creador: userId,
            usuariosCompartidos: [userId],
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('listas').doc('principal').set(listaPrincipal)
            .then(() => {
                listaActivaId = 'principal';
                nombreListaActiva.textContent = 'Lista Principal';
                cargarListasUsuario();
            })
            .catch((error) => {
                console.error('Error creando lista principal:', error);
            });
    }

    // Cambiar lista activa
    function cambiarListaActiva(listaId, nombreLista) {
        listaActivaId = listaId;
        nombreListaActiva.textContent = nombreLista;
        modalListas.style.display = 'none';
        cargarItemsLista(listaId);
    }

    // Crear nueva lista
    btnCrearLista.addEventListener('click', function() {
        const nombre = inputNuevaLista.value.trim();
        if (nombre === '') {
            alert('¡Escribe un nombre para la lista!');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            alert('Debes iniciar sesión para crear listas');
            return;
        }

        const nuevaLista = {
            nombre: nombre,
            creador: user.uid,
            usuariosCompartidos: [user.uid],
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('listas').add(nuevaLista)
            .then((docRef) => {
                inputNuevaLista.value = '';
                cargarListasUsuario();
                alert('✅ Lista creada exitosamente');
            })
            .catch((error) => {
                console.error('Error creando lista:', error);
                alert('❌ Error al crear lista');
            });
    });

    // ===== FUNCIONES PARA ITEMS =====
    function cargarItemsLista(listaId) {
        const listaContainer = document.getElementById('listaContainer');
        if (!listaContainer) {
            console.error("❌ No se encontró listaContainer");
            return;
        }
        
        listaContainer.innerHTML = '<li class="item">🎯 Cargando items...</li>';

        db.collection('items')
            .where('listaId', '==', listaId)
            .orderBy('fecha', 'desc')
            .onSnapshot((querySnapshot) => {
                listaContainer.innerHTML = '';
                
                if (querySnapshot.empty) {
                    listaContainer.innerHTML = '<li class="item">🎯 Esta lista está vacía. ¡Agrega tu primer item!</li>';
                    return;
                }

                let total = 0;

                querySnapshot.forEach((doc) => {
                    const item = doc.data();
                    const costo = item.costo || 0;
                    total += costo;

                    const li = document.createElement('li');
                    li.className = `item ${item.completado ? 'completado' : ''}`;
                    li.innerHTML = `
                        <span class="item-texto">${item.texto}</span>
                        <div class="item-botones">
                            ${costo > 0 ? `<span class="costo-display">$${formatearPesos(costo)}</span>` : ''}
                            <button class="btn-agregar-costo" onclick="agregarCosto('${doc.id}')">💰</button>
                            <button class="btn-completar" onclick="marcarCompletado('${doc.id}', ${!item.completado})">
                                ${item.completado ? '↶' : '✓'}
                            </button>
                            <button class="btn-eliminar" onclick="eliminarItem('${doc.id}')">🗑️</button>
                        </div>
                    `;
                    listaContainer.appendChild(li);
                });

                // Mostrar total con formato pesos
                const totalElement = document.createElement('li');
                totalElement.className = 'item total';
                totalElement.innerHTML = `<strong>💰 Total: $${formatearPesos(total)}</strong>`;
                listaContainer.appendChild(totalElement);
                
                console.log("✅ Items cargados. Total:", formatearPesos(total));
            }, (error) => {
                console.error('Error cargando items:', error);
                listaContainer.innerHTML = '<li class="item">❌ Error al cargar items</li>';
            });
    }

    // Función para agregar items
    function agregarItem() {
        const texto = document.getElementById('nuevoItem').value.trim();
        
        if (texto === '') {
            alert('¡Escribe algo primero! 📝');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            alert('Debes iniciar sesión para agregar items');
            return;
        }

        const nuevoItem = {
            texto: texto,
            listaId: listaActivaId,
            usuarioQueAgrego: user.uid,
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            completado: false,
            costo: 0
        };

        db.collection('items').add(nuevoItem)
            .then((docRef) => {
                document.getElementById('nuevoItem').value = '';
                document.getElementById('nuevoItem').focus();
                console.log('✅ Item agregado');
            })
            .catch((error) => {
                console.error('Error agregando item:', error);
                alert('❌ Error al agregar item');
            });
    }

    // Event listeners para agregar items
    btnAgregar.addEventListener('click', agregarItem);
    
    inputItem.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            agregarItem();
        }
    });

    // ===== SISTEMA DE AUTENTICACIÓN =====
    btnShowAuth.addEventListener('click', function() {
        authSection.style.display = 'flex';
    });

    authSection.addEventListener('click', function(e) {
        if (e.target === authSection) {
            authSection.style.display = 'none';
        }
    });

    switchToRegister.addEventListener('click', function() {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        switchToLogin.textContent = '¿Ya tienes cuenta? Inicia sesión';
    });

    switchToLogin.addEventListener('click', function() {
        if (registerForm.style.display === 'block') {
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            switchToLogin.textContent = '¿Olvidaste tu contraseña? Recuperémosla';
        } else {
            alert('¡Función de recuperación coming soon! 🔐');
        }
    });

    // Registro de usuario
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nombre = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                return db.collection('usuarios').doc(user.uid).set({
                    nombre: nombre,
                    email: email,
                    fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                alert('🎉 ¡Cuenta creada EXITOSAMENTE! Bienvenido/a ' + nombre);
                authSection.style.display = 'none';
                registerForm.reset();
                btnShowAuth.textContent = '👋 ' + nombre;
                crearListaPrincipal(auth.currentUser.uid);
            })
            .catch((error) => {
                const errorCode = error.code;
                let mensajeError = 'Error al crear cuenta';
                
                if (errorCode === 'auth/email-already-in-use') {
                    mensajeError = '❌ Este email ya está registrado';
                } else if (errorCode === 'auth/invalid-email') {
                    mensajeError = '❌ Email inválido';
                } else if (errorCode === 'auth/weak-password') {
                    mensajeError = '❌ Contraseña muy débil';
                }
                
                alert(mensajeError);
            });
    });

    // Login de usuario
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                return db.collection('usuarios').doc(user.uid).get();
            })
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    alert('🚀 ¡Login EXITOSO! Bienvenido/a ' + userData.nombre);
                    authSection.style.display = 'none';
                    loginForm.reset();
                    btnShowAuth.textContent = '👋 ' + userData.nombre;
                    cargarListasUsuario();
                    cargarItemsLista(listaActivaId);
                }
            })
            .catch((error) => {
                const errorCode = error.code;
                let mensajeError = 'Error al iniciar sesión';
                
                if (errorCode === 'auth/user-not-found') {
                    mensajeError = '❌ Usuario no encontrado';
                } else if (errorCode === 'auth/wrong-password') {
                    mensajeError = '❌ Contraseña incorrecta';
                } else if (errorCode === 'auth/invalid-email') {
                    mensajeError = '❌ Email inválido';
                }
                
                alert(mensajeError);
            });
    });

    // Verificar autenticación
    auth.onAuthStateChanged((user) => {
        if (user) {
            db.collection('usuarios').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        btnShowAuth.textContent = '👋 ' + userData.nombre;
                        cargarListasUsuario();
                        cargarItemsLista(listaActivaId);
                    }
                });
        } else {
            btnShowAuth.textContent = '👤 Mi Cuenta';
            if (listaContainer) {
                listaContainer.innerHTML = '<li class="item">🔐 Inicia sesión para ver tus listas</li>';
            }
        }
    });

    console.log("🎉 Aplicación completamente inicializada");
}

// =========================================
// FUNCIONES GLOBALES PARA LOS BOTONES
// =========================================
window.marcarCompletado = function(itemId, completado) {
    firebase.firestore().collection('items').doc(itemId).update({
        completado: completado
    }).catch(error => console.error('Error actualizando item:', error));
};

window.eliminarItem = function(itemId) {
    if (confirm('¿Eliminar este item?')) {
        firebase.firestore().collection('items').doc(itemId).delete()
            .catch(error => console.error('Error eliminando item:', error));
    }
};

window.agregarCosto = function(itemId) {
    const costo = prompt('¿Cuánto cuesta este item? (Ej: 10000 para diez mil pesos)');
    
    if (costo && !isNaN(costo)) {
        const costoNumero = parseFloat(costo);
        firebase.firestore().collection('items').doc(itemId).update({
            costo: costoNumero
        }).then(() => {
            console.log("✅ Costo actualizado:", formatearPesos(costoNumero));
        }).catch(error => {
            console.error('Error actualizando costo:', error);
        });
    } else if (costo) {
        alert('❌ Por favor ingresa solo números (Ej: 10000)');
    }
};

// =========================================
// SISTEMA DE EMERGENCIA (backup)
// =========================================
window.agregarItemEmergencia = function() {
    const input = document.getElementById('nuevoItem');
    const texto = input.value.trim();
    
    if (texto === '') {
        alert('¡Escribe algo primero! 📝');
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Debes iniciar sesión para agregar items');
        return;
    }

    const nuevoItem = {
        texto: texto,
        listaId: listaActivaId,
        usuarioQueAgrego: user.uid,
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
        completado: false,
        costo: 0
    };

    firebase.firestore().collection('items').add(nuevoItem)
        .then((docRef) => {
            input.value = '';
            input.focus();
            if (window.cargarItemsLista) {
                window.cargarItemsLista(listaActivaId);
            }
        })
        .catch((error) => {
            console.error('❌ ERROR:', error);
            alert('Error: ' + error.message);
        });
};

// Hacer cargarItemsLista global como backup
window.cargarItemsLista = function(listaId) {
    const listaContainer = document.getElementById('listaContainer');
    if (!listaContainer) return;
    
    firebase.firestore().collection('items')
        .where('listaId', '==', listaId)
        .orderBy('fecha', 'desc')
        .onSnapshot((querySnapshot) => {
            // Esta función se usa solo como backup
        });
};

// =========================================
// FUNCIÓN PARA ELIMINAR LISTAS
// =========================================

// =========================================
// FUNCIÓN PARA ELIMINAR LISTAS - VERSIÓN CORREGIDA
// =========================================
window.eliminarLista = function(listaId, nombreLista) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la lista "${nombreLista}"?\n\nEsta acción también eliminará todos los items de esta lista y no se puede deshacer.`)) {
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Debes iniciar sesión para eliminar listas');
        return;
    }

    console.log("🗑️ Eliminando lista:", listaId);

    // PRIMERO: Eliminar todos los items de esta lista
    db.collection('items')
        .where('listaId', '==', listaId)
        .get()
        .then((querySnapshot) => {
            const batch = db.batch();
            
            // Agregar todas las eliminaciones al batch
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            // Ejecutar batch de eliminación de items
            return batch.commit();
        })
        .then(() => {
            console.log("✅ Todos los items eliminados");
            
            // SEGUNDO: Eliminar la lista misma
            return db.collection('listas').doc(listaId).delete();
        })
        .then(() => {
            console.log("✅ Lista eliminada exitosamente");
            
            // Si la lista eliminada era la activa, cambiar a la principal
            if (listaId === listaActivaId) {
                listaActivaId = 'principal';
                document.getElementById('nombreListaActiva').textContent = 'Lista Principal';
                // Usar la función global para cargar items
                if (window.cargarItemsLista) {
                    window.cargarItemsLista('principal');
                }
            }
            
            // SOLUCIÓN: Recargar la página para actualizar todo
            location.reload();
            
        })
        .catch((error) => {
            console.error('❌ Error eliminando lista:', error);
            alert('❌ Error al eliminar la lista: ' + error.message);
        });
};

// Manejo de errores global
window.addEventListener('error', function(e) {
    console.error("💥 Error global:", e.error);
});

console.log("📦 Listappdo cargado completamente - Listo para usar 🎯");