// ===== GESTIÓN DE LISTAS COLABORATIVAS =====
const modalListas = document.getElementById('modalListas');
const btnGestionListas = document.getElementById('btnGestionListas');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const listaDeListas = document.getElementById('listaDeListas');
const inputNuevaLista = document.getElementById('inputNuevaLista');
const btnCrearLista = document.getElementById('btnCrearLista');
const nombreListaActiva = document.getElementById('nombreListaActiva');

let listaActivaId = 'principal'; // ID de la lista activa
let listasUsuario = []; // Array para almacenar las listas

// Mostrar/ocultar modal
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
    const user = firebase.auth().currentUser;
    if (!user) return;

    listaDeListas.innerHTML = '<p>Cargando listas...</p>';

    // Cargar listas donde el usuario es creador o está compartido
    db.collection('listas')
        .where('usuariosCompartidos', 'array-contains', user.uid)
        .get()
        .then((querySnapshot) => {
            listasUsuario = [];
            listaDeListas.innerHTML = '';

            querySnapshot.forEach((doc) => {
                const lista = {
                    id: doc.id,
                    ...doc.data()
                };
                listasUsuario.push(lista);

                // Crear elemento de lista en el modal
                const itemLista = document.createElement('div');
                itemLista.className = `item-lista ${doc.id === listaActivaId ? 'activa' : ''}`;
                itemLista.innerHTML = `
                    <span>${lista.nombre}</span>
                    <small>${doc.id === 'principal' ? 'Por defecto' : ''}</small>
                `;
                
                itemLista.addEventListener('click', function() {
                    cambiarListaActiva(doc.id, lista.nombre);
                });

                listaDeListas.appendChild(itemLista);
            });

            // Si no hay listas, crear una por defecto
            if (listasUsuario.length === 0) {
                crearListaPrincipal(user.uid);
            }
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
    
    // Recargar items de la nueva lista
    cargarItemsLista(listaId);
}

// Crear nueva lista
btnCrearLista.addEventListener('click', function() {
    const nombre = inputNuevaLista.value.trim();
    if (nombre === '') {
        alert('¡Escribe un nombre para la lista!');
        return;
    }

    const user = firebase.auth().currentUser;
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

// Función para cargar items de una lista específica
function cargarItemsLista(listaId) {
    // Limpiar lista actual
    listaContainer.innerHTML = '<li class="item">🎯 Cargando items...</li>';

    // Cargar items de la lista activa
    db.collection('items')
        .where('listaId', '==', listaId)
        .orderBy('fecha', 'desc')
        .get()
        .then((querySnapshot) => {
            listaContainer.innerHTML = '';
            
            if (querySnapshot.empty) {
                listaContainer.innerHTML = '<li class="item">🎯 Esta lista está vacía</li>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const item = doc.data();
                // Aquí crearías los elementos de la lista como lo haces actualmente
                // pero filtrados por listaId
                console.log('Item de la lista:', item); // Para debugging
            });
        })
        .catch((error) => {
            console.error('Error cargando items:', error);
            listaContainer.innerHTML = '<li class="item">❌ Error al cargar items</li>';
        });
}

// Modificar la función agregarItem para guardar en la lista activa
function agregarItem() {
    const texto = inputItem.value.trim();
    
    if (texto === '') {
        alert('¡Escribe algo primero! 📝');
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Debes iniciar sesión para agregar items');
        return;
    }

    // Crear nuevo item CON listaId
    const nuevoItem = {
        texto: texto,
        listaId: listaActivaId,
        usuarioQueAgrego: user.uid,
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
        completado: false
    };

    // Guardar en Firestore
    db.collection('items').add(nuevoItem)
        .then((docRef) => {
            // Limpiar input
            inputItem.value = '';
            inputItem.focus();
            
            // Recargar items de la lista actual
            cargarItemsLista(listaActivaId);
            
            console.log('✅ Item agregado a la lista:', listaActivaId);
        })
        .catch((error) => {
            console.error('Error agregando item:', error);
            alert('❌ Error al agregar item');
        });
}

// Escuchar cambios de autenticación para cargar listas
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        cargarListasUsuario();
        // Cargar items de la lista activa
        cargarItemsLista(listaActivaId);
    }
});

// ===== LOGICA LOGIN =====
const authSection = document.getElementById('authSection');
const btnShowAuth = document.getElementById('btnShowAuth');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');

// Mostrar/ocultar sección auth
btnShowAuth.addEventListener('click', function() {
    authSection.style.display = 'flex';
});

// Cerrar al hacer clic fuera
authSection.addEventListener('click', function(e) {
    if (e.target === authSection) {
        authSection.style.display = 'none';
    }
});

// Cambiar entre login y registro - VERSIÓN MEJORADA
switchToRegister.addEventListener('click', function() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    // Actualizar texto del otro botón
    switchToLogin.textContent = '¿Ya tienes cuenta? Inicia sesión';
});

switchToLogin.addEventListener('click', function() {
    if (registerForm.style.display === 'block') {
        // Si está viendo registro, volver a login
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        switchToLogin.textContent = '¿Olvidaste tu contraseña? Recuperémosla';
    } else {
        // Si está viendo login, mostrar recuperación de contraseña
        alert('¡Función de recuperación coming soon! 🔐');
    }
});

// ===== REGISTRO REAL CON FIREBASE =====
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    // Validación básica
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    // REGISTRO REAL con Firebase
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // ¡Usuario registrado EXITOSAMENTE!
            const user = userCredential.user;
            
            // Guardar nombre adicional en Firestore
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
            
            // Actualizar interfaz para usuario logeado
            btnShowAuth.textContent = '👋 ' + nombre;
            
            // Crear lista principal para el nuevo usuario
            crearListaPrincipal(user.uid);
        })
        .catch((error) => {
            // Manejar errores
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

// ===== LOGIN REAL CON FIREBASE =====
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // LOGIN REAL con Firebase
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // ¡Login EXITOSO!
            const user = userCredential.user;
            
            // Obtener datos del usuario
            return db.collection('usuarios').doc(user.uid).get();
        })
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                alert('🚀 ¡Login EXITOSO! Bienvenido/a ' + userData.nombre);
                authSection.style.display = 'none';
                loginForm.reset();
                
                // Actualizar interfaz
                btnShowAuth.textContent = '👋 ' + userData.nombre;
                
                // Cargar listas del usuario
                cargarListasUsuario();
            }
        })
        .catch((error) => {
            // Manejar errores
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

// ===== VERIFICAR SI YA HAY USUARIO LOGGEADO =====
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Usuario ya está logeado
        db.collection('usuarios').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    btnShowAuth.textContent = '👋 ' + userData.nombre;
                }
            });
    }
});