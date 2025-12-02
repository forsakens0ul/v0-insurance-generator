import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestPayload {
  prompt: string;
  agent: "auto" | "gpt4" | "claude" | "custom";
  context?: Record<string, any>;
}

interface QuoterConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  fields: any[];
  coefficientTables: any[];
  formulas: any[];
  sections: any[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { prompt, agent, context }: RequestPayload = await req.json();

    if (!prompt || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: "请提供报价器需求描述" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "未配置 AI API Key，请在 Supabase 项目设置中添加 OPENAI_API_KEY" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = `你是一个专业的保险报价器配置生成专家。你需要根据用户的自然语言描述，生成一个完整的保险报价器配置 JSON。

配置结构说明：
1. **fields**（字段数组）：表单字段配置
   - id: 字段唯一标识（使用驼峰命名）
   - name: 字段中文名称
   - label: 显示标签
   - type: 字段类型（"radio" | "select" | "number" | "text" | "array"）
   - required: 是否必填（boolean）
   - options: 选项列表（radio/select 类型需要）
   - min/max: 数值范围（number 类型）
   - suffix: 后缀单位（如"岁"、"元"）
   - defaultValue: 默认值

2. **coefficientTables**（系数表数组）：用于费率计算的二维表格
   - id: 系数表唯一标识
   - name: 系数表名称
   - description: 说明
   - rowKeyName: 行键名称
   - colKeyName: 列键名称
   - data: 数据对象（Record<string, Record<string, number>>）

3. **formulas**（公式数组）：计算公式配置
   - id: 公式唯一标识
   - name: 公式名称
   - description: 说明
   - expression: 公式表达式
     * 使用 $fieldId 引用字段（如 $age）
     * 使用 @formulaId 引用其他公式（如 @basePremium）
     * 使用 LOOKUP(tableId, rowKey, colKey) 查询系数表
     * 支持函数：ROUND, IF, MIN, MAX, SUM, AVG 等
   - dependencies: 依赖的字段和公式 ID 数组
   - showInResult: 是否在结果中显示
   - unit: 单位

4. **sections**（分组数组）：字段分组展示
   - id: 分组唯一标识
   - title: 分组标题
   - fieldIds: 包含的字段 ID 数组
   - collapsible: 是否可折叠

设计原则：
- 字段命名使用驼峰格式（如 age, occupation, insuranceAmount）
- 系数表要基于保险行业常识设计（年龄段、职业类别、风险等级）
- 公式要层层递进，先算基础值，再乘系数，最后汇总
- 最终保费公式 ID 必须为 "totalPremium"
- 合理设置默认值，方便用户快速体验

示例公式：
- 基础保费：ROUND($insuranceAmount * 0.01, 2)
- 年龄系数查询：LOOKUP(ageRateTable, $age, $occupation)
- 最终保费：ROUND(@basePremium * @ageCoefficient * @occupationCoefficient, 2)

请严格按照 JSON 格式输出，不要添加任何额外的解释文字。`;

    const userPrompt = `请生成保险报价器配置：${prompt}

输出 JSON 格式，包含以下字段：
{
  "id": "唯一标识",
  "name": "报价器名称",
  "title": "报价器标题",
  "description": "简短描述",
  "fields": [...],
  "coefficientTables": [...],
  "formulas": [...],
  "sections": [...]
}`;

    const model = agent === "gpt4" ? "gpt-4o" : "gpt-4o-mini";

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("OpenAI API 错误:", errorData);
      return new Response(
        JSON.stringify({ error: "AI 服务调用失败，请稍后重试" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const generatedContent = openaiData.choices[0]?.message?.content?.trim() || "{}";

    let config: QuoterConfig;
    try {
      config = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error("JSON 解析错误:", parseError);
      return new Response(
        JSON.stringify({ error: "生成的配置格式错误，请重试" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!config.id || !config.fields || !config.formulas) {
      return new Response(
        JSON.stringify({ error: "生成的配置不完整，请重试" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!config.coefficientTables) {
      config.coefficientTables = [];
    }

    if (!config.sections || config.sections.length === 0) {
      config.sections = [
        {
          id: "basic-info",
          title: "基本信息",
          fieldIds: config.fields.map((f: any) => f.id),
          collapsible: false
        }
      ];
    }

    return new Response(
      JSON.stringify({ config }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("处理请求时发生错误:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "服务器内部错误"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
