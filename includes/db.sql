-- Création de la base de données
CREATE DATABASE IF NOT EXISTS otakuzone_cards CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE otakuzone_cards;

-- Table des templates
CREATE TABLE IF NOT EXISTS card_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    fields_json JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des demandes
CREATE TABLE IF NOT EXISTS card_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    template_id INT NOT NULL,
    data_json JSON NOT NULL,
    image_path VARCHAR(255),
    status ENUM('pending','in_progress','completed','rejected') DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (template_id) REFERENCES card_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des administrateurs
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertion des templates par défaut
INSERT INTO card_templates (name, description, image, fields_json) VALUES
('Carte OtakuID', 'Ta carte d''identité officielle dans l''univers OtakuZone. Parfaite pour montrer ton niveau et ton anime préféré.', '/cards/assets/otakuid-preview.jpg',
'[
    {"name":"pseudo","label":"Pseudo","type":"text","placeholder":"Ton pseudo Otaku","required":true},
    {"name":"anime_prefere","label":"Anime préféré","type":"text","placeholder":"Ex: One Piece, Naruto...","required":true},
    {"name":"niveau","label":"Niveau","type":"select","options":["Débutant","Intermédiaire","Expert","Légende"],"required":true},
    {"name":"pouvoir_special","label":"Pouvoir spécial","type":"text","placeholder":"Ex: Sharingan, Bankai...","required":false},
    {"name":"citation","label":"Citation favorite","type":"textarea","placeholder":"Ta citation préférée...","required":false},
    {"name":"image","label":"Avatar (optionnel)","type":"file","required":false,"accept":"image/*"}
]'),
('Carte Personnage Anime', 'Crée ta propre carte de personnage. Deviens le héros de ton univers préféré !', '/cards/assets/character-preview.jpg',
'[
    {"name":"nom_personnage","label":"Nom du personnage","type":"text","placeholder":"Ex: Goku, Luffy...","required":true},
    {"name":"univers","label":"Univers (manga/anime)","type":"text","placeholder":"Ex: Dragon Ball, One Piece...","required":true},
    {"name":"role","label":"Rôle","type":"select","options":["Héros","Vilain","Antihéros","Personnage secondaire","Mentor"],"required":true},
    {"name":"description","label":"Description","type":"textarea","placeholder":"Décris ton personnage...","required":true},
    {"name":"stats_attaque","label":"Statistique Attaque (1-100)","type":"number","min":"1","max":"100","required":false},
    {"name":"stats_defense","label":"Statistique Défense (1-100)","type":"number","min":"1","max":"100","required":false},
    {"name":"stats_vitesse","label":"Statistique Vitesse (1-100)","type":"number","min":"1","max":"100","required":false},
    {"name":"image","label":"Image du personnage","type":"file","required":true,"accept":"image/*"}
]');

-- Insertion d'un admin par défaut (mot de passe: Fw70359545 - à changer !)
INSERT INTO admins (username, password_hash, email) VALUES
('admin', '$2a$12$R0peyfY3LBF0TyxZBFVV4uDtqi0UGIMqni3V7MgVm/LJUDsAWdb7e', ADMIN_EMAIL);
-- Pour générer le hash: password_hash('admin123', PASSWORD_DEFAULT)

-- Note: Remplace $2y$10$YourHashHere par un vrai hash généré avec password_hash()