import { ref, reactive } from 'vue';

export function useEvaluator() {
  const hoveredCell = ref<string | null>(null);
  const isLoading = ref(false);
  const currentResult = ref("");
  const error = ref("");
  
  // Cache to store responses. Key format: "cellId_value" (e.g., "L2_15.34")
  const evalCache = reactive<Map<string, string>>(new Map());
  
  let hoverTimer: number | null = null;

  const clearTimer = () => {
    if (hoverTimer !== null) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  };

  const handleMouseEnter = (cellId: string, value: string) => {
    clearTimer();
    
    // Only evaluate if there's an actual value
    if (!value || value.trim() === "") return;

    // Start 1-second hover timer
    hoverTimer = window.setTimeout(async () => {
      hoveredCell.value = cellId;
      error.value = "";
      
      const cacheKey = `${cellId}_${value}`;
      if (evalCache.has(cacheKey)) {
        currentResult.value = evalCache.get(cacheKey)!;
        isLoading.value = false;
        return;
      }

      isLoading.value = true;
      currentResult.value = "";

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            teacher_type: 'data_eval',
            messages: [
              {
                role: 'user',
                content: `这是我录入的特定测点数据：${cellId} = ${value} mm，请给出评价。`
              }
            ],
            stream: false
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(`API Request failed with status ${response.status}: ${errData.detail || response.statusText}`);
        }

        const data = await response.json();
        let resultText = data.response;
        
        // 由于后端可能返回了JSON Schema约束的结构化输出，尝试解析它
        try {
           const parsed = JSON.parse(resultText);
           if (parsed.evaluation) {
               resultText = parsed.evaluation;
           } else if (parsed.message) {
               resultText = parsed.message;
           }
        } catch (e) {
           // 不是 JSON 格式，保留原文
        }
        
        resultText = resultText || "老师看过了，但没有给出具体反馈。";
        
        currentResult.value = resultText;
        evalCache.set(cacheKey, resultText);
      } catch (err: any) {
        console.error("Evaluation Error:", err);
        error.value = `请求老师评价失败: ${err.message || err}`;
      } finally {
        isLoading.value = false;
      }
    }, 1000);
  };

  const handleMouseLeave = () => {
    clearTimer();
    hoveredCell.value = null;
    isLoading.value = false;
    currentResult.value = "";
    error.value = "";
  };

  return {
    hoveredCell,
    isLoading,
    currentResult,
    error,
    handleMouseEnter,
    handleMouseLeave
  };
}
