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

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 10000);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: abortController.signal,
          body: JSON.stringify({
            teacher_type: 'data_eval',
            messages: [
              {
                role: 'user',
                content: `这是我录入的特定测点数据：${cellId} = ${value} mm，请给出评价。`
              }
            ],
            stream: true
          })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(`API Request failed with status ${response.status}: ${errData.detail || response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Response body is null");

        const decoder = new TextDecoder();
        let aggregatedText = "";

        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(chunk);
          const lines = chunkText.split('\n');

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
            
            if (trimmedLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmedLine.slice(6));
                const content = data.choices?.[0]?.delta?.content || "";
                aggregatedText += content;
                currentResult.value = aggregatedText;
              } catch (e) {
                // Ignore parsing errors for partial chunks
              }
            }
          }
        }

        evalCache.set(cacheKey, aggregatedText);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          error.value = "请求超时 (10s)，请稍后再试。";
        } else {
          console.error("Evaluation Error:", err);
          error.value = `请求老师评价失败: ${err.message || err}`;
        }
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
