/*
 Navicat Premium Dump SQL

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80012 (8.0.12)
 Source Host           : localhost:3306
 Source Schema         : blog_3d

 Target Server Type    : MySQL
 Target Server Version : 80012 (8.0.12)
 File Encoding         : 65001

 Date: 25/05/2026 10:41:05
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for announcements
-- ----------------------------
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `is_active` tinyint(1) NULL DEFAULT 1,
  `sort_order` int(11) NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of announcements
-- ----------------------------
INSERT INTO `announcements` VALUES (1, '哈哈哈哈哈哈哈', 1, 0, '2026-05-19 07:17:51', '2026-05-19 07:17:51');
INSERT INTO `announcements` VALUES (2, '微风威锋网服务费', 1, 0, '2026-05-19 07:17:59', '2026-05-19 07:18:08');

-- ----------------------------
-- Table structure for article_tags
-- ----------------------------
DROP TABLE IF EXISTS `article_tags`;
CREATE TABLE `article_tags`  (
  `article_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `tag_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`article_id`, `tag_id`) USING BTREE,
  INDEX `tag_id`(`tag_id` ASC) USING BTREE,
  CONSTRAINT `article_tags_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `article_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of article_tags
-- ----------------------------
INSERT INTO `article_tags` VALUES ('4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', '0009b913-91ea-4e84-8b5a-0fc5a6db9ac8');
INSERT INTO `article_tags` VALUES ('f96e8100b5c746a3871848f1427a8800', '14');
INSERT INTO `article_tags` VALUES ('6e0a83add5514b9a868508b04381a9f1', '3289c843623544a1ac92985d5b805de7');
INSERT INTO `article_tags` VALUES ('6e0a83add5514b9a868508b04381a9f1', '3ab0e8e898324ce58e58f4fd2de9ac66');
INSERT INTO `article_tags` VALUES ('4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', '484b4f48-4d7f-4f8c-bf41-9f833860cc9b');
INSERT INTO `article_tags` VALUES ('6e0a83add5514b9a868508b04381a9f1', '526c7e8736a3411ba78a6048f2bf2f44');
INSERT INTO `article_tags` VALUES ('4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', '5dbfe7eb-89e1-4d18-a307-579e52708a9b');
INSERT INTO `article_tags` VALUES ('f96e8100b5c746a3871848f1427a8800', 'aa10c9139ede4aaeafef38fe65508412');
INSERT INTO `article_tags` VALUES ('6e0a83add5514b9a868508b04381a9f1', 'aabbc09cf0144cdd82176bf157a687b3');
INSERT INTO `article_tags` VALUES ('4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', 'd58a6c36-a842-43fc-91bd-4f7fa1583edd');

-- ----------------------------
-- Table structure for article_vectors
-- ----------------------------
DROP TABLE IF EXISTS `article_vectors`;
CREATE TABLE `article_vectors`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `article_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `embedding` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `chunk_index` int(11) NOT NULL,
  `chunk_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `article_id`(`article_id` ASC) USING BTREE,
  CONSTRAINT `article_vectors_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 35 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of article_vectors
-- ----------------------------

-- ----------------------------
-- Table structure for articles
-- ----------------------------
DROP TABLE IF EXISTS `articles`;
CREATE TABLE `articles`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `slug` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `cover` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` enum('draft','published','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'draft',
  `author_id` int(11) NOT NULL,
  `category_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `view_count` int(11) NULL DEFAULT 0,
  `like_count` int(11) NULL DEFAULT 0,
  `is_ai_generated` tinyint(1) NULL DEFAULT 0,
  `published_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT NULL,
  `updated_at` datetime NULL DEFAULT NULL,
  `content_type` enum('html','markdown') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'html',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `slug`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_2`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_3`(`slug` ASC) USING BTREE,
  INDEX `author_id`(`author_id` ASC) USING BTREE,
  INDEX `category_id`(`category_id` ASC) USING BTREE,
  CONSTRAINT `articles_ibfk_11` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `articles_ibfk_12` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of articles
-- ----------------------------
INSERT INTO `articles` VALUES ('4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', '深入 NodeJS 开发：构建高效异步后端的核心指南', '-nodejs-', '<p>在当前的云计算与后端开发领域，NodeJS 凭借其独特的单线程事件驱动模型，始终占据着不可忽视的生态位。许多开发者初入门时，往往会被其非阻塞 I/O 的特性所吸引，但在实际项目中，如何真正驾驭 NodeJS 的核心能力，往往是决定项目成败的关键。</p><p>本文将深入探讨 NodeJS 开发的底层逻辑与核心实践，从异步编程的本质到性能优化技巧，再到现代开发工具链的整合，希望能为您提供一份清晰、实用的技术参考。</p><h2>一、异步编程的精髓与事件循环</h2><p>NodeJS 的核心优势在于其事件循环机制，这使得它能够高效地处理大量并发请求。理解这一机制，是掌握 NodeJS 开发的第一步。</p><h3>1. 理解事件循环与单线程</h3><p>不同于多语言环境，NodeJS 是<strong>单线程</strong>运行的。这意味着所有的代码执行都在同一个上下文中，任何阻塞操作都可能影响整个服务器的响应速度。然而，事件循环的存在弥补了这一短板，它通过异步非阻塞的方式，让 NodeJS 能够处理海量连接。</p><blockquote>正如 NodeJS 官方所言：NodeJS 的设计哲学是“非阻塞即无阻塞”，这意味着只要不主动阻塞事件循环，性能瓶颈通常是可以被规避的。</blockquote><p>在实际开发中，我们需要深入理解 <strong>微任务与宏任务队列</strong> 的优先级关系，这对于处理异步时序逻辑至关重要。无论是使用回调函数，还是现代的 Promise，亦或是 Async/Await，本质上都是在操作这个事件循环。</p><h3>2. 异步编程的最佳实践</h3><p>随着 ES6 的普及，异步编程的模式发生了巨大变化。现代 NodeJS 开发更推崇使用 <strong>Promise</strong> 和 <strong>Async/Await</strong> 语法糖，它们让异步代码看起来像同步代码一样清晰。</p><ul><li><strong>避免回调地狱：</strong> 过多的嵌套回调函数会让代码难以维护，使用 Promise 链式调用可以有效解决这一问题。</li><li><strong>错误处理：</strong> 在异步操作中，错误处理机制往往被忽视。务必在 Promise 的 <strong>then</strong> 和 <strong>catch</strong> 中做好异常捕获，防止未捕获的异常导致进程崩溃。</li><li><strong>并发控制：</strong> 虽然 NodeJS 是单线程，但通过并发执行非阻塞 I/O 操作，我们可以在同一时刻处理多个任务，无需等待。</li></ul><h2>二、性能优化技巧与内存管理</h2><p>性能优化是 NodeJS 开发中经常被提及的话题，尤其是在处理高并发场景时。合理的内存管理和高效的 I/O 操作能显著提升应用的可扩展性。</p><h3>1. 内存泄漏的预防</h3><p>NodeJS 内存泄漏往往是性能下降的隐形杀手。开发者需要关注全局对象和闭包中未释放的引用，这些对象会占用内存直到进程退出。</p><blockquote>在 process.memoryUsage() 中，我们可以实时查看当前进程的 RSS 和 Heap 使用情况，这有助于在开发环境中提前发现潜在的泄漏点。</blockquote><p>对于大型数据处理，建议将内存占用控制在合理范围内，避免一次性加载所有数据到内存中。使用流（Stream）来处理大数据是 NodeJS 的强项。</p><h3>2. 流处理与缓冲</h3><p>在文件读写和网络传输场景下，流操作能极大提升效率。NodeJS 的 <strong>ReadableStream</strong> 和 <strong>WritableStream</strong> 允许数据分块传输，避免了一次性传输带来的内存压力。</p><p style=\"text-align: center;\">流式处理就像一条流水线，数据进来，经过处理，再流出去，中间状态始终保持最小化。</p><p>此外，对于同步阻塞操作，如文件解析或正则匹配，应尽量避免在异步回调中执行，这会导致事件循环暂停。</p><h2>三、生态工具链与工程化</h2><p>NodeJS 的强大不仅在于核心运行时，更在于其丰富的生态系统。选择合适的框架和工具，能大幅降低开发成本。</p><h3>1. 主流框架选择</h3><p>无论是轻量级的 <strong>Express</strong>，还是全功能架构的 <strong>NestJS</strong>，亦或是基于云原生设计的 <strong>Koa</strong>，不同场景下的选型策略各有不同。</p><ol><li><strong>Express：</strong> 适合快速开发中小型项目，灵活度高，学习曲线平缓。</li><li><strong>NestJS：</strong> 适合大型企业级项目，基于 TypeScript，结构严谨，自带依赖注入机制。</li><li><strong>Koa：</strong> 轻量级中间件驱动，适合对性能有极致要求的场景。</li></ol><h3>2. 开发规范与质量工具</h3><p>随着项目规模扩大，代码规范和质量检查变得尤为重要。ESLint 和 Prettier 是代码风格统一的标配，而 Jest 或 Mocha 则是单元测试的利器。</p><p>使用 <strong>CI/CD</strong> 工具如 GitHub Actions 或 GitLab CI，可以自动化构建、测试和部署流程，确保代码交付的一致性。</p><h2>总结与展望</h2><p>NodeJS 开发虽然看似简单，实则涵盖了从底层原理到上层架构的众多知识点。掌握事件循环、优化内存管理、善用生态工具，是成为一名资深 NodeJS 开发者的必经之路。</p><p>未来，随着云原生和边缘计算的普及，NodeJS 的应用场景将更加广泛。保持对新技术的敏感度，持续学习，才能在 NodeJS 开发的浪潮中保持竞争力。</p>', '本文深入探讨了Node.js开发的底层逻辑与核心实践。重点介绍了事件循环机制、异步编程的精髓、性能优化技巧以及内存管理方法。此外，还涵盖了主流框架的选择和开发规范质量工具的使用，强调掌握这些知识点对成为一名资深Node.js开发者的重要性。随着云计算和边缘计算的普及，Node.js的应用前景广阔，持续学习和适应新技术是关键。', '/uploads/7d8828b31cfd46b384092090d2ca60c0.png', 'published', 1, 'd4ab7a65-dd8a-405f-afb5-4261de256b94', 58, 2, 0, '2026-05-20 02:44:05', '2026-05-18 12:01:59', '2026-05-21 03:30:38', 'html');
INSERT INTO `articles` VALUES ('6e0a83add5514b9a868508b04381a9f1', 'Go语言之美', 'go', '\n## 引言段落😂\n\n在这个数字化时代，编程语言的选择往往决定了开发者的工作效率和项目的未来。Go语言，也被称为Golang，自从2009年由Google推出以来，就以其简洁、高效的特点迅速赢得了开发者们的青睐。本文将带您探索Go语言的魅力所在。\n\n```go\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Hello, Go!\")\n\n    // 并发示例：启动一个 Goroutine\n    go func() {\n        fmt.Println(\"Running in background\")\n    }()\n\n    // 等待输入，防止主程序立刻退出（实际中会用 sync.WaitGroup）\n    fmt.Scanln()\n}\n```\n\n## 正文\n\n### Go语言的简洁性\n\n**什么是简洁性？** 简洁性不仅仅是一种代码风格，更是一种哲学。Go语言的设计者们深知这一点，因此Go语言的核心原则之一就是简洁。\n\n- **语法简单**：Go语言的语法接近英语，易于学习和使用。\n- **标准库丰富**：Go的标准库涵盖了从网络编程到并发处理的各种功能，开发者可以快速构建应用程序。\n\n### Go语言的性能\n\n在性能方面，Go语言同样表现出色。它的编译器和运行时都是用C语言编写的，因此能够提供高效的执行速度。\n\n- **编译型语言**：Go语言是编译型语言，编译后的程序可以直接运行在目标机器上。\n- **垃圾回收机制**：Go语言的垃圾回收机制可以自动管理内存，提高开发效率。\n\n### Go语言的并发性\n\nGo语言最引人注目的特点之一是其强大的并发支持。通过goroutine和channel，开发者可以轻松地编写出高效的并发程序。\n\n- **goroutine**：轻量级线程，可以在同一进程中并行运行多个任务。\n- **channel**：用于在goroutine之间通信的管道。\n\n### Go语言的生态系统\n\nGo语言的生态系统也非常丰富，拥有大量的第三方库和框架，可以帮助开发者快速开发各种应用程序。\n\n- **GitHub**：Go语言在GitHub上拥有庞大的社区，许多优秀的开源项目都是用Go语言编写的。\n- **Docker**：Go语言是Docker容器技术的核心技术之一。\n\n## 总结结论\n\nGo语言以其简洁、高效、并发性强等特点，成为了现代编程语言中的一颗璀璨明珠。无论是Web开发、系统编程还是分布式计算，Go语言都能够提供强大的支持。对于追求高性能和开发效率的开发者来说，Go语言无疑是一个值得选择的语言。', '本文探讨了Go语言的魅力所在。Go语言以其简洁的语法、丰富的标准库和高效的性能赢得了开发者青睐。它作为编译型语言，具备垃圾回收机制，并能通过goroutine和channel实现强大的并发支持。同时，Go语言拥有庞大的社区支持和生态系统，适合Web开发、系统编程和分布式计算等多种场景。对于追求高效开发的程序员而言，Go语言是理想的选择。', 'https://ark-content-generation-v2-cn-beijing.tos-cn-beijing.volces.com/doubao-seedream-4-5/02177933907218886599b1c0b236750c2ee79774ecf16d3d6356d_0.jpeg?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260521%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260521T045120Z&X-Tos-Expires=86400&X-Tos-Signature=ce4170ee9b8e194067b148105f0b2182999de39edab66b917fcb24571a3c8b74&X-Tos-SignedHeaders=host', 'published', 1, 'a3286e9f9ca142f8973a32eabc46773b', 6, 0, 0, '2026-05-21 04:51:31', '2026-05-21 00:33:58', '2026-05-21 04:51:31', 'markdown');
INSERT INTO `articles` VALUES ('f96e8100b5c746a3871848f1427a8800', 'Spring Boot 开发概述', 'spring-boot-', '<p><br></p><p> Spring Boot 是一个开源的 Java-based 平台，它旨在简化开发、测试和部署应用程序的过程。本文将为您介绍 Spring Boot 的基本概念、优势以及如何在项目中使用它。<br> &nbsp; &nbsp;</p><h2>一、引言</h2><p>随着互联网技术的发展，Java 语言在企业级应用开发领域一直占据重要地位。然而，传统的 Java 应用程序开发涉及到繁琐的配置工作，增加了开发成本和难度。Spring Boot 应运而生，它简化了 Spring 应用的创建和部署流程。<br> &nbsp; &nbsp;</p><h2>二、Spring Boot 的优势</h2><h3>1. 自动配置</h3><p><br> &nbsp; &nbsp; &nbsp; &nbsp;Spring Boot 通过自动配置来减少开发者的配置代码量。当 Spring Boot 应用启动时，它会根据添加的依赖和类路径信息自动配置 Bean。<br> &nbsp; &nbsp;</p><h3>2. 简化构建过程</h3><p><br> &nbsp; &nbsp; &nbsp; &nbsp;Spring Boot 使用 Maven 或 Gradle 作为构建工具，简化了项目的构建过程。开发者只需添加必要的依赖项即可快速启动项目。<br> &nbsp; &nbsp;</p><h3>3. 提供生产就绪特性</h3><p><br> &nbsp; &nbsp; &nbsp; &nbsp;Spring Boot 为生产环境提供了一系列的默认配置，如内嵌服务器、安全性配置等，使得应用程序能够快速部署到生产环境中。<br> &nbsp; &nbsp;</p><h2>三、Spring Boot 的使用</h2><h3>1. 创建 Spring Boot 项目</h3><ol><li>访问 Spring Initializr（ <a href=\"https://start.spring.io/\" target=\"_blank\">https://start.spring.io/</a> ），选择所需的依赖项和项目结构。<br> &nbsp; &nbsp; &nbsp; &nbsp;</li><li>下载生成的 zip 文件，解压后导入到 IDE 中。<br> &nbsp; &nbsp; &nbsp; &nbsp;</li><li>在项目中创建一个主类，并添加 @SpringBootApplication 注解作为项目的入口点。<br></li></ol><h3>2. 编写业务代码</h3><p>在 Spring Boot 项目中，您可以像在常规 Spring 应用程序中一样编写业务代码。使用注解如 @RestController 和 @RequestMapping 来创建 RESTful 风格的 API。<br> &nbsp; &nbsp;</p><h2>四、总结</h2><p>Spring Boot 是一个强大的工具，它简化了 Java 应用的开发过程。通过本文的介绍，您应该对 Spring Boot 有了一个基本的了解。希望它能帮助您在未来的项目中提高开发效率。<br> &nbsp; &nbsp;</p>', 'Spring Boot是一个旨在简化Java应用开发的平台，具有自动配置、构建过程简化和生产就绪特性等优势。文章介绍了如何在Spring Initializr创建项目，编写业务代码，并强调了其高效性。', '/uploads/8e943d6809364074a628900329fa4cf1.jpg', 'published', 1, '2', 69, 0, 0, '2026-05-21 04:25:24', '2026-05-19 07:23:05', '2026-05-21 04:25:24', 'html');

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `slug` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_2`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_2`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_3`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_3`(`slug` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` VALUES ('1', '测试', '测试', '');
INSERT INTO `categories` VALUES ('2', 'Java开发', 'java开发', '');
INSERT INTO `categories` VALUES ('a3286e9f9ca142f8973a32eabc46773b', 'Go语言', 'go', '');
INSERT INTO `categories` VALUES ('d4ab7a65-dd8a-405f-afb5-4261de256b94', '后端开发', '后端开发', '');

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `article_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `user_id` int(11) NULL DEFAULT NULL,
  `parent_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `author_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `author_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `avatar` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `content_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'text',
  `is_ai_reply` tinyint(1) NULL DEFAULT 0,
  `is_approved` tinyint(1) NULL DEFAULT 1,
  `like_count` int(11) NULL DEFAULT 0,
  `created_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `article_id`(`article_id` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `parent_id`(`parent_id` ASC) USING BTREE,
  CONSTRAINT `comments_ibfk_13` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_14` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_15` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of comments
-- ----------------------------
INSERT INTO `comments` VALUES ('2f78d6183ec149a19cb490258d06ab9a', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', NULL, NULL, '85485748', '85485748@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=TtPB6OicYHkflMlpRL3uyDA&s=640&t=0', '呜呜呜', 'markdown', 0, 1, 1, '2026-05-20 00:53:17');
INSERT INTO `comments` VALUES ('30585fb6957f4fd59ed208227f7afe64', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', NULL, 'b053b9fffa714f7dbf61faa31fd00117', 'AI回复', '2906594394@qq.com', NULL, '哈哈，谢谢你的点赞！看到你这么有活力地支持我的文章，我也感到很欣慰呢~ 如果你对Node.js开发有任何疑问或者想要进一步探讨的话题，随时欢迎来交流哦！😊', 'markdown', 1, 1, 0, '2026-05-21 03:45:01');
INSERT INTO `comments` VALUES ('3f97f00335ca4da78b5e53c99da77280', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', NULL, NULL, 'e', '2568863244@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=oGCIhQ81tiaiajKMDTXVMRCQ&kti=ZM4VJAAAAAE&s=640&t=1686582209', '嘻嘻嘻', 'markdown', 0, 1, 0, '2026-05-20 07:12:50');
INSERT INTO `comments` VALUES ('766cf41af693420ea6f6049f98977f6f', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', NULL, NULL, 'QQ用户_2906594394', '2906594394@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=KoDV084gERv5k3rP8aEj1g&kti=aT_mihHyHcE&s=640&t=1681581854', '> hello Word', 'markdown', 0, 1, 0, '2026-05-20 00:46:51');
INSERT INTO `comments` VALUES ('b053b9fffa714f7dbf61faa31fd00117', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', NULL, '766cf41af693420ea6f6049f98977f6f', 'QQ用户_2906594394', '2906594394@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=KoDV084gERv5k3rP8aEj1g&kti=aT_mihHyHcE&s=640&t=1681581854', '哈哈哈', 'markdown', 0, 1, 0, '2026-05-20 00:47:44');
INSERT INTO `comments` VALUES ('b1df1fa1fa9949c39f864dfcefd863b1', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', NULL, '2f78d6183ec149a19cb490258d06ab9a', 'QQ用户_2906594394', '2906594394@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=KoDV084gERv5k3rP8aEj1g&kti=aT_mihHyHcE&s=640&t=1681581854', '2026年5月20日 13:15:17', 'markdown', 0, 1, 0, '2026-05-20 05:15:28');
INSERT INTO `comments` VALUES ('ea9ec8e8510d4b24a5ff95b2d3bf5d84', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', 1, '2f78d6183ec149a19cb490258d06ab9a', 'admin', '2906594394@qq.com', NULL, '哎呀，亲爱的朋友，别难过呀！如果你有任何关于Node.js开发的问题或者想要分享的感受，都可以告诉我哦。我在这里随时愿意帮助你！😊🌟', 'markdown', 0, 1, 0, '2026-05-21 01:04:53');
INSERT INTO `comments` VALUES ('fabfec2be42345fbb4717ac8da36527d', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', NULL, '3f97f00335ca4da78b5e53c99da77280', 'AI回复', '2906594394@qq.com', NULL, '哈哈，很高兴您喜欢这篇文章！如果有什么疑问或者想分享的，随时告诉我哦，我会尽力帮助您的。期待与您的互动！🌟', 'text', 1, 1, 0, '2026-05-20 12:41:03');

-- ----------------------------
-- Table structure for tags
-- ----------------------------
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `slug` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_2`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_2`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_3`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_3`(`slug` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tags
-- ----------------------------
INSERT INTO `tags` VALUES ('0009b913-91ea-4e84-8b5a-0fc5a6db9ac8', '后端开发', '后端开发');
INSERT INTO `tags` VALUES ('1', 'Vue3', 'vue3');
INSERT INTO `tags` VALUES ('13', '微服务', '微服务');
INSERT INTO `tags` VALUES ('14', 'Spring Boot', 'spring-boot');
INSERT INTO `tags` VALUES ('15', 'Java后端', 'java后端');
INSERT INTO `tags` VALUES ('16', '云原生', '云原生');
INSERT INTO `tags` VALUES ('3', 'TypeScript', 'typescript');
INSERT INTO `tags` VALUES ('3289c843623544a1ac92985d5b805de7', 'Go语言', 'go语言');
INSERT INTO `tags` VALUES ('3ab0e8e898324ce58e58f4fd2de9ac66', '并发', '并发');
INSERT INTO `tags` VALUES ('484b4f48-4d7f-4f8c-bf41-9f833860cc9b', '异步编程', '异步编程');
INSERT INTO `tags` VALUES ('5', 'AI', 'ai');
INSERT INTO `tags` VALUES ('526c7e8736a3411ba78a6048f2bf2f44', '性能', '性能');
INSERT INTO `tags` VALUES ('5dbfe7eb-89e1-4d18-a307-579e52708a9b', '性能优化', '性能优化');
INSERT INTO `tags` VALUES ('7', 'web开发', 'web开发');
INSERT INTO `tags` VALUES ('75647e55-0ccb-4844-a25e-3d8064f4de6e', '云计算', '云计算');
INSERT INTO `tags` VALUES ('9', 'GLM5.1', 'glm51');
INSERT INTO `tags` VALUES ('aa10c9139ede4aaeafef38fe65508412', 'Java 开发', 'java-开发');
INSERT INTO `tags` VALUES ('aabbc09cf0144cdd82176bf157a687b3', '编程', '编程');
INSERT INTO `tags` VALUES ('d58a6c36-a842-43fc-91bd-4f7fa1583edd', 'NodeJS', 'nodejs');
INSERT INTO `tags` VALUES ('eb5750ef7ddb4293aeb5aa15b4474fac', '简洁性', '简洁性');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '昵称',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `avatar` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `role` enum('admin','author','user') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'user',
  `created_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_2`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_2`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_3`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_3`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, '小熙', 'admin', '2906594394@qq.com', '$2a$10$Za4QR5RZ7zlom8gQ.8yKReuIYkDsxLTVAAiE46vv0aElN942g9gJq', '/uploads/6.jpg', 'admin', '2026-05-21 09:08:06');

-- ----------------------------
-- Table structure for visitor_logs
-- ----------------------------
DROP TABLE IF EXISTS `visitor_logs`;
CREATE TABLE `visitor_logs`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `article_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `user_agent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `article_id`(`article_id` ASC) USING BTREE,
  CONSTRAINT `visitor_logs_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of visitor_logs
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
