import { reactive } from 'vue';

// ============================================================================
// TYPES 
// ============================================================================

export interface FormData {
  L: string[];         // 位移 L₀...L₉ (10 values, mm)
  deltaL: string[];    // 差值 ΔL₀...ΔL₄ (5 values, mm)
  deltaLBar: string;   // 平均值 ΔL̄
  uDeltaL: string;     // 不确定度 u_ΔL
  lambdaBar: string;   // 波长 λ̄
  uLambda: string;     // 不确定度 u_λ
  f: string;           // 频率 f (kHz)
  uf: string;          // 不确定度 u_f
  vBar: string;        // 声速 v̄ (m/s)
  uvRatio: string;     // 相对误差 u_v/v̄ (%)
  uv: string;          // 不确定度 u_v (m/s)
  A: string;           // 相对误差 A (%)
  autoCalculateEnabled: boolean;
}

export interface FormDataTime {
  L: string[];         // 位移 L (10 values, mm)
  T: string[];         // 时间 T (10 values, μs)
  deltaL: string[];    // 差值 ΔL (5 values, mm)
  deltaT: string[];    // 差值 ΔT (5 values, μs)
  deltaLBar: string;   // 平均值 ΔL̄ (mm)
  deltaTBar: string;   // 平均值 ΔT̄ (μs)
  vBar: string;        // 声速 v̄ (mm/μs ≈ m/s)
  A: string;           // 相对误差 A (%)
  autoCalculateEnabled: boolean;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

export const INITIAL_FORM_DATA: FormData = {
  L: Array(10).fill(""),
  deltaL: Array(5).fill(""),
  deltaLBar: "",
  uDeltaL: "",
  lambdaBar: "",
  uLambda: "",
  f: "",
  uf: "",
  vBar: "",
  uvRatio: "",
  uv: "",
  A: "",
  autoCalculateEnabled: true,
};

export const INITIAL_FORM_TIME: FormDataTime = {
  L: Array(10).fill(""),
  T: Array(10).fill(""),
  deltaL: Array(5).fill(""),
  deltaT: Array(5).fill(""),
  deltaLBar: "",
  deltaTBar: "",
  vBar: "",
  A: "",
  autoCalculateEnabled: true,
};

// ============================================================================
// CALCULATION FUNCTIONS 
// ============================================================================

export function calculateDeltaL(L: string[], i: number): string {
  const val1 = parseFloat(L[i] || "0");
  const val2 = parseFloat(L[i + 5] || "0");
  if (isNaN(val1) || isNaN(val2) || !L[i]?.trim() || !L[i + 5]?.trim()) return "";
  return (val2 - val1).toString();
}

export function calculateDeltaLBar(deltaL: string[]): string {
  const values = deltaL
    .slice(0, 5)
    .map((v) => parseFloat(v || "0"))
    .filter((v) => !isNaN(v) && v !== 0);
  if (values.length === 0) return "";
  return (values.reduce((a, b) => a + b, 0) / 5).toString();
}

export function calculateLambdaBar(deltaLBar: string): string {
  const val = parseFloat(deltaLBar || "0");
  if (isNaN(val) || !deltaLBar.trim()) return "";
  return ((2 / 5) * val).toString();
}

export function calculateUDeltaL(deltaL: string[], deltaLBar: string): string {
  const bar = parseFloat(deltaLBar || "0");
  if (isNaN(bar) || !deltaLBar.trim()) return "";
  
  const values = deltaL.slice(0, 5).map((v) => parseFloat(v || "0"));
  if (values.length < 5) return "";
  
  const sumSquares = values.reduce((sum, v) => sum + Math.pow(v - bar, 2), 0);
  const variance = sumSquares / (5 * 4);
  return Math.sqrt(variance).toString();
}

export function calculateULambda(uDeltaL: string): string {
  const val = parseFloat(uDeltaL || "0");
  if (isNaN(val) || !uDeltaL.trim()) return "";
  return ((2 / 5) * val).toString();
}

export function calculateVBar(f: string, lambdaBar: string): string {
  const fVal = parseFloat(f || "0");
  const lambdaVal = parseFloat(lambdaBar || "0");
  if (isNaN(fVal) || isNaN(lambdaVal) || !f.trim() || !lambdaBar.trim()) return "";
  return (fVal * lambdaVal / 1000).toString();
}

export function calculateUVRatio(f: string, uf: string, lambdaBar: string, uLambda: string): string {
  const fVal = parseFloat(f || "0");
  const ufVal = parseFloat(uf || "0");
  const lambdaVal = parseFloat(lambdaBar || "0");
  const uLambdaVal = parseFloat(uLambda || "0");
  
  if (isNaN(fVal) || isNaN(ufVal) || isNaN(lambdaVal) || isNaN(uLambdaVal) ||
      !f.trim() || !uf.trim() || !lambdaBar.trim() || !uLambda.trim() ||
      fVal === 0 || lambdaVal === 0) return "";
  
  const ratio1Sq = Math.pow(ufVal / fVal, 2);
  const ratio2Sq = Math.pow(uLambdaVal / lambdaVal, 2);
  const result = Math.sqrt(ratio1Sq + ratio2Sq) * 100;
  return result.toString();
}

export function calculateUV(vBar: string, uvRatio: string): string {
  const vVal = parseFloat(vBar || "0");
  const ratioVal = parseFloat(uvRatio || "0");
  if (isNaN(vVal) || isNaN(ratioVal) || !vBar.trim() || !uvRatio.trim() || ratioVal === 0) return "";
  return (vVal * ratioVal / 100).toString();
}

export function calculateRelativeError(vBar: string): string {
  const vVal = parseFloat(vBar || "0");
  if (isNaN(vVal) || !vBar.trim()) return "";
  const v0 = 340;
  return (((vVal - v0) / v0) * 100).toString();
}

export function calculateDeltaLBarTime(deltaL: string[]): string {
  return calculateDeltaLBar(deltaL);
}

export function calculateDeltaTBarTime(deltaT: string[]): string {
  return calculateDeltaLBar(deltaT);
}

export function calculateVBarTime(deltaLBar: string, deltaTBar: string): string {
  const dl = parseFloat(deltaLBar || "0");
  const dt = parseFloat(deltaTBar || "0");
  if (isNaN(dl) || isNaN(dt) || !deltaLBar.trim() || !deltaTBar.trim() || dt === 0) return "";
  return (dl / dt).toString();
}

export function calculateDeltaT(T: string[], i: number): string {
  const val1 = parseFloat(T[i] || "0");
  const val2 = parseFloat(T[i + 5] || "0");
  if (isNaN(val1) || isNaN(val2) || !T[i]?.trim() || !T[i + 5]?.trim()) return "";
  return (val2 - val1).toString();
}

// ============================================================================
// COMPOSABLES
// ============================================================================

export function usePhysicsCalculator() {
  const form = reactive<FormData>({ ...INITIAL_FORM_DATA });

  const updateField = (key: keyof FormData, value: any, index?: number) => {
    if (key === 'L' || key === 'deltaL') {
      if (index !== undefined) {
        form[key][index] = value;
      }
    } else {
      (form as any)[key] = value;
    }

    if (form.autoCalculateEnabled) {
      if (key === 'L' && index !== undefined) {
        if (index < 5) {
          form.deltaL[index] = calculateDeltaL(form.L, index);
        } else if (index >= 5 && index < 10) {
          form.deltaL[index - 5] = calculateDeltaL(form.L, index - 5);
        }
        form.deltaLBar = calculateDeltaLBar(form.deltaL);
        form.uDeltaL = calculateUDeltaL(form.deltaL, form.deltaLBar);
        
        // Cascade deltaLBar & uDeltaL
        form.lambdaBar = calculateLambdaBar(form.deltaLBar);
        form.uLambda = calculateULambda(form.uDeltaL);
        form.vBar = calculateVBar(form.f, form.lambdaBar);
        form.uvRatio = calculateUVRatio(form.f, form.uf, form.lambdaBar, form.uLambda);
        form.uv = calculateUV(form.vBar, form.uvRatio);
        form.A = calculateRelativeError(form.vBar);
      }

      if (key === 'deltaL' && index !== undefined) {
        form.deltaLBar = calculateDeltaLBar(form.deltaL);
        form.uDeltaL = calculateUDeltaL(form.deltaL, form.deltaLBar);
        
        // Cascade deltaLBar & uDeltaL
        form.lambdaBar = calculateLambdaBar(form.deltaLBar);
        form.uLambda = calculateULambda(form.uDeltaL);
        form.vBar = calculateVBar(form.f, form.lambdaBar);
        form.uvRatio = calculateUVRatio(form.f, form.uf, form.lambdaBar, form.uLambda);
        form.uv = calculateUV(form.vBar, form.uvRatio);
        form.A = calculateRelativeError(form.vBar);
      }

      if (key === 'f') {
        form.vBar = calculateVBar(form.f, form.lambdaBar);
        form.uvRatio = calculateUVRatio(form.f, form.uf, form.lambdaBar, form.uLambda);
        form.uv = calculateUV(form.vBar, form.uvRatio);
        form.A = calculateRelativeError(form.vBar);
      }

      if (key === 'uf') {
        form.uvRatio = calculateUVRatio(form.f, form.uf, form.lambdaBar, form.uLambda);
        form.uv = calculateUV(form.vBar, form.uvRatio);
      }

      if (key === 'deltaLBar') {
        form.lambdaBar = calculateLambdaBar(form.deltaLBar);
        form.vBar = calculateVBar(form.f, form.lambdaBar);
        form.uvRatio = calculateUVRatio(form.f, form.uf, form.lambdaBar, form.uLambda);
        form.uv = calculateUV(form.vBar, form.uvRatio);
        form.A = calculateRelativeError(form.vBar);
      }

      if (key === 'uDeltaL') {
        form.uLambda = calculateULambda(form.uDeltaL);
        form.uvRatio = calculateUVRatio(form.f, form.uf, form.lambdaBar, form.uLambda);
        form.uv = calculateUV(form.vBar, form.uvRatio);
      }

      if (key === 'lambdaBar') {
        form.vBar = calculateVBar(form.f, form.lambdaBar);
        form.uvRatio = calculateUVRatio(form.f, form.uf, form.lambdaBar, form.uLambda);
        form.uv = calculateUV(form.vBar, form.uvRatio);
        form.A = calculateRelativeError(form.vBar);
      }

      if (key === 'uLambda') {
        form.uvRatio = calculateUVRatio(form.f, form.uf, form.lambdaBar, form.uLambda);
        form.uv = calculateUV(form.vBar, form.uvRatio);
      }

      if (key === 'vBar') {
        form.uv = calculateUV(form.vBar, form.uvRatio);
        form.A = calculateRelativeError(form.vBar);
      }

      if (key === 'uvRatio') {
        form.uv = calculateUV(form.vBar, form.uvRatio);
      }
    }
  };

  return { form, updateField };
}

export function usePhysicsCalculatorTime() {
  const form = reactive<FormDataTime>({ ...INITIAL_FORM_TIME });

  const updateField = (key: keyof FormDataTime, value: any, index?: number) => {
    if (key === 'L' || key === 'T' || key === 'deltaL' || key === 'deltaT') {
      if (index !== undefined) {
        form[key][index] = value;
      }
    } else {
      (form as any)[key] = value;
    }

    if (form.autoCalculateEnabled) {
      if (key === 'L' && index !== undefined) {
        if (index < 5) form.deltaL[index] = calculateDeltaL(form.L, index);
        else if (index >= 5 && index < 10) form.deltaL[index - 5] = calculateDeltaL(form.L, index - 5);
        
        form.deltaLBar = calculateDeltaLBarTime(form.deltaL);
        form.vBar = calculateVBarTime(form.deltaLBar, form.deltaTBar);
        form.A = calculateRelativeError(form.vBar);
      }

      if (key === 'T' && index !== undefined) {
        if (index < 5) form.deltaT[index] = calculateDeltaT(form.T, index);
        else if (index >= 5 && index < 10) form.deltaT[index - 5] = calculateDeltaT(form.T, index - 5);
        
        form.deltaTBar = calculateDeltaTBarTime(form.deltaT);
        form.vBar = calculateVBarTime(form.deltaLBar, form.deltaTBar);
        form.A = calculateRelativeError(form.vBar);
      }

      if (key === 'deltaL' && index !== undefined) {
        form.deltaLBar = calculateDeltaLBarTime(form.deltaL);
        form.vBar = calculateVBarTime(form.deltaLBar, form.deltaTBar);
        form.A = calculateRelativeError(form.vBar);
      }
      
      if (key === 'deltaT' && index !== undefined) {
        form.deltaTBar = calculateDeltaTBarTime(form.deltaT);
        form.vBar = calculateVBarTime(form.deltaLBar, form.deltaTBar);
        form.A = calculateRelativeError(form.vBar);
      }

      if (key === 'deltaLBar' || key === 'deltaTBar') {
        form.vBar = calculateVBarTime(form.deltaLBar, form.deltaTBar);
        form.A = calculateRelativeError(form.vBar);
      }

      if (key === 'vBar') {
        form.A = calculateRelativeError(form.vBar);
      }
    }
  };

  return { form, updateField };
}
