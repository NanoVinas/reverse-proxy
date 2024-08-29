CREATE DATABASE IF NOT EXISTS `proxy` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `proxy`;

CREATE TABLE IF NOT EXISTS `certificates` (
  `name` varchar(255) NOT NULL DEFAULT '',
  `key` text DEFAULT NULL,
  `cert` text DEFAULT NULL,
  `ca` text DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `domains` (
  `name` varchar(255) NOT NULL DEFAULT '',
  `type` enum('web','backend') NOT NULL DEFAULT 'web',
  `certificate` varchar(255) DEFAULT NULL,
  `host` text DEFAULT NULL,
  PRIMARY KEY (`name`),
  KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` timestamp NULL DEFAULT current_timestamp(),
  `event_type` varchar(255) DEFAULT NULL,
  `ip` varchar(15) DEFAULT NULL,
  `domain` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `details` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `domain` (`domain`),
  KEY `timestamp` (`timestamp`),
  KEY `ip` (`ip`),
  KEY `event_type` (`event_type`),
  KEY `url` (`url`)
) ENGINE=InnoDB AUTO_INCREMENT=781 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `restrictions` (
  `ip` varchar(15) NOT NULL DEFAULT '',
  `url` varchar(255) NOT NULL DEFAULT '*',
  `code` int(3) DEFAULT 500,
  PRIMARY KEY (`ip`,`url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;