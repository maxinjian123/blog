/*
 Navicat Premium Dump SQL

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80046 (8.0.46)
 Source Host           : localhost:3306
 Source Schema         : blog

 Target Server Type    : MySQL
 Target Server Version : 80046 (8.0.46)
 File Encoding         : 65001

 Date: 02/08/2026 23:12:17
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for announcements
-- ----------------------------
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '公告内容',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用（1是 0否）',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序（越靠前先使用哪个）',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '公告表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of announcements
-- ----------------------------
INSERT INTO `announcements` VALUES (1, '哈哈哈哈哈哈哈', 1, 1, '2026-05-19 07:17:51', '2026-07-29 04:27:56');
INSERT INTO `announcements` VALUES (2, '这是一条评论', 0, 2, '2026-05-19 07:17:59', '2026-07-29 04:27:51');

-- ----------------------------
-- Table structure for article_tags
-- ----------------------------
DROP TABLE IF EXISTS `article_tags`;
CREATE TABLE `article_tags`  (
  `article_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文章id',
  `tag_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标签id',
  PRIMARY KEY (`article_id`, `tag_id`) USING BTREE,
  INDEX `tag_id`(`tag_id` ASC) USING BTREE,
  CONSTRAINT `article_tags_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `article_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文章-标签关联表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of article_tags
-- ----------------------------
INSERT INTO `article_tags` VALUES ('4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', '0009b913-91ea-4e84-8b5a-0fc5a6db9ac8');
INSERT INTO `article_tags` VALUES ('8aa8821ecd3c43b1ba5eaa08a57a76bf', '0410dc644aed4efc915eb2679ba6bab0');
INSERT INTO `article_tags` VALUES ('3ce7d5b12fb84061bc20dd27df9b432e', '1');
INSERT INTO `article_tags` VALUES ('950ff22260a04c9692b84daa7b070a49', '1');
INSERT INTO `article_tags` VALUES ('f96e8100b5c746a3871848f1427a8800', '14');
INSERT INTO `article_tags` VALUES ('8aa8821ecd3c43b1ba5eaa08a57a76bf', '1f09da0619fa4c07b43aa361c7ca0a03');
INSERT INTO `article_tags` VALUES ('bcd7dc113f6c49019b79ff0e677f9f35', '23a52a7081f2499b8da52f0be5428321');
INSERT INTO `article_tags` VALUES ('3ce7d5b12fb84061bc20dd27df9b432e', '3');
INSERT INTO `article_tags` VALUES ('6e0a83add5514b9a868508b04381a9f1', '3289c843623544a1ac92985d5b805de7');
INSERT INTO `article_tags` VALUES ('6e0a83add5514b9a868508b04381a9f1', '3ab0e8e898324ce58e58f4fd2de9ac66');
INSERT INTO `article_tags` VALUES ('3ce7d5b12fb84061bc20dd27df9b432e', '4749b8b3757b49798db7f0c42b0dc30c');
INSERT INTO `article_tags` VALUES ('4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', '484b4f48-4d7f-4f8c-bf41-9f833860cc9b');
INSERT INTO `article_tags` VALUES ('2e4441d2233f456a8ed3947e65776a0b', '5');
INSERT INTO `article_tags` VALUES ('30162c8ec03f4bf38520b0505d1f4f6c', '5');
INSERT INTO `article_tags` VALUES ('9083775b9add481eab7c10ea2224bcf3', '5');
INSERT INTO `article_tags` VALUES ('6e0a83add5514b9a868508b04381a9f1', '526c7e8736a3411ba78a6048f2bf2f44');
INSERT INTO `article_tags` VALUES ('4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', '5dbfe7eb-89e1-4d18-a307-579e52708a9b');
INSERT INTO `article_tags` VALUES ('bcd7dc113f6c49019b79ff0e677f9f35', '6b8b716c63da4c269a126a2e3b180621');
INSERT INTO `article_tags` VALUES ('950ff22260a04c9692b84daa7b070a49', '7f48f3c5022a4cef9c22f7c2f283a5bf');
INSERT INTO `article_tags` VALUES ('2e4441d2233f456a8ed3947e65776a0b', '8eb40e39591f40d2af365a13883f253c');
INSERT INTO `article_tags` VALUES ('30162c8ec03f4bf38520b0505d1f4f6c', '8eb40e39591f40d2af365a13883f253c');
INSERT INTO `article_tags` VALUES ('bcd7dc113f6c49019b79ff0e677f9f35', 'a7d9f7ad8c3642c1a34b3865235a996d');
INSERT INTO `article_tags` VALUES ('f96e8100b5c746a3871848f1427a8800', 'aa10c9139ede4aaeafef38fe65508412');
INSERT INTO `article_tags` VALUES ('6e0a83add5514b9a868508b04381a9f1', 'aabbc09cf0144cdd82176bf157a687b3');
INSERT INTO `article_tags` VALUES ('30162c8ec03f4bf38520b0505d1f4f6c', 'c12d4e0be38b48f8ac4791df6084e81c');
INSERT INTO `article_tags` VALUES ('4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', 'd58a6c36-a842-43fc-91bd-4f7fa1583edd');
INSERT INTO `article_tags` VALUES ('2e4441d2233f456a8ed3947e65776a0b', 'db4abadd762e42689229b2a0d19203ae');
INSERT INTO `article_tags` VALUES ('30162c8ec03f4bf38520b0505d1f4f6c', 'db4abadd762e42689229b2a0d19203ae');
INSERT INTO `article_tags` VALUES ('8aa8821ecd3c43b1ba5eaa08a57a76bf', 'db54e583f7f248e3bef570dc960e121b');
INSERT INTO `article_tags` VALUES ('950ff22260a04c9692b84daa7b070a49', 'ed6a1dfc9c6a41629841ce4795a61e64');
INSERT INTO `article_tags` VALUES ('3ce7d5b12fb84061bc20dd27df9b432e', 'efc4c4d44ea04ac38be8af9a0ffb99ab');
INSERT INTO `article_tags` VALUES ('bcd7dc113f6c49019b79ff0e677f9f35', 'f0c1c6e5e8db4879b9c6e836b87d5921');
INSERT INTO `article_tags` VALUES ('8aa8821ecd3c43b1ba5eaa08a57a76bf', 'f19f9321b84c461385b89c8ed574afed');
INSERT INTO `article_tags` VALUES ('2e4441d2233f456a8ed3947e65776a0b', 'f3c35ad2589a41348d9962df822e8d0c');
INSERT INTO `article_tags` VALUES ('950ff22260a04c9692b84daa7b070a49', 'fbdf625fbd95469caadb5df851a9ad08');

-- ----------------------------
-- Table structure for article_vectors
-- ----------------------------
DROP TABLE IF EXISTS `article_vectors`;
CREATE TABLE `article_vectors`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `article_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文章id',
  `embedding` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '向量值',
  `chunk_index` int NOT NULL COMMENT '切割块索引',
  `chunk_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '切割文本',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `article_id`(`article_id` ASC) USING BTREE,
  CONSTRAINT `article_vectors_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 35 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文章向量表（废弃）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of article_vectors
-- ----------------------------

-- ----------------------------
-- Table structure for article_versions
-- ----------------------------
DROP TABLE IF EXISTS `article_versions`;
CREATE TABLE `article_versions`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '自增id',
  `article_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文章id',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文章标题',
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文章内容',
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '文章摘要',
  `cover` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '封面图',
  `category_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分类id',
  `content_type` enum('html','markdown') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'markdown' COMMENT '文章类型',
  `catalog` json NULL COMMENT '文章目录（markdown语法才生效）',
  `version_note` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '版本说明',
  `created_by` int NULL DEFAULT NULL COMMENT '创建者',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建日期',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日期',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_article_id`(`article_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '文章历史版本表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of article_versions
-- ----------------------------

-- ----------------------------
-- Table structure for articles
-- ----------------------------
DROP TABLE IF EXISTS `articles`;
CREATE TABLE `articles`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文章标题',
  `slug` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '别名',
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文章内容',
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '文章摘要',
  `cover` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '文章封面图',
  `status` enum('draft','published','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'draft' COMMENT '文章状态（\'draft\',\'published\',\'archived\'）',
  `author_id` int NOT NULL COMMENT '作者id',
  `category_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '分类id',
  `view_count` int NULL DEFAULT 0 COMMENT '浏览量',
  `like_count` int NULL DEFAULT 0 COMMENT '点赞量',
  `is_ai_generated` tinyint(1) NULL DEFAULT 0 COMMENT '是否AI生成',
  `published_at` datetime NULL DEFAULT NULL COMMENT '发布时间',
  `scheduled_at` datetime NULL DEFAULT NULL COMMENT '定时发布时间（到点自动将 status 从 draft 改为 published）',
  `created_at` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT NULL COMMENT '更新时间',
  `content_type` enum('html','markdown') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'html' COMMENT '内容类型',
  `catalog` json NULL COMMENT '文章目录',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `slug`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_2`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_3`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_4`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `articles_slug`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_5`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_6`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_7`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_8`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_9`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_10`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_11`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_12`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_13`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_14`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_15`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_16`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_17`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_18`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_19`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_20`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_21`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_22`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_23`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_24`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_25`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_26`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_27`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_28`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_29`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_30`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `slug_31`(`slug` ASC) USING BTREE,
  INDEX `author_id`(`author_id` ASC) USING BTREE,
  INDEX `category_id`(`category_id` ASC) USING BTREE,
  INDEX `articles_status`(`status` ASC) USING BTREE,
  INDEX `articles_category_id`(`category_id` ASC) USING BTREE,
  INDEX `articles_author_id`(`author_id` ASC) USING BTREE,
  INDEX `articles_published_at`(`published_at` ASC) USING BTREE,
  CONSTRAINT `articles_ibfk_67` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `articles_ibfk_68` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文章表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of articles
-- ----------------------------
INSERT INTO `articles` VALUES ('2e4441d2233f456a8ed3947e65776a0b', 'Browser Use：让 AI Agent 操控浏览器的工程化方案', 'browser-use-ai-agent', '# Browser Use：让 AI Agent 操控浏览器的工程化方案\n\n> 本文基于 [browser-use/browser-use](https://github.com/browser-use/browser-use)（⭐ 107k+）源码剖析。\n\n## 引言\n\nBrowser Use 是 2024 年底爆火的项目，让 LLM 能够像人一样操控浏览器：点击、输入、滚动、截图。它打通了 AI 与真实 Web 世界的最后一公里。\n\n## 一、整体架构\n\n```\n┌─────────────┐     ┌──────────────┐     ┌─────────────┐\n│   LLM       │────▶│  Agent Loop  │────▶│  Browser    │\n│ (决策大脑)   │◀────│  (动作调度)   │◀────│ (Playwright)│\n└─────────────┘     └──────────────┘     └─────────────┘\n                           │\n                           ▼\n                    ┌──────────────┐\n                    │ DOM/截图      │\n                    │ (状态感知)    │\n                    └──────────────┘\n```\n\n核心循环：\n1. **状态感知**：提取 DOM + 截图\n2. **LLM 决策**：根据当前状态输出下一个动作\n3. **动作执行**：Playwright 执行点击/输入等\n4. **循环**：直到任务完成或达到步数上限\n\n## 二、DOM 提取的精妙设计\n\n直接把整个 HTML 喂给 LLM 不现实（太长）。Browser Use 的做法：\n\n```python\ndef extract_dom(self):\n    # 1. 注入 JS，遍历所有可交互元素\n    elements = self.page.evaluate(\'\'\'\n        () => {\n            const items = []\n            document.querySelectorAll(\n                \'a, button, input, select, textarea, [role=\"button\"]\'\n            ).forEach((el, i) => {\n                el.setAttribute(\'browser-use-id\', i)\n                items.push({\n                    id: i,\n                    tag: el.tagName,\n                    text: el.innerText.slice(0, 100),\n                    attrs: {...}\n                })\n            })\n            return items\n        }\n    \'\'\')\n    # 2. 给每个元素打索引标记\n    # 3. 只返回精简后的元素列表给 LLM\n    return elements\n```\n\n关键点：\n- **索引化**：每个可交互元素打 `browser-use-id`\n- **精简化**：只保留 tag + 文本 + 关键属性\n- **视觉辅助**：配合截图让 LLM 看到布局\n\n## 三、动作执行\n\n```python\ndef execute_action(self, action: str, params: dict):\n    if action == \'click\':\n        # 通过索引定位元素\n        self.page.click(f\'[browser-use-id=\"{params[\"index\"]}\"]\')\n    elif action == \'type\':\n        self.page.fill(f\'[browser-use-id=\"{params[\"index\"]}\"]\', params[\'text\'])\n    elif action == \'scroll\':\n        self.page.mouse.wheel(0, params[\'delta\'])\n    elif action == \'screenshot\':\n        return self.page.screenshot()\n```\n\nLLM 输出 JSON 格式的动作指令，Agent 解析后调用 Playwright。\n\n## 四、任务完成的判定\n\n```python\ndef is_task_complete(self, llm_response):\n    # LLM 在完成时输出特殊标记\n    return llm_response.get(\'action\') == \'done\' and \'result\' in llm_response\n\n# 防止无限循环\nMAX_STEPS = 50\nfor step in range(MAX_STEPS):\n    state = self.get_state()\n    action = self.llm.decide(state)\n    if self.is_task_complete(action):\n        return action[\'result\']\n    self.execute_action(action[\'action\'], action[\'params\'])\n```\n\n## 总结\n\nBrowser Use 的工程化启示：\n1. **状态压缩**：DOM 索引化让 LLM 能\"看懂\"页面\n2. **视觉+结构**：截图 + DOM 双通道，互补\n3. **有限动作集**：click/type/scroll/done，降低 LLM 决策难度\n4. **步数上限**：防止无限循环，工程必备\n\n[browser-use/browser-use](https://github.com/browser-use/browser-use) 是 AI Agent 落地 Web 的最佳实践。', '基于 browser-use/browser-use 源码，剖析 LLM 如何通过 DOM 提取、视觉理解、动作执行三步操控浏览器。', '', 'draft', 1, 'd4ab7a65-dd8a-405f-afb5-4261de256b94', 8, 0, 0, '2026-07-28 10:49:51', NULL, '2026-07-28 10:49:51', '2026-08-02 12:00:37', 'markdown', '[{\"line\": 0, \"text\": \"Browser Use：让 AI Agent 操控浏览器的工程化方案\", \"level\": 1, \"nextToken\": {\"map\": [0, 1], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"0\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"Browser Use：让 AI Agent 操控浏览器的工程化方案\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"Browser Use：让 AI Agent 操控浏览器的工程化方案\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [0, 1], \"tag\": \"h1\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"0\"], [\"id\", \"Browser Use：让 AI Agent 操控浏览器的工程化方案\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"#\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 4, \"text\": \"引言\", \"level\": 2, \"nextToken\": {\"map\": [4, 5], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"4\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"引言\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"引言\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [4, 5], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"4\"], [\"id\", \"引言\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 8, \"text\": \"一、整体架构\", \"level\": 2, \"nextToken\": {\"map\": [8, 9], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"8\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"一、整体架构\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"一、整体架构\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [8, 9], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"8\"], [\"id\", \"一、整体架构\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 29, \"text\": \"二、DOM 提取的精妙设计\", \"level\": 2, \"nextToken\": {\"map\": [29, 30], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"29\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"二、DOM 提取的精妙设计\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"二、DOM 提取的精妙设计\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [29, 30], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"29\"], [\"id\", \"二、DOM 提取的精妙设计\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 63, \"text\": \"三、动作执行\", \"level\": 2, \"nextToken\": {\"map\": [63, 64], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"63\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"三、动作执行\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"三、动作执行\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [63, 64], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"63\"], [\"id\", \"三、动作执行\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 80, \"text\": \"四、任务完成的判定\", \"level\": 2, \"nextToken\": {\"map\": [80, 81], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"80\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"四、任务完成的判定\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"四、任务完成的判定\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [80, 81], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"80\"], [\"id\", \"四、任务完成的判定\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 97, \"text\": \"总结\", \"level\": 2, \"nextToken\": {\"map\": [97, 98], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"97\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"总结\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"总结\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [97, 98], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"97\"], [\"id\", \"总结\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}]');
INSERT INTO `articles` VALUES ('30162c8ec03f4bf38520b0505d1f4f6c', 'LangChain Agent 工程化实践：从 ReAct 到 Tool Use', 'langchain-agent-practice', '# LangChain Agent 工程化实践：从 ReAct 到 Tool Use\n\n> 本文基于 [langchain-ai/langchain](https://github.com/langchain-ai/langchain)（⭐ 142k+）源码，剖析 Agent 工程化。\n\n## 引言\n\nLLM Agent 是 2024-2026 年最热的 AI 工程方向。LangChain 作为生态最完整的框架，其 Agent 实现经历了 ReAct → OpenAI Functions → Tool Calling 三代演进。本文将剖析其核心机制。\n\n## 一、ReAct：推理与行动的循环\n\nReAct（Reasoning + Acting）的核心是让 LLM 在\"思考\"和\"行动\"之间交替：\n\n```text\nThought: 我需要搜索天气\nAction: search_weather\nAction Input: {\"city\": \"北京\"}\nObservation: 北京今天 25℃，晴\nThought: 我现在知道答案了\nFinal Answer: 北京今天 25℃，晴朗。\n```\n\nLangChain 的实现：\n\n```python\nclass ReActAgent:\n    def __init__(self, llm, tools):\n        self.llm = llm\n        self.tools = {t.name: t for t in tools}\n    \n    def step(self, input):\n        # 1. 构造 prompt 让 LLM 输出 Thought/Action\n        response = self.llm.predict(self.prompt(input))\n        # 2. 解析出 Action 和 Action Input\n        action, action_input = self.parse(response)\n        # 3. 执行工具\n        observation = self.tools[action].run(action_input)\n        # 4. 把结果塞回上下文，循环\n        return observation\n    \n    def run(self, query):\n        while not self.is_final():\n            self.step(query)\n```\n\n## 二、Tool Calling：原生工具调用\n\nOpenAI 在 2023 年底推出 Tool Calling，让 LLM 原生输出结构化工具调用，省去了字符串解析：\n\n```python\ntools = [\n    {\n        \"type\": \"function\",\n        \"function\": {\n            \"name\": \"get_weather\",\n            \"description\": \"获取城市天气\",\n            \"parameters\": {\n                \"type\": \"object\",\n                \"properties\": {\n                    \"city\": {\"type\": \"string\"}\n                }\n            }\n        }\n    }\n]\n\nresponse = llm.chat.completions.create(\n    model=\"gpt-4\",\n    messages=[...],\n    tools=tools\n)\n# response.choices[0].message.tool_calls 直接是结构化对象\n```\n\nLangChain 的 `create_tool_calling_agent` 封装了这套机制，自动处理工具调度循环。\n\n## 三、多 Agent 协作\n\nLangGraph（LangChain 的图扩展）支持复杂的多 Agent 编排：\n\n```python\nfrom langgraph.graph import StateGraph\n\ngraph = StateGraph(AgentState)\ngraph.add_node(\"researcher\", researcher_agent)\ngraph.add_node(\"writer\", writer_agent)\ngraph.add_node(\"critic\", critic_agent)\n\ngraph.add_edge(\"researcher\", \"writer\")\ngraph.add_conditional_edges(\"writer\", should_revise, {\n    True: \"critic\",\n    False: END\n})\ngraph.add_edge(\"critic\", \"writer\")  # 修改后再写\n```\n\n## 总结\n\nAgent 工程化的三个关键：\n1. **ReAct 范式**：Thought-Action-Observation 循环，是最通用的 Agent 模型\n2. **Tool Calling**：原生结构化输出，比字符串解析更稳定\n3. **多 Agent 编排**：LangGraph 把 Agent 当作图节点，支持复杂工作流\n\n阅读 [langchain-ai/langchain](https://github.com/langchain-ai/langchain) 源码，是掌握 AI 工程化的捷径。', '基于 langchain-ai/langchain 源码，剖析 LLM Agent 的 ReAct 范式、工具调用、多轮规划的工程实现。', NULL, 'published', 1, 'd4ab7a65-dd8a-405f-afb5-4261de256b94', 8, 0, 0, '2026-07-28 10:49:51', NULL, '2026-07-28 10:49:51', '2026-07-31 15:26:45', 'markdown', '[{\"text\": \"LangChain Agent 工程化实践：从 ReAct 到 Tool Use\", \"level\": 1}, {\"text\": \"引言\", \"level\": 2}, {\"text\": \"一、ReAct：推理与行动的循环\", \"level\": 2}, {\"text\": \"二、Tool Calling：原生工具调用\", \"level\": 2}, {\"text\": \"三、多 Agent 协作\", \"level\": 2}, {\"text\": \"总结\", \"level\": 2}]');
INSERT INTO `articles` VALUES ('3ce7d5b12fb84061bc20dd27df9b432e', 'Vue 3 核心源码解析：响应式系统的设计与实现', 'vue3-reactivity-source', '# Vue 3 核心源码解析：响应式系统的设计与实现\n\n> 本文基于 [vuejs/core](https://github.com/vuejs/core)（⭐ 54k+）源码，剖析 Vue 3 响应式系统的核心实现。\n\n## 引言\n\nVue 3 的响应式系统相比 Vue 2 有了质的飞跃：用 Proxy 替代 Object.defineProperty，支持了数组索引修改、Map/Set 等集合类型，并在性能上通过 lazy 收集减少了不必要的开销。本文将从 reactive、ref、computed 三个核心 API 入手，逐层揭开其设计哲学。\n\n## 一、reactive：Proxy 代理的艺术\n\n```typescript\nfunction reactive<T extends object>(target: T): T {\n  // 如果已经是响应式对象，直接返回\n  if (target[ReactiveFlags.IS_REACTIVE]) return target\n  return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers)\n}\n```\n\n核心在于 `createReactiveObject` 会根据 target 类型选择不同的 handler：\n- 普通对象（Object/Array）：使用 `mutableHandlers`\n- 集合类型（Map/Set/WeakMap/WeakSet）：使用 `mutableCollectionHandlers`\n\n### 依赖收集\n\n当组件 render 函数执行时，访问响应式对象的属性会触发 `get` 拦截器：\n\n```typescript\nget(target, key, receiver) {\n  // 关键：track 收集依赖\n  track(target, key)\n  const res = Reflect.get(target, key, receiver)\n  // 嵌套对象递归代理（lazy）\n  if (isObject(res)) return reactive(res)\n  return res\n}\n```\n\n`track` 会把当前正在执行的 effect（即 render 函数）记录到 targetMap -> keyMap -> dep 的三级结构中。\n\n## 二、ref：单值的优雅包装\n\nref 的存在是因为 Proxy 无法代理原始类型（string/number/boolean）：\n\n```typescript\nclass RefImpl<T> {\n  private _value: T\n  constructor(value: T) {\n    this._value = isObject(value) ? reactive(value) : value\n  }\n  get value() {\n    track(this, \'value\')\n    return this._value\n  }\n  set value(newVal) {\n    if (hasChanged(newVal, this._value)) {\n      this._value = isObject(newVal) ? reactive(newVal) : newVal\n      trigger(this, \'value\')\n    }\n  }\n}\n```\n\n注意：对象类型会被自动转为 reactive，这是 ref 与 reactive 的关键桥梁。\n\n## 三、computed：缓存的智慧\n\ncomputed 本质是一个带缓存标志的 effect：\n\n```typescript\nclass ComputedRefImpl<T> {\n  _dirty = true  // 关键：脏标记\n  _value: T\n  \n  get value() {\n    if (this._dirty) {\n      this._value = this.effect.run()  // 重新计算\n      this._dirty = false\n    }\n    track(this, \'value\')\n    return this._value\n  }\n}\n```\n\n当依赖的响应式数据变化时，trigger 会把 `_dirty` 重置为 true，下次访问才重新计算。这就是\"惰性求值\"的核心。\n\n## 总结\n\nVue 3 响应式系统的精妙之处在于：\n1. **Proxy 替代 defineProperty**：解决了 Vue 2 的诸多限制\n2. **lazy 依赖收集**：访问时才建立依赖关系，避免预扫描开销\n3. **三级 targetMap 结构**：精准定位依赖，最小化触发范围\n4. **computed 脏标记**：实现真正的惰性计算\n\n阅读 [vuejs/core](https://github.com/vuejs/core) 源码是理解现代前端响应式设计的最佳路径。', '深入 Vue 3 core 仓库，剖析 ref/reactive/computed 的依赖收集与触发机制，理解 Proxy 如何取代 defineProperty。', NULL, 'published', 1, 'd4ab7a65-dd8a-405f-afb5-4261de256b94', 5, 0, 0, '2026-07-28 10:49:50', NULL, '2026-07-28 10:49:50', '2026-08-01 08:23:10', 'markdown', '[{\"text\": \"Vue 3 核心源码解析：响应式系统的设计与实现\", \"level\": 1}, {\"text\": \"引言\", \"level\": 2}, {\"text\": \"一、reactive：Proxy 代理的艺术\", \"level\": 2}, {\"text\": \"依赖收集\", \"level\": 3}, {\"text\": \"二、ref：单值的优雅包装\", \"level\": 2}, {\"text\": \"三、computed：缓存的智慧\", \"level\": 2}, {\"text\": \"总结\", \"level\": 2}]');
INSERT INTO `articles` VALUES ('4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', '深入 NodeJS 开发：构建高效异步后端的核心指南', '-nodejs-', '在当前的云计算与后端开发领域，NodeJS 凭借其独特的单线程事件驱动模型，始终占据着不可忽视的生态位。许多开发者初入门时，往往会被其非阻塞 I/O 的特性所吸引，但在实际项目中，如何真正驾驭 NodeJS 的核心能力，往往是决定项目成败的关键。\n\n本文将深入探讨 NodeJS 开发的底层逻辑与核心实践，从异步编程的本质到性能优化技巧，再到现代开发工具链的整合，希望能为您提供一份清晰、实用的技术参考。\n\n## 一、异步编程的精髓与事件循环\n\nNodeJS 的核心优势在于其事件循环机制，这使得它能够高效地处理大量并发请求。理解这一机制，是掌握 NodeJS 开发的第一步。\n\n### 1. 理解事件循环与单线程\n\n不同于多语言环境，NodeJS 是**单线程**运行的。这意味着所有的代码执行都在同一个上下文中，任何阻塞操作都可能影响整个服务器的响应速度。然而，事件循环的存在弥补了这一短板，它通过异步非阻塞的方式，让 NodeJS 能够处理海量连接。\n\n> 正如 NodeJS 官方所言：NodeJS 的设计哲学是“非阻塞即无阻塞”，这意味着只要不主动阻塞事件循环，性能瓶颈通常是可以被规避的。\n\n在实际开发中，我们需要深入理解 **微任务与宏任务队列** 的优先级关系，这对于处理异步时序逻辑至关重要。无论是使用回调函数，还是现代的 Promise，亦或是 Async/Await，本质上都是在操作这个事件循环。\n\n### 2. 异步编程的最佳实践\n\n随着 ES6 的普及，异步编程的模式发生了巨大变化。现代 NodeJS 开发更推崇使用 **Promise** 和 **Async/Await** 语法糖，它们让异步代码看起来像同步代码一样清晰。\n\n- **避免回调地狱：** 过多的嵌套回调函数会让代码难以维护，使用 Promise 链式调用可以有效解决这一问题。\n- **错误处理：** 在异步操作中，错误处理机制往往被忽视。务必在 Promise 的 **then** 和 **catch** 中做好异常捕获，防止未捕获的异常导致进程崩溃。\n- **并发控制：** 虽然 NodeJS 是单线程，但通过并发执行非阻塞 I/O 操作，我们可以在同一时刻处理多个任务，无需等待。\n\n## 二、性能优化技巧与内存管理\n\n性能优化是 NodeJS 开发中经常被提及的话题，尤其是在处理高并发场景时。合理的内存管理和高效的 I/O 操作能显著提升应用的可扩展性。\n\n### 1. 内存泄漏的预防\n\nNodeJS 内存泄漏往往是性能下降的隐形杀手。开发者需要关注全局对象和闭包中未释放的引用，这些对象会占用内存直到进程退出。\n\n> 在 process.memoryUsage() 中，我们可以实时查看当前进程的 RSS 和 Heap 使用情况，这有助于在开发环境中提前发现潜在的泄漏点。\n\n对于大型数据处理，建议将内存占用控制在合理范围内，避免一次性加载所有数据到内存中。使用流（Stream）来处理大数据是 NodeJS 的强项。\n\n### 2. 流处理与缓冲\n\n在文件读写和网络传输场景下，流操作能极大提升效率。NodeJS 的 **ReadableStream** 和 **WritableStream** 允许数据分块传输，避免了一次性传输带来的内存压力。\n\n流式处理就像一条流水线，数据进来，经过处理，再流出去，中间状态始终保持最小化。\n\n此外，对于同步阻塞操作，如文件解析或正则匹配，应尽量避免在异步回调中执行，这会导致事件循环暂停。\n\n## 三、生态工具链与工程化\n\nNodeJS 的强大不仅在于核心运行时，更在于其丰富的生态系统。选择合适的框架和工具，能大幅降低开发成本。\n\n### 1. 主流框架选择\n\n无论是轻量级的 **Express**，还是全功能架构的 **NestJS**，亦或是基于云原生设计的 **Koa**，不同场景下的选型策略各有不同。\n\n- **Express：** 适合快速开发中小型项目，灵活度高，学习曲线平缓。\n- **NestJS：** 适合大型企业级项目，基于 TypeScript，结构严谨，自带依赖注入机制。\n- **Koa：** 轻量级中间件驱动，适合对性能有极致要求的场景。\n\n### 2. 开发规范与质量工具\n\n随着项目规模扩大，代码规范和质量检查变得尤为重要。ESLint 和 Prettier 是代码风格统一的标配，而 Jest 或 Mocha 则是单元测试的利器。\n\n使用 **CI/CD** 工具如 GitHub Actions 或 GitLab CI，可以自动化构建、测试和部署流程，确保代码交付的一致性。\n\n## 总结与展望\n\nNodeJS 开发虽然看似简单，实则涵盖了从底层原理到上层架构的众多知识点。掌握事件循环、优化内存管理、善用生态工具，是成为一名资深 NodeJS 开发者的必经之路。\n\n未来，随着云原生和边缘计算的普及，NodeJS 的应用场景将更加广泛。保持对新技术的敏感度，持续学习，才能在 NodeJS 开发的浪潮中保持竞争力。', '本文深入探讨了Node.js开发的底层逻辑与核心实践。重点介绍了事件循环机制、异步编程的精髓、性能优化技巧以及内存管理方法。此外，还涵盖了主流框架的选择和开发规范质量工具的使用，强调掌握这些知识点对成为一名资深Node.js开发者的重要性。随着云计算和边缘计算的普及，Node.js的应用前景广阔，持续学习和适应新技术是关键。', '/uploads/7d8828b31cfd46b384092090d2ca60c0.png', 'published', 1, 'd4ab7a65-dd8a-405f-afb5-4261de256b94', 69, 2, 0, '2026-05-18 12:01:59', NULL, '2026-05-18 12:01:59', '2026-07-28 12:43:02', 'markdown', '[{\"text\": \"一、异步编程的精髓与事件循环\", \"level\": 2}, {\"text\": \"1. 理解事件循环与单线程\", \"level\": 3}, {\"text\": \"2. 异步编程的最佳实践\", \"level\": 3}, {\"text\": \"二、性能优化技巧与内存管理\", \"level\": 2}, {\"text\": \"1. 内存泄漏的预防\", \"level\": 3}, {\"text\": \"2. 流处理与缓冲\", \"level\": 3}, {\"text\": \"三、生态工具链与工程化\", \"level\": 2}, {\"text\": \"1. 主流框架选择\", \"level\": 3}, {\"text\": \"2. 开发规范与质量工具\", \"level\": 3}, {\"text\": \"总结与展望\", \"level\": 2}]');
INSERT INTO `articles` VALUES ('6e0a83add5514b9a868508b04381a9f1', 'Go语言之美', 'go', '\n## 引言段落😂\n\n在这个数字化时代，编程语言的选择往往决定了开发者的工作效率和项目的未来。Go语言，也被称为Golang，自从2009年由Google推出以来，就以其简洁、高效的特点迅速赢得了开发者们的青睐。本文将带您探索Go语言的魅力所在。\n\n```go\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Hello, Go!\")\n\n    // 并发示例：启动一个 Goroutine\n    go func() {\n        fmt.Println(\"Running in background\")\n    }()\n\n    // 等待输入，防止主程序立刻退出（实际中会用 sync.WaitGroup）\n    fmt.Scanln()\n}\n```\n\n## 正文\n\n### Go语言的简洁性\n\n**什么是简洁性？** 简洁性不仅仅是一种代码风格，更是一种哲学。Go语言的设计者们深知这一点，因此Go语言的核心原则之一就是简洁。\n\n- **语法简单**：Go语言的语法接近英语，易于学习和使用。\n- **标准库丰富**：Go的标准库涵盖了从网络编程到并发处理的各种功能，开发者可以快速构建应用程序。\n\n### Go语言的性能\n\n在性能方面，Go语言同样表现出色。它的编译器和运行时都是用C语言编写的，因此能够提供高效的执行速度。\n\n- **编译型语言**：Go语言是编译型语言，编译后的程序可以直接运行在目标机器上。\n- **垃圾回收机制**：Go语言的垃圾回收机制可以自动管理内存，提高开发效率。\n\n### Go语言的并发性\n\nGo语言最引人注目的特点之一是其强大的并发支持。通过goroutine和channel，开发者可以轻松地编写出高效的并发程序。\n\n- **goroutine**：轻量级线程，可以在同一进程中并行运行多个任务。\n- **channel**：用于在goroutine之间通信的管道。\n\n### Go语言的生态系统\n\nGo语言的生态系统也非常丰富，拥有大量的第三方库和框架，可以帮助开发者快速开发各种应用程序。\n\n- **GitHub**：Go语言在GitHub上拥有庞大的社区，许多优秀的开源项目都是用Go语言编写的。\n- **Docker**：Go语言是Docker容器技术的核心技术之一。\n\n## 总结结论\n\nGo语言以其简洁、高效、并发性强等特点，成为了现代编程语言中的一颗璀璨明珠。无论是Web开发、系统编程还是分布式计算，Go语言都能够提供强大的支持。对于追求高性能和开发效率的开发者来说，Go语言无疑是一个值得选择的语言。', '本文探讨了Go语言的魅力所在。Go语言以其简洁的语法、丰富的标准库和高效的性能赢得了开发者青睐。它作为编译型语言，具备垃圾回收机制，并能通过goroutine和channel实现强大的并发支持。同时，Go语言拥有庞大的社区支持和生态系统，适合Web开发、系统编程和分布式计算等多种场景。对于追求高效开发的程序员而言，Go语言是理想的选择。', '/uploads/e999a14cdfd54793899f9bd4afa9a14d.png', 'published', 1, 'a3286e9f9ca142f8973a32eabc46773b', 18, 2, 0, '2026-07-12 15:44:22', NULL, '2026-05-21 00:33:58', '2026-07-30 04:26:46', 'markdown', '[{\"line\": 1, \"text\": \"引言段落😂\", \"level\": 2, \"nextToken\": {\"map\": [1, 2], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"1\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"引言段落😂\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"引言段落😂\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [1, 2], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"1\"], [\"id\", \"引言段落😂\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 23, \"text\": \"正文\", \"level\": 2, \"nextToken\": {\"map\": [23, 24], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"23\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"正文\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"正文\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [23, 24], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"23\"], [\"id\", \"正文\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 25, \"text\": \"Go语言的简洁性\", \"level\": 3, \"nextToken\": {\"map\": [25, 26], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"25\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"Go语言的简洁性\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"Go语言的简洁性\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [25, 26], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"25\"], [\"id\", \"Go语言的简洁性\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 32, \"text\": \"Go语言的性能\", \"level\": 3, \"nextToken\": {\"map\": [32, 33], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"32\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"Go语言的性能\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"Go语言的性能\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [32, 33], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"32\"], [\"id\", \"Go语言的性能\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 39, \"text\": \"Go语言的并发性\", \"level\": 3, \"nextToken\": {\"map\": [39, 40], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"39\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"Go语言的并发性\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"Go语言的并发性\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [39, 40], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"39\"], [\"id\", \"Go语言的并发性\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 46, \"text\": \"Go语言的生态系统\", \"level\": 3, \"nextToken\": {\"map\": [46, 47], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"46\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"Go语言的生态系统\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"Go语言的生态系统\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [46, 47], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"46\"], [\"id\", \"Go语言的生态系统\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 53, \"text\": \"总结结论\", \"level\": 2, \"nextToken\": {\"map\": [53, 54], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"53\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"总结结论\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"总结结论\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [53, 54], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"53\"], [\"id\", \"总结结论\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}]');
INSERT INTO `articles` VALUES ('8aa8821ecd3c43b1ba5eaa08a57a76bf', 'C++：现代编程语言的魅力', 'c', '## C++：现代编程语言的魅力\n\n### 引言段落\n\n在当今这个信息化时代，编程语言的重要性日益凸显。作为面向对象程序设计的经典代表之一，C++以其强大的功能和广泛的应用领域，在软件开发中扮演着重要角色。本文将带你走进C++的世界，探索它的魅力所在。\n\n### C++的基本特点与优势\n\n#### ### 面向对象的特性\n**面向对象编程（OOP）** 是C++的一大特色。它允许程序员创建类和对象，并且可以封装数据、继承和多态性。这些特性使得代码更加模块化，易于维护和扩展。\n\n#### ### 丰富的标准库支持\nC++拥有庞大的标准库，涵盖了从文件处理到网络通信等几乎所有开发需求。这极大地提高了开发效率，减少了重复工作。\n\n#### ### 高性能与灵活性\n相比其他高级语言，C++在执行速度上具有显著优势。同时，它允许直接操作内存地址，提供了更高的灵活性和控制力，使得一些高性能的应用程序可以使用C++来实现。\n\n### C++的应用场景\n\n#### ### 游戏开发\n由于其对资源的高效管理能力和强大的图形处理能力，许多知名游戏引擎如Unity、Unreal Engine都支持C++。在游戏开发中，C++被广泛用于优化性能和实现复杂算法。\n\n#### ### 系统级软件与嵌入式系统\nC++是编写操作系统、数据库管理系统等关键应用的理想选择。它能够提供底层的控制力，确保程序运行时的高效性和稳定性。\n\n### C++的学习与发展\n\n#### ### 入门指南\n对于初学者来说，可以从学习基本语法和数据类型开始。推荐使用《C++ Primer》或《Effective Modern C++》这样的经典书籍来系统地学习C++的基础知识。\n\n#### ### 持续学习与实践\nC++是一个不断发展演进的语言，新版本不断推出新的特性和功能。保持对最新技术的关注，并通过实际项目来应用所学知识，才能更好地掌握这门语言。\n\n### 总结结论\n\n综上所述，C++凭借其强大的性能、灵活的特性以及广泛的应用场景，在现代软件开发中占据着不可替代的位置。无论是游戏开发者还是系统级软件工程师，都应熟悉并掌握这门语言。希望本文能为你打开学习和使用C++的大门。\n\n> “选择正确的工具可以事半功倍。” —— 阿德里安·克雷默（Adrian Kramer）', 'C++作为面向对象程序设计的经典代表，以其强大的功能和广泛的应用领域在软件开发中发挥着重要作用。它具备丰富的标准库支持、高性能与灵活性以及面向对象的特性等优势，在游戏开发和系统级软件等领域有广泛应用。初学者可以从基本语法开始学习，并通过实际项目不断实践以掌握这门语言。随着C++持续发展，保持对新技术的关注也是必要的。', '', 'draft', 1, 'd4ab7a65-dd8a-405f-afb5-4261de256b94', 7, 0, 0, NULL, NULL, '2026-08-01 11:30:20', '2026-08-02 11:58:50', 'markdown', '[{\"line\": 0, \"text\": \"C++：现代编程语言的魅力\", \"level\": 2, \"nextToken\": {\"map\": [0, 1], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"0\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"C++：现代编程语言的魅力\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"C++：现代编程语言的魅力\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [0, 1], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"0\"], [\"id\", \"C++：现代编程语言的魅力\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 2, \"text\": \"引言段落\", \"level\": 3, \"nextToken\": {\"map\": [2, 3], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"2\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"引言段落\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"引言段落\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [2, 3], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"2\"], [\"id\", \"引言段落\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 6, \"text\": \"C++的基本特点与优势\", \"level\": 3, \"nextToken\": {\"map\": [6, 7], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"6\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"C++的基本特点与优势\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"C++的基本特点与优势\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [6, 7], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"6\"], [\"id\", \"C++的基本特点与优势\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 8, \"text\": \"### 面向对象的特性\", \"level\": 4, \"nextToken\": {\"map\": [8, 9], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"8\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"### 面向对象的特性\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"### 面向对象的特性\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [8, 9], \"tag\": \"h4\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"8\"], [\"id\", \"### 面向对象的特性\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"####\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 11, \"text\": \"### 丰富的标准库支持\", \"level\": 4, \"nextToken\": {\"map\": [11, 12], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"11\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"### 丰富的标准库支持\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"### 丰富的标准库支持\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [11, 12], \"tag\": \"h4\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"11\"], [\"id\", \"### 丰富的标准库支持\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"####\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 14, \"text\": \"### 高性能与灵活性\", \"level\": 4, \"nextToken\": {\"map\": [14, 15], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"14\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"### 高性能与灵活性\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"### 高性能与灵活性\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [14, 15], \"tag\": \"h4\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"14\"], [\"id\", \"### 高性能与灵活性\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"####\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 17, \"text\": \"C++的应用场景\", \"level\": 3, \"nextToken\": {\"map\": [17, 18], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"17\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"C++的应用场景\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"C++的应用场景\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [17, 18], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"17\"], [\"id\", \"C++的应用场景\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 19, \"text\": \"### 游戏开发\", \"level\": 4, \"nextToken\": {\"map\": [19, 20], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"19\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"### 游戏开发\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"### 游戏开发\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [19, 20], \"tag\": \"h4\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"19\"], [\"id\", \"### 游戏开发\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"####\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 22, \"text\": \"### 系统级软件与嵌入式系统\", \"level\": 4, \"nextToken\": {\"map\": [22, 23], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"22\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"### 系统级软件与嵌入式系统\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"### 系统级软件与嵌入式系统\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [22, 23], \"tag\": \"h4\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"22\"], [\"id\", \"### 系统级软件与嵌入式系统\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"####\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 25, \"text\": \"C++的学习与发展\", \"level\": 3, \"nextToken\": {\"map\": [25, 26], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"25\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"C++的学习与发展\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"C++的学习与发展\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [25, 26], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"25\"], [\"id\", \"C++的学习与发展\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 27, \"text\": \"### 入门指南\", \"level\": 4, \"nextToken\": {\"map\": [27, 28], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"27\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"### 入门指南\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"### 入门指南\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [27, 28], \"tag\": \"h4\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"27\"], [\"id\", \"### 入门指南\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"####\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 30, \"text\": \"### 持续学习与实践\", \"level\": 4, \"nextToken\": {\"map\": [30, 31], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"30\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"### 持续学习与实践\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"### 持续学习与实践\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [30, 31], \"tag\": \"h4\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"30\"], [\"id\", \"### 持续学习与实践\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"####\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 33, \"text\": \"总结结论\", \"level\": 3, \"nextToken\": {\"map\": [33, 34], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"33\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"总结结论\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"总结结论\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [33, 34], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"33\"], [\"id\", \"总结结论\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}]');
INSERT INTO `articles` VALUES ('9083775b9add481eab7c10ea2224bcf3', 'Codex：藏在代码背后的“智能助手”', 'codex', '\n  不知道你有没有过这样的时刻：对着代码编辑器挠头半小时，一个小小的语法问题卡得寸步难行；或者想实现一个简单的功能，翻遍文档还是摸不着头脑？这时候，OpenAI推出的Codex就像一位藏在屏幕后的“代码助手”，悄悄改变着我们和代码打交道的方式，让编程不再是少数人的“专属技能”。\n\n### 什么是Codex？\nCodex是OpenAI基于GPT系列模型开发的**代码专用大语言模型**，核心能力是把自然语言描述转化为可运行的代码。它的训练数据来自全球海量公开的代码仓库，覆盖Python、JavaScript、Java、C++等数十种主流编程语言，甚至能理解特定行业的编程逻辑。不同于普通的代码补全工具，Codex可以处理从简单脚本到复杂项目的需求，只要你能说清楚想实现的功能，它就能帮你把想法落地成代码。\n\n### Codex能为我们解决哪些问题？\n对于新手来说，Codex是绝佳的入门“引路人”。比如你输入“写一个Python脚本，自动把桌面上的图片按拍摄日期分类整理到不同文件夹”，它会直接生成带注释的可运行代码，还会解释每一步的作用，帮你快速理解编程逻辑。\n\n对于开发者而言，Codex能大幅提升效率。写前端交互逻辑时，它可以快速生成点击事件、动画效果的代码；写后端接口时，它能帮你搭建基础的路由和数据处理框架；甚至遇到报错时，输入错误提示，它能快速定位问题并给出修正方案。\n\n更重要的是，Codex降低了编程的门槛：一个没有专业编程基础的学生，能靠它做课程作业的小项目；一个创业者，能靠它快速搭建产品的原型框架，不用再花大量时间学习基础语法。\n\n### 关于Codex的那些“边界”\n但Codex也不是无所不能的“全能助手”，它有自己的局限。比如面对高度定制化的业务场景，它生成的代码可能会忽略实际业务中的特殊需求；处理复杂的算法逻辑时，它的方案可能不是最优解，甚至会出现逻辑漏洞。\n\n另外，Codex是工具，永远不能替代人的思考。我曾试过让它生成一个针对特定行业的数据分析脚本，它的代码在测试小数据时没问题，但遇到异常值处理就会报错，这时候还是需要开发者根据业务逻辑手动调整。更关键的是，过度依赖Codex生成代码，会让新手错过理解编程底层逻辑的过程，反而不利于长期的能力提升。\n\n## 总结\n总的来说，Codex是一把好用的“代码钥匙”，它打开了编程的普惠大门，让更多人能跨越技术的门槛，把天马行空的想法变成可运行的程序。但它终究是辅助工具，真正的创造力和深度思考，依然需要我们自己来掌控。未来，当人类的编程智慧和AI的高效能力结合，或许会诞生更多意想不到的可能——而Codex，正是这场变革里最亮眼的起点。', 'Codex是OpenAI基于GPT系列开发的代码专用大语言模型，可将自然语言转化为Python、JavaScript等多语言可运行代码，训练数据覆盖海量公开代码仓库，能处理从简单脚本到复杂项目的编程需求。它能降低编程门槛，助力新手入门、开发者提升效率，但存在局限：对高度定制化业务、复杂算法适配性不足，无法替代人类思考，过度依赖可能阻碍新手掌握编程底层逻辑，是编程普惠的工具，结合人类智慧将有更多可能。', '/uploads/9f40558fcfe740d4a4ccaa75c778ad81.jpeg', 'published', 1, 'd4ab7a65-dd8a-405f-afb5-4261de256b94', 17, 0, 0, '2026-07-18 09:13:42', NULL, '2026-07-13 04:48:23', '2026-07-29 12:36:52', 'markdown', '[{\"line\": 3, \"text\": \"什么是Codex？\", \"level\": 3, \"nextToken\": {\"map\": [3, 4], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"3\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"什么是Codex？\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"什么是Codex？\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [3, 4], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"3\"], [\"id\", \"什么是Codex？\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 6, \"text\": \"Codex能为我们解决哪些问题？\", \"level\": 3, \"nextToken\": {\"map\": [6, 7], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"6\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"Codex能为我们解决哪些问题？\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"Codex能为我们解决哪些问题？\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [6, 7], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"6\"], [\"id\", \"Codex能为我们解决哪些问题？\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 13, \"text\": \"关于Codex的那些“边界”\", \"level\": 3, \"nextToken\": {\"map\": [13, 14], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"13\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"关于Codex的那些“边界”\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"关于Codex的那些“边界”\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [13, 14], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"13\"], [\"id\", \"关于Codex的那些“边界”\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 18, \"text\": \"总结\", \"level\": 2, \"nextToken\": {\"map\": [18, 19], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"18\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"总结\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"总结\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [18, 19], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"18\"], [\"id\", \"总结\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}]');
INSERT INTO `articles` VALUES ('950ff22260a04c9692b84daa7b070a49', 'Nuxt 全栈框架：SSR/SSG/混合渲染的工程选择', 'nuxt-fullstack-rendering', '# Nuxt 全栈框架：SSR/SSG/混合渲染的工程选择\n\n> 本文基于 [nuxt/nuxt](https://github.com/nuxt/nuxt)（⭐ 60k+）源码，剖析渲染策略。\n\n## 引言\n\nNuxt 3 是 Vue 生态最完整的全栈框架，支持 SSR/SSG/CSR/混合渲染四种模式。如何选型？本文从源码角度给出答案。\n\n## 一、四种渲染模式对比\n\n| 模式 | 触发时机 | SEO | 首屏 | 服务端负载 |\n|------|---------|-----|------|----------|\n| SSR | 每次请求 | ✅ | 快 | 高 |\n| SSG | 构建时 | ✅ | 快 | 低（静态） |\n| CSR | 客户端 | ❌ | 慢 | 低 |\n| 混合 | 路由级可选 | 可控 | 可控 | 可控 |\n\n## 二、Nuxt 的路由级渲染\n\n```typescript\n// nuxt.config.ts\nexport default defineNuxtConfig({\n  routeRules: {\n    // 首页静态生成\n    \'/\': { prerender: true },\n    // 文章详情 SSR\n    \'/article/**\': { ssr: true },\n    // 后台 CSR\n    \'/admin/**\': { ssr: false },\n    // API 增量静态\n    \'/api/**\': { swr: 3600 }\n  }\n})\n```\n\n`routeRules` 是 Nuxt 3 的杀手锏：不同路由用不同渲染策略，无需全局统一。\n\n## 三、Nitro 服务端引擎\n\nNuxt 3 的服务端由 Nitro 驱动：\n\n```typescript\n// server/api/article/[id].ts\nexport default defineEventHandler(async (event) => {\n  const id = getRouterParam(event, \'id\')\n  const article = await db.article.findById(id)\n  return article\n})\n```\n\nNitro 的核心特性：\n- **跨平台部署**：同一份代码，部署到 Vercel/Cloudflare/Node/Deno\n- **自动代码分割**：每个 API 路由独立打包，冷启动快\n- **存储层抽象**：统一接口访问 KV/FS/Database\n\n## 四、混合渲染实战\n\n```vue\n<!-- pages/article/[id].vue -->\n<script setup>\nconst route = useRoute()\n// 服务端获取数据，客户端水合\nconst { data: article } = await useFetch(`/api/article/${route.params.id}`)\n</script>\n\n<template>\n  <article>{{ article.title }}</article>\n</template>\n```\n\n`useFetch` 自动处理：\n1. 服务端：直接调用 API\n2. 客户端水合：复用服务端数据，不重复请求\n3. 导航时：客户端发起请求\n\n## 总结\n\nNuxt 的渲染选型策略：\n1. **内容站**：SSG 为主，文章详情可用 SSR\n2. **应用站**：CSR 为主，关键页用 SSR\n3. **混合站**：routeRules 路由级控制，最灵活\n\n[Nuxt](https://github.com/nuxt/nuxt) 是 Vue 全栈最佳实践。', '基于 nuxt/nuxt 源码，分析 SSR/SSG/CSR/混合渲染的适用场景，理解 nitro 服务端引擎的设计。', NULL, 'published', 1, 'd4ab7a65-dd8a-405f-afb5-4261de256b94', 3, 0, 0, '2026-07-28 10:49:51', NULL, '2026-07-28 10:49:51', '2026-07-29 12:23:07', 'markdown', '[{\"text\": \"Nuxt 全栈框架：SSR/SSG/混合渲染的工程选择\", \"level\": 1}, {\"text\": \"引言\", \"level\": 2}, {\"text\": \"一、四种渲染模式对比\", \"level\": 2}, {\"text\": \"二、Nuxt 的路由级渲染\", \"level\": 2}, {\"text\": \"三、Nitro 服务端引擎\", \"level\": 2}, {\"text\": \"四、混合渲染实战\", \"level\": 2}, {\"text\": \"总结\", \"level\": 2}]');
INSERT INTO `articles` VALUES ('bcd7dc113f6c49019b79ff0e677f9f35', 'Express.js 中间件模型深度剖析', 'express-middleware-deep', '# Express.js 中间件模型深度剖析\n\n> 本文基于 [expressjs/express](https://github.com/expressjs/express)（⭐ 69k+）源码，深入剖析中间件机制。\n\n## 引言\n\nExpress 的中间件模型是其灵魂所在。一行 `app.use(cors())` 背后，是洋葱模型的层层包裹、是 next 函数的递归调度、是错误处理的优雅降级。理解这套机制，是写出可维护 Node.js 后端的基础。\n\n## 一、中间件注册：app.use 的真相\n\n```javascript\napp.use = function use(fn) {\n  var offset = 0\n  var path = \'/\'\n  // 支持 app.use(\'/api\', fn) 形式\n  if (typeof fn !== \'function\') {\n    var arg = fn\n    while (Array.isArray(arg) && arg.length !== 0) arg = arg[0]\n    if (typeof arg !== \'function\') {\n      throw new TypeError(\'app.use() requires a callback function\')\n    }\n    offset = 1\n    path = fn\n  }\n  var fns = flattenSlice.call(arguments, offset)\n  fns.forEach(function (fn) {\n    // 关键：每个中间件包装成 Layer，推入 stack\n    var layer = new Layer(path, {\n      sensitive: this.enabled(\'case sensitive routing\'),\n      strict: false,\n      end: false\n    }, fn)\n    layer.route = false\n    this._router.stack.push(layer)\n  }, this)\n  return this\n}\n```\n\n每个中间件最终都变成一个 Layer 对象，推入 `_router.stack` 数组。\n\n## 二、请求调度：next 的递归魔法\n\n当请求到来时，Express 从 stack 第一个 Layer 开始匹配：\n\n```javascript\nproto.handle = function handle(req, res, out) {\n  var idx = 0\n  var stack = this.stack\n  \n  function next(err) {\n    var layer = stack[idx++]\n    if (!layer) return out(err)\n    \n    // 错误中间件 vs 普通中间件\n    if (err) {\n      if (layer.handle.length === 4) {\n        layer.handle(err, req, res, next)\n      } else {\n        next(err)  // 跳过非错误中间件\n      }\n    } else {\n      if (layer.handle.length === 4) {\n        next()  // 跳过错误中间件\n      } else {\n        layer.handle(req, res, next)\n      }\n    }\n  }\n  next()\n}\n```\n\n关键点：\n- `next()` 不是同步调用，而是异步递归\n- 错误中间件 `fn(err, req, res, next)` 必须有 4 个参数\n- 普通中间件 `fn(req, res, next)` 有 3 个参数，靠 `length` 区分\n\n## 三、错误处理的陷阱\n\n```javascript\n// ❌ 错误：异步错误 next 捕获不到\napp.get(\'/api\', (req, res, next) => {\n  fs.readFile(\'a.txt\', (err, data) => {\n    if (err) throw err  // 进程崩溃\n    res.json(data)\n  })\n})\n\n// ✅ 正确：用 next(err)\napp.get(\'/api\', (req, res, next) => {\n  fs.readFile(\'a.txt\', (err, data) => {\n    if (err) return next(err)\n    res.json(data)\n  })\n})\n\n// 错误中间件（4个参数）\napp.use((err, req, res, next) => {\n  res.status(500).json({ message: err.message })\n})\n```\n\n## 总结\n\nExpress 中间件的本质是\"链式责任模式\"+ \"递归调度\"：\n1. **stack 数组**：所有中间件按注册顺序排列\n2. **next 函数**：递归推进 idx，串起整个链\n3. **错误中间件**：通过参数个数区分，实现错误降级\n4. **异步陷阱**：必须显式 `next(err)`，throw 会崩溃进程\n\n深入 [expressjs/express](https://github.com/expressjs/express) 源码，能让你对 Node.js 后端架构有本质理解。', '从 expressjs/express 源码出发，理解洋葱模型、next 机制、错误处理中间件的设计原理与实战陷阱。', NULL, 'published', 1, 'd4ab7a65-dd8a-405f-afb5-4261de256b94', 2, 0, 0, '2026-07-28 10:49:50', NULL, '2026-07-28 10:49:50', '2026-07-29 04:17:33', 'markdown', '[{\"text\": \"Express.js 中间件模型深度剖析\", \"level\": 1}, {\"text\": \"引言\", \"level\": 2}, {\"text\": \"一、中间件注册：app.use 的真相\", \"level\": 2}, {\"text\": \"二、请求调度：next 的递归魔法\", \"level\": 2}, {\"text\": \"三、错误处理的陷阱\", \"level\": 2}, {\"text\": \"总结\", \"level\": 2}]');
INSERT INTO `articles` VALUES ('f96e8100b5c746a3871848f1427a8800', 'Spring Boot 开发概述', 'spring-boot-', 'Spring Boot 是一个开源的 Java-based 平台，它旨在简化开发、测试和部署应用程序的过程。本文将为您介绍 Spring Boot 的基本概念、优势以及如何在项目中使用它。\n\n## 一、引言\n\n随着互联网技术的发展，Java 语言在企业级应用开发领域一直占据重要地位。然而，传统的 Java 应用程序开发涉及到繁琐的配置工作，增加了开发成本和难度。Spring Boot 应运而生，它简化了 Spring 应用的创建和部署流程。\n\n## 二、Spring Boot 的优势\n\n### 1. 自动配置\n\nSpring Boot 通过自动配置来减少开发者的配置代码量。当 Spring Boot 应用启动时，它会根据添加的依赖和类路径信息自动配置 Bean。\n\n### 2. 简化构建过程\n\nSpring Boot 使用 Maven 或 Gradle 作为构建工具，简化了项目的构建过程。开发者只需添加必要的依赖项即可快速启动项目。\n\n### 3. 提供生产就绪特性\n\nSpring Boot 为生产环境提供了一系列的默认配置，如内嵌服务器、安全性配置等，使得应用程序能够快速部署到生产环境中。\n\n## 三、Spring Boot 的使用\n\n### 1. 创建 Spring Boot 项目\n\n1. 访问 Spring Initializr（ [https://start.spring.io/](https://start.spring.io/) ），选择所需的依赖项和项目结构。\n2. 下载生成的 zip 文件，解压后导入到 IDE 中。\n3. 在项目中创建一个主类，并添加 @SpringBootApplication 注解作为项目的入口点。\n\n### 2. 编写业务代码\n\n在 Spring Boot 项目中，您可以像在常规 Spring 应用程序中一样编写业务代码。使用注解如 @RestController 和 @RequestMapping 来创建 RESTful 风格的 API。\n\n## 四、总结\n\nSpring Boot 是一个强大的工具，它简化了 Java 应用的开发过程。通过本文的介绍，您应该对 Spring Boot 有了一个基本的了解。希望它能帮助您在未来的项目中提高开发效率。', 'Spring Boot是一个旨在简化Java应用开发的平台，具有自动配置、构建过程简化和生产就绪特性等优势。文章介绍了如何在Spring Initializr创建项目，编写业务代码，并强调了其高效性。', '/uploads/8e943d6809364074a628900329fa4cf1.jpg', 'published', 1, '2', 82, 0, 0, '2026-07-12 15:44:17', NULL, '2026-05-19 07:23:05', '2026-07-30 10:25:54', 'markdown', '[{\"line\": 2, \"text\": \"一、引言\", \"level\": 2, \"nextToken\": {\"map\": [2, 3], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"2\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"一、引言\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"一、引言\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [2, 3], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"2\"], [\"id\", \"一、引言\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 6, \"text\": \"二、Spring Boot 的优势\", \"level\": 2, \"nextToken\": {\"map\": [6, 7], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"6\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"二、Spring Boot 的优势\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"二、Spring Boot 的优势\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [6, 7], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"6\"], [\"id\", \"二、Spring Boot 的优势\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 8, \"text\": \"1. 自动配置\", \"level\": 3, \"nextToken\": {\"map\": [8, 9], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"8\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"1. 自动配置\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"1. 自动配置\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [8, 9], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"8\"], [\"id\", \"1. 自动配置\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 12, \"text\": \"2. 简化构建过程\", \"level\": 3, \"nextToken\": {\"map\": [12, 13], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"12\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"2. 简化构建过程\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"2. 简化构建过程\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [12, 13], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"12\"], [\"id\", \"2. 简化构建过程\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 16, \"text\": \"3. 提供生产就绪特性\", \"level\": 3, \"nextToken\": {\"map\": [16, 17], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"16\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"3. 提供生产就绪特性\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"3. 提供生产就绪特性\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [16, 17], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"16\"], [\"id\", \"3. 提供生产就绪特性\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 20, \"text\": \"三、Spring Boot 的使用\", \"level\": 2, \"nextToken\": {\"map\": [20, 21], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"20\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"三、Spring Boot 的使用\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"三、Spring Boot 的使用\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [20, 21], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"20\"], [\"id\", \"三、Spring Boot 的使用\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 22, \"text\": \"1. 创建 Spring Boot 项目\", \"level\": 3, \"nextToken\": {\"map\": [22, 23], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"22\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"1. 创建 Spring Boot 项目\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"1. 创建 Spring Boot 项目\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [22, 23], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"22\"], [\"id\", \"1. 创建 Spring Boot 项目\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 28, \"text\": \"2. 编写业务代码\", \"level\": 3, \"nextToken\": {\"map\": [28, 29], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"28\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"2. 编写业务代码\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"2. 编写业务代码\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [28, 29], \"tag\": \"h3\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"28\"], [\"id\", \"2. 编写业务代码\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"###\", \"content\": \"\", \"nesting\": 1, \"children\": null}}, {\"line\": 32, \"text\": \"四、总结\", \"level\": 2, \"nextToken\": {\"map\": [32, 33], \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"inline\", \"attrs\": [[\"data-line\", \"32\"]], \"block\": true, \"level\": 1, \"hidden\": false, \"markup\": \"\", \"content\": \"四、总结\", \"nesting\": 0, \"children\": [{\"map\": null, \"tag\": \"\", \"info\": \"\", \"meta\": null, \"type\": \"text\", \"attrs\": null, \"block\": false, \"level\": 0, \"hidden\": false, \"markup\": \"\", \"content\": \"四、总结\", \"nesting\": 0, \"children\": null}]}, \"currentToken\": {\"map\": [32, 33], \"tag\": \"h2\", \"info\": \"\", \"meta\": null, \"type\": \"heading_open\", \"attrs\": [[\"data-line\", \"32\"], [\"id\", \"四、总结\"]], \"block\": true, \"level\": 0, \"hidden\": false, \"markup\": \"##\", \"content\": \"\", \"nesting\": 1, \"children\": null}}]');

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类名',
  `slug` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '别名',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '分类描述',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug`(`slug` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文章分类表' ROW_FORMAT = DYNAMIC;

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
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `article_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文章id',
  `user_id` int NULL DEFAULT NULL COMMENT '用户id（废弃）',
  `parent_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '父评论id',
  `author_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '评论人昵称',
  `author_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '评论人邮箱',
  `avatar` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '评论内容',
  `content_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'text' COMMENT '评论类型（markdown，txt）',
  `is_ai_reply` tinyint(1) NULL DEFAULT 0 COMMENT '是否AI回复',
  `is_approved` tinyint(1) NULL DEFAULT 1 COMMENT '是否批准显示',
  `like_count` int NULL DEFAULT 0 COMMENT '点赞量',
  `created_at` datetime NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `article_id`(`article_id` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `parent_id`(`parent_id` ASC) USING BTREE,
  CONSTRAINT `comments_ibfk_97` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_98` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_99` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文章评论表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of comments
-- ----------------------------
INSERT INTO `comments` VALUES ('03ab334260c44c81b1d201646178ba19', '6e0a83add5514b9a868508b04381a9f1', NULL, '4ea7d818e8d84f0db6abba332a2190c5', '腾讯视频', '123456@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=xyOnRe5ML3Aw96iaaQ1hh6w&s=640&t=1555323117', '22222', 'text', 0, 1, 0, '2026-07-13 04:22:04');
INSERT INTO `comments` VALUES ('0b35b795c899443aac8d95563820d83d', '6e0a83add5514b9a868508b04381a9f1', NULL, 'b772cad68f4640b381c8b6b6c3098c35', '腾讯视频', '123456@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=xyOnRe5ML3Aw96iaaQ1hh6w&s=640&t=1555323117', '我的饭', 'markdown', 0, 1, 0, '2026-07-13 04:22:32');
INSERT INTO `comments` VALUES ('2f1197f4c0254a6fa8a20bd596468d48', '2e4441d2233f456a8ed3947e65776a0b', NULL, NULL, 'QQ用户_2906594394', '2906594394@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=KoDV084gERv5k3rP8aEj1g&kti=aT_mihHyHcE&s=640&t=1681581854', '**加粗文本**\n\n*斜体文本*\n\n`代码片段`\n\n[链接](https://example.com)\n\n多行内容', 'markdown', 0, 1, 0, '2026-07-29 13:13:20');
INSERT INTO `comments` VALUES ('2f78d6183ec149a19cb490258d06ab9a', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', NULL, NULL, '85485748', '85485748@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=TtPB6OicYHkflMlpRL3uyDA&s=640&t=0', '呜呜呜', 'markdown', 0, 1, 1, '2026-05-20 00:53:17');
INSERT INTO `comments` VALUES ('3e0b10ee9fb94abaa280b42865e5aa07', '6e0a83add5514b9a868508b04381a9f1', NULL, NULL, 'QQ用户_2906594394', '2906594394@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=KoDV084gERv5k3rP8aEj1g&kti=aT_mihHyHcE&s=640&t=1681581854', '废物', 'markdown', 0, 1, 0, '2026-07-13 03:17:17');
INSERT INTO `comments` VALUES ('3f97f00335ca4da78b5e53c99da77280', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', NULL, NULL, 'e', '2568863244@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=oGCIhQ81tiaiajKMDTXVMRCQ&kti=ZM4VJAAAAAE&s=640&t=1686582209', '嘻嘻嘻', 'markdown', 0, 1, 1, '2026-05-20 07:12:50');
INSERT INTO `comments` VALUES ('4ea7d818e8d84f0db6abba332a2190c5', '6e0a83add5514b9a868508b04381a9f1', NULL, 'e3e00e1fa8c5485994c3f331e1d9fc12', '腾讯视频', '123456@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=xyOnRe5ML3Aw96iaaQ1hh6w&s=640&t=1555323117', 'frontend 回复管理员测试', 'text', 0, 1, 0, '2026-07-13 04:06:08');
INSERT INTO `comments` VALUES ('5edbe3fc422c467282180bb0209e7075', '6e0a83add5514b9a868508b04381a9f1', NULL, 'e3e00e1fa8c5485994c3f331e1d9fc12', '就是爱音乐', '123456789@qq.com', 'https://q.qlogo.cn/headimg_dl?dst_uin=123456789&spec=640', 'client 自动测试回复管理员 1783916931', 'markdown', 0, 1, 0, '2026-07-13 04:28:52');
INSERT INTO `comments` VALUES ('766cf41af693420ea6f6049f98977f6f', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', NULL, NULL, 'QQ用户_2906594394', '2906594394@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=KoDV084gERv5k3rP8aEj1g&kti=aT_mihHyHcE&s=640&t=1681581854', '> hello Word', 'markdown', 0, 1, 0, '2026-05-20 00:46:51');
INSERT INTO `comments` VALUES ('b053b9fffa714f7dbf61faa31fd00117', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', NULL, '766cf41af693420ea6f6049f98977f6f', 'QQ用户_2906594394', '2906594394@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=KoDV084gERv5k3rP8aEj1g&kti=aT_mihHyHcE&s=640&t=1681581854', '哈哈哈', 'markdown', 0, 1, 0, '2026-05-20 00:47:44');
INSERT INTO `comments` VALUES ('b1df1fa1fa9949c39f864dfcefd863b1', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', NULL, '2f78d6183ec149a19cb490258d06ab9a', 'QQ用户_2906594394', '2906594394@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=KoDV084gERv5k3rP8aEj1g&kti=aT_mihHyHcE&s=640&t=1681581854', '2026年5月20日 13:15:17', 'markdown', 0, 1, 0, '2026-05-20 05:15:28');
INSERT INTO `comments` VALUES ('b772cad68f4640b381c8b6b6c3098c35', '6e0a83add5514b9a868508b04381a9f1', NULL, '4ea7d818e8d84f0db6abba332a2190c5', '腾讯视频', '123456@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=xyOnRe5ML3Aw96iaaQ1hh6w&s=640&t=1555323117', '111', 'markdown', 0, 1, 0, '2026-07-13 04:21:46');
INSERT INTO `comments` VALUES ('d531d14f56f74da5b610220a97f16fd3', '6e0a83add5514b9a868508b04381a9f1', NULL, 'e3e00e1fa8c5485994c3f331e1d9fc12', '腾讯视频', '123456@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=xyOnRe5ML3Aw96iaaQ1hh6w&s=640&t=1555323117', '通过 fetch 测试回复管理员', 'text', 0, 1, 0, '2026-07-13 03:59:11');
INSERT INTO `comments` VALUES ('db02889eed2c4a1b99f4a08d6d02c638', '6e0a83add5514b9a868508b04381a9f1', NULL, 'e3e00e1fa8c5485994c3f331e1d9fc12', '就是爱音乐', '123456789@qq.com', 'https://q.qlogo.cn/headimg_dl?dst_uin=123456789&spec=640', 'frontend 自动测试回复管理员 1783916940', 'markdown', 0, 1, 0, '2026-07-13 04:29:04');
INSERT INTO `comments` VALUES ('de6ee87d771541668b946a268350dd21', '6e0a83add5514b9a868508b04381a9f1', NULL, '3e0b10ee9fb94abaa280b42865e5aa07', 'e', '2568863244@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=oGCIhQ81tiaiajKMDTXVMRCQ&kti=ZM4VJAAAAAE&s=640&t=1686582209', '哈哈哈哈哈哈', 'markdown', 0, 1, 0, '2026-07-29 12:58:05');
INSERT INTO `comments` VALUES ('e3e00e1fa8c5485994c3f331e1d9fc12', '6e0a83add5514b9a868508b04381a9f1', 1, '3e0b10ee9fb94abaa280b42865e5aa07', 'admin', '2906594394@qq.com', NULL, '您好呀，不知道是不是我写的《Go语言之美》这篇文章哪里让您不满意了？或者是您对Go语言有什么疑问想交流呢？欢迎您说说具体想法，咱们一起聊聊、探讨下呀～', 'markdown', 0, 1, 2, '2026-07-13 03:18:03');
INSERT INTO `comments` VALUES ('e7124159851440f8953e2aa85f198e16', '6e0a83add5514b9a868508b04381a9f1', NULL, 'e3e00e1fa8c5485994c3f331e1d9fc12', '就是爱音乐', '123456789@qq.com', 'https://q.qlogo.cn/headimg_dl?dst_uin=123456789&spec=640', 'client 自动测试回复管理员 1783916991', 'markdown', 0, 1, 0, '2026-07-13 04:29:52');
INSERT INTO `comments` VALUES ('ea9ec8e8510d4b24a5ff95b2d3bf5d84', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', 1, '2f78d6183ec149a19cb490258d06ab9a', 'admin', '2906594394@qq.com', NULL, '哎呀，亲爱的朋友，别难过呀！如果你有任何关于Node.js开发的问题或者想要分享的感受，都可以告诉我哦。我在这里随时愿意帮助你！😊🌟', 'markdown', 0, 1, 0, '2026-05-21 01:04:53');
INSERT INTO `comments` VALUES ('f19ae70207de45bf8cd927e0b91f7c40', '6e0a83add5514b9a868508b04381a9f1', NULL, 'e3e00e1fa8c5485994c3f331e1d9fc12', '就是爱音乐', '123456789@qq.com', 'https://q.qlogo.cn/headimg_dl?dst_uin=123456789&spec=640', 'frontend 自动测试回复管理员 1783916999', 'markdown', 0, 1, 0, '2026-07-13 04:30:00');
INSERT INTO `comments` VALUES ('fabfec2be42345fbb4717ac8da36527d', '4a7c8f7b-a183-4de5-b62e-1f50bb4aad0b', NULL, '3f97f00335ca4da78b5e53c99da77280', 'AI回复', '2906594394@qq.com', NULL, '哈哈，很高兴您喜欢这篇文章！如果有什么疑问或者想分享的，随时告诉我哦，我会尽力帮助您的。期待与您的互动！🌟', 'text', 1, 1, 0, '2026-05-20 12:41:03');
INSERT INTO `comments` VALUES ('ffc8e783b5364274afbc43acc0e9ef35', '6e0a83add5514b9a868508b04381a9f1', NULL, 'e3e00e1fa8c5485994c3f331e1d9fc12', '腾讯视频', '123456@qq.com', 'https://thirdqq.qlogo.cn/g?b=sdk&k=xyOnRe5ML3Aw96iaaQ1hh6w&s=640&t=1555323117', '测试回复管理员', 'text', 0, 1, 0, '2026-07-13 03:40:59');

-- ----------------------------
-- Table structure for links
-- ----------------------------
DROP TABLE IF EXISTS `links`;
CREATE TABLE `links`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '友链站点名称',
  `url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '友链地址',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '站点描述',
  `avatar` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '站点头像/Logo URL',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '友情链接' COMMENT '友链分类',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序（越小越靠前）',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '友情链接' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of links
-- ----------------------------
INSERT INTO `links` VALUES ('031a95f3-6bbc-4be7-aed3-1c5e8234d14f', 'Vite', 'https://cn.vitejs.dev', '下一代前端构建工具', 'https://cn.vitejs.dev/logo.svg', '官方文档', 4, 1, '2026-07-28 11:59:33', '2026-07-28 11:59:33');
INSERT INTO `links` VALUES ('1950ca44-8892-47fe-b432-d64b88a4d800', 'MDN Web Docs', 'https://developer.mozilla.org', 'Web 开发者权威参考文档', 'https://developer.mozilla.org/favicon-48x48.png', '官方文档', 5, 1, '2026-07-28 11:59:33', '2026-07-28 11:59:33');
INSERT INTO `links` VALUES ('ae43a4b0-1f4f-49d3-9933-22c1785f189c', '阮一峰的个人网站', 'https://www.ruanyifeng.com', '科技爱好者周刊，前端入门必读博客', 'https://a.favicon.im/www.ruanyifeng.com', '技术博客', 1, 1, '2026-07-28 11:59:33', '2026-07-28 12:33:35');
INSERT INTO `links` VALUES ('c19e3185-68d4-4f1b-869e-d2928763bf87', 'Vue.js 官方', 'https://cn.vuejs.org', '渐进式 JavaScript 框架官方文档', 'https://cn.vuejs.org/logo.svg', '官方文档', 3, 1, '2026-07-28 11:59:33', '2026-07-28 11:59:33');
INSERT INTO `links` VALUES ('e7fb17c0-3bc6-4e47-a571-9b6d13091e1f', '张鑫旭的博客', 'https://www.zhangxinxu.com', '鑫空间，鑫生活，专注 CSS 与前端深度', 'https://www.zhangxinxu.com/favicon.ico', '技术博客', 2, 1, '2026-07-28 11:59:33', '2026-07-28 11:59:33');

-- ----------------------------
-- Table structure for media_files
-- ----------------------------
DROP TABLE IF EXISTS `media_files`;
CREATE TABLE `media_files`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '主键id',
  `filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '存储文件名（含扩展名）',
  `original_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '原始文件名',
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '文件类型',
  `size` bigint NOT NULL COMMENT '文件大小（字节）',
  `storage` enum('local','minio') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT 'local' COMMENT '存储源：local 本地 / minio 对象存储',
  `url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '访问 URL',
  `path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '存储路径（本地相对路径或 MinIO object key）',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  `author` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '图片来源作者',
  `source_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '图片来源页 URL',
  `license` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '授权信息',
  `source_platform` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '来源平台标识',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_520_ci COMMENT = '媒体文件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of media_files
-- ----------------------------
INSERT INTO `media_files` VALUES ('0487cf91-0100-4107-aac8-a6d49fde27f1', 'f521b750aaf04cc6873691c384607597.mp3', '后会无期.mp3', 'audio/mpeg; charset=UTF-8', 3300249, 'minio', 'http://111.228.9.147/minio/api/blog/f521b750aaf04cc6873691c384607597.mp3', 'f521b750aaf04cc6873691c384607597.mp3', '2026-07-30 10:05:53', '2026-07-30 10:23:10', NULL, NULL, NULL, NULL);
INSERT INTO `media_files` VALUES ('0ddde337-50aa-4744-8330-fe0192ebc4db', '162604dba2b64963b1a4a5de73da123b.mp3', '梦里望-浅影阿.mp3', 'audio/mpeg', 8073075, 'minio', 'http://111.228.9.147/minio/api/blog/162604dba2b64963b1a4a5de73da123b.mp3', '162604dba2b64963b1a4a5de73da123b.mp3', '2026-07-31 09:07:44', '2026-07-31 09:07:44', NULL, NULL, NULL, NULL);
INSERT INTO `media_files` VALUES ('1d9499da-498e-426f-bbb8-8ad275b0e98d', '3171fe93336244a3896ac59455a1e1ad.jpg', '我宣布：斗图大会开始！', 'image/jpeg', 5370, 'local', '/uploads/3171fe93336244a3896ac59455a1e1ad.jpg', '3171fe93336244a3896ac59455a1e1ad.jpg', '2026-07-31 11:30:04', '2026-07-31 11:30:04', 'dogetu.com', 'https://www.dogetu.com/view/128519.html', 'dogetu.com', 'dogetu');
INSERT INTO `media_files` VALUES ('269e8088-04a9-4ca4-9511-1d736bcc339a', '75726c917da84cd9b6c53316002ec50d.jpg', '头像| 私藏微信头像24张', 'image/jpeg', 28049, 'local', '/uploads/75726c917da84cd9b6c53316002ec50d.jpg', '75726c917da84cd9b6c53316002ec50d.jpg', '2026-07-31 11:25:24', '2026-07-31 11:25:24', 'fashion.sohu.com', 'https://fashion.sohu.com', 'dogetu.com', 'baidu');
INSERT INTO `media_files` VALUES ('652ceab4-fbdb-4205-8447-02257bb9e086', 'e0be44aecd3b4854a6d8edd5da5aac9f.jpg', '1446627012.jpg', 'image/jpeg', 59792, 'minio', 'http://111.228.9.147/minio/api/blog/e0be44aecd3b4854a6d8edd5da5aac9f.jpg', 'e0be44aecd3b4854a6d8edd5da5aac9f.jpg', '2026-07-31 08:42:25', '2026-07-31 08:45:13', NULL, NULL, NULL, NULL);
INSERT INTO `media_files` VALUES ('74ecd3de-3481-4d5a-8e1b-680ed3cfd986', '2fb3f9272d0f4954a283bfebd00cfd17.png', '下载.png', 'image/png', 25477, 'minio', 'http://111.228.9.147/minio/api/blog/2fb3f9272d0f4954a283bfebd00cfd17.png', '2fb3f9272d0f4954a283bfebd00cfd17.png', '2026-07-29 07:50:53', '2026-07-29 07:50:53', NULL, NULL, NULL, NULL);
INSERT INTO `media_files` VALUES ('9948c35a-5115-4da8-87d9-55940a31c9af', '59c1a0dde4ae4bee966cd7619d880d41.jpg', '3b54e418f021590fabe6c42c4747f1f0.jpg', 'image/jpeg', 10524, 'local', '/uploads/59c1a0dde4ae4bee966cd7619d880d41.jpg', '59c1a0dde4ae4bee966cd7619d880d41.jpg', '2026-07-29 12:19:06', '2026-07-29 12:19:06', NULL, NULL, NULL, NULL);
INSERT INTO `media_files` VALUES ('9eb46af4-74d3-4e0b-a9f6-a69263c68864', '080f1727039f4738945610bd695de76d.mp3', '不分手的恋爱-汪苏泷.mp3', 'audio/mpeg', 8228585, 'minio', 'http://111.228.9.147/minio/api/blog/080f1727039f4738945610bd695de76d.mp3', '080f1727039f4738945610bd695de76d.mp3', '2026-07-31 07:40:45', '2026-07-31 07:40:45', NULL, NULL, NULL, NULL);
INSERT INTO `media_files` VALUES ('f01b8fc3-f540-4778-8530-1ce4f07adebf', 'fc769bddfe1649339524791a25e564c1.jpg', '001c2de19bc080783611dc7c5a43fd9b.jpg', 'image/jpeg', 28984, 'local', '/uploads/fc769bddfe1649339524791a25e564c1.jpg', 'fc769bddfe1649339524791a25e564c1.jpg', '2026-07-29 10:52:52', '2026-07-29 10:52:52', NULL, NULL, NULL, NULL);

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '主键id',
  `parent_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '父留言id',
  `user_id` int NULL DEFAULT NULL COMMENT '用户id',
  `author_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '留言昵称',
  `author_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '留言邮箱',
  `avatar` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '头像',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容',
  `content_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text' COMMENT '内容类型',
  `is_approved` tinyint(1) NULL DEFAULT 1 COMMENT '是否显示',
  `like_count` int NULL DEFAULT 0 COMMENT '点赞量',
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'ip',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_parent_id`(`parent_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '留言表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of messages
-- ----------------------------
INSERT INTO `messages` VALUES ('1088d65067464287a2efb0d307f2ae9a', '9634b2f312574c5d892367181ee78c46', 1, 'admin', '2906594394@qq.com', NULL, '**狗叫什么呢**', 'markdown', 1, 0, NULL, '2026-07-30 04:19:30');
INSERT INTO `messages` VALUES ('3b9b00740520468590fb25ab1298ba63', NULL, NULL, '自动化验证', NULL, NULL, '自动化验证留言，用于测试提交功能', 'text', 1, 0, NULL, '2026-07-28 15:33:08');
INSERT INTO `messages` VALUES ('9634b2f312574c5d892367181ee78c46', NULL, NULL, 'API??', 'api@test.com', NULL, '????API????', 'text', 1, 0, NULL, '2026-07-28 15:31:22');
INSERT INTO `messages` VALUES ('a11999ae853741e3a22a41d17cac34c4', NULL, NULL, '前端测试', 'test@example.com', NULL, '这是一条来自浏览器自动测试的留言', 'text', 1, 0, NULL, '2026-07-28 15:12:48');

-- ----------------------------
-- Table structure for musics
-- ----------------------------
DROP TABLE IF EXISTS `musics`;
CREATE TABLE `musics`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '主键id',
  `song_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'QQ音乐歌曲 mid',
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '歌曲名',
  `singer` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '歌手',
  `album` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '专辑名',
  `cover` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '封面图 URL',
  `play_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '播放地址（M4A/MP3）',
  `duration` int NULL DEFAULT NULL COMMENT '时长（秒）',
  `source` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT 'qq' COMMENT '来源：qq 音乐',
  `playlist_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '导入来源歌单名',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序权重（越小越靠前）',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  `origin_platform` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'netease' COMMENT '原始来源平台：netease 网易云 / qq QQ音乐 / upload 手动上传',
  `lyric` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL COMMENT 'LRC 歌词文本',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_520_ci COMMENT = '音乐表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of musics
-- ----------------------------
INSERT INTO `musics` VALUES ('0936c803-c118-4277-bb8f-7048b91aa1f7', 'upload_1785483645312', '不分手的恋爱', '汪苏泷', '', 'http://111.228.9.147/minio/api/blog/4bfdf5078a6f487b87a207b7668bb333.jpg', 'http://111.228.9.147/minio/api/blog/080f1727039f4738945610bd695de76d.mp3', 206, 'minio', '手动上传', 0, 1, '2026-07-31 07:40:45', '2026-07-31 07:40:45', 'upload', '[00:00.00]欢迎来访爱听音乐网 www.2t58.com\r\n[ti:不分手的恋爱]\n[ar:汪苏泷]\n[al:新版倩女幽魂之还泪]\n[by:]\n[offset:0]\n[00:00.00]不分手的恋爱 - 汪苏泷 (Silence Wang)\n[00:08.73]词：汪苏泷\n[00:17.47]曲：汪苏泷\n[00:26.21]不知不觉不问 不痛不痒\n[00:29.32]多少的时光\n[00:31.73]不确定的某个 夜晚小巷\n[00:34.97]泪悄悄流淌\n[00:37.37]街边天气微凉 淡淡月光\n[00:40.62]我沿路哼唱\n[00:43.00]找寻我们一直 找不到的\n[00:46.27]缘分被捆绑\n[00:48.28]感觉不到你为我坚强\n[00:51.08]感觉得到你对我说谎\n[00:54.13]我安静听着肖邦\n[00:55.97]用维也纳忧伤\n[00:59.68]你的爱被埋葬 恨被收藏\n[01:03.19]痛应该原谅\n[01:05.28]我的爱不用讲 恨不用想\n[01:08.85]思念在发烫\n[01:10.86]看着你的脸庞 背着行囊\n[01:14.52]说要去远方\n[01:16.53]谁还记得那年我拉着你说\n[01:21.52]爱永远一样\n[01:22.91]我也搞不懂\n[01:23.62]为什么那么多真心相爱\n[01:25.30]到最后\n[01:25.83]都会变成两个人分开的无奈\n[01:28.03]当初我们说过要谈一场\n[01:29.83]永远不分手的恋爱\n[01:31.25]是否今天这句话\n[01:32.46]竟变成我们之间的阻碍\n[01:34.18]不想太多 不想太多\n[01:35.53]也许会明白的更多\n[01:36.91]不想再说 不想再说\n[01:38.29]就让我们彼此沉默\n[01:39.73]现在我们终于明白\n[01:41.20]结局却也无法更改\n[01:42.57]这场不分手的恋爱\n[01:43.93]我想结局注定失败\n[01:45.17]不知不觉不问\n[01:46.90]不痛不痒 多少的时光\n[01:50.76]不确定的某个\n[01:52.62]夜晚小巷 泪悄悄流淌\n[01:56.39]街边天气微凉\n[01:58.24]淡淡月光 我沿路哼唱\n[02:02.05]找寻我们一直\n[02:03.89]找不到的 缘分被捆绑\n[02:07.35]感觉不到你为我坚强\n[02:10.15]感觉得到你对我说谎\n[02:13.30]我安静听着肖邦\n[02:15.07]用维也纳忧伤\n[02:18.75]你的爱被埋葬 恨被收藏\n[02:22.23]痛应该原谅\n[02:24.30]我的爱不用讲 恨不用想\n[02:27.91]思念在发烫\n[02:29.93]看着你的脸庞 背着行囊\n[02:33.54]说要去远方\n[02:35.59]谁还记得那年我拉着你说\n[02:40.56]爱永远一样\n[02:41.95]你的爱被埋葬 恨被收藏\n[02:44.86]痛应该原谅\n[02:46.88]我的爱不用讲 恨不用想\n[02:50.53]思念在发烫\n[02:52.48]看着你的脸庞 背着行囊\n[02:56.12]说要去远方\n[02:58.28]谁还记得那年我拉着你说\n[03:03.19]爱永远一样\n');
INSERT INTO `musics` VALUES ('f63dca1e-bc55-4ffe-b058-fa10ebc5272f', 'upload_1785487345176', '梦里望', '浅影阿', '', 'http://111.228.9.147/minio/api/blog/e0be44aecd3b4854a6d8edd5da5aac9f.jpg', 'http://111.228.9.147/minio/api/blog/162604dba2b64963b1a4a5de73da123b.mp3', 202, 'minio', '手动上传', 0, 1, '2026-07-31 08:42:25', '2026-08-01 08:05:27', 'upload', '[00:00.00]欢迎来访爱听音乐网 www.2t58.com\r\n[ti:]\n[ar:]\n[al:]\n[by:天琴实验室AI生成v1.0]\n[offset:0]\n[00:00.00]梦里望-浅影阿\n[00:02.00]作词Lyric：千年小妖\n[00:03.00]作曲Composer：李遇知\n[00:04.00]编曲Arranger：万一@超级星声\n[00:05.00]制作人Producer：瑞琪@超级星声\n[00:06.00]和声Harmony：白荼@超级星声\n[00:07.00]吉他Guitar：万一@超级星声\n[00:08.00]混音/母带Mix Engineer：潘君明/瑞琪\n[00:09.00]制作公司Production Company ：超级星声MUSIC \n[00:10.01]企划A&R：全幺九\n[00:11.01]OP/发行：鲸鱼向海（北京）文化有限公司\n[00:12.01]【未经著作权人许可不得翻唱翻录或使用】\n[00:13.02]那年木篮装满被风吹落的枣花\n[00:18.18]阿公的蒲扇摇着记忆的盛夏\n[00:23.25]地里又长出了几个脆甜的西瓜\n[00:27.42]爱睡懒觉的老黄猫又躲在哪片屋瓦\n[00:33.42]谁家的缲车阿还在不停的吱呀\n[00:38.55]夜晚的流星对我说着悄悄话\n[00:43.68]缠着阿嬷不肯睡想吃栗子烤地瓜\n[00:48.18]还有那杯永远热的茶\n[00:52.92]梦里望田螺青青抓了一大把\n[00:58.35]池塘边鱼儿追着小脚丫\n[01:03.12]回首年少路漫漫转眼就长大\n[01:08.49]时间它模糊了远处的家\n[01:13.35]梦里望灶糖甜甜塞了一嘴巴\n[01:18.81]耳畔边谁唤着我小傻瓜\n[01:23.55]一声再见只遗憾没拥有魔法\n[01:29.01]看不到那年伴着笑声的烟花\n[01:44.88]那年木篮装满被风吹落的枣花\n[01:50.07]阿公的蒲扇摇着记忆的盛夏\n[01:55.17]地里又长出了几个脆甜的西瓜\n[01:59.34]爱睡懒觉的老黄猫又躲在哪片屋瓦\n[02:05.31]谁家的缲车阿还在不停的吱呀\n[02:10.47]夜晚的流星对我说着悄悄话\n[02:15.57]缠着阿嬷不肯睡想吃栗子烤地瓜\n[02:20.10]还有那杯永远热的茶\n[02:24.84]梦里望田螺青青抓了一大把\n[02:30.27]池塘边鱼儿追着小脚丫\n[02:35.01]回首年少路漫漫转眼就长大\n[02:40.44]时间它模糊了远处的家\n[02:45.27]梦里望灶糖甜甜塞了一嘴巴\n[02:50.73]耳畔边谁唤着我小傻瓜\n[02:55.47]一声再见只遗憾没拥有魔法\n[03:00.93]看不到那年伴着笑声的烟花\n');

-- ----------------------------
-- Table structure for operation_logs
-- ----------------------------
DROP TABLE IF EXISTS `operation_logs`;
CREATE TABLE `operation_logs`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '操作者 ID',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '操作者用户名（冗余字段，便于查询）',
  `module` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '操作模块：article/comment/link/media/music/playlist/announcement/config/user/auth 等',
  `action` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '操作类型：create/update/delete/publish/audit/login 等',
  `target_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '操作目标 ID',
  `target_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '操作目标名称/摘要（如文章标题）',
  `method` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT 'HTTP 方法',
  `path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '请求路径',
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '操作 IP',
  `user_agent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT 'User-Agent',
  `status` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'success' COMMENT '操作状态：success / fail',
  `status_code` int NULL DEFAULT NULL COMMENT 'HTTP 状态码',
  `error_msg` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL COMMENT '错误信息（失败时记录）',
  `duration` int NULL DEFAULT NULL COMMENT '请求耗时（毫秒）',
  `request_body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL COMMENT '请求参数（脱敏后 JSON，限 2KB）',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_520_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of operation_logs
-- ----------------------------
INSERT INTO `operation_logs` VALUES ('0b0daf43-7348-489c-97cb-12fb73b4dd66', '1', 'admin', 'config', 'update', NULL, NULL, 'PUT', '/api/v1/admin/settings', '::1', 'node', 'success', 200, NULL, 10, '{\"configs\":[{\"key\":\"site_name\",\"value\":\"LinzyBlog\"}]}', '2026-08-01 11:52:22');
INSERT INTO `operation_logs` VALUES ('4538f29d-6c6b-4a6e-912d-8bf004bb7708', NULL, '', 'auth', 'login', NULL, NULL, 'POST', '/api/v1/auth/login', '::ffff:192.168.48.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) blog-admin/1.0.0 Chrome/130.0.6723.191 Electron/33.4.11 Safari/537.36', 'success', 200, NULL, 138, '{\"username\":\"admin\",\"password\":\"***\"}', '2026-08-01 15:01:06');
INSERT INTO `operation_logs` VALUES ('69820841-f9e1-4438-a2e9-ae492907d6be', NULL, '', 'auth', 'login', NULL, NULL, 'POST', '/api/v1/auth/login', '::ffff:192.168.48.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) blog-admin/1.0.0 Chrome/130.0.6723.191 Electron/33.4.11 Safari/537.36', 'success', 200, NULL, 145, '{\"username\":\"admin\",\"password\":\"***\"}', '2026-08-02 09:35:36');
INSERT INTO `operation_logs` VALUES ('69bc1051-fcf6-401e-a5c5-edfcbe551e19', '1', 'admin', 'config', 'update', NULL, '系统配置（5 项）', 'PUT', '/api/v1/admin/settings', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'success', 200, NULL, 5, '{\"configs\":[{\"key\":\"site_name\",\"value\":\"LinzyBlog\"},{\"key\":\"site_description\",\"value\":\"一个专注于 Vue、Node.js 与全栈开发的技术博客。在这里分享实践、工具与踩坑记录。\"},{\"key\":\"site_url\",\"value\":\"\"},{\"key\":\"site_logo\",\"value\":\"/uploads/fc769bddfe1649339524791a25e564c1.jpg\"},{\"key\":\"admin_email\",\"value\":\"2906594394@qq.com\"}]}', '2026-08-01 12:27:46');
INSERT INTO `operation_logs` VALUES ('83015ce9-577c-4fad-b8d6-55544d6be105', NULL, '', 'auth', 'login', NULL, NULL, 'POST', '/api/v1/auth/login', '::ffff:192.168.48.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) blog-admin/1.0.0 Chrome/130.0.6723.191 Electron/33.4.11 Safari/537.36', 'success', 200, NULL, 157, '{\"username\":\"admin\",\"password\":\"***\"}', '2026-08-01 14:46:47');
INSERT INTO `operation_logs` VALUES ('98ee64a0-256a-4a8c-9c7f-34a9f6fb374e', '1', 'admin', 'config', 'update', NULL, '系统配置（1 项）', 'PUT', '/api/v1/admin/settings', '::1', 'node', 'success', 200, NULL, 11, '{\"configs\":[{\"key\":\"site_name\",\"value\":\"LinzyBlog\"}]}', '2026-08-01 12:27:15');
INSERT INTO `operation_logs` VALUES ('ba29c9a0-20ac-4764-a6ae-e26d8e8f1595', '1', 'admin', 'media', 'delete', '473dc932-16c1-45b1-a6f4-a01ea2447201', NULL, 'DELETE', '/api/v1/media/473dc932-16c1-45b1-a6f4-a01ea2447201', '::ffff:192.168.48.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) blog-admin/1.0.0 Chrome/130.0.6723.191 Electron/33.4.11 Safari/537.36', 'success', 200, NULL, 13, '{}', '2026-08-02 12:00:20');
INSERT INTO `operation_logs` VALUES ('d889e62c-ef35-4ec7-8bc0-d48ac4817ffc', '1', 'admin', 'media', 'create', NULL, NULL, 'POST', '/api/v1/media', '::ffff:192.168.48.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) blog-admin/1.0.0 Chrome/130.0.6723.191 Electron/33.4.11 Safari/537.36', 'success', 201, NULL, 14, '{\"storage\":\"local\"}', '2026-08-02 12:00:13');
INSERT INTO `operation_logs` VALUES ('f4f2fb0b-9d44-4485-a677-71f30d973c57', '1', 'admin', 'config', 'update', NULL, NULL, 'PUT', '/api/v1/admin/settings', '::1', 'node', 'success', 200, NULL, 23, '{\"configs\":[{\"key\":\"site_name\",\"value\":\"LinzyBlog\"}]}', '2026-08-01 11:51:31');

-- ----------------------------
-- Table structure for playlist_songs
-- ----------------------------
DROP TABLE IF EXISTS `playlist_songs`;
CREATE TABLE `playlist_songs`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '主键id',
  `playlist_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '歌单 ID',
  `music_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '音乐 ID',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序权重（越小越靠前）',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_520_ci COMMENT = '歌单-音乐关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of playlist_songs
-- ----------------------------
INSERT INTO `playlist_songs` VALUES ('075994a2-75e0-493b-9780-4e47ca7da591', '39eb5f1a-2578-4c9a-843f-c0ca15e4d102', 'f63dca1e-bc55-4ffe-b058-fa10ebc5272f', 3, '2026-08-01 07:00:11', '2026-08-01 07:00:11');
INSERT INTO `playlist_songs` VALUES ('69fdb97e-f536-4129-a2ca-333b9854e5d7', '39eb5f1a-2578-4c9a-843f-c0ca15e4d102', '0936c803-c118-4277-bb8f-7048b91aa1f7', 4, '2026-08-01 07:00:11', '2026-08-01 07:00:11');

-- ----------------------------
-- Table structure for playlists
-- ----------------------------
DROP TABLE IF EXISTS `playlists`;
CREATE TABLE `playlists`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '主键id',
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '歌单名称',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '歌单描述',
  `cover` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '歌单封面图 URL',
  `is_public` tinyint(1) NULL DEFAULT 1 COMMENT '是否公开访问',
  `share_code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '分享码（用于公开访问链接）',
  `play_count` int NULL DEFAULT 0 COMMENT '播放次数',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `share_code`(`share_code` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_520_ci COMMENT = '歌单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of playlists
-- ----------------------------
INSERT INTO `playlists` VALUES ('39eb5f1a-2578-4c9a-843f-c0ca15e4d102', '我的歌单', '', '', 1, '0ebdbd8c', 27, '2026-07-30 11:37:58', '2026-08-02 12:00:37');

-- ----------------------------
-- Table structure for series
-- ----------------------------
DROP TABLE IF EXISTS `series`;
CREATE TABLE `series`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '专辑名称',
  `slug` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '别名',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '描述',
  `cover` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '封面图',
  `created_at` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `slug`(`slug` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '专辑表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of series
-- ----------------------------
INSERT INTO `series` VALUES ('3c869f67e4e040cf80ad5e58bfd57ace', '测试', '测试', '', '', '2026-07-14 07:36:03', '2026-07-14 07:36:03');

-- ----------------------------
-- Table structure for site_configs
-- ----------------------------
DROP TABLE IF EXISTS `site_configs`;
CREATE TABLE `site_configs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '配置键名',
  `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL COMMENT '配置值（JSON 字符串或纯文本）',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT 'general' COMMENT '配置分类：general/mail/upload/site',
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT '配置说明',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `config_key`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_2`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_3`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_4`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_5`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_6`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_7`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_8`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_9`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_10`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_11`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_12`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_13`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_14`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_15`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_16`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_17`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_18`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_19`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_20`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_21`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_22`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_23`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_24`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_25`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_26`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_27`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_28`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_29`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_30`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_31`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_32`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_33`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_34`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_35`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_36`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_37`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_38`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_39`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_40`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_41`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_42`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_43`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_44`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_45`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_46`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_47`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_48`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_49`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_50`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_51`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_52`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_53`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_54`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_55`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_56`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_57`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_58`(`config_key` ASC) USING BTREE,
  UNIQUE INDEX `config_key_59`(`config_key` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 35 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_520_ci COMMENT = '系统配置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of site_configs
-- ----------------------------
INSERT INTO `site_configs` VALUES (1, 'site_name', 'LinzyBlog', 'site', '站点名称', '2026-07-29 06:43:33', '2026-08-01 11:51:31');
INSERT INTO `site_configs` VALUES (2, 'site_description', '一个专注于 Vue、Node.js 与全栈开发的技术博客。在这里分享实践、工具与踩坑记录。', 'site', '站点描述', '2026-07-29 06:43:33', '2026-07-29 12:30:46');
INSERT INTO `site_configs` VALUES (3, 'site_url', '', 'site', '站点地址（用于邮件链接、sitemap）', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (4, 'admin_email', '2906594394@qq.com', 'site', '管理员邮箱', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (5, 'mail_host', 'smtp.qq.com', 'mail', 'SMTP 服务器地址', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (6, 'mail_port', '465', 'mail', 'SMTP 端口', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (7, 'mail_secure', 'true', 'mail', '是否启用 SSL', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (8, 'mail_user', '2906594394@qq.com', 'mail', '发件邮箱账号', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (9, 'mail_pass', 'jskkbfdnztraddhg', 'mail', 'SMTP 授权码', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (10, 'mail_from_name', 'LinzyBlog', 'mail', '发件人显示名称', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (11, 'upload_dir', './uploads', 'upload', '本地上传目录', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (12, 'upload_max_size', '10mb', 'upload', '文件大小上限', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (13, 'upload_default_storage', 'minio', 'upload', '默认上传源：local / minio', '2026-07-29 06:43:33', '2026-07-31 08:37:14');
INSERT INTO `site_configs` VALUES (14, 'minio_enabled', 'true', 'upload', '是否启用 MinIO', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (15, 'minio_endpoint', 'http://111.228.9.147:9000', 'upload', 'MinIO 服务地址', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (16, 'minio_port', '9000', 'upload', 'MinIO 端口', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (17, 'minio_use_ssl', 'false', 'upload', 'MinIO 是否使用 SSL', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (18, 'minio_access_key', 'admin', 'upload', 'MinIO AccessKey', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (19, 'minio_secret_key', 'Admin@123456', 'upload', 'MinIO SecretKey', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (20, 'minio_bucket', 'blog', 'upload', 'MinIO 桶名', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (21, 'minio_public_base_url', 'http://111.228.9.147:9000', 'upload', 'MinIO 公开访问基址（用于拼接 URL）', '2026-07-29 06:43:33', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (22, 'github_token', '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', 'crawler', 'GitHub Personal Access Token（用于仓库搜索与内容爬取，避免 60次/小时限流）', '2026-07-29 09:16:48', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (23, 'site_logo', '/uploads/fc769bddfe1649339524791a25e564c1.jpg', 'site', '站点 Logo 地址（客户端/管理端共用，支持本地路径或完整 URL）', '2026-07-29 12:20:21', '2026-07-29 12:26:23');
INSERT INTO `site_configs` VALUES (24, 'minio_region', '', 'upload', 'MinIO Region（非空时覆盖默认 region，如 us-east-1）', '2026-07-31 08:37:14', '2026-07-31 08:37:14');
INSERT INTO `site_configs` VALUES (25, 'pexels_api_key', '', 'image_crawler', 'Pexels API Key（在 https://www.pexels.com/api/ 申请）', '2026-08-01 10:38:14', '2026-08-01 10:38:14');
INSERT INTO `site_configs` VALUES (26, 'pixabay_api_key', '', 'image_crawler', 'Pixabay API Key（在 https://pixabay.com/accounts/register/ 申请）', '2026-08-01 10:38:14', '2026-08-01 10:38:14');
INSERT INTO `site_configs` VALUES (27, 'unsplash_api_key', '', 'image_crawler', 'Unsplash Access Key（在 https://unsplash.com/developers 申请）', '2026-08-01 10:38:14', '2026-08-01 10:38:14');
INSERT INTO `site_configs` VALUES (28, 'doubao_api_key', 'ark-c3bfc665-05a5-4260-8993-12b73925ee39-0e881', 'ai', '豆包 API Key（火山引擎控制台获取）', '2026-08-01 10:38:14', '2026-08-01 10:48:20');
INSERT INTO `site_configs` VALUES (29, 'doubao_base_url', 'https://ark.cn-beijing.volces.com/api/v3', 'ai', '豆包 API Base URL', '2026-08-01 10:38:14', '2026-08-01 10:38:38');
INSERT INTO `site_configs` VALUES (30, 'doubao_chat_model', 'doubao-seed-2-0-mini-260428', 'ai', '豆包对话模型 ID', '2026-08-01 10:38:14', '2026-08-01 10:48:20');
INSERT INTO `site_configs` VALUES (31, 'doubao_image_model', 'doubao-seedream-4-5-251128', 'ai', '豆包图片生成模型 ID', '2026-08-01 10:38:14', '2026-08-01 10:48:20');
INSERT INTO `site_configs` VALUES (32, 'ollama_host', 'http://localhost:11434', 'ai', 'Ollama 服务地址', '2026-08-01 10:38:14', '2026-08-01 10:38:14');
INSERT INTO `site_configs` VALUES (33, 'ollama_chat_enabled', 'true', 'ai', '是否启用 Ollama 本地对话（不可用时降级到豆包云端）', '2026-08-01 10:38:14', '2026-08-01 10:38:14');
INSERT INTO `site_configs` VALUES (34, 'ollama_chat_model', 'qwen2.5:7b', 'ai', 'Ollama 对话模型名称（如 glm4:9b）', '2026-08-01 10:38:14', '2026-08-01 10:48:57');

-- ----------------------------
-- Table structure for subscribers
-- ----------------------------
DROP TABLE IF EXISTS `subscribers`;
CREATE TABLE `subscribers`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `status` enum('pending','active','unsubscribed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT 'pending' COMMENT 'pending 待确认 / active 已确认 / unsubscribed 已退订',
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT '确认/退订令牌',
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NULL DEFAULT NULL COMMENT 'ip',
  `created_at` datetime NULL DEFAULT NULL,
  `updated_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_520_ci COMMENT = '邮箱订阅表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of subscribers
-- ----------------------------
INSERT INTO `subscribers` VALUES (1, 'test@example.com', 'active', '28eacccc723c569c4a957de0479b06fb20e77f7f14154e488818767a327b64b1', '::1', '2026-07-28 16:09:14', '2026-07-28 16:09:24');

-- ----------------------------
-- Table structure for tags
-- ----------------------------
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标签名',
  `slug` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '别名',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_2`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_2`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_3`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_3`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_4`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_4`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_5`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_5`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_6`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_6`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_7`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_7`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_8`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_8`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_9`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_9`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_10`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_10`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_11`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_11`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_12`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_12`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_13`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_13`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_14`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_14`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_15`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_15`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_16`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_16`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_17`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_17`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_18`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_18`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_19`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_19`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_20`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_20`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_21`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_21`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_22`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_22`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_23`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_23`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_24`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_24`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_25`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_25`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_26`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_26`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_27`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_27`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_28`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_28`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_29`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_29`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_30`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_30`(`slug` ASC) USING BTREE,
  UNIQUE INDEX `name_31`(`name` ASC) USING BTREE,
  UNIQUE INDEX `slug_31`(`slug` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '标签表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of tags
-- ----------------------------
INSERT INTO `tags` VALUES ('0009b913-91ea-4e84-8b5a-0fc5a6db9ac8', '后端开发', '后端开发');
INSERT INTO `tags` VALUES ('0410dc644aed4efc915eb2679ba6bab0', 'C++', 'c');
INSERT INTO `tags` VALUES ('1', 'Vue3', 'vue3');
INSERT INTO `tags` VALUES ('13', '微服务', '微服务');
INSERT INTO `tags` VALUES ('14', 'Spring Boot', 'spring-boot');
INSERT INTO `tags` VALUES ('15', 'Java后端', 'java后端');
INSERT INTO `tags` VALUES ('16', '云原生', '云原生');
INSERT INTO `tags` VALUES ('1f09da0619fa4c07b43aa361c7ca0a03', '面向对象编程', '面向对象编程');
INSERT INTO `tags` VALUES ('23a52a7081f2499b8da52f0be5428321', 'Node.js', 'node.js');
INSERT INTO `tags` VALUES ('3', 'TypeScript', 'typescript');
INSERT INTO `tags` VALUES ('3289c843623544a1ac92985d5b805de7', 'Go语言', 'go语言');
INSERT INTO `tags` VALUES ('3ab0e8e898324ce58e58f4fd2de9ac66', '并发', '并发');
INSERT INTO `tags` VALUES ('4749b8b3757b49798db7f0c42b0dc30c', '源码解析', '源码解析');
INSERT INTO `tags` VALUES ('484b4f48-4d7f-4f8c-bf41-9f833860cc9b', '异步编程', '异步编程');
INSERT INTO `tags` VALUES ('5', 'AI', 'ai');
INSERT INTO `tags` VALUES ('526c7e8736a3411ba78a6048f2bf2f44', '性能', '性能');
INSERT INTO `tags` VALUES ('5dbfe7eb-89e1-4d18-a307-579e52708a9b', '性能优化', '性能优化');
INSERT INTO `tags` VALUES ('6b8b716c63da4c269a126a2e3b180621', '后端', '后端');
INSERT INTO `tags` VALUES ('7', 'web开发', 'web开发');
INSERT INTO `tags` VALUES ('75647e55-0ccb-4844-a25e-3d8064f4de6e', '云计算', '云计算');
INSERT INTO `tags` VALUES ('7f48f3c5022a4cef9c22f7c2f283a5bf', 'Nuxt', 'nuxt');
INSERT INTO `tags` VALUES ('8eb40e39591f40d2af365a13883f253c', 'Agent', 'agent');
INSERT INTO `tags` VALUES ('9', 'GLM5.1', 'glm51');
INSERT INTO `tags` VALUES ('9fe73bddc1bd41e0ad16ddf9e6cb8f04', 'goroutine', 'goroutine');
INSERT INTO `tags` VALUES ('a7d9f7ad8c3642c1a34b3865235a996d', 'Express', 'express');
INSERT INTO `tags` VALUES ('aa10c9139ede4aaeafef38fe65508412', 'Java 开发', 'java-开发');
INSERT INTO `tags` VALUES ('aabbc09cf0144cdd82176bf157a687b3', '编程', '编程');
INSERT INTO `tags` VALUES ('bedd77a0e2c9496bab3683050cdf19b9', 'channel', 'channel');
INSERT INTO `tags` VALUES ('c12d4e0be38b48f8ac4791df6084e81c', 'LangChain', 'langchain');
INSERT INTO `tags` VALUES ('d58a6c36-a842-43fc-91bd-4f7fa1583edd', 'NodeJS', 'nodejs');
INSERT INTO `tags` VALUES ('db4abadd762e42689229b2a0d19203ae', 'LLM', 'llm');
INSERT INTO `tags` VALUES ('db54e583f7f248e3bef570dc960e121b', '系统级软件', '系统级软件');
INSERT INTO `tags` VALUES ('eb5750ef7ddb4293aeb5aa15b4474fac', '简洁性', '简洁性');
INSERT INTO `tags` VALUES ('ed6a1dfc9c6a41629841ce4795a61e64', '全栈', '全栈');
INSERT INTO `tags` VALUES ('efc4c4d44ea04ac38be8af9a0ffb99ab', '响应式', '响应式');
INSERT INTO `tags` VALUES ('f0c1c6e5e8db4879b9c6e836b87d5921', '中间件', '中间件');
INSERT INTO `tags` VALUES ('f19f9321b84c461385b89c8ed574afed', '游戏开发', '游戏开发');
INSERT INTO `tags` VALUES ('f3c35ad2589a41348d9962df822e8d0c', 'Playwright', 'playwright');
INSERT INTO `tags` VALUES ('fbdf625fbd95469caadb5df851a9ad08', 'SSR', 'ssr');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
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
  UNIQUE INDEX `email_3`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_4`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_4`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_5`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_5`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_6`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_6`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_7`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_7`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_8`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_8`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_9`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_9`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_10`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_10`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_11`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_11`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_12`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_12`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_13`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_13`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_14`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_14`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_15`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_15`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_16`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_16`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_17`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_17`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_18`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_18`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_19`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_19`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_20`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_20`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_21`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_21`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_22`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_22`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_23`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_23`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_24`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_24`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_25`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_25`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_26`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_26`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_27`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_27`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_28`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_28`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_29`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_29`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_30`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_30`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_31`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_31`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_32`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, '12小熙', 'admin', '2906594394@qq.com', '$2a$10$Za4QR5RZ7zlom8gQ.8yKReuIYkDsxLTVAAiE46vv0aElN942g9gJq', '/uploads/75726c917da84cd9b6c53316002ec50d.jpg', 'admin', '2026-05-21 09:08:06');

-- ----------------------------
-- Table structure for visitor_logs
-- ----------------------------
DROP TABLE IF EXISTS `visitor_logs`;
CREATE TABLE `visitor_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `article_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `user_agent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `article_id`(`article_id` ASC) USING BTREE,
  INDEX `idx_action_created`(`action` ASC, `created_at` ASC) USING BTREE,
  CONSTRAINT `visitor_logs_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 110 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '访客日志' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of visitor_logs
-- ----------------------------
INSERT INTO `visitor_logs` VALUES (1, 'f96e8100b5c746a3871848f1427a8800', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.19041.6456', 'view', '本地', '本地/内网', '2026-07-29 05:07:03');
INSERT INTO `visitor_logs` VALUES (75, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-29 05:57:06');
INSERT INTO `visitor_logs` VALUES (76, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-29 05:57:41');
INSERT INTO `visitor_logs` VALUES (77, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-29 05:59:40');
INSERT INTO `visitor_logs` VALUES (78, '950ff22260a04c9692b84daa7b070a49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-29 06:02:58');
INSERT INTO `visitor_logs` VALUES (79, '950ff22260a04c9692b84daa7b070a49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-29 06:04:57');
INSERT INTO `visitor_logs` VALUES (80, 'f96e8100b5c746a3871848f1427a8800', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-29 06:15:42');
INSERT INTO `visitor_logs` VALUES (81, '2e4441d2233f456a8ed3947e65776a0b', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-29 12:19:36');
INSERT INTO `visitor_logs` VALUES (82, '950ff22260a04c9692b84daa7b070a49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-29 12:23:07');
INSERT INTO `visitor_logs` VALUES (83, '2e4441d2233f456a8ed3947e65776a0b', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-29 12:36:23');
INSERT INTO `visitor_logs` VALUES (84, '9083775b9add481eab7c10ea2224bcf3', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-29 12:36:52');
INSERT INTO `visitor_logs` VALUES (85, '2e4441d2233f456a8ed3947e65776a0b', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-29 13:11:33');
INSERT INTO `visitor_logs` VALUES (86, '3ce7d5b12fb84061bc20dd27df9b432e', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-30 04:22:20');
INSERT INTO `visitor_logs` VALUES (87, '6e0a83add5514b9a868508b04381a9f1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-30 04:26:46');
INSERT INTO `visitor_logs` VALUES (88, 'f96e8100b5c746a3871848f1427a8800', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-30 10:25:54');
INSERT INTO `visitor_logs` VALUES (89, '2e4441d2233f456a8ed3947e65776a0b', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-30 16:22:18');
INSERT INTO `visitor_logs` VALUES (90, '2e4441d2233f456a8ed3947e65776a0b', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-07-31 06:40:09');
INSERT INTO `visitor_logs` VALUES (91, '30162c8ec03f4bf38520b0505d1f4f6c', '114.114.114.114', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'view', '山东', '济南市', '2026-07-31 15:26:20');
INSERT INTO `visitor_logs` VALUES (92, '30162c8ec03f4bf38520b0505d1f4f6c', '8.8.8.8', 'Mozilla/5.0', 'view', '美国', 'Ashburn', '2026-07-31 15:26:45');
INSERT INTO `visitor_logs` VALUES (93, '30162c8ec03f4bf38520b0505d1f4f6c', '1.1.1.1', 'Mozilla/5.0', 'view', '澳大利亞', 'South Brisbane', '2026-07-31 15:26:45');
INSERT INTO `visitor_logs` VALUES (94, '30162c8ec03f4bf38520b0505d1f4f6c', '223.5.5.5', 'Mozilla/5.0', 'view', '浙江', '杭州', '2026-07-31 15:26:46');
INSERT INTO `visitor_logs` VALUES (95, '30162c8ec03f4bf38520b0505d1f4f6c', '119.29.29.29', 'Mozilla/5.0', 'view', '广东', '广州市', '2026-07-31 15:26:46');
INSERT INTO `visitor_logs` VALUES (96, '30162c8ec03f4bf38520b0505d1f4f6c', '180.76.76.76', 'Mozilla/5.0', 'view', '北京', '北京', '2026-07-31 15:26:46');
INSERT INTO `visitor_logs` VALUES (97, '30162c8ec03f4bf38520b0505d1f4f6c', '117.50.60.60', 'Mozilla/5.0', 'view', '上海', 'Yangpu', '2026-07-31 15:26:46');
INSERT INTO `visitor_logs` VALUES (98, '30162c8ec03f4bf38520b0505d1f4f6c', '144.144.144.144', 'Mozilla/5.0', 'view', '美国', 'Whitehall', '2026-07-31 15:26:47');
INSERT INTO `visitor_logs` VALUES (99, '3ce7d5b12fb84061bc20dd27df9b432e', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-08-01 08:23:10');
INSERT INTO `visitor_logs` VALUES (100, '8aa8821ecd3c43b1ba5eaa08a57a76bf', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-08-01 11:30:23');
INSERT INTO `visitor_logs` VALUES (101, '8aa8821ecd3c43b1ba5eaa08a57a76bf', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-08-01 11:30:49');
INSERT INTO `visitor_logs` VALUES (102, '8aa8821ecd3c43b1ba5eaa08a57a76bf', '::ffff:192.168.48.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) blog-admin/1.0.0 Chrome/130.0.6723.191 Electron/33.4.11 Safari/537.36', 'view', '本地', '本地/内网', '2026-08-02 09:47:24');
INSERT INTO `visitor_logs` VALUES (103, '8aa8821ecd3c43b1ba5eaa08a57a76bf', '::ffff:192.168.48.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) blog-admin/1.0.0 Chrome/130.0.6723.191 Electron/33.4.11 Safari/537.36', 'view', '本地', '本地/内网', '2026-08-02 10:59:33');
INSERT INTO `visitor_logs` VALUES (104, '2e4441d2233f456a8ed3947e65776a0b', '::ffff:192.168.48.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) blog-admin/1.0.0 Chrome/130.0.6723.191 Electron/33.4.11 Safari/537.36', 'view', '本地', '本地/内网', '2026-08-02 11:01:23');
INSERT INTO `visitor_logs` VALUES (105, '8aa8821ecd3c43b1ba5eaa08a57a76bf', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-08-02 11:52:17');
INSERT INTO `visitor_logs` VALUES (106, '8aa8821ecd3c43b1ba5eaa08a57a76bf', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-08-02 11:57:32');
INSERT INTO `visitor_logs` VALUES (107, '8aa8821ecd3c43b1ba5eaa08a57a76bf', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-08-02 11:58:50');
INSERT INTO `visitor_logs` VALUES (108, '2e4441d2233f456a8ed3947e65776a0b', '::ffff:192.168.48.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) blog-admin/1.0.0 Chrome/130.0.6723.191 Electron/33.4.11 Safari/537.36', 'view', '本地', '本地/内网', '2026-08-02 12:00:32');
INSERT INTO `visitor_logs` VALUES (109, '2e4441d2233f456a8ed3947e65776a0b', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'view', '本地', '本地/内网', '2026-08-02 12:00:37');

SET FOREIGN_KEY_CHECKS = 1;
