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