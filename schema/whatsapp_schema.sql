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

-- 3. CRM Lead Follow-ups Table (Lead Pipeline, Travel Date, Package & Next Follow-up Schedule)
CREATE TABLE IF NOT EXISTS `crm_lead_followups` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `contact_id` INT NOT NULL UNIQUE,
    `lead_name` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(100) NULL,
    `lead_type` ENUM('cold', 'warm', 'hot') NOT NULL DEFAULT 'warm',
    `travel_date` DATE NULL,
    `travel_destination` VARCHAR(255) NULL,
    `adults` INT DEFAULT 1,
    `children` INT DEFAULT 0,
    `infants` INT DEFAULT 0,
    `number_of_persons` INT DEFAULT 1,
    `total_rooms` INT DEFAULT 1,
    `room_details` LONGTEXT NULL,
    `package_name` VARCHAR(255) NULL,
    `package_rate` VARCHAR(100) NULL,
    `extra_note` TEXT NULL,
    `next_followup_date` DATE NULL,
    `last_followup_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `last_followup_by` INT NULL,
    `created_by` INT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_contact_id` (`contact_id`),
    INDEX `idx_lead_type` (`lead_type`),
    INDEX `idx_next_followup_date` (`next_followup_date`),
    INDEX `idx_travel_date` (`travel_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CRM Lead Follow-up Timeline Audit Logs
CREATE TABLE IF NOT EXISTS `crm_lead_followup_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `followup_id` INT NULL,
    `contact_id` INT NOT NULL,
    `admin_user_id` INT NOT NULL,
    `lead_type` VARCHAR(50) NOT NULL,
    `note` TEXT NULL,
    `next_followup_date` DATE NULL,
    `travel_date` DATE NULL,
    `travel_destination` VARCHAR(255) NULL,
    `adults` INT DEFAULT 1,
    `children` INT DEFAULT 0,
    `infants` INT DEFAULT 0,
    `number_of_persons` INT DEFAULT 1,
    `total_rooms` INT DEFAULT 1,
    `room_details` LONGTEXT NULL,
    `package_name` VARCHAR(255) NULL,
    `package_rate` VARCHAR(100) NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_log_contact` (`contact_id`),
    INDEX `idx_log_admin` (`admin_user_id`),
    INDEX `idx_log_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. WhatsApp Marketing Broadcast Campaigns Table
CREATE TABLE IF NOT EXISTS `whatsapp_campaigns` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `campaign_name` VARCHAR(255) NOT NULL,
    `message_text` TEXT NOT NULL,
    `media_url` TEXT NULL,
    `media_type` VARCHAR(50) NULL,
    `cta_url` VARCHAR(255) NULL,
    `cta_text` VARCHAR(100) NULL,
    `target_audience_type` VARCHAR(50) DEFAULT 'selected',
    `target_filter_json` JSON NULL,
    `total_recipients` INT DEFAULT 0,
    `total_sent` INT DEFAULT 0,
    `total_delivered` INT DEFAULT 0,
    `total_failed` INT DEFAULT 0,
    `status` ENUM('draft', 'scheduled', 'processing', 'completed', 'cancelled') DEFAULT 'completed',
    `scheduled_at` DATETIME NULL,
    `sent_at` DATETIME NULL,
    `created_by` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_status` (`status`),
    INDEX `idx_scheduled_at` (`scheduled_at`),
    INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. WhatsApp Campaign Recipients & Delivery Logs
CREATE TABLE IF NOT EXISTS `whatsapp_campaign_recipients` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `campaign_id` INT NOT NULL,
    `contact_id` INT NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `recipient_name` VARCHAR(255) NULL,
    `status` ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
    `message_id` VARCHAR(255) NULL,
    `error_message` TEXT NULL,
    `sent_at` DATETIME NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_campaign` (`campaign_id`),
    INDEX `idx_contact` (`contact_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Safari Peak Dates & High-Demand Calendar Table
CREATE TABLE IF NOT EXISTS `crm_peak_dates` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `peak_type` VARCHAR(50) DEFAULT 'peak',
    `surge_percentage` INT DEFAULT 0,
    `color` VARCHAR(50) DEFAULT '#dc2626',
    `notes` TEXT NULL,
    `created_by` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_start_date` (`start_date`),
    INDEX `idx_end_date` (`end_date`),
    INDEX `idx_peak_type` (`peak_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


