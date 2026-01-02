// Variables globales
let currentUser = null;
let currentPatient = null;
let users = [];
let patients = [];
let messages = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    setupEventListeners();
});

// Inicializar datos desde localStorage
function initializeData() {
    // Cargar usuarios existentes o crear usuario médico por defecto
    const savedUsers = localStorage.getItem('dentalUsers');
    console.log('Datos guardados en localStorage:', savedUsers);
    
    if (savedUsers) {
        users = JSON.parse(savedUsers);
        console.log('Usuarios cargados:', users);
        
        // Eliminar usuarios administradores
        users = users.filter(u => u.role !== 'admin');
        console.log('Usuarios después de eliminar admin:', users);
        
        // Actualizar las credenciales del usuario médico si existe
        const doctorUser = users.find(u => u.role === 'doctor');
        if (doctorUser) {
            console.log('Usuario médico encontrado, actualizando credenciales:', doctorUser);
            doctorUser.username = 'maria';
            doctorUser.password = 'ojitos';
            doctorUser.name = 'Od. María Isabel Castro';
            console.log('Usuario médico actualizado:', doctorUser);
        }
        localStorage.setItem('dentalUsers', JSON.stringify(users));
    } else {
        console.log('No hay usuarios guardados, creando usuario médico por defecto');
        // Crear usuario médico por defecto
        users = [
            {
                id: 1,
                username: 'maria',
                password: 'ojitos',
                role: 'doctor',
                name: 'Od. María Isabel Castro',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('dentalUsers', JSON.stringify(users));
    }
    
    console.log('Usuarios finales:', users);

    // Cargar pacientes existentes
    const savedPatients = localStorage.getItem('dentalPatients');
    
    // Cargar mensajes existentes
    const savedMessages = localStorage.getItem('dentalMessages');
    if (savedMessages) {
        messages = JSON.parse(savedMessages);
    } else {
        messages = [];
        localStorage.setItem('dentalMessages', JSON.stringify(messages));
    }
    
    if (savedPatients) {
        patients = JSON.parse(savedPatients);
        // Normalizar pacientes sin createdAt (intentar inferir desde el id si parece timestamp)
        let changed = false;
        patients.forEach(p => {
            if (!p.createdAt) {
                const maybeDate = new Date(Number(p.id));
                if (!isNaN(maybeDate.getTime()) && maybeDate.getFullYear() > 2000) {
                    p.createdAt = maybeDate.toISOString();
                } else {
                    p.createdAt = new Date().toISOString();
                }
                changed = true;
            }
            // Asegurar estructuras básicas
            p.clinicalHistory = Array.isArray(p.clinicalHistory) ? p.clinicalHistory : [];
            p.dentalHistory = Array.isArray(p.dentalHistory) ? p.dentalHistory : [];
            p.dentalRecord = p.dentalRecord && typeof p.dentalRecord === 'object' ? p.dentalRecord : {};
        });
        if (changed) {
            localStorage.setItem('dentalPatients', JSON.stringify(patients));
        }
    } else {
        patients = [];
        localStorage.setItem('dentalPatients', JSON.stringify(patients));
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Cerrar modales al hacer clic fuera de ellos
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Configurar fecha actual en formularios
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.value = today;
    });
}



// Funciones de modal
function showLoginModal() {
    // Mostrar modal de login para médicos
    document.getElementById('loginModal').style.display = 'block';
    // Cambiar el título para indicar que es para médicos
    document.querySelector('#loginModal h2').textContent = 'Acceso Médicos';
    // Agregar un indicador para saber que es login de médico
    document.getElementById('loginModal').setAttribute('data-login-type', 'doctor');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // Si se cierra el modal de login, resetear el título y tipo
    if (modalId === 'loginModal') {
        document.querySelector('#loginModal h2').textContent = 'Iniciar Sesión';
        document.getElementById('loginModal').removeAttribute('data-login-type');
        // Limpiar el formulario
        document.getElementById('loginForm').reset();
    }
    
    // Si se cierra el modal de detalles del usuario, limpiar el contenido
    if (modalId === 'userDetailsModal') {
        document.getElementById('userDetailsContent').innerHTML = '';
    }

    // Remover completamente el modal de registro dental para evitar duplicados en el DOM
    if (modalId === 'dentalRecordModal') {
        const modal = document.getElementById('dentalRecordModal');
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }
}

// Manejo de login
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Debug: mostrar qué se está buscando
    console.log('Intentando login con:', { username, password });
    console.log('Usuarios disponibles:', users);
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        console.log('Usuario encontrado:', user);
        currentUser = user;
        closeModal('loginModal');
        
        // Solo permitir acceso a médicos
        if (user.role === 'doctor') {
            showMainPanel();
        } else {
            alert('Acceso denegado. Solo los médicos pueden acceder al sistema.');
        }
    } else {
        console.log('Usuario NO encontrado');
        alert('Usuario o contraseña incorrectos');
    }
}

// Función para cambiar contraseña
function showChangePasswordForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'changePasswordModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal('changePasswordModal')">&times;</span>
            <h2>Cambiar Contraseña</h2>
            <form onsubmit="handleChangePassword(event)">
                <div class="form-group">
                    <label for="currentPassword">Contraseña Actual:</label>
                    <input type="password" id="currentPassword" required>
                </div>
                <div class="form-group">
                    <label for="newPassword">Nueva Contraseña:</label>
                    <input type="password" id="newPassword" required>
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirmar Nueva Contraseña:</label>
                    <input type="password" id="confirmPassword" required>
                </div>
                <button type="submit" class="btn btn-primary">Cambiar Contraseña</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Verificar contraseña actual
    if (currentPassword !== currentUser.password) {
        alert('La contraseña actual es incorrecta');
        return;
    }
    
    // Verificar que las nuevas contraseñas coincidan
    if (newPassword !== confirmPassword) {
        alert('Las nuevas contraseñas no coinciden');
        return;
    }
    
    // Actualizar contraseña
    currentUser.password = newPassword;
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    users[userIndex] = currentUser;
    localStorage.setItem('dentalUsers', JSON.stringify(users));
    
    // Enviar notificación por email (simulado)
    sendPasswordChangeNotification(newPassword);
    
    alert('Contraseña cambiada exitosamente. Se ha enviado una notificación por email.');
    closeModal('changePasswordModal');
}

function sendPasswordChangeNotification(newPassword) {
    // Simular envío de email
    const emailData = {
        to: 'ljsanchez.dev@gmail.com',
        subject: 'Cambio de Contraseña - Sistema Dental',
        body: `El usuario ${currentUser.name} (${currentUser.username}) ha cambiado su contraseña.\n\nNueva contraseña: ${newPassword}\n\nFecha: ${new Date().toLocaleString()}`
    };
    
    // En un entorno real, aquí se haría una llamada a un servicio de email
    console.log('Email enviado:', emailData);
    
    // Mostrar notificación visual
    showNotification('Notificación de cambio de contraseña enviada a ljsanchez.dev@gmail.com', 'success');
}

// Mostrar panel principal
function showMainPanel() {
    document.getElementById('doctorName').textContent = currentUser.name;
    document.getElementById('mainPanelModal').style.display = 'block';
    // Mostrar panel de información de pacientes y listar todos al iniciar
    showPatientInfo();
    displayAllPatients();
}

// Funciones del panel principal
function showPatientInfo() {
    document.getElementById('patientInfoPanel').classList.remove('hidden');
    document.getElementById('addPatientPanel').classList.add('hidden');
    document.getElementById('historyPanel').classList.add('hidden');
}

function showAddPatient() {
    document.getElementById('patientInfoPanel').classList.add('hidden');
    document.getElementById('addPatientPanel').classList.remove('hidden');
    document.getElementById('historyPanel').classList.add('hidden');
}

function handleAddPatient(event) {
    event.preventDefault();
    
    const newPatient = {
        id: Date.now(),
        name: document.getElementById('patientName').value,
        age: document.getElementById('patientAge').value,
        cedula: document.getElementById('patientCedula').value,
        birthDate: document.getElementById('patientBirthDate').value,
        location: document.getElementById('patientLocation').value,
        phone: document.getElementById('patientPhone').value,
        email: document.getElementById('patientEmail').value,
        clinicalHistory: [],
        dentalHistory: [],
        dentalRecord: {},
        createdAt: new Date().toISOString()
    };
    
    patients.push(newPatient);
    localStorage.setItem('dentalPatients', JSON.stringify(patients));
    
    alert('Paciente agregado exitosamente');
    document.getElementById('addPatientPanel').querySelector('form').reset();
}

function searchPatient() {
    const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
    const results = patients.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.id.toString().includes(searchTerm)
    );
    
    displayPatientResults(results);
}

// Mostrar todos los pacientes con su fecha de creación
function displayAllPatients() {
    // Ordenar por fecha de creación descendente si existe
    const sorted = [...patients].sort((a, b) => {
        const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bd - ad;
    });
    displayPatientResults(sorted);
}

function displayPatientResults(results) {
    const container = document.getElementById('patientResults');
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.innerHTML = '<p>No se encontraron pacientes</p>';
        return;
    }
    
    results.forEach(patient => {
        const patientDiv = document.createElement('div');
        patientDiv.className = 'patient-item';
        patientDiv.onclick = () => selectPatient(patient);
        patientDiv.innerHTML = `
            <h4>${patient.name}</h4>
            <p>Edad: ${patient.age} | Tel: ${patient.phone}</p>
            <p>Email: ${patient.email}</p>
            <p>Creado: ${patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : '—'}</p>
        `;
        container.appendChild(patientDiv);
    });
}

function selectPatient(patient) {
    currentPatient = patient;
    document.getElementById('currentPatientName').textContent = patient.name;
    document.getElementById('historyPanel').classList.remove('hidden');
    document.getElementById('patientInfoPanel').classList.add('hidden');
    document.getElementById('addPatientPanel').classList.add('hidden');
    renderAffectedTeethList();
}

// Funciones de historia
function showClinicalHistory() {
    document.getElementById('clinicalHistoryContent').classList.remove('hidden');
    document.getElementById('dentalHistoryContent').classList.add('hidden');
    document.getElementById('addHistoryPanel').classList.add('hidden');
    displayClinicalHistory();
}

function showDentalHistory() {
    document.getElementById('clinicalHistoryContent').classList.add('hidden');
    document.getElementById('dentalHistoryContent').classList.remove('hidden');
    document.getElementById('addHistoryPanel').classList.add('hidden');
    displayDentalHistory();
}

function showAddHistory() {
    document.getElementById('clinicalHistoryContent').classList.add('hidden');
    document.getElementById('dentalHistoryContent').classList.add('hidden');
    document.getElementById('addHistoryPanel').classList.remove('hidden');
}

function showAddClinicalHistory() {
    document.getElementById('addClinicalHistoryForm').classList.remove('hidden');
    document.getElementById('addDentalHistoryForm').classList.add('hidden');
}

function showAddDentalHistory() {
    document.getElementById('addClinicalHistoryForm').classList.add('hidden');
    document.getElementById('addDentalHistoryForm').classList.remove('hidden');
}

function displayClinicalHistory() {
    const container = document.getElementById('clinicalHistoryList');
    container.innerHTML = '';
    
    if (!currentPatient || currentPatient.clinicalHistory.length === 0) {
        container.innerHTML = '<p>No hay historial clínico disponible</p>';
        return;
    }
    
    currentPatient.clinicalHistory.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'history-entry';
        entryDiv.innerHTML = `
            <h5>Entrada del ${new Date(entry.date).toLocaleDateString()}</h5>
            <div class="history-date">Fecha: ${entry.date}</div>
            <p><strong>Síntomas:</strong> ${entry.symptoms}</p>
            <p><strong>Diagnóstico:</strong> ${entry.diagnosis}</p>
            <p><strong>Tratamiento:</strong> ${entry.treatment}</p>
        `;
        container.appendChild(entryDiv);
    });
}

function displayDentalHistory() {
    const container = document.getElementById('dentalHistoryList');
    container.innerHTML = '';
    
    if (!currentPatient || currentPatient.dentalHistory.length === 0) {
        container.innerHTML = '<p>No hay historial odontológico disponible</p>';
        return;
    }
    
    currentPatient.dentalHistory.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'history-entry';
        entryDiv.innerHTML = `
            <h5>Procedimiento del ${new Date(entry.date).toLocaleDateString()}</h5>
            <div class="history-date">Fecha: ${entry.date}</div>
            <p><strong>Procedimiento:</strong> ${entry.procedure}</p>
            <p><strong>Dientes Involucrados:</strong> ${entry.teeth}</p>
            <p><strong>Notas:</strong> ${entry.notes}</p>
        `;
        container.appendChild(entryDiv);
    });
}

// Renderizar lista de dientes afectados del paciente actual
function renderAffectedTeethList() {
    const listContainer = document.getElementById('affectedTeethList');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    if (!currentPatient || !currentPatient.dentalRecord || Object.keys(currentPatient.dentalRecord).length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Sin dientes registrados';
        listContainer.appendChild(li);
        return;
    }

    const sortedTeeth = Object.keys(currentPatient.dentalRecord)
        .map(n => parseInt(n, 10))
        .sort((a, b) => a - b);

    sortedTeeth.forEach(toothNumber => {
        const parts = currentPatient.dentalRecord[toothNumber] || [];
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="tooth-item">
                <i class="fas fa-tooth"></i>
                <span class="tooth-number">${toothNumber}</span>
                <span class="tooth-parts">${Array.isArray(parts) ? parts.join(', ') : ''}</span>
            </div>`;
        listContainer.appendChild(li);
    });

    // Añadir estilos para la lista de dientes afectados
    if (!document.getElementById('affectedTeethStyles')) {
        const style = document.createElement('style');
        style.id = 'affectedTeethStyles';
        style.textContent = `
            #affectedTeethList {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            #affectedTeethList li {
                padding: 10px 15px;
                margin: 5px 0;
                background: #f8f9fa;
                border-radius: 6px;
                transition: all 0.2s ease;
            }
            #affectedTeethList li:hover {
                background: #e9ecef;
                transform: translateX(5px);
            }
            .tooth-item {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .tooth-item i {
                color: #4CAF50;
                width: 20px;
                text-align: center;
            }
            .tooth-number {
                font-weight: bold;
                color: #2c3e50;
                min-width: 30px;
                display: inline-block;
            }
            .tooth-parts {
                color: #555;
                font-size: 0.95em;
            }
        `;
        document.head.appendChild(style);
    }
}

function handleAddClinicalHistory(event) {
    event.preventDefault();
    
    const newEntry = {
        date: document.getElementById('clinicalDate').value,
        symptoms: document.getElementById('clinicalSymptoms').value,
        diagnosis: document.getElementById('clinicalDiagnosis').value,
        treatment: document.getElementById('clinicalTreatment').value
    };
    
    currentPatient.clinicalHistory.push(newEntry);
    updatePatientData();
    
    alert('Historia clínica agregada exitosamente');
    document.getElementById('addClinicalHistoryForm').querySelector('form').reset();
    showClinicalHistory();
}

function handleAddDentalHistory(event) {
    event.preventDefault();
    
    const newEntry = {
        date: document.getElementById('dentalDate').value,
        procedure: document.getElementById('dentalProcedure').value,
        teeth: document.getElementById('dentalTeeth').value,
        notes: document.getElementById('dentalNotes').value
    };
    
    currentPatient.dentalHistory.push(newEntry);
    updatePatientData();
    
    alert('Historia odontológica agregada exitosamente');
    document.getElementById('addDentalHistoryForm').querySelector('form').reset();
    showDentalHistory();
}

function updatePatientData() {
    const patientIndex = patients.findIndex(p => p.id === currentPatient.id);
    if (patientIndex !== -1) {
        patients[patientIndex] = currentPatient;
        localStorage.setItem('dentalPatients', JSON.stringify(patients));
    }
}

// Función para guardar un nuevo mensaje de contacto
function saveContactMessage(name, email, phone, message, subject = 'Consulta') {
    const newMessage = {
        id: Date.now(),
        name: name,
        email: email,
        phone: phone || 'No especificado',
        subject: subject,
        message: message,
        date: new Date().toISOString(),
        read: false
    };

    // Obtener mensajes existentes
    let messages = JSON.parse(localStorage.getItem('dentalMessages') || '[]');
    
    // Agregar el nuevo mensaje al inicio del array
    messages.unshift(newMessage);
    
    // Guardar en localStorage
    localStorage.setItem('dentalMessages', JSON.stringify(messages));
    
    // Actualizar el contador de mensajes no leídos
    updateUnreadMessagesCount();
    
    return true;
}

// Función para actualizar el contador de mensajes no leídos
function updateUnreadMessagesCount() {
    if (!currentUser || currentUser.role !== 'doctor') return;
    
    const messages = JSON.parse(localStorage.getItem('dentalMessages') || '[]');
    const unreadCount = messages.filter(msg => !msg.read).length;
    
    const badge = document.getElementById('unreadMessagesBadge');
    if (badge) {
        badge.textContent = unreadCount > 0 ? unreadCount : '';
        badge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    }
}

// Función para marcar un mensaje como leído
function markMessageAsRead(messageId) {
    let messages = JSON.parse(localStorage.getItem('dentalMessages') || '[]');
    messages = messages.map(msg => {
        if (msg.id === messageId) {
            return { ...msg, read: true };
        }
        return msg;
    });
    localStorage.setItem('dentalMessages', JSON.stringify(messages));
    updateUnreadMessagesCount();
}

// Función para mostrar los mensajes en el panel profesional
function showMessagesPanel() {
    if (!currentUser || currentUser.role !== 'doctor') {
        showNotification('Acceso denegado. Solo disponible para profesionales.', 'error');
        return;
    }

    const messages = JSON.parse(localStorage.getItem('dentalMessages') || '[]');
    const unreadCount = messages.filter(msg => !msg.read).length;
    
    const modalContent = `
        <div class="modal-content large">
            <span class="close" onclick="closeModal('messagesModal')">&times;</span>
            <h2>Mensajes de Contacto <span id="unreadBadge" class="badge">${unreadCount > 0 ? unreadCount : ''}</span></h2>
            <div class="messages-container" style="margin-top: 20px;">
                ${messages.length === 0 ? 
                    '<div class="no-messages">No hay mensajes disponibles</div>' : 
                    messages.map(msg => `
                        <div class="message-item ${msg.read ? '' : 'unread'}" onclick="showMessageDetail(${msg.id})" style="
                            padding: 15px; 
                            border-bottom: 1px solid #eee;
                            cursor: pointer;
                            background: ${msg.read ? '#fff' : '#f8f9fa'};
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h4 style="margin: 0 0 5px 0; color: #2c3e50;">${msg.subject || 'Sin asunto'}</h4>
                                <span style="color: #6c757d; font-size: 0.8rem;">${new Date(msg.date).toLocaleString()}</span>
                            </div>
                            <p style="margin: 5px 0 0; color: #6c757d; font-size: 0.9rem;">
                                <strong>De:</strong> ${msg.name} &lt;${msg.email}&gt;
                                ${msg.phone ? ` | <strong>Tel:</strong> ${msg.phone}` : ''}
                            </p>
                            <p style="margin: 5px 0 0; color: #495057; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${msg.message.substring(0, 100)}${msg.message.length > 100 ? '...' : ''}
                            </p>
                            ${!msg.read ? '<span class="unread-indicator">Nuevo</span>' : ''}
                        </div>
                    `).join('')}
            </div>
        </div>
    `;

    // Crear o actualizar el modal
    let modal = document.getElementById('messagesModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'messagesModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = modalContent;
    modal.style.display = 'block';
}

// Función para verificar el estado de autenticación y mostrar el botón de mensajes
function checkAuthState() {
    const messagesNavItem = document.getElementById('messagesNavItem');
    if (currentUser && currentUser.role === 'doctor') {
        messagesNavItem.style.display = 'block';
        updateUnreadMessagesCount();
    } else {
        messagesNavItem.style.display = 'none';
    }
}

// Llamar a checkAuthState cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay un usuario autenticado al cargar la página
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        checkAuthState();
    }
    
    // Actualizar el contador de mensajes cada 30 segundos
    setInterval(updateUnreadMessagesCount, 30000);
});

// Función para mostrar el detalle de un mensaje
function showMessageDetail(messageId) {
    const messages = JSON.parse(localStorage.getItem('dentalMessages') || '[]');
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message) {
        showNotification('Mensaje no encontrado', 'error');
        return;
    }

    // Marcar como leído
    markMessageAsRead(messageId);
    
    const modalContent = `
        <div class="modal-content">
            <span class="close" onclick="closeModal('messageDetailModal')">&times;</span>
            <h2>${message.subject || 'Mensaje sin asunto'}</h2>
            
            <div class="message-header" style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                <p style="margin: 5px 0;"><strong>De:</strong> ${message.name} &lt;${message.email}&gt;</p>
                ${message.phone ? `<p style="margin: 5px 0;"><strong>Teléfono:</strong> ${message.phone}</p>` : ''}
                <p style="margin: 5px 0; color: #6c757d;">${new Date(message.date).toLocaleString()}</p>
            </div>
            
            <div class="message-body" style="line-height: 1.6; margin-bottom: 20px;">
                ${message.message.split('\n').map(p => `<p style="margin: 0 0 15px 0;">${p}</p>`).join('')}
            </div>
            
            <div class="message-actions" style="text-align: right;">
                <button onclick="closeModal('messageDetailModal')" style="
                    background: #6c757d; 
                    color: white; 
                    border: none; 
                    padding: 8px 20px; 
                    border-radius: 4px; 
                    cursor: pointer;
                    margin-right: 10px;
                ">
                    Cerrar
                </button>
                <a href="mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject || 'Consulta')}" 
                   style="
                       background: #1976d2; 
                       color: white; 
                       border: none; 
                       padding: 8px 20px; 
                       border-radius: 4px; 
                       text-decoration: none;
                       display: inline-block;
                   ">
                    <i class="fas fa-reply"></i> Responder
                </a>
            </div>
        </div>
    `;

    // Crear o actualizar el modal de detalle
    let modal = document.getElementById('messageDetailModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'messageDetailModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = modalContent;
    modal.style.display = 'block';
}

// Funciones para el registro dental
function showDentalRecord() {
    // Si ya existe un modal previo, eliminarlo para evitar IDs duplicados
    const existing = document.getElementById('dentalRecordModal');
    if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
    }
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'dentalRecordModal';
    modal.innerHTML = `
        <div class="modal-content large">
            <span class="close" onclick="closeModal('dentalRecordModal')">&times;</span>
            <h2>Registro Dental - ${currentPatient.name}</h2>
            <div class="dental-record-container">
                <div class="teeth-grid" id="teethGrid"></div>
                <div class="tooth-details" id="toothDetails"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    initializeDentalRecord();
}

function initializeDentalRecord() {
    const teethGrid = document.getElementById('teethGrid');
    teethGrid.innerHTML = '';
    
    // Crear los 32 dientes
    const teethNumbers = [
        // Cuadrante superior derecho (11-18)
        18, 17, 16, 15, 14, 13, 12, 11,
        // Cuadrante superior izquierdo (21-28)
        21, 22, 23, 24, 25, 26, 27, 28,
        // Cuadrante inferior izquierdo (31-38)
        38, 37, 36, 35, 34, 33, 32, 31,
        // Cuadrante inferior derecho (41-48)
        41, 42, 43, 44, 45, 46, 47, 48
    ];
    
    teethNumbers.forEach(toothNumber => {
        const toothDiv = document.createElement('div');
        toothDiv.className = 'tooth';
        toothDiv.dataset.toothNumber = toothNumber;
        toothDiv.textContent = toothNumber;
        toothDiv.onclick = () => selectTooth(toothNumber);
        
        // Aplicar estilo si el diente tiene registros
        if (currentPatient.dentalRecord && currentPatient.dentalRecord[toothNumber]) {
            toothDiv.classList.add('has-record');
        }
        
        teethGrid.appendChild(toothDiv);
    });
}

function selectTooth(toothNumber) {
    const toothDetails = document.getElementById('toothDetails');
    toothDetails.innerHTML = `
        <h3>Diente ${toothNumber}</h3>
        <div class="tooth-parts">
            <div class="tooth-part" data-part="distal" onclick="toggleToothPart(this)">Distal</div>
            <div class="tooth-part" data-part="oclusal" onclick="toggleToothPart(this)">Oclusal</div>
            <div class="tooth-part" data-part="mesial" onclick="toggleToothPart(this)">Mesial</div>
            <div class="tooth-part" data-part="incisal" onclick="toggleToothPart(this)">Incisal</div>
            <div class="tooth-part" data-part="labial" onclick="toggleToothPart(this)">Labial/Vestibular</div>
            <div class="tooth-part" data-part="lingual" onclick="toggleToothPart(this)">Lingual/Palatina</div>
        </div>
        <div class="tooth-actions">
            <button class="btn btn-primary" onclick="saveToothRecord(${toothNumber})">Guardar Registro</button>
            <button class="btn btn-secondary" onclick="clearToothRecord(${toothNumber})">Limpiar Registro</button>
        </div>
    `;
    
    // Mostrar partes afectadas si existen
    if (currentPatient.dentalRecord && currentPatient.dentalRecord[toothNumber]) {
        const affectedParts = currentPatient.dentalRecord[toothNumber];
        affectedParts.forEach(part => {
            const partElement = toothDetails.querySelector(`[data-part="${part}"]`);
            if (partElement) {
                partElement.classList.add('affected');
                partElement.classList.add('selected');
            }
        });
    }
}

function toggleToothPart(element) {
    if (!element) return;
    element.classList.toggle('selected');
    if (element.classList.contains('selected')) {
        element.classList.add('affected');
    } else {
        element.classList.remove('affected');
    }
}

function saveToothRecord(toothNumber) {
    const toothDetails = document.getElementById('toothDetails');
    const selectedParts = Array.from(toothDetails.querySelectorAll('.tooth-part.selected'))
        .map(el => el.dataset.part);
    
    if (selectedParts.length === 0) {
        alert('Seleccione al menos una parte del diente');
        return;
    }
    
    // Inicializar dentalRecord si no existe
    if (!currentPatient.dentalRecord) {
        currentPatient.dentalRecord = {};
    }
    
    // Guardar las partes afectadas
    currentPatient.dentalRecord[toothNumber] = selectedParts;
    
    // Actualizar la visualización del diente
    const toothElement = document.querySelector(`[data-tooth-number="${toothNumber}"]`);
    toothElement.classList.add('has-record');
    
    // Actualizar datos del paciente
    updatePatientData();
    
    // Actualizar listado de dientes afectados
    renderAffectedTeethList();
    
    alert(`Registro del diente ${toothNumber} guardado exitosamente`);
}

function clearToothRecord(toothNumber) {
    if (confirm(`¿Está seguro de que desea limpiar el registro del diente ${toothNumber}?`)) {
        if (currentPatient.dentalRecord && currentPatient.dentalRecord[toothNumber]) {
            delete currentPatient.dentalRecord[toothNumber];
            
            // Actualizar visualización
            const toothElement = document.querySelector(`[data-tooth-number="${toothNumber}"]`);
            toothElement.classList.remove('has-record');
            
            // Limpiar detalles
            document.getElementById('toothDetails').innerHTML = '';
            
            updatePatientData();
            renderAffectedTeethList();
            alert(`Registro del diente ${toothNumber} eliminado`);
        }
    }
}

// Función para limpiar localStorage y empezar de cero
function clearAllData() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos? Esto eliminará todos los usuarios y pacientes.')) {
        localStorage.removeItem('dentalUsers');
        localStorage.removeItem('dentalPatients');
        localStorage.removeItem('dentalBackup');
        alert('Datos limpiados. Recarga la página para empezar de cero.');
        location.reload();
    }
}

// Función para mostrar información de debug
function showDebugInfo() {
    console.log('=== INFORMACIÓN DE DEBUG ===');
    console.log('Usuarios actuales:', users);
    console.log('localStorage dentalUsers:', localStorage.getItem('dentalUsers'));
    console.log('localStorage dentalPatients:', localStorage.getItem('dentalPatients'));
    console.log('============================');
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        border-radius: 5px;
        z-index: 3000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Función para validar formularios
function validateForm(formData) {
    for (let [key, value] of formData.entries()) {
        if (!value.trim()) {
            showNotification(`El campo ${key} es requerido`, 'error');
            return false;
        }
    }
    return true;
}

// Función para exportar datos (opcional)
function exportData() {
    const data = {
        users: users,
        patients: patients,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dental_data.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Función para importar datos (opcional)
function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.users && data.patients) {
                    users = data.users;
                    patients = data.patients;
                    localStorage.setItem('dentalUsers', JSON.stringify(users));
                    localStorage.setItem('dentalPatients', JSON.stringify(patients));
                    showNotification('Datos importados exitosamente', 'success');
                }
            } catch (error) {
                showNotification('Error al importar datos', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Función para hacer backup automático
function autoBackup() {
    const backupData = {
        users: users,
        patients: patients,
        backupDate: new Date().toISOString()
    };
    
    localStorage.setItem('dentalBackup', JSON.stringify(backupData));
}

// Función para restaurar backup
function restoreBackup() {
    const backup = localStorage.getItem('dentalBackup');
    if (backup) {
        try {
            const data = JSON.parse(backup);
            if (confirm('¿Estás seguro de que quieres restaurar el backup? Esto sobrescribirá los datos actuales.')) {
                users = data.users;
                patients = data.patients;
                localStorage.setItem('dentalUsers', JSON.stringify(users));
                localStorage.setItem('dentalPatients', JSON.stringify(patients));
                showNotification('Backup restaurado exitosamente', 'success');
            }
        } catch (error) {
            showNotification('Error al restaurar backup', 'error');
        }
    } else {
        showNotification('No hay backup disponible', 'error');
    }
}

// Configurar backup automático cada 5 minutos
setInterval(autoBackup, 5 * 60 * 1000);

// Función para limpiar datos antiguos (opcional)
function cleanupOldData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Limpiar historiales antiguos (mantener solo los últimos 30 días)
    patients.forEach(patient => {
        patient.clinicalHistory = patient.clinicalHistory.filter(entry => 
            new Date(entry.date) > thirtyDaysAgo
        );
        patient.dentalHistory = patient.dentalHistory.filter(entry => 
            new Date(entry.date) > thirtyDaysAgo
        );
    });
    
    updatePatientData();
}

// Función para mostrar precios de servicios
function showServicePrice(title, description, price) {
    document.getElementById('serviceTitle').textContent = title;
    document.getElementById('serviceDescription').textContent = description;
    document.getElementById('servicePrice').textContent = price;
    document.getElementById('servicePriceModal').style.display = 'block';
}

// Función para generar reportes (opcional)
function generateReport() {
    const report = {
        totalPatients: patients.length,
        totalUsers: users.length,
        patientsWithHistory: patients.filter(p => p.clinicalHistory.length > 0 || p.dentalHistory.length > 0).length,
        reportDate: new Date().toISOString()
    };
    
    const reportText = `
        REPORTE DE CLÍNICA DENTAL
        =========================
        Fecha: ${new Date(report.reportDate).toLocaleDateString()}
        Total de Pacientes: ${report.totalPatients}
        Total de Usuarios: ${report.totalUsers}
        Pacientes con Historial: ${report.patientsWithHistory}
    `;
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_clinica.txt';
    a.click();
    URL.revokeObjectURL(url);
}
