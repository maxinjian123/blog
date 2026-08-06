/**
 * 客户端设计模式参考文档：全部 API 接口
 * 由 Swagger 规范（config/swagger.js，覆盖全部路由的 JSDoc 注解）动态生成，
 * 管理端「接口文档」页签通过 GET /api/v1/site/api-docs 获取。
 * 结构：{ total, groups: [{ title(标签), items: [...] }] }
 */
const swaggerSpecs = require('../config/swagger');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/** 根据 schema 生成示例值（支持 $ref / enum / 常见格式） */
function buildSample(schema = {}, depth = 0, seen = []) {
  if (!schema || depth > 4) return 'xxx';
  if (schema.example !== undefined) return schema.example;
  if (schema.$ref) {
    const name = String(schema.$ref).split('/').pop();
    if (seen.includes(name)) return '...';
    const refSchema = swaggerSpecs.components?.schemas?.[name];
    if (refSchema) return buildSample(refSchema, depth + 1, [...seen, name]);
    return name;
  }
  if (schema.enum && schema.enum.length) return schema.enum[0];
  const type = schema.type;
  if (type === 'integer' || type === 'number') return 1;
  if (type === 'boolean') return true;
  if (type === 'array') return [buildSample(schema.items || {}, depth, seen)];
  if (type === 'object' || schema.properties) {
    const out = {};
    for (const [k, v] of Object.entries(schema.properties || {})) {
      out[k] = buildSample(v, depth, seen);
    }
    return out;
  }
  if (type === 'string') {
    if (schema.format === 'date-time') return '2026-01-01T00:00:00.000Z';
    if (schema.format === 'email') return 'user@example.com';
    return schema.example || 'xxx';
  }
  return 'xxx';
}

/** 从 requestBody 提取 JSON 请求体示例 */
function extractBodyExample(requestBody) {
  if (!requestBody) return null;
  const json = requestBody.content?.['application/json'];
  if (!json || !json.schema) return null;
  if (json.example !== undefined) return json.example;
  return buildSample(json.schema);
}

/** 从响应中提取 JSON 返回示例（优先 200/201/204；无 Schema 时给出通用包装结构） */
function extractResponseExample(responses) {
  if (!responses) return null;
  for (const code of ['200', '201', '204']) {
    const resp = responses[code];
    const json = resp?.content?.['application/json'];
    if (json && json.schema) {
      if (json.example !== undefined) return json.example;
      return buildSample(json.schema);
    }
    if (resp && resp.example !== undefined) return resp.example;
  }
  // 兜底：接口统一返回 { code, message, data } 包装结构
  const firstCode = Object.keys(responses).find((c) => /^2\d\d$/.test(c));
  if (firstCode) {
    return {code: Number(firstCode), message: 'success', data: null};
  }
  return null;
}

/** 构建 BlogAPI 调用示例 */
function buildUsage(method, path, op) {
  const queryParams = (op.parameters || []).filter((p) => p.in === 'query');
  const arg = {};
  for (const q of queryParams) {
    arg[q.name] = buildSample(q.schema || {}, 0);
  }
  const m = method.toLowerCase();
  const qs = Object.keys(arg).length ? `, ${JSON.stringify(arg).replace(/"/g, "'")}` : '';
  if (method === 'GET' || method === 'DELETE') {
    return method === 'GET' ? `BlogAPI.get('${path}'${qs})` : `BlogAPI.del('${path}'${qs})`;
  }
  const body = extractBodyExample(op.requestBody);
  const bodyStr = body ? JSON.stringify(body, null, 2) : '{}';
  return `BlogAPI.${m}('${path}', ${bodyStr})`;
}

/** 由 Swagger 规范生成全部接口文档 */
function buildApiDocs() {
  const groups = [];
  const groupIndex = {};
  const paths = swaggerSpecs.paths || {};

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!HTTP_METHODS.includes(method)) continue;
      const tag = (op.tags && op.tags[0]) || '其他';
      const auth = Array.isArray(op.security) && op.security.some((s) => s && s.BearerAuth);

      const parameters = (op.parameters || []).map((p) => ({
        name: p.name,
        in: p.in,
        required: !!p.required,
        description: p.description || '',
        type: (p.schema || {}).type || 'string'
      }));

      const item = {
        method: method.toUpperCase(),
        path,
        summary: op.summary || op.description || '',
        description: op.description || op.summary || '',
        tag,
        auth,
        parameters,
        requestBody: extractBodyExample(op.requestBody),
        responseExample: extractResponseExample(op.responses),
        usage: buildUsage(method.toUpperCase(), path, op)
      };

      if (!groupIndex[tag]) {
        groupIndex[tag] = {title: tag, items: []};
        groups.push(groupIndex[tag]);
      }
      groupIndex[tag].items.push(item);
    }
  }

  // 排序：组按标签名，组内按路径
  groups.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
  for (const g of groups) {
    g.items.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
  }

  return {
    total: groups.reduce((sum, g) => sum + g.items.length, 0),
    groups
  };
}

module.exports = buildApiDocs();
