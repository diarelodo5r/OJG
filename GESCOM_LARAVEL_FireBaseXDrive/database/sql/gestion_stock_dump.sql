-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : sam. 27 sep. 2025 à 17:12
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `gestion_stock`
--

-- --------------------------------------------------------

--
-- Structure de la table `archives`
--

CREATE TABLE `archives` (
  `id` int(11) NOT NULL,
  `article_id` int(11) DEFAULT NULL,
  `fournisseur_id` int(11) DEFAULT NULL,
  `motif` enum('vendu','périmé','retrait manuel','autre') NOT NULL,
  `quantite` int(11) DEFAULT NULL,
  `montant_vente` decimal(10,2) DEFAULT NULL,
  `date_archivage` timestamp NOT NULL DEFAULT current_timestamp(),
  `commentaire` text DEFAULT NULL,
  `utilisateur_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `archives`
--

INSERT INTO `archives` (`id`, `article_id`, `fournisseur_id`, `motif`, `quantite`, `montant_vente`, `date_archivage`, `commentaire`, `utilisateur_id`) VALUES
(2, 13, 10, 'retrait manuel', 2, 0.00, '2025-06-01 06:58:21', '', 6),
(3, 14, NULL, 'vendu', 2, 19364.00, '2025-06-01 16:42:00', 'Archivage automatique de la vente #3', 6),
(4, 14, NULL, 'vendu', 2, 19500.00, '2025-06-01 17:25:49', 'Archivage automatique de la vente #2', 6),
(5, 16, 13, 'vendu', 2, 12489.48, '2025-06-02 17:20:02', 'Archivage automatique de la vente #12', 4),
(6, 16, 13, 'vendu', 2, 12489.48, '2025-06-02 17:20:18', 'Archivage automatique de la vente #11', 4),
(7, 16, 13, 'vendu', 1, 6244.74, '2025-06-02 17:37:02', 'Archivage automatique de la vente #10', 4);

-- --------------------------------------------------------

--
-- Structure de la table `articles`
--

CREATE TABLE `articles` (
  `id` int(11) NOT NULL,
  `famille_id` int(11) DEFAULT NULL,
  `nom_article` varchar(255) NOT NULL,
  `image_article` varchar(255) DEFAULT NULL,
  `prixVente` decimal(10,2) DEFAULT NULL,
  `quantite_standard` int(11) DEFAULT 0 CHECK (`quantite_standard` >= 0),
  `Conditionnement` varchar(30) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `articles`
--

INSERT INTO `articles` (`id`, `famille_id`, `nom_article`, `image_article`, `prixVente`, `quantite_standard`, `Conditionnement`, `description`, `date_creation`, `date_modification`) VALUES
(13, 6, 'cuvette', './public/images/WhatsApp Image 2025-01-13 à 22.24.51_74ab396f.jpg', 19125.00, 24, '12 tubes', '', '2025-06-01 06:54:54', '2025-06-02 06:01:33'),
(14, 6, 'ret', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', 11964.71, 13, '8 tubes', '', '2025-06-01 07:21:34', '2025-06-02 17:45:33'),
(15, 7, 'Milka', '', 14375.00, 12, '8 tubes', '', '2025-06-01 18:49:36', '2025-06-02 08:00:04'),
(16, 7, 'PIOMALou', '', 6600.00, 20, '15 Boîtes', '', '2025-06-02 06:29:27', '2025-07-12 14:46:09');

-- --------------------------------------------------------

--
-- Structure de la table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `nom` varchar(60) NOT NULL,
  `telephone` varchar(30) DEFAULT NULL,
  `adresse` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `date_modification` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `clients`
--

INSERT INTO `clients` (`id`, `nom`, `telephone`, `adresse`, `description`, `date_creation`, `date_modification`) VALUES
(1, 'mike', NULL, NULL, NULL, '2025-06-01 14:24:26', '2025-06-01 14:24:26'),
(2, 'popo', NULL, NULL, NULL, '2025-06-01 14:54:34', '2025-06-01 14:54:34'),
(4, 'Darryl', NULL, NULL, NULL, '2025-06-01 16:01:19', '2025-06-01 16:01:19'),
(5, 'MOSCOU', NULL, NULL, NULL, '2025-06-02 14:17:21', '2025-06-02 14:17:21'),
(6, 'Damon', NULL, NULL, NULL, '2025-06-02 14:22:16', '2025-06-02 14:22:16'),
(7, 'François', NULL, NULL, NULL, '2025-06-02 14:22:35', '2025-06-02 14:22:35'),
(10, 'Junior', NULL, NULL, NULL, '2025-06-02 14:30:19', '2025-06-02 14:30:19'),
(11, 'Jacques', NULL, NULL, NULL, '2025-06-02 14:31:41', '2025-06-02 14:31:41'),
(12, 'Bosco', NULL, NULL, NULL, '2025-06-02 16:24:59', '2025-06-02 16:24:59'),
(13, 'Luc', NULL, NULL, NULL, '2025-06-02 16:26:50', '2025-06-02 16:26:50'),
(14, 'dz', NULL, NULL, NULL, '2025-06-02 16:43:49', '2025-06-02 16:43:49'),
(15, 'asa', NULL, NULL, NULL, '2025-06-02 16:44:32', '2025-06-02 16:44:32'),
(16, 'Tristan', NULL, NULL, NULL, '2025-06-02 16:48:23', '2025-06-02 16:48:23'),
(17, 'Joël', NULL, NULL, NULL, '2025-06-02 16:54:44', '2025-06-02 16:54:44'),
(18, 'Joël', NULL, NULL, NULL, '2025-06-02 16:55:13', '2025-06-02 16:55:13'),
(19, 'Fernand', NULL, NULL, NULL, '2025-06-02 16:56:08', '2025-06-02 16:56:08'),
(20, 'Merveille', NULL, NULL, NULL, '2025-06-02 16:59:45', '2025-06-02 16:59:45'),
(21, 'George', NULL, NULL, NULL, '2025-06-02 17:01:29', '2025-06-02 17:01:29'),
(22, 'George', NULL, NULL, NULL, '2025-06-02 17:01:44', '2025-06-02 17:01:44'),
(23, 'Raoul', NULL, NULL, NULL, '2025-06-02 17:08:34', '2025-06-02 17:08:34'),
(24, 'Claude', '90515663', '', '', '2025-06-02 17:36:29', '2025-07-12 20:32:26');

-- --------------------------------------------------------

--
-- Structure de la table `familles`
--

CREATE TABLE `familles` (
  `id` int(11) NOT NULL,
  `nom_famille` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `familles`
--

INSERT INTO `familles` (`id`, `nom_famille`, `description`, `date_creation`, `date_modification`) VALUES
(6, 'STAGA', '', '2025-06-01 06:54:54', '2025-06-02 23:22:30'),
(7, 'STAGO', NULL, '2025-06-01 18:49:36', '2025-06-01 18:49:36'),
(8, 'ROCHE', NULL, '2025-06-02 14:14:41', '2025-06-02 14:14:41'),
(9, 'SPIN', '', '2025-06-02 19:14:27', '2025-06-02 23:21:57'),
(10, 'SALIMA', 'dzd', '2025-07-12 13:50:19', '2025-07-12 14:47:46');

-- --------------------------------------------------------

--
-- Structure de la table `fournisseurs`
--

CREATE TABLE `fournisseurs` (
  `id` int(11) NOT NULL,
  `article_id` int(11) DEFAULT NULL,
  `prixArticle` decimal(10,2) NOT NULL,
  `nom` varchar(60) NOT NULL,
  `telephone` varchar(30) DEFAULT NULL,
  `adresse` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT current_timestamp(),
  `date_modification` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `fournisseurs`
--

INSERT INTO `fournisseurs` (`id`, `article_id`, `prixArticle`, `nom`, `telephone`, `adresse`, `description`, `date_creation`, `date_modification`) VALUES
(10, 13, 12500.00, 'Dereck', '', '', '', '2025-06-01 06:54:54', '2025-06-01 06:56:46'),
(12, 15, 12500.00, 'Dereck', NULL, NULL, NULL, '2025-06-01 18:49:36', '2025-06-01 18:49:36'),
(13, 16, 6000.00, 'Joe', '', '', '', '2025-06-02 06:29:27', '2025-06-02 17:35:53'),
(17, 16, 9050.00, 'Karl', NULL, NULL, NULL, '2025-07-12 14:59:43', '2025-07-12 14:59:43'),
(18, 13, 657.89, 'PIPI', '90515663', '', '', '2025-07-12 16:24:58', '2025-07-12 18:23:59');

-- --------------------------------------------------------

--
-- Structure de la table `historiques`
--

CREATE TABLE `historiques` (
  `id` int(11) NOT NULL,
  `stock_id` int(11) DEFAULT NULL,
  `fournisseur_id` int(11) DEFAULT NULL,
  `utilisateur_id` int(11) DEFAULT NULL,
  `type_mouvement` enum('entrée','sortie','retour','ajustement') NOT NULL,
  `quantite_standard_id` int(11) DEFAULT NULL,
  `prix_achat_id` int(11) DEFAULT NULL,
  `prix_vente_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `historiques`
--

INSERT INTO `historiques` (`id`, `stock_id`, `fournisseur_id`, `utilisateur_id`, `type_mouvement`, `quantite_standard_id`, `prix_achat_id`, `prix_vente_id`, `description`, `date_creation`, `date_modification`) VALUES
(10, NULL, 10, 6, 'ajustement', NULL, 9, NULL, 'Modification du prix d\'achat pour le fournisseur Dereck : 0.00 CFA → 12,500.00 CFA', '2025-06-01 06:56:46', '2025-06-01 08:01:48'),
(12, 11, NULL, 6, 'entrée', 9, NULL, NULL, '', '2025-06-01 07:21:34', '2025-06-01 07:21:34'),
(22, 13, NULL, NULL, 'sortie', NULL, NULL, NULL, 'Vente de 1 unités pour un montant de 6244.74 CFA', '2025-06-02 16:50:33', '2025-06-02 16:50:33'),
(23, 13, NULL, NULL, 'sortie', NULL, NULL, NULL, 'Vente de 2 unités pour un montant de 12489.48 CFA', '2025-06-02 16:56:08', '2025-06-02 16:56:08'),
(27, NULL, NULL, 4, 'ajustement', NULL, NULL, NULL, 'Modification du prix d\'achat pour le fournisseur Medecines Corp : 15,743.04 CFA → 17,000.00 CFA', '2025-06-02 18:15:41', '2025-06-02 18:15:41'),
(28, NULL, NULL, 4, 'ajustement', NULL, NULL, NULL, 'Modification du prix de vente de 25 500,00 à 24 650,00 CFA', '2025-06-02 18:23:40', '2025-06-02 18:23:40'),
(29, NULL, NULL, 4, 'ajustement', NULL, NULL, NULL, 'Modification du prix de vente de 24 650,00 à 26 860,00 CFA', '2025-06-02 18:27:54', '2025-06-02 18:27:54'),
(30, NULL, NULL, 4, 'ajustement', NULL, NULL, NULL, 'Modification du prix de vente de 26 860,00 à 24 310,00 CFA', '2025-06-02 18:28:36', '2025-06-02 18:28:36'),
(31, NULL, NULL, 4, 'ajustement', NULL, NULL, NULL, 'Modification du prix de vente de 24 310,00 à 18 700,00 CFA', '2025-06-02 18:29:37', '2025-06-02 18:29:37'),
(32, NULL, NULL, 4, 'ajustement', NULL, NULL, NULL, 'Modification du prix de vente de 18 700,00 à 23 120,00 CFA', '2025-06-02 18:31:45', '2025-06-02 18:31:45'),
(33, NULL, NULL, 4, 'ajustement', NULL, NULL, NULL, 'Modification du prix de vente de 23 120,00 à 22 780,00 CFA', '2025-06-02 18:33:46', '2025-06-02 18:33:46'),
(38, 12, 12, 8, 'sortie', 39, 39, 14, 'Vente de 1 unités pour un montant de 14375.00 CFA. Prix unitaire: 14375.00 CFA, Prix d\'achat: 12500.00 CFA', '2025-07-12 12:15:05', '2025-07-12 12:15:05'),
(39, NULL, NULL, 4, 'ajustement', NULL, NULL, NULL, 'Modification du prix de vente de 22 780,00 à 18 700,00 CFA', '2025-07-12 13:03:30', '2025-07-12 13:03:30'),
(41, NULL, NULL, 4, 'ajustement', NULL, NULL, NULL, 'Ajustement de stock | Fournisseur: Baroon | Modification du prix d\'achat pour le fournisseur Baroon : 7,871.52 CFA → 9,000.00 CFA', '2025-07-12 14:17:29', '2025-07-12 14:17:29'),
(42, NULL, NULL, 4, 'ajustement', NULL, NULL, NULL, 'Ajustement de stock | Fournisseur: Baroon | Modification du prix d\'achat pour le fournisseur Baroon : 9,000.00 CFA → 10,000.00 CFA', '2025-07-12 14:18:20', '2025-07-12 14:18:20'),
(43, NULL, NULL, 4, 'ajustement', NULL, NULL, NULL, 'Ajustement de stock | Fournisseur: BORIS | Modification du prix d\'achat pour le fournisseur BORIS : 15,743.04 CFA → 20,000.00 CFA', '2025-07-12 14:19:46', '2025-07-12 14:19:46'),
(47, 13, 13, 4, 'ajustement', 44, 47, NULL, 'Ajustement de stock | Quantité: 0 | Nouvelle quantité standard: 20 | Fournisseur: Joe', '2025-07-12 14:52:46', '2025-07-12 14:52:46'),
(48, 13, 13, 4, 'ajustement', 45, 48, NULL, 'Ajustement de stock | Quantité: 0 | Nouvelle quantité standard: 20 | Fournisseur: Joe', '2025-07-12 14:55:07', '2025-07-12 14:55:07'),
(51, 11, NULL, 4, 'ajustement', 48, NULL, NULL, 'Ajustement de stock | Quantité: 12 | Nouvelle quantité standard: 13 | Fournisseur: Baroon', '2025-07-12 14:56:18', '2025-07-12 14:56:18'),
(52, 13, 13, 4, 'ajustement', 49, 52, NULL, 'Ajustement de stock | Quantité: 10 | Nouvelle quantité standard: 20 | Fournisseur: Joe', '2025-07-12 14:56:47', '2025-07-12 14:56:47'),
(53, 13, 13, 4, 'ajustement', 50, 53, NULL, 'Ajustement de stock | Quantité: 10 | Nouvelle quantité standard: 20 | Fournisseur: Joe', '2025-07-12 14:57:22', '2025-07-12 14:57:22'),
(54, 13, 17, 4, 'ajustement', 51, 54, NULL, 'Ajustement de stock | Quantité: 10 | Nouvelle quantité standard: 20 | Fournisseur: Karl', '2025-07-12 14:59:43', '2025-07-12 14:59:43'),
(55, NULL, NULL, 4, 'ajustement', NULL, NULL, NULL, 'Modification du prix de vente de 11 000,00 à 12 000,00 CFA', '2025-07-12 15:25:41', '2025-07-12 15:25:41'),
(56, 17, 18, 8, 'entrée', 52, 55, NULL, '', '2025-07-12 16:24:58', '2025-07-12 16:24:58'),
(57, NULL, 18, 4, 'ajustement', NULL, 56, NULL, 'Ajustement de stock | Fournisseur: PIPI | Modification du prix d\'achat pour le fournisseur PIPI : 657.89 CFA → 657.89 CFA', '2025-07-12 18:23:59', '2025-07-12 18:23:59'),
(58, 18, 17, 4, 'entrée', 53, 57, NULL, '', '2025-07-12 20:13:12', '2025-07-12 20:13:12'),
(59, 19, 17, 4, 'entrée', 54, 58, NULL, '', '2025-07-12 20:19:35', '2025-07-12 20:19:35'),
(60, 20, 18, 4, 'entrée', 55, 59, NULL, '', '2025-07-12 20:21:17', '2025-07-12 20:21:17'),
(61, 21, 17, 4, 'entrée', 56, 60, NULL, '', '2025-07-12 20:22:44', '2025-07-12 20:22:44'),
(62, 21, 17, 4, 'ajustement', 57, 61, NULL, 'Ajustement de stock | Quantité: 2 | Nouvelle quantité standard: 20 | Fournisseur: Karl', '2025-08-30 13:27:54', '2025-08-30 13:27:54'),
(63, 21, 17, 4, 'ajustement', 58, 62, NULL, 'Ajustement de stock | Quantité: 2 | Nouvelle quantité standard: 12 | Fournisseur: Karl', '2025-08-30 13:28:29', '2025-08-30 13:28:29'),
(64, 21, 17, 4, 'ajustement', 59, 63, NULL, 'Ajustement de stock | Quantité: 2 | Nouvelle quantité standard: 12 | Fournisseur: Karl', '2025-08-30 13:28:38', '2025-08-30 13:28:38'),
(65, 18, 17, 4, 'sortie', 60, 64, 17, 'Vente de 1 unités pour un montant de 11964.71 CFA. Prix unitaire: 11964.71 CFA, Prix d\'achat: 9050.00 CFA', '2025-08-31 19:57:12', '2025-08-31 19:57:12'),
(66, 12, 12, 4, 'sortie', 61, 65, 18, 'Vente de 1 unités pour un montant de 14375.00 CFA. Prix unitaire: 14375.00 CFA, Prix d\'achat: 12500.00 CFA', '2025-09-01 09:56:59', '2025-09-01 09:56:59'),
(67, 11, NULL, 8, 'sortie', 62, NULL, 19, 'Vente de 2 unités pour un montant de 23929.42 CFA. Prix unitaire: 11964.71 CFA, Prix d\'achat: 0.00 CFA', '2025-09-01 10:21:53', '2025-09-01 10:21:53'),
(68, 11, NULL, 8, 'sortie', 63, NULL, 20, 'Vente de 1 unités pour un montant de 11964.71 CFA. Prix unitaire: 11964.71 CFA, Prix d\'achat: 0.00 CFA', '2025-09-01 10:34:02', '2025-09-01 10:34:02'),
(69, 11, NULL, 8, 'sortie', 64, NULL, 21, 'Vente de 1 unités pour un montant de 11964.71 CFA. Prix unitaire: 11964.71 CFA, Prix d\'achat: 0.00 CFA', '2025-09-01 10:34:37', '2025-09-01 10:34:37'),
(70, 11, NULL, 8, 'sortie', 65, NULL, 22, 'Vente de 1 unités pour un montant de 11964.71 CFA. Prix unitaire: 11964.71 CFA, Prix d\'achat: 0.00 CFA', '2025-09-01 10:35:03', '2025-09-01 10:35:03'),
(71, 11, NULL, 8, 'sortie', 66, NULL, 23, 'Vente de 2 unités pour un montant de 23929.42 CFA. Prix unitaire: 11964.71 CFA, Prix d\'achat: 0.00 CFA', '2025-09-01 10:39:45', '2025-09-01 10:39:45'),
(72, 13, 17, 8, 'sortie', 67, 66, 24, 'Vente de 2 unités pour un montant de 13200.00 CFA. Prix unitaire: 6600.00 CFA, Prix d\'achat: 9050.00 CFA', '2025-09-01 10:41:06', '2025-09-01 10:41:06'),
(73, 13, 17, 8, 'sortie', 68, 67, 25, 'Vente de 2 unités pour un montant de 0.00 CFA. Prix unitaire: 0.00 CFA, Prix d\'achat: 9050.00 CFA', '2025-09-01 11:08:18', '2025-09-01 11:08:18'),
(74, 11, NULL, 8, 'sortie', 69, NULL, 26, 'Vente de 1 unités pour un montant de 11964.71 CFA. Prix unitaire: 11964.71 CFA, Prix d\'achat: 0.00 CFA', '2025-09-01 11:08:18', '2025-09-01 11:08:18'),
(75, 11, NULL, 8, 'sortie', 70, NULL, 27, 'Vente de 1 unités pour un montant de 11964.71 CFA. Prix unitaire: 11964.71 CFA, Prix d\'achat: 0.00 CFA', '2025-09-01 11:10:37', '2025-09-01 11:10:37'),
(76, 11, NULL, 8, 'sortie', 71, NULL, 28, 'Vente de 1 unités pour un montant de 11964.71 CFA. Prix unitaire: 11964.71 CFA, Prix d\'achat: 0.00 CFA', '2025-09-01 11:20:20', '2025-09-01 11:20:20'),
(77, 11, NULL, 8, 'sortie', 72, NULL, 29, 'Vente de 1 unités pour un montant de 11964.71 CFA. Prix unitaire: 11964.71 CFA, Prix d\'achat: 0.00 CFA', '2025-09-01 11:21:43', '2025-09-01 11:21:43'),
(78, 13, 17, 8, 'sortie', 73, 68, 30, 'Vente de 1 unités pour un montant de 6600.00 CFA. Prix unitaire: 6600.00 CFA, Prix d\'achat: 9050.00 CFA', '2025-09-01 11:25:58', '2025-09-01 11:25:58'),
(79, 13, 17, 8, 'sortie', 74, 69, 31, 'Vente de 5 unités pour un montant de 33000.00 CFA. Prix unitaire: 6600.00 CFA, Prix d\'achat: 9050.00 CFA', '2025-09-01 11:26:40', '2025-09-01 11:26:40'),
(80, 11, NULL, 8, 'sortie', 75, NULL, 32, 'Vente de 1 unités pour un montant de 11964.71 CFA. Prix unitaire: 11964.71 CFA, Prix d\'achat: 0.00 CFA', '2025-09-01 11:26:40', '2025-09-01 11:26:40'),
(81, 19, 17, 8, 'sortie', 76, 70, 33, 'Vente de 2 unités pour un montant de 23929.42 CFA. Prix unitaire: 11964.71 CFA, Prix d\'achat: 9050.00 CFA', '2025-09-01 11:31:51', '2025-09-01 11:31:51'),
(82, 21, 17, 8, 'sortie', 77, 71, 34, 'Vente de 1 unités pour un montant de 14375.00 CFA. Prix unitaire: 14375.00 CFA, Prix d\'achat: 9050.00 CFA', '2025-09-01 11:36:23', '2025-09-01 11:36:23'),
(83, 21, 17, 4, 'ajustement', 78, 72, NULL, 'Ajustement de stock | Quantité: 2 | Nouvelle quantité standard: 12 | Fournisseur: Karl', '2025-09-01 17:03:33', '2025-09-01 17:03:33'),
(84, 21, 17, 8, 'ajustement', 79, 73, NULL, 'Ajustement de stock | Quantité: 1 | Nouvelle quantité standard: 12 | Fournisseur: Karl', '2025-09-01 17:05:29', '2025-09-01 17:05:29'),
(85, 18, 17, 4, 'sortie', 80, 74, 35, 'Vente de 1 unités pour un montant de 10000.00 CFA. Prix unitaire: 10000.00 CFA, Prix d\'achat: 9050.00 CFA', '2025-09-01 17:51:22', '2025-09-01 17:51:22');

-- --------------------------------------------------------

--
-- Structure de la table `historique_prix_achat`
--

CREATE TABLE `historique_prix_achat` (
  `id` int(11) NOT NULL,
  `fournisseur_id` int(11) NOT NULL,
  `valeur` decimal(10,2) NOT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `historique_prix_achat`
--

INSERT INTO `historique_prix_achat` (`id`, `fournisseur_id`, `valeur`, `date_creation`, `date_modification`) VALUES
(8, 10, 0.00, '2025-06-01 06:54:54', '2025-06-01 06:54:54'),
(9, 10, 12500.00, '2025-06-01 06:56:46', '2025-06-01 06:56:46'),
(39, 12, 12500.00, '2025-07-12 12:15:05', '2025-07-12 12:15:05'),
(47, 13, 6500.00, '2025-07-12 14:52:46', '2025-07-12 14:52:46'),
(48, 13, 6500.00, '2025-07-12 14:55:07', '2025-07-12 14:55:07'),
(52, 13, 6000.00, '2025-07-12 14:56:47', '2025-07-12 14:56:47'),
(53, 13, 6500.00, '2025-07-12 14:57:22', '2025-07-12 14:57:22'),
(54, 17, 9050.00, '2025-07-12 14:59:43', '2025-07-12 14:59:43'),
(55, 18, 657.89, '2025-07-12 16:24:58', '2025-07-12 16:24:58'),
(56, 18, 657.89, '2025-07-12 18:23:59', '2025-07-12 18:23:59'),
(57, 17, 12048.19, '2025-07-12 20:13:12', '2025-07-12 20:13:12'),
(58, 17, 12048.19, '2025-07-12 20:19:35', '2025-07-12 20:19:35'),
(59, 18, 78947.37, '2025-07-12 20:21:17', '2025-07-12 20:21:17'),
(60, 17, 15131.58, '2025-07-12 20:22:44', '2025-07-12 20:22:44'),
(61, 17, 9050.00, '2025-08-30 13:27:54', '2025-08-30 13:27:54'),
(62, 17, 9050.00, '2025-08-30 13:28:29', '2025-08-30 13:28:29'),
(63, 17, 9050.00, '2025-08-30 13:28:38', '2025-08-30 13:28:38'),
(64, 17, 9050.00, '2025-08-31 19:57:12', '2025-08-31 19:57:12'),
(65, 12, 12500.00, '2025-09-01 09:56:59', '2025-09-01 09:56:59'),
(66, 17, 9050.00, '2025-09-01 10:41:06', '2025-09-01 10:41:06'),
(67, 17, 9050.00, '2025-09-01 11:08:18', '2025-09-01 11:08:18'),
(68, 17, 9050.00, '2025-09-01 11:25:58', '2025-09-01 11:25:58'),
(69, 17, 9050.00, '2025-09-01 11:26:40', '2025-09-01 11:26:40'),
(70, 17, 9050.00, '2025-09-01 11:31:51', '2025-09-01 11:31:51'),
(71, 17, 9050.00, '2025-09-01 11:36:23', '2025-09-01 11:36:23'),
(72, 17, 9050.00, '2025-09-01 17:03:33', '2025-09-01 17:03:33'),
(73, 17, 9050.00, '2025-09-01 17:05:29', '2025-09-01 17:05:29'),
(74, 17, 9050.00, '2025-09-01 17:51:22', '2025-09-01 17:51:22');

-- --------------------------------------------------------

--
-- Structure de la table `historique_prix_vente`
--

CREATE TABLE `historique_prix_vente` (
  `id` int(11) NOT NULL,
  `article_id` int(11) NOT NULL,
  `valeur` decimal(10,2) NOT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `historique_prix_vente`
--

INSERT INTO `historique_prix_vente` (`id`, `article_id`, `valeur`, `date_creation`, `date_modification`) VALUES
(1, 16, 6244.74, '2025-06-02 17:08:34', '2025-06-02 17:08:34'),
(2, 16, 6244.74, '2025-06-02 17:36:29', '2025-06-02 17:36:29'),
(14, 15, 14375.00, '2025-07-12 12:15:05', '2025-07-12 12:15:05'),
(17, 14, 11964.71, '2025-08-31 19:57:12', '2025-08-31 19:57:12'),
(18, 15, 14375.00, '2025-09-01 09:56:59', '2025-09-01 09:56:59'),
(19, 14, 11964.71, '2025-09-01 10:21:53', '2025-09-01 10:21:53'),
(20, 14, 11964.71, '2025-09-01 10:34:02', '2025-09-01 10:34:02'),
(21, 14, 11964.71, '2025-09-01 10:34:37', '2025-09-01 10:34:37'),
(22, 14, 11964.71, '2025-09-01 10:35:03', '2025-09-01 10:35:03'),
(23, 14, 11964.71, '2025-09-01 10:39:45', '2025-09-01 10:39:45'),
(24, 16, 6600.00, '2025-09-01 10:41:06', '2025-09-01 10:41:06'),
(25, 16, 6600.00, '2025-09-01 11:08:18', '2025-09-01 11:08:18'),
(26, 14, 11964.71, '2025-09-01 11:08:18', '2025-09-01 11:08:18'),
(27, 14, 11964.71, '2025-09-01 11:10:37', '2025-09-01 11:10:37'),
(28, 14, 11964.71, '2025-09-01 11:20:20', '2025-09-01 11:20:20'),
(29, 14, 11964.71, '2025-09-01 11:21:43', '2025-09-01 11:21:43'),
(30, 16, 6600.00, '2025-09-01 11:25:58', '2025-09-01 11:25:58'),
(31, 16, 6600.00, '2025-09-01 11:26:40', '2025-09-01 11:26:40'),
(32, 14, 11964.71, '2025-09-01 11:26:40', '2025-09-01 11:26:40'),
(33, 14, 11964.71, '2025-09-01 11:31:51', '2025-09-01 11:31:51'),
(34, 15, 14375.00, '2025-09-01 11:36:23', '2025-09-01 11:36:23'),
(35, 14, 11964.71, '2025-09-01 17:51:22', '2025-09-01 17:51:22');

-- --------------------------------------------------------

--
-- Structure de la table `historique_quantite_standard`
--

CREATE TABLE `historique_quantite_standard` (
  `id` int(11) NOT NULL,
  `article_id` int(11) NOT NULL,
  `valeur` int(11) NOT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `historique_quantite_standard`
--

INSERT INTO `historique_quantite_standard` (`id`, `article_id`, `valeur`, `date_creation`, `date_modification`) VALUES
(8, 13, 24, '2025-06-01 06:54:54', '2025-06-01 06:54:54'),
(9, 14, 13, '2025-06-01 07:21:34', '2025-06-01 07:21:34'),
(10, 15, 10, '2025-06-01 18:49:36', '2025-06-01 18:49:36'),
(11, 16, 15, '2025-06-02 06:29:27', '2025-06-02 06:29:27'),
(12, 16, 15, '2025-06-02 11:55:52', '2025-06-02 11:55:52'),
(13, 16, 15, '2025-06-02 11:56:11', '2025-06-02 11:56:11'),
(22, 16, 15, '2025-06-02 17:08:34', '2025-06-02 17:08:34'),
(23, 16, 15, '2025-06-02 17:36:29', '2025-06-02 17:36:29'),
(39, 15, 12, '2025-07-12 12:15:05', '2025-07-12 12:15:05'),
(44, 16, 20, '2025-07-12 14:52:46', '2025-07-12 14:52:46'),
(45, 16, 20, '2025-07-12 14:55:07', '2025-07-12 14:55:07'),
(48, 14, 13, '2025-07-12 14:56:18', '2025-07-12 14:56:18'),
(49, 16, 20, '2025-07-12 14:56:47', '2025-07-12 14:56:47'),
(50, 16, 20, '2025-07-12 14:57:22', '2025-07-12 14:57:22'),
(51, 16, 20, '2025-07-12 14:59:43', '2025-07-12 14:59:43'),
(52, 13, 24, '2025-07-12 16:24:58', '2025-07-12 16:24:58'),
(53, 14, 13, '2025-07-12 20:13:12', '2025-07-12 20:13:12'),
(54, 14, 13, '2025-07-12 20:19:35', '2025-07-12 20:19:35'),
(55, 16, 20, '2025-07-12 20:21:17', '2025-07-12 20:21:17'),
(56, 16, 20, '2025-07-12 20:22:44', '2025-07-12 20:22:44'),
(57, 16, 20, '2025-08-30 13:27:54', '2025-08-30 13:27:54'),
(58, 15, 12, '2025-08-30 13:28:29', '2025-08-30 13:28:29'),
(59, 15, 12, '2025-08-30 13:28:38', '2025-08-30 13:28:38'),
(60, 14, 13, '2025-08-31 19:57:12', '2025-08-31 19:57:12'),
(61, 15, 12, '2025-09-01 09:56:59', '2025-09-01 09:56:59'),
(62, 14, 13, '2025-09-01 10:21:53', '2025-09-01 10:21:53'),
(63, 14, 13, '2025-09-01 10:34:02', '2025-09-01 10:34:02'),
(64, 14, 13, '2025-09-01 10:34:37', '2025-09-01 10:34:37'),
(65, 14, 13, '2025-09-01 10:35:03', '2025-09-01 10:35:03'),
(66, 14, 13, '2025-09-01 10:39:45', '2025-09-01 10:39:45'),
(67, 16, 20, '2025-09-01 10:41:06', '2025-09-01 10:41:06'),
(68, 16, 20, '2025-09-01 11:08:18', '2025-09-01 11:08:18'),
(69, 14, 13, '2025-09-01 11:08:18', '2025-09-01 11:08:18'),
(70, 14, 13, '2025-09-01 11:10:37', '2025-09-01 11:10:37'),
(71, 14, 13, '2025-09-01 11:20:20', '2025-09-01 11:20:20'),
(72, 14, 13, '2025-09-01 11:21:43', '2025-09-01 11:21:43'),
(73, 16, 20, '2025-09-01 11:25:58', '2025-09-01 11:25:58'),
(74, 16, 20, '2025-09-01 11:26:40', '2025-09-01 11:26:40'),
(75, 14, 13, '2025-09-01 11:26:40', '2025-09-01 11:26:40'),
(76, 14, 13, '2025-09-01 11:31:51', '2025-09-01 11:31:51'),
(77, 15, 12, '2025-09-01 11:36:23', '2025-09-01 11:36:23'),
(78, 15, 12, '2025-09-01 17:03:33', '2025-09-01 17:03:33'),
(79, 15, 12, '2025-09-01 17:05:29', '2025-09-01 17:05:29'),
(80, 14, 13, '2025-09-01 17:51:22', '2025-09-01 17:51:22');

-- --------------------------------------------------------

--
-- Structure de la table `stock`
--

CREATE TABLE `stock` (
  `id` int(11) NOT NULL,
  `article_id` int(11) NOT NULL,
  `fournisseur_id` int(11) DEFAULT NULL,
  `lot` varchar(40) DEFAULT NULL,
  `reference` varchar(40) DEFAULT NULL,
  `quantite` int(11) DEFAULT NULL,
  `montant` decimal(10,2) DEFAULT NULL,
  `date_fabrication` date DEFAULT NULL,
  `date_peremption` date DEFAULT NULL,
  `etat` decimal(5,2) DEFAULT NULL COMMENT 'Pourcentage du stock par rapport à la quantité standard',
  `description` text DEFAULT NULL,
  `etat_stock` enum('actif','vendu','périmé','archivé') DEFAULT 'actif',
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `stock`
--

INSERT INTO `stock` (`id`, `article_id`, `fournisseur_id`, `lot`, `reference`, `quantite`, `montant`, `date_fabrication`, `date_peremption`, `etat`, `description`, `etat_stock`, `date_creation`, `date_modification`) VALUES
(11, 14, NULL, 'cd1', '07GY', 0, 120000.00, '2025-05-26', '2025-07-06', 0.00, '', 'actif', '2025-06-01 07:21:34', '2025-09-01 11:26:40'),
(12, 15, 12, 'cd12', '07GY', 0, 37500.00, '2025-05-27', '2025-09-13', 0.00, '', 'actif', '2025-06-01 18:49:36', '2025-09-01 09:56:59'),
(13, 16, 17, 'DF52T', 'SD8999', 0, 90500.00, '2025-05-26', '2025-07-06', 0.00, '', 'actif', '2025-06-02 06:29:27', '2025-09-01 11:26:40'),
(17, 13, 18, 'op4', 'PL09', 2, 1315.78, '2025-06-30', '2025-07-27', 20.00, '', 'actif', '2025-07-12 16:24:58', '2025-07-12 16:24:58'),
(18, 14, 17, 'op4', 'PL09', 2, 48192.76, '2025-07-01', '2025-08-10', 15.38, '', 'actif', '2025-07-12 20:13:12', '2025-09-01 17:51:22'),
(19, 14, 17, 'op4', 'PL09', 2, 48192.76, '2025-07-01', '2025-08-10', 15.38, '', 'actif', '2025-07-12 20:19:35', '2025-09-01 11:31:51'),
(20, 16, 18, 'op4', 'PL09', 4, 315789.48, '0000-00-00', '0000-00-00', 10.00, '', 'actif', '2025-07-12 20:21:17', '2025-07-12 20:21:17'),
(21, 15, 17, 'op4', 'PL09', 1, 9050.00, '2025-08-06', '2025-09-06', 8.33, '', 'actif', '2025-07-12 20:22:44', '2025-09-01 17:05:29');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id` int(11) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `sexe` varchar(20) DEFAULT NULL,
  `telephone` varchar(30) DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `photo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `nom`, `mot_de_passe`, `role`, `email`, `description`, `adresse`, `sexe`, `telephone`, `date_creation`, `date_modification`, `photo`) VALUES
(4, 'admin', '$2y$10$5qQEtdMMpzsvehMXnfY.3uUCfj6GZRgh0.AC2qDRyJ5ywpW8ITAXK', 'admin', 'charlyeklu27@gmail.com', 'Très travailleur', 'Segbe, Lome', 'Autre', '97 02 77 07', '2025-04-12 20:25:49', '2025-04-26 16:26:31', './model/public/images/utilisateurs/WhatsApp Image 2025-01-13 à 09.20.22_d7fc7af2.jpg'),
(5, 'Charles', '$2y$10$10sq3LpxIvmff3Ezy0hh4.9A75hSd0N28JE9m8vIMI727tMWAfc.C', 's_user', 'charlyeklu27@gmail.com', 'Ingénieur Logiciel', 'Segbe, Lome', 'Homme', '90515663', '2025-04-21 14:31:04', '2025-04-21 14:40:34', './model/public/images/utilisateurs/icone_2.png.jpg'),
(6, 'charly', '$2y$10$n.73rrSYQZjjaYRStTYDh.l.vr/Q1LF7izYchV7OHpTLweZoqLgMa', 'admin', NULL, NULL, NULL, 'Homme', NULL, '2025-04-26 18:46:45', '2025-05-29 10:45:05', './model/public/images/utilisateurs/RENGOKU_3.jpg'),
(7, 'georges', '$2y$10$uM4G763zU/z0eA8CTlVwX.xSQl0grSFbnwoBEGgeMTEoi7sXXZioe', 'admin', NULL, NULL, NULL, 'Homme', NULL, '2025-06-21 11:40:35', '2025-06-21 11:40:35', NULL),
(8, 'Charles4', '$2y$10$hD3VVH2thBssmnt/jVAkcuigYMUOSMbxOb3okqUVuf0D9yxpBKy8K', 's_user', NULL, NULL, NULL, 'Homme', NULL, '2025-07-12 10:16:03', '2025-09-01 10:20:20', './model/public/images/utilisateurs/23854.png');

-- --------------------------------------------------------

--
-- Structure de la table `ventes`
--

CREATE TABLE `ventes` (
  `id` int(11) NOT NULL,
  `stock_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `quantite` int(11) DEFAULT NULL,
  `montant` decimal(10,2) DEFAULT NULL,
  `nom_article_snapshot` varchar(255) DEFAULT NULL,
  `nom_famille_snapshot` varchar(255) DEFAULT NULL,
  `prix_vente_snapshot` decimal(10,2) DEFAULT NULL,
  `prix_achat_snapshot` decimal(10,2) DEFAULT NULL,
  `nom_fournisseur_snapshot` varchar(255) DEFAULT NULL,
  `lot_snapshot` varchar(255) DEFAULT NULL,
  `reference_snapshot` varchar(255) DEFAULT NULL,
  `conditionnement_snapshot` varchar(255) DEFAULT NULL,
  `image_article_snapshot` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modification` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `ventes`
--

INSERT INTO `ventes` (`id`, `stock_id`, `client_id`, `quantite`, `montant`, `nom_article_snapshot`, `nom_famille_snapshot`, `prix_vente_snapshot`, `prix_achat_snapshot`, `nom_fournisseur_snapshot`, `lot_snapshot`, `reference_snapshot`, `conditionnement_snapshot`, `image_article_snapshot`, `description`, `date_creation`, `date_modification`) VALUES
(1, 11, 1, 2, 19363.94, 'ret', 'STAGA', 11964.71, 7871.52, 'Baroon', 'cd1', '07GY', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-06-01 14:25:28', '2025-07-12 12:12:52'),
(5, 12, 1, 2, 32500.00, 'Milka', 'STAGO', 14375.00, 12500.00, 'Dereck', 'cd12', '07GY', '8 tubes', '', NULL, '2025-06-01 18:57:57', '2025-07-12 12:12:52'),
(6, 12, 4, 1, 14375.00, 'Milka', 'STAGO', 14375.00, 12500.00, 'Dereck', 'cd12', '07GY', '8 tubes', '', NULL, '2025-06-02 13:38:12', '2025-07-12 12:12:52'),
(8, 13, 13, 1, 6244.74, 'PIOMAL', 'STAGO', 6244.74, 6000.00, 'Joe', 'DF52T', 'SD8999', '15 Boîtes', '', NULL, '2025-06-02 16:44:24', '2025-07-12 12:12:52'),
(9, 13, 16, 1, 6244.74, 'PIOMAL', 'STAGO', 6244.74, 6000.00, 'Joe', 'DF52T', 'SD8999', '15 Boîtes', '', NULL, '2025-06-02 16:48:23', '2025-07-12 12:12:52'),
(13, 13, 24, 2, 12489.48, 'PIOMAL', 'STAGO', 6244.74, 6000.00, 'Joe', 'DF52T', 'SD8999', '15 Boîtes', '', NULL, '2025-06-02 17:36:29', '2025-07-12 12:12:52'),
(16, 12, 16, 1, 14375.00, 'Milka', 'STAGO', 14375.00, 12500.00, 'Dereck', 'cd12', '07GY', '8 tubes', '', NULL, '2025-07-12 12:15:05', '2025-07-12 12:15:05'),
(17, 18, 16, 1, 11964.71, 'ret', 'STAGA', 11964.71, 9050.00, 'Karl', 'op4', 'PL09', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-08-31 19:57:12', '2025-08-31 19:57:12'),
(18, 12, 21, 1, 14375.00, 'Milka', 'STAGO', 14375.00, 12500.00, 'Dereck', 'cd12', '07GY', '8 tubes', '', NULL, '2025-09-01 09:56:59', '2025-09-01 09:56:59'),
(19, 11, 18, 2, 23929.42, 'ret', 'STAGA', 11964.71, 0.00, '', 'cd1', '07GY', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-09-01 10:21:53', '2025-09-01 10:21:53'),
(20, 11, 20, 1, 11964.71, 'ret', 'STAGA', 11964.71, 0.00, '', 'cd1', '07GY', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-09-01 10:34:02', '2025-09-01 10:34:02'),
(21, 11, 10, 1, 11964.71, 'ret', 'STAGA', 11964.71, 0.00, '', 'cd1', '07GY', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-09-01 10:34:37', '2025-09-01 10:34:37'),
(22, 11, 21, 1, 11964.71, 'ret', 'STAGA', 11964.71, 0.00, '', 'cd1', '07GY', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-09-01 10:35:03', '2025-09-01 10:35:03'),
(23, 11, 19, 2, 23929.42, 'ret', 'STAGA', 11964.71, 0.00, '', 'cd1', '07GY', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-09-01 10:39:45', '2025-09-01 10:39:45'),
(24, 13, 13, 2, 13200.00, 'PIOMALou', 'STAGO', 6600.00, 9050.00, 'Karl', 'DF52T', 'SD8999', '15 Boîtes', '', NULL, '2025-09-01 10:41:06', '2025-09-01 10:41:06'),
(25, 13, 21, 2, 0.00, 'PIOMALou', 'STAGO', 6600.00, 9050.00, 'Karl', 'DF52T', 'SD8999', '15 Boîtes', '', NULL, '2025-09-01 11:08:18', '2025-09-01 11:08:18'),
(26, 11, 21, 1, 11964.71, 'ret', 'STAGA', 11964.71, 0.00, '', 'cd1', '07GY', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-09-01 11:08:18', '2025-09-01 11:08:18'),
(27, 11, 22, 1, 11964.71, 'ret', 'STAGA', 11964.71, 0.00, '', 'cd1', '07GY', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-09-01 11:10:37', '2025-09-01 11:10:37'),
(28, 11, 18, 1, 11964.71, 'ret', 'STAGA', 11964.71, 0.00, '', 'cd1', '07GY', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-09-01 11:20:20', '2025-09-01 11:20:20'),
(29, 11, 12, 1, 11964.71, 'ret', 'STAGA', 11964.71, 0.00, '', 'cd1', '07GY', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-09-01 11:21:43', '2025-09-01 11:21:43'),
(30, 13, 5, 1, 6600.00, 'PIOMALou', 'STAGO', 6600.00, 9050.00, 'Karl', 'DF52T', 'SD8999', '15 Boîtes', '', NULL, '2025-09-01 11:25:58', '2025-09-01 11:25:58'),
(31, 13, 11, 5, 33000.00, 'PIOMALou', 'STAGO', 6600.00, 9050.00, 'Karl', 'DF52T', 'SD8999', '15 Boîtes', '', NULL, '2025-09-01 11:26:40', '2025-09-01 11:26:40'),
(32, 11, 11, 1, 11964.71, 'ret', 'STAGA', 11964.71, 0.00, '', 'cd1', '07GY', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-09-01 11:26:40', '2025-09-01 11:26:40'),
(33, 19, 20, 2, 23929.42, 'ret', 'STAGA', 11964.71, 9050.00, 'Karl', 'op4', 'PL09', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-09-01 11:31:51', '2025-09-01 11:31:51'),
(34, 21, 12, 1, 14375.00, 'Milka', 'STAGO', 14375.00, 9050.00, 'Karl', 'op4', 'PL09', '8 tubes', '', NULL, '2025-09-01 11:36:23', '2025-09-01 11:36:23'),
(35, 18, 12, 1, 10000.00, 'ret', 'STAGA', 11964.71, 9050.00, 'Karl', 'op4', 'PL09', '8 tubes', './public/images/WhatsApp Image 2025-01-13 à 22.24.50_cc906446.jpg', NULL, '2025-09-01 17:51:22', '2025-09-01 17:51:22');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `archives`
--
ALTER TABLE `archives`
  ADD PRIMARY KEY (`id`),
  ADD KEY `article_id` (`article_id`),
  ADD KEY `fournisseur_id` (`fournisseur_id`),
  ADD KEY `utilisateur_id` (`utilisateur_id`);

--
-- Index pour la table `articles`
--
ALTER TABLE `articles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `famille_id` (`famille_id`);

--
-- Index pour la table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `familles`
--
ALTER TABLE `familles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nom_famille` (`nom_famille`);

--
-- Index pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `article_id` (`article_id`);

--
-- Index pour la table `historiques`
--
ALTER TABLE `historiques`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_id` (`stock_id`),
  ADD KEY `fournisseur_id` (`fournisseur_id`),
  ADD KEY `utilisateur_id` (`utilisateur_id`),
  ADD KEY `quantite_standard_id` (`quantite_standard_id`),
  ADD KEY `prix_achat_id` (`prix_achat_id`),
  ADD KEY `prix_vente_id` (`prix_vente_id`);

--
-- Index pour la table `historique_prix_achat`
--
ALTER TABLE `historique_prix_achat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_prix_achat_fournisseur` (`fournisseur_id`);

--
-- Index pour la table `historique_prix_vente`
--
ALTER TABLE `historique_prix_vente`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_prix_vente_article` (`article_id`);

--
-- Index pour la table `historique_quantite_standard`
--
ALTER TABLE `historique_quantite_standard`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_qs_article` (`article_id`);

--
-- Index pour la table `stock`
--
ALTER TABLE `stock`
  ADD PRIMARY KEY (`id`),
  ADD KEY `article_id` (`article_id`),
  ADD KEY `fournisseur_id` (`fournisseur_id`);

--
-- Index pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `ventes`
--
ALTER TABLE `ventes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_id` (`stock_id`),
  ADD KEY `client_id` (`client_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `archives`
--
ALTER TABLE `archives`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `articles`
--
ALTER TABLE `articles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT pour la table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT pour la table `familles`
--
ALTER TABLE `familles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT pour la table `historiques`
--
ALTER TABLE `historiques`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT pour la table `historique_prix_achat`
--
ALTER TABLE `historique_prix_achat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT pour la table `historique_prix_vente`
--
ALTER TABLE `historique_prix_vente`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT pour la table `historique_quantite_standard`
--
ALTER TABLE `historique_quantite_standard`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT pour la table `stock`
--
ALTER TABLE `stock`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `ventes`
--
ALTER TABLE `ventes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `archives`
--
ALTER TABLE `archives`
  ADD CONSTRAINT `archives_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `archives_ibfk_2` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `archives_ibfk_3` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `articles`
--
ALTER TABLE `articles`
  ADD CONSTRAINT `articles_ibfk_1` FOREIGN KEY (`famille_id`) REFERENCES `familles` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  ADD CONSTRAINT `fournisseurs_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `historiques`
--
ALTER TABLE `historiques`
  ADD CONSTRAINT `historiques_ibfk_1` FOREIGN KEY (`stock_id`) REFERENCES `stock` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `historiques_ibfk_2` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `historiques_ibfk_3` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `historiques_ibfk_4` FOREIGN KEY (`quantite_standard_id`) REFERENCES `historique_quantite_standard` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `historiques_ibfk_5` FOREIGN KEY (`prix_achat_id`) REFERENCES `historique_prix_achat` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `historiques_ibfk_6` FOREIGN KEY (`prix_vente_id`) REFERENCES `historique_prix_vente` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `historique_prix_achat`
--
ALTER TABLE `historique_prix_achat`
  ADD CONSTRAINT `fk_prix_achat_fournisseur` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `historique_prix_vente`
--
ALTER TABLE `historique_prix_vente`
  ADD CONSTRAINT `fk_prix_vente_article` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `historique_quantite_standard`
--
ALTER TABLE `historique_quantite_standard`
  ADD CONSTRAINT `fk_qs_article` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `stock`
--
ALTER TABLE `stock`
  ADD CONSTRAINT `stock_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_ibfk_2` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `ventes`
--
ALTER TABLE `ventes`
  ADD CONSTRAINT `ventes_ibfk_1` FOREIGN KEY (`stock_id`) REFERENCES `stock` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ventes_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
