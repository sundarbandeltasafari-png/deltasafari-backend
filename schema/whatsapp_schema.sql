-- =========================================================
-- Delta Safari — WhatsApp Business Cloud API CRM Database Schema
-- =========================================================

-- 1. WhatsApp Contacts Table (Stores Unique Lead Phone Numbers & Names)
CREATE TABLE IF NOT EXISTS `whatsapp_contacts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `wa_id` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(255) NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_wa_id` (`wa_id`),
    INDEX `idx_updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. WhatsApp Messages Table (Stores Incoming & Outgoing Conversations)
CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `contact_id` INT NOT NULL,
    `message_id` VARCHAR(255) NULL,
    `sender_type` ENUM('customer', 'business') DEFAULT 'customer',
    `message_text` TEXT NULL,
    `media_url` TEXT NULL,
    `media_type` VARCHAR(50) NULL,
    `timestamp` VARCHAR(50) NULL,
    `status` VARCHAR(50) DEFAULT 'delivered',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_contact_id` (`contact_id`),
    INDEX `idx_message_id` (`message_id`),
    INDEX `idx_created_at` (`created_at`),
    CONSTRAINT `fk_whatsapp_messages_contact` 
        FOREIGN KEY (`contact_id`) 
        REFERENCES `whatsapp_contacts` (`id`) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
