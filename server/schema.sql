-- AyurSutra MySQL Database Schema
-- Run this file to set up the database:
--   mysql -u root -p < server/schema.sql

CREATE DATABASE IF NOT EXISTS ayursutra_db;
USE ayursutra_db;

-- Users table (doctors, patients, admins)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(128) UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'doctor', 'patient') NOT NULL DEFAULT 'patient',
  license_number VARCHAR(100),
  degree_url VARCHAR(500),
  id_proof_url VARCHAR(500),
  approved BOOLEAN DEFAULT FALSE,
  blocked BOOLEAN DEFAULT FALSE,
  flagged BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_ratings INT DEFAULT 0,
  complaints INT DEFAULT 0,
  total_requests INT DEFAULT 0,
  rejected_requests INT DEFAULT 0,
  rejection_rate DECIMAL(5,2) DEFAULT 0.00,
  total_sessions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Patients table (additional patient details)
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  age INT,
  therapy VARCHAR(255),
  status ENUM('active', 'inactive', 'discharged') DEFAULT 'active',
  join_date DATE,
  last_visit DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_email VARCHAR(255) NOT NULL,
  doctor_email VARCHAR(255),
  type VARCHAR(255),
  date DATE NOT NULL,
  time TIME NOT NULL,
  room VARCHAR(50),
  total_fee DECIMAL(10,2) DEFAULT 0.00,
  advance_fee DECIMAL(10,2) DEFAULT 0.00,
  remaining_fee DECIMAL(10,2) DEFAULT 0.00,
  advance_paid BOOLEAN DEFAULT FALSE,
  remaining_paid BOOLEAN DEFAULT FALSE,
  payment_status VARCHAR(50) DEFAULT 'advance_due',
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  remaining_order_id VARCHAR(255),
  remaining_payment_id VARCHAR(255),
  offline_remaining_paid BOOLEAN DEFAULT FALSE,
  platform_revenue DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Requests table (therapy session requests from patients)
CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_email VARCHAR(255) NOT NULL,
  doctor_email VARCHAR(255),
  therapy VARCHAR(255),
  date DATE,
  time TIME,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_email VARCHAR(255) NOT NULL,
  doctor_email VARCHAR(255),
  pain INT CHECK (pain BETWEEN 1 AND 10),
  energy INT CHECK (energy BETWEEN 1 AND 10),
  satisfaction INT CHECK (satisfaction BETWEEN 1 AND 5),
  notes TEXT,
  reported BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  to_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress notes table (doctor notes)
CREATE TABLE IF NOT EXISTS progress_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id VARCHAR(128),
  doctor_email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verified doctors cache (MCIM licence scraper results)
CREATE TABLE IF NOT EXISTS verified_doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  qualification VARCHAR(500),
  status VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reg_number (registration_number)
);
