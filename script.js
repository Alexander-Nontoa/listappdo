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

    // Prevenir envío de formularios (por ahora)
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('¡Login funcionará pronto! 🔥');
        authSection.style.display = 'none';
    });

    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('¡Registro funcionará pronto! 🎉');
        authSection.style.display = 'none';
    });