// Configuration Supabase
const SUPABASE_URL = 'https://lrvwhewjudeiuwqcaeqz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TQG7By7w-HIQymSz37tTEQ_6UeF2ktN';

let currentUser = null;
let supabase = null;

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await initSupabase();
    await checkAuth();
    initEventListeners();
});

// Initialiser Supabase
async function initSupabase() {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
}

// Vérifier l'authentification
async function checkAuth() {
    if (!supabase) return;
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            currentUser = session.user;
            console.log('Utilisateur connecté:', currentUser.email);
        }
    } catch (error) {
        console.error('Erreur auth:', error);
    }
}

// Initialiser les événements
function initEventListeners() {
    // Boutons "Choisir ce modèle"
    document.querySelectorAll('.choose-template').forEach(btn => {
        btn.addEventListener('click', () => {
            const templateId = btn.dataset.id;
            openTemplateModal(templateId);
        });
    });
    
    // Fermeture de la modale
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Soumission du formulaire
    document.getElementById('requestForm').addEventListener('submit', submitRequest);
}

// Ouvrir la modale avec le formulaire
async function openTemplateModal(templateId) {
    if (!currentUser) {
        showToast('Connecte-toi d\'abord sur OtakuZone !', 'error');
        setTimeout(() => {
            window.location.href = '/#/login';
        }, 2000);
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`request.php?action=get_template&id=${templateId}`);
        const template = await response.json();
        
        if (template.error) {
            showToast(template.error, 'error');
            return;
        }
        
        generateForm(template);
        document.getElementById('modalTitle').textContent = template.name;
        document.getElementById('templateModal').classList.add('active');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors du chargement du template', 'error');
    } finally {
        showLoading(false);
    }
}

// Générer le formulaire dynamique
function generateForm(template) {
    const form = document.getElementById('dynamicForm');
    form.innerHTML = '';
    form.dataset.templateId = template.id;
    
    template.fields.forEach(field => {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const label = document.createElement('label');
        label.htmlFor = field.name;
        label.textContent = field.label + (field.required ? ' *' : '');
        
        let input;
        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.id = field.name;
            input.name = field.name;
            input.placeholder = field.placeholder || '';
            input.required = field.required;
        } else if (field.type === 'select') {
            input = document.createElement('select');
            input.id = field.name;
            input.name = field.name;
            input.required = field.required;
            
            field.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                input.appendChild(option);
            });
        } else if (field.type === 'file') {
            input = document.createElement('input');
            input.type = 'file';
            input.id = field.name;
            input.name = field.name;
            input.accept = field.accept || 'image/*';
            input.required = field.required;
        } else if (field.type === 'number') {
            input = document.createElement('input');
            input.type = 'number';
            input.id = field.name;
            input.name = field.name;
            input.min = field.min || '';
            input.max = field.max || '';
            input.placeholder = field.placeholder || '';
            input.required = field.required;
        } else {
            input = document.createElement('input');
            input.type = field.type || 'text';
            input.id = field.name;
            input.name = field.name;
            input.placeholder = field.placeholder || '';
            input.required = field.required;
        }
        
        group.appendChild(label);
        group.appendChild(input);
        form.appendChild(group);
    });
}

// Soumettre la demande
async function submitRequest(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Tu dois être connecté', 'error');
        return;
    }
    
    showLoading(true);
    
    const form = document.getElementById('requestForm');
    const templateId = form.dataset.templateId;
    const formData = new FormData(form);
    
    formData.append('template_id', templateId);
    formData.append('user_id', currentUser.id);
    formData.append('user_email', currentUser.email);
    
    // Ajouter le token d'authentification
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        formData.append('access_token', session.access_token);
    }
    
    try {
        const response = await fetch('request.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Demande envoyée avec succès ! ✨', 'success');
            closeModal();
            form.reset();
        } else {
            showToast(result.error || 'Une erreur est survenue', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
    }
}

// Fermer la modale
function closeModal() {
    document.getElementById('templateModal').classList.remove('active');
    document.getElementById('requestForm').reset();
}

// Afficher/masquer le loading
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
}

// Afficher un toast
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Fonction pour vérifier le statut d'une demande (pour l'admin)
async function checkRequestStatus(requestId) {
    try {
        const response = await fetch(`request.php?action=check_status&id=${requestId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur:', error);
        return null;
    }
}