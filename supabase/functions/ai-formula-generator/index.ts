import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestPayload {
  description: string;
  availableFields: Array<{ id: string; label: string; type: string }>;
  availableTables: Array<{ id: string; name: string; description: string }>;
  availableFormulas: Array<{ id: string; name: string }>;
}

interface FormulaResponse {
  formula: string;
  explanation: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { description, availableFields, availableTables, availableFormulas }: RequestPayload = await req.json();

    if (!description) {
      return new Response(
        JSON.stringify({ error: "缺少描述参数" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 从环境变量获取 OpenAI API Key
    // 注意: 需要在 Supabase 项目设置中添加 OPENAI_API_KEY 环境变量
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "未配置 OpenAI API Key，请联系管理员" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 构建提示词
    const systemPrompt = `你是一个专业的保险计算公式生成助手。你需要将用户的自然语言描述转换为标准的公式表达式。

公式语法规则：
1. 使用 $fieldId 引用表单字段，例如：$age（年龄）、$gender（性别）、$occupation（职业）
2. 使用 @formulaId 引用其他公式的计算结果，例如：@mainPremium（主险保费）
3. 使用 LOOKUP(tableId, rowKey, colKey) 查询系数表
4. 支持的内置函数：
   - ROUND(value, decimals)：四舍五入
   - FLOOR(value)：向下取整
   - CEIL(value)：向上取整
   - ABS(value)：绝对值
   - MIN(...args)：最小值
   - MAX(...args)：最大值
   - SUM(...args)：求和
   - AVG(...args)：平均值
   - IF(condition, trueVal, falseVal)：条件判断
5. 支持基本运算符：+、-、*、/、()、>、<、>=、<=、==、!=

可用的表单字段：
${availableFields.map(f => `- $${f.id}: ${f.label} (${f.type})`).join("\n")}

可用的系数表：
${availableTables.map(t => `- ${t.id}: ${t.name} - ${t.description}`).join("\n")}

可用的公式引用：
${availableFormulas.map(f => `- @${f.id}: ${f.name}`).join("\n")}

请根据用户描述生成公式，只返回公式表达式，不要有多余的解释。确保公式符合语法规则。`;

    const userPrompt = `请将以下描述转换为公式表达式：${description}`;

    // 调用 OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
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
    const generatedFormula = openaiData.choices[0]?.message?.content?.trim() || "";

    // 再次调用 AI 生成解释
    const explanationResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "你是一个专业的保险计算公式解释助手。请用简洁的中文解释公式的计算逻辑。" },
          { role: "user", content: `请解释这个公式的计算逻辑（50字以内）：${generatedFormula}` }
        ],
        temperature: 0.5,
        max_tokens: 200,
      }),
    });

    let explanation = "AI 生成的公式";
    if (explanationResponse.ok) {
      const explanationData = await explanationResponse.json();
      explanation = explanationData.choices[0]?.message?.content?.trim() || explanation;
    }

    const result: FormulaResponse = {
      formula: generatedFormula,
      explanation: explanation,
    };

    return new Response(
      JSON.stringify(result),
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
      JSON.stringify({ error: "服务器内部错误" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
