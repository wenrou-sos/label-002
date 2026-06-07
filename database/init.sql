CREATE DATABASE IF NOT EXISTS pet_sitting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pet_sitting;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    role ENUM('owner', 'caregiver') NOT NULL,
    name VARCHAR(50) NOT NULL,
    avatar VARCHAR(255),
    address VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    species VARCHAR(20) NOT NULL,
    breed VARCHAR(50),
    age INT,
    gender ENUM('male', 'female', 'unknown'),
    weight DECIMAL(5,2),
    description TEXT,
    avatar VARCHAR(255),
    health_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner (owner_id),
    INDEX idx_species (species)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    caregiver_id INT,
    pet_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    special_needs TEXT,
    status ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (caregiver_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_owner (owner_id),
    INDEX idx_caregiver (caregiver_id),
    INDEX idx_pet (pet_id),
    INDEX idx_date (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (username, password, email, phone, role, name, bio) VALUES
('owner1', '$2a$10$JhZ40waO3LyKcWPhiGBkFuvx9bHoVqSIbmJwnXq9GMmsUUSqXYuay', 'owner1@example.com', '13800138001', 'owner', '张三', '爱猫人士，有一只可爱的橘猫'),
('owner2', '$2a$10$JhZ40waO3LyKcWPhiGBkFuvx9bHoVqSIbmJwnXq9GMmsUUSqXYuay', 'owner2@example.com', '13800138002', 'owner', '李四', '狗狗爱好者，养了两只金毛'),
('caregiver1', '$2a$10$JhZ40waO3LyKcWPhiGBkFuvx9bHoVqSIbmJwnXq9GMmsUUSqXYuay', 'caregiver1@example.com', '13900139001', 'caregiver', '王五', '专业宠物保姆，有5年经验，可照顾各种宠物'),
('caregiver2', '$2a$10$JhZ40waO3LyKcWPhiGBkFuvx9bHoVqSIbmJwnXq9GMmsUUSqXYuay', 'caregiver2@example.com', '13900139002', 'caregiver', '赵六', '热爱小动物，家里环境干净整洁，适合宠物居住');

INSERT INTO pets (owner_id, name, species, breed, age, gender, weight, description, health_info) VALUES
(1, '大橘', 'cat', '橘猫', 3, 'male', 5.5, '性格温顺，喜欢睡觉和玩逗猫棒', '已接种疫苗，无特殊病史'),
(1, '小花', 'cat', '英短', 2, 'female', 4.2, '胆小但粘人，喜欢安静的环境', '已绝育，定期驱虫'),
(2, '大黄', 'dog', '金毛', 4, 'male', 32.0, '活泼好动，喜欢户外活动和游泳', '已接种疫苗，关节需要注意保护'),
(2, '小金', 'dog', '金毛', 1, 'female', 25.0, '幼犬，活泼可爱，正在训练中', '已完成基础疫苗接种');

INSERT INTO orders (owner_id, pet_id, title, description, start_date, end_date, special_needs, price) VALUES
(1, 1, '周末寄养橘猫大橘', '因为周末要出差，需要找人照顾大橘2天', '2026-06-13', '2026-06-15', '每天需要喂两次猫粮，晚上陪玩15分钟', 150.00),
(2, 3, '金毛大黄一周寄养', '全家出去旅游，需要寄养大黄一周', '2026-06-20', '2026-06-27', '每天需要遛狗两次，每次至少30分钟，注意不要让它剧烈运动', 800.00);
