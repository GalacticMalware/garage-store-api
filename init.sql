CREATE DATABASE IF NOT EXISTS `garage_storage`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `garage_storage`;

CREATE TABLE IF NOT EXISTS `user` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid`       CHAR(36) NOT NULL,
  `user_name`  VARCHAR(255) NOT NULL,
  `container`  VARCHAR(255) NOT NULL,
  `hash`       VARCHAR(255) NOT NULL,
  `createdat`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedat`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_user_uuid` (`uuid`),
  UNIQUE KEY `UQ_user_user_name` (`user_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `storage` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid`       CHAR(36) NOT NULL,
  `user_id`    INT UNSIGNED NOT NULL,
  `name`       VARCHAR(255) NOT NULL,
  `url`        VARCHAR(500) NOT NULL,
  `createdat`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_storage_user` (`user_id`),
  CONSTRAINT `FK_storage_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Usuario de ejemplo (uuid demo-0000-0000-0000-000000000001, password: Admin123*).
-- Genera el hash real con: node -e "console.log(require('bcryptjs').hashSync('Admin123*',10))"
-- INSERT INTO `user` (uuid, user_name, container, hash, updatedat) VALUES
-- ('demo-0000-0000-0000-000000000001','demo','garage-bucket',
--  '$2a$10$REEMPLAZA_ESTE_HASH', NOW());
