import { useState, useCallback } from "react";

// ============================================================================
// TYPES 
// ============================================================================

/**
 * Table 2/3: Standing Wave Method & Phase Method
 */
interface FormData {
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

/**
 * Table 4: Time Difference Method
 */
interface FormDataTime {
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

const INITIAL_FORM_DATA: FormData = {
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

const INITIAL_FORM_TIME: FormDataTime = {
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

/**
 * Calculate ΔL[i] = L[i+5] - L[i]
 */
function calculateDeltaL(L: string[], i: number): string {
  const val1 = parseFloat(L[i] || "0");
  const val2 = parseFloat(L[i + 5] || "0");
  if (isNaN(val1) || isNaN(val2) || !L[i].trim() || !L[i + 5].trim()) return "";
  return (val2 - val1).toString();
}

/**
 * Calculate ΔL̄ = (1/5) × Σ(ΔL[0:5])
 */
function calculateDeltaLBar(deltaL: string[]): string {
  const values = deltaL
    .slice(0, 5)
    .map((v) => parseFloat(v || "0"))
    .filter((v) => !isNaN(v) && v !== 0);
  if (values.length === 0) return "";
  return (values.reduce((a, b) => a + b, 0) / 5).toString();
}

/**
 * Calculate λ̄ = (2/5) × ΔL̄
 */
function calculateLambdaBar(deltaLBar: string): string {
  const val = parseFloat(deltaLBar || "0");
  if (isNaN(val) || !deltaLBar.trim()) return "";
  return ((2 / 5) * val).toString();
}

/**
 * Calculate u_ΔL (Standard deviation of ΔL)
 * u_ΔL = √[Σ(ΔL[i] - ΔL̄)² / (5×4)]
 */
function calculateUDeltaL(deltaL: string[], deltaLBar: string): string {
  const bar = parseFloat(deltaLBar || "0");
  if (isNaN(bar) || !deltaLBar.trim()) return "";
  
  const values = deltaL.slice(0, 5).map((v) => parseFloat(v || "0"));
  if (values.length < 5) return "";
  
  const sumSquares = values.reduce((sum, v) => sum + Math.pow(v - bar, 2), 0);
  const variance = sumSquares / (5 * 4);
  return Math.sqrt(variance).toString();
}

/**
 * Calculate u_λ = (2/5) × u_ΔL
 */
function calculateULambda(uDeltaL: string): string {
  const val = parseFloat(uDeltaL || "0");
  if (isNaN(val) || !uDeltaL.trim()) return "";
  return ((2 / 5) * val).toString();
}

/**
 * Calculate v̄ = f × λ̄
 */
function calculateVBar(f: string, lambdaBar: string): string {
  const fVal = parseFloat(f || "0");
  const lambdaVal = parseFloat(lambdaBar || "0");
  if (isNaN(fVal) || isNaN(lambdaVal) || !f.trim() || !lambdaBar.trim()) return "";
  return (fVal * lambdaVal / 1000).toString(); // f in kHz, λ in mm → v in m/s
}

/**
 * Calculate u_v/v̄ = √[(u_f/f)² + (u_λ/λ̄)²]
 */
function calculateUVRatio(f: string, uf: string, lambdaBar: string, uLambda: string): string {
  const fVal = parseFloat(f || "0");
  const ufVal = parseFloat(uf || "0");
  const lambdaVal = parseFloat(lambdaBar || "0");
  const uLambdaVal = parseFloat(uLambda || "0");
  
  if (isNaN(fVal) || isNaN(ufVal) || isNaN(lambdaVal) || isNaN(uLambdaVal) ||
      !f.trim() || !uf.trim() || !lambdaBar.trim() || !uLambda.trim() ||
      fVal === 0 || lambdaVal === 0) return "";
  
  const ratio1Sq = Math.pow(ufVal / fVal, 2);
  const ratio2Sq = Math.pow(uLambdaVal / lambdaVal, 2);
  const result = Math.sqrt(ratio1Sq + ratio2Sq) * 100; // Convert to percentage
  return result.toString();
}

/**
 * Calculate u_v = v̄ × (u_v/v̄)
 */
function calculateUV(vBar: string, uvRatio: string): string {
  const vVal = parseFloat(vBar || "0");
  const ratioVal = parseFloat(uvRatio || "0");
  if (isNaN(vVal) || isNaN(ratioVal) || !vBar.trim() || !uvRatio.trim()) return "";
  return (vVal * ratioVal / 100).toString();
}

/**
 * Calculate A = (v̄ - 340) / 340 × 100%
 * where 340 is the standard speed of sound
 */
function calculateRelativeError(vBar: string): string {
  const vVal = parseFloat(vBar || "0");
  if (isNaN(vVal) || !vBar.trim()) return "";
  const v0 = 340; // Standard speed of sound (m/s)
  return (((vVal - v0) / v0) * 100).toString();
}

// ============================================================================
// TABLE 4 SPECIFIC CALCULATIONS
// ============================================================================

/**
 * Calculate ΔL̄ for Time Difference Method
 */
function calculateDeltaLBarTime(deltaL: string[]): string {
  const values = deltaL
    .slice(0, 5)
    .map((v) => parseFloat(v || "0"))
    .filter((v) => !isNaN(v) && v !== 0);
  if (values.length === 0) return "";
  return (values.reduce((a, b) => a + b, 0) / 5).toString();
}

/**
 * Calculate ΔT̄ for Time Difference Method
 */
function calculateDeltaTBarTime(deltaT: string[]): string {
  const values = deltaT
    .slice(0, 5)
    .map((v) => parseFloat(v || "0"))
    .filter((v) => !isNaN(v) && v !== 0);
  if (values.length === 0) return "";
  return (values.reduce((a, b) => a + b, 0) / 5).toString();
}

/**
 * Calculate v̄ = ΔL̄ / ΔT̄ (mm/μs ≈ m/s without conversion)
 */
function calculateVBarTime(deltaLBar: string, deltaTBar: string): string {
  const dl = parseFloat(deltaLBar || "0");
  const dt = parseFloat(deltaTBar || "0");
  if (isNaN(dl) || isNaN(dt) || !deltaLBar.trim() || !deltaTBar.trim() || dt === 0) return "";
  return (dl / dt).toString();
}

// ============================================================================
// UI COMPONENTS 
// ============================================================================

/**
 * DataInput - Reusable input field component
 */
function DataInput({
  value,
  onChange,
  placeholder,
  variant = "normal",
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  variant?: "normal" | "result";
  disabled?: boolean;
}) {
  const baseClass = "px-3 py-2 border border-slate-300 rounded text-sm font-mono";
  const variantClass =
    variant === "result"
      ? "bg-slate-100 text-slate-700 cursor-default"
      : "bg-white text-slate-900";
  const disabledClass = disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "";
  const filledClass = !disabled && value ? "border-slate-400" : "";

  return (
    <input
      type="text"
      inputMode="decimal"
      className={`${baseClass} ${variantClass} ${disabledClass} ${filledClass}`}
      value={value}
      placeholder={placeholder || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
}

/**
 * TabButton - Navigation button for tabs
 */
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 border-b-2 font-medium transition-colors ${
        active
          ? "border-slate-800 text-slate-800"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

// ============================================================================
// FORM COMPONENTS
// ============================================================================

/**
 * FormTable23 - Forms for Table 2 (Standing Wave) and Table 3 (Phase Method)
 */
function FormTable23({
  methodName,
  form,
  onSetL,
  onSetDeltaL,
  onSetField,
  onToggleAutoCalculate,
  onClear,
}: {
  methodName: "驻波法" | "相位法";
  form: FormData;
  onSetL: (i: number, v: string) => void;
  onSetDeltaL: (i: number, v: string) => void;
  onSetField: (key: keyof FormData, v: string) => void;
  onToggleAutoCalculate: () => void;
  onClear: () => void;
}) {
  const maxFilledLIndex = form.L.findLastIndex((v) => v.trim() !== "") ?? -1;
  const isLFieldEnabled = (i: number) => i <= maxFilledLIndex + 1;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">表2 {methodName}——音速的测定</h1>
        <p className="text-sm text-slate-600">
          {methodName === "驻波法"
            ? "Standing Wave Method - Speed of Sound Measurement"
            : "Phase Method - Speed of Sound Measurement"}
        </p>
        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.autoCalculateEnabled}
              onChange={onToggleAutoCalculate}
              className="w-4 h-4 border border-slate-300 rounded cursor-pointer"
            />
            <span className="text-sm text-slate-700">启用自动计算</span>
          </label>
          <button
            onClick={onClear}
            className="text-sm px-3 py-1 border border-slate-300 rounded hover:bg-slate-100 transition-colors text-slate-700"
          >
            清空
          </button>
        </div>
      </div>

      {/* L Input Grid */}
      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          位移 L₀...L₉ (mm)
        </h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-600 font-mono">
                L<sub>{i}</sub>
              </span>
              <DataInput
                value={form.L[i]}
                onChange={(v) => onSetL(i, v)}
                placeholder={`L${i}`}
                disabled={!isLFieldEnabled(i)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ΔL Display Grid */}
      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          差值 ΔL = L<sub>i+5</sub> - L<sub>i</sub> (mm)
        </h2>
        <div className="grid grid-cols-5 gap-4 max-w-xl">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-600 font-mono">
                ΔL<sub>{i}</sub>
              </span>
              <DataInput
                value={form.deltaL[i]}
                onChange={(v) => onSetDeltaL(i, v)}
                placeholder=""
                disabled={form.autoCalculateEnabled}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Calculated Fields */}
      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">计算结果</h2>
        <div className="space-y-4">
          {/* Row 1: ΔL̄ and u_ΔL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
                <span style={{ textDecoration: "overline" }}>ΔL</span> = (1/5)Σ <span style={{ textDecoration: "overline" }}>ΔL</span> =
              </div>
              <DataInput
                value={form.deltaLBar}
                onChange={(v) => onSetField("deltaLBar", v)}
                variant="result"
              />
              <span className="text-xs text-slate-500">(mm)</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
                u<sub>ΔL</sub> =
              </div>
              <DataInput
                value={form.uDeltaL}
                onChange={(v) => onSetField("uDeltaL", v)}
                variant="result"
              />
              <span className="text-xs text-slate-500">(mm)</span>
            </div>
          </div>

          {/* Row 2: λ̄ and u_λ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
                <span style={{ textDecoration: "overline" }}>λ</span> = (2/5)<span style={{ textDecoration: "overline" }}>ΔL</span> =
              </div>
              <DataInput
                value={form.lambdaBar}
                onChange={(v) => onSetField("lambdaBar", v)}
                variant="result"
              />
              <span className="text-xs text-slate-500">(mm)</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
                u<sub>λ</sub> =
              </div>
              <DataInput
                value={form.uLambda}
                onChange={(v) => onSetField("uLambda", v)}
                variant="result"
              />
              <span className="text-xs text-slate-500">(mm)</span>
            </div>
          </div>

          {/* Row 3: Frequency f and u_f */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
                f =
              </div>
              <DataInput
                value={form.f}
                onChange={(v) => onSetField("f", v)}
                variant="normal"
              />
              <span className="text-xs text-slate-500">(kHz)</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
                u<sub>f</sub> =
              </div>
              <DataInput
                value={form.uf}
                onChange={(v) => onSetField("uf", v)}
                variant="normal"
              />
              <span className="text-xs text-slate-500">(kHz)</span>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          {/* Row 4: v̄ and u_v */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-blue-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
                <span style={{ textDecoration: "overline" }}>v</span> = f × <span style={{ textDecoration: "overline" }}>λ</span> =
              </div>
              <DataInput
                value={form.vBar}
                onChange={(v) => onSetField("vBar", v)}
                variant="result"
              />
              <span className="text-xs text-slate-500">(m/s)</span>
            </div>
            <div className="flex items-center gap-3 bg-blue-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
                u<sub>v</sub> =
              </div>
              <DataInput
                value={form.uv}
                onChange={(v) => onSetField("uv", v)}
                variant="result"
              />
              <span className="text-xs text-slate-500">(m/s)</span>
            </div>
          </div>

          {/* Row 5: u_v/v̄ */}
          <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
            <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
              u<sub>v</sub> / <span style={{ textDecoration: "overline" }}>v</span> =
            </div>
            <DataInput
              value={form.uvRatio}
              onChange={(v) => onSetField("uvRatio", v)}
              variant="result"
            />
            <span className="text-xs text-slate-500">(%)</span>
          </div>
        </div>
      </div>

      {/* Error Analysis */}
      <div className="border border-slate-200 rounded px-6 py-4 bg-rose-50">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">相对误差</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
            A = (<span style={{ textDecoration: "overline" }}>v</span> - 340) / 340 × 100% =
          </div>
          <DataInput
            value={form.A}
            onChange={(v) => onSetField("A", v)}
            variant="result"
          />
          <span className="text-xs text-slate-500">(%)</span>
        </div>
      </div>
    </div>
  );
}

/**
 * FormTable4 - Form for Table 4 (Time Difference Method)
 */
function FormTable4({
  form,
  onSetL,
  onSetT,
  onSetDeltaL,
  onSetDeltaT,
  onSetField,
  onToggleAutoCalculate,
  onClear,
}: {
  form: FormDataTime;
  onSetL: (i: number, v: string) => void;
  onSetT: (i: number, v: string) => void;
  onSetDeltaL: (i: number, v: string) => void;
  onSetDeltaT: (i: number, v: string) => void;
  onSetField: (key: keyof FormDataTime, v: string) => void;
  onToggleAutoCalculate: () => void;
  onClear: () => void;
}) {
  const maxFilledLIndex = form.L.findLastIndex((v) => v.trim() !== "") ?? -1;
  const maxFilledTIndex = form.T.findLastIndex((v) => v.trim() !== "") ?? -1;
  const isLFieldEnabled = (i: number) => i <= maxFilledLIndex + 1;
  const isTFieldEnabled = (i: number) => i <= maxFilledTIndex + 1;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">表4 时差法——音速的测定</h1>
        <p className="text-sm text-slate-600">
          Time Difference Method - Speed of Sound Measurement
        </p>
        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.autoCalculateEnabled}
              onChange={onToggleAutoCalculate}
              className="w-4 h-4 border border-slate-300 rounded cursor-pointer"
            />
            <span className="text-sm text-slate-700">启用自动计算</span>
          </label>
          <button
            onClick={onClear}
            className="text-sm px-3 py-1 border border-slate-300 rounded hover:bg-slate-100 transition-colors text-slate-700"
          >
            清空
          </button>
        </div>
      </div>

      {/* L Input Grid */}
      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">位移 L (mm)</h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-600 font-mono">
                L<sub>{i}</sub>
              </span>
              <DataInput
                value={form.L[i]}
                onChange={(v) => onSetL(i, v)}
                placeholder={`L${i}`}
                disabled={!isLFieldEnabled(i)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* T Input Grid */}
      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">时间 T (μs)</h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-600 font-mono">
                T<sub>{i}</sub>
              </span>
              <DataInput
                value={form.T[i]}
                onChange={(v) => onSetT(i, v)}
                placeholder={`T${i}`}
                disabled={!isTFieldEnabled(i)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ΔL and ΔT Display Grids */}
      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">差值</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              ΔL = L<sub>i+5</sub> - L<sub>i</sub> (mm)
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-600 font-mono">
                    ΔL<sub>{i}</sub>
                  </span>
                  <DataInput
                    value={form.deltaL[i]}
                    onChange={(v) => onSetDeltaL(i, v)}
                    placeholder=""
                    disabled={form.autoCalculateEnabled}
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              ΔT = T<sub>i+5</sub> - T<sub>i</sub> (μs)
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-600 font-mono">
                    ΔT<sub>{i}</sub>
                  </span>
                  <DataInput
                    value={form.deltaT[i]}
                    onChange={(v) => onSetDeltaT(i, v)}
                    placeholder=""
                    disabled={form.autoCalculateEnabled}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calculated Fields */}
      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">计算结果</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
                <span style={{ textDecoration: "overline" }}>ΔL</span> =
              </div>
              <DataInput
                value={form.deltaLBar}
                onChange={(v) => onSetField("deltaLBar", v)}
                variant="result"
              />
              <span className="text-xs text-slate-500">(mm)</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
                <span style={{ textDecoration: "overline" }}>ΔT</span> =
              </div>
              <DataInput
                value={form.deltaTBar}
                onChange={(v) => onSetField("deltaTBar", v)}
                variant="result"
              />
              <span className="text-xs text-slate-500">(μs)</span>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-blue-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
                <span style={{ textDecoration: "overline" }}>v</span> = <span style={{ textDecoration: "overline" }}>ΔL</span> / <span style={{ textDecoration: "overline" }}>ΔT</span> =
              </div>
              <DataInput
                value={form.vBar}
                onChange={(v) => onSetField("vBar", v)}
                variant="result"
              />
              <span className="text-xs text-slate-500">(mm/μs)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Analysis */}
      <div className="border border-slate-200 rounded px-6 py-4 bg-rose-50">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">相对误差</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-700 font-mono whitespace-nowrap">
            A = (<span style={{ textDecoration: "overline" }}>v</span> - 340) / 340 × 100% =
          </div>
          <DataInput
            value={form.A}
            onChange={(v) => onSetField("A", v)}
            variant="result"
          />
          <span className="text-xs text-slate-500">(%)</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function App() {
  const [activeTab, setActiveTab] = useState<"Table2" | "Table3" | "Table4">(
    "Table2"
  );
  const [form2, setForm2] = useState<FormData>(INITIAL_FORM_DATA);
  const [form3, setForm3] = useState<FormData>(INITIAL_FORM_DATA);
  const [form4, setForm4] = useState<FormDataTime>(INITIAL_FORM_TIME);

  // ========================================================================
  // TABLE 2 HANDLERS (Standing Wave Method)
  // ========================================================================

  const setL2 = useCallback((i: number, v: string) => {
    setForm2((prev) => {
      const newForm = { ...prev, L: [...prev.L] };
      newForm.L[i] = v;

      if (prev.autoCalculateEnabled && v.trim()) {
        // BUG FIX: Calculate all 5 delta values
        const deltaL = [...newForm.deltaL];
        for (let j = 0; j < 5; j++) {
          deltaL[j] = calculateDeltaL(newForm.L, j);
        }
        newForm.deltaL = deltaL;

        // Auto-calculate dependent fields
        newForm.deltaLBar = calculateDeltaLBar(newForm.deltaL);
        newForm.uDeltaL = calculateUDeltaL(newForm.deltaL, newForm.deltaLBar);
        newForm.lambdaBar = calculateLambdaBar(newForm.deltaLBar);
        newForm.uLambda = calculateULambda(newForm.uDeltaL);
        newForm.vBar = calculateVBar(newForm.f, newForm.lambdaBar);
        newForm.uvRatio = calculateUVRatio(
          newForm.f,
          newForm.uf,
          newForm.lambdaBar,
          newForm.uLambda
        );
        newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
        newForm.A = calculateRelativeError(newForm.vBar);
      }

      return newForm;
    });
  }, []);

  const setDeltaL2 = useCallback((i: number, v: string) => {
    setForm2((prev) => {
      const deltaL = [...prev.deltaL];
      deltaL[i] = v;
      const newForm = { ...prev, deltaL };

      if (prev.autoCalculateEnabled) {
        newForm.deltaLBar = calculateDeltaLBar(newForm.deltaL);
        newForm.uDeltaL = calculateUDeltaL(newForm.deltaL, newForm.deltaLBar);
        newForm.lambdaBar = calculateLambdaBar(newForm.deltaLBar);
        newForm.uLambda = calculateULambda(newForm.uDeltaL);
        newForm.vBar = calculateVBar(newForm.f, newForm.lambdaBar);
        newForm.uvRatio = calculateUVRatio(
          newForm.f,
          newForm.uf,
          newForm.lambdaBar,
          newForm.uLambda
        );
        newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
        newForm.A = calculateRelativeError(newForm.vBar);
      }

      return newForm;
    });
  }, []);

  const setField2 = useCallback((key: keyof FormData, v: string) => {
    setForm2((prev) => {
      const newForm = { ...prev, [key]: v };

      if (prev.autoCalculateEnabled) {
        // f 改变 → 更新相关字段
        if (key === "f") {
          newForm.vBar = calculateVBar(newForm.f, newForm.lambdaBar);
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
          newForm.A = calculateRelativeError(newForm.vBar);
        }

        // uf 改变 → 更新相关字段
        if (key === "uf") {
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
        }

        // deltaLBar 改变 → 更新：lambdaBar、vBar、uvRatio、uv、A
        if (key === "deltaLBar") {
          newForm.lambdaBar = calculateLambdaBar(newForm.deltaLBar);
          newForm.vBar = calculateVBar(newForm.f, newForm.lambdaBar);
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
          newForm.A = calculateRelativeError(newForm.vBar);
        }

        // uDeltaL 改变 → 更新：uLambda、uvRatio、uv
        if (key === "uDeltaL") {
          newForm.uLambda = calculateULambda(newForm.uDeltaL);
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
        }

        // lambdaBar 改变 → 更新：vBar、uvRatio、uv、A
        if (key === "lambdaBar") {
          newForm.vBar = calculateVBar(newForm.f, newForm.lambdaBar);
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
          newForm.A = calculateRelativeError(newForm.vBar);
        }

        // uLambda 改变 → 更新：uvRatio、uv
        if (key === "uLambda") {
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
        }

        // vBar 改变 → 更新：uvRatio、uv、A
        if (key === "vBar") {
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
          newForm.A = calculateRelativeError(newForm.vBar);
        }
      }

      return newForm;
    });
  }, []);

  const toggleAutoCalculate2 = useCallback(
    () =>
      setForm2((prev) => ({
        ...prev,
        autoCalculateEnabled: !prev.autoCalculateEnabled,
      })),
    []
  );

  const clear2 = useCallback(() => setForm2(INITIAL_FORM_DATA), []);

  // ========================================================================
  // TABLE 3 HANDLERS (Phase Method)
  // ========================================================================

  const setL3 = useCallback((i: number, v: string) => {
    setForm3((prev) => {
      const newForm = { ...prev, L: [...prev.L] };
      newForm.L[i] = v;

      if (prev.autoCalculateEnabled && v.trim()) {
        // BUG FIX: Calculate all 5 delta values
        const deltaL = [...newForm.deltaL];
        for (let j = 0; j < 5; j++) {
          deltaL[j] = calculateDeltaL(newForm.L, j);
        }
        newForm.deltaL = deltaL;

        // Auto-calculate dependent fields
        newForm.deltaLBar = calculateDeltaLBar(newForm.deltaL);
        newForm.uDeltaL = calculateUDeltaL(newForm.deltaL, newForm.deltaLBar);
        newForm.lambdaBar = calculateLambdaBar(newForm.deltaLBar);
        newForm.uLambda = calculateULambda(newForm.uDeltaL);
        newForm.vBar = calculateVBar(newForm.f, newForm.lambdaBar);
        newForm.uvRatio = calculateUVRatio(
          newForm.f,
          newForm.uf,
          newForm.lambdaBar,
          newForm.uLambda
        );
        newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
        newForm.A = calculateRelativeError(newForm.vBar);
      }

      return newForm;
    });
  }, []);

  const setDeltaL3 = useCallback((i: number, v: string) => {
    setForm3((prev) => {
      const deltaL = [...prev.deltaL];
      deltaL[i] = v;
      const newForm = { ...prev, deltaL };

      if (prev.autoCalculateEnabled) {
        newForm.deltaLBar = calculateDeltaLBar(newForm.deltaL);
        newForm.uDeltaL = calculateUDeltaL(newForm.deltaL, newForm.deltaLBar);
        newForm.lambdaBar = calculateLambdaBar(newForm.deltaLBar);
        newForm.uLambda = calculateULambda(newForm.uDeltaL);
        newForm.vBar = calculateVBar(newForm.f, newForm.lambdaBar);
        newForm.uvRatio = calculateUVRatio(
          newForm.f,
          newForm.uf,
          newForm.lambdaBar,
          newForm.uLambda
        );
        newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
        newForm.A = calculateRelativeError(newForm.vBar);
      }

      return newForm;
    });
  }, []);

  const setField3 = useCallback((key: keyof FormData, v: string) => {
    setForm3((prev) => {
      const newForm = { ...prev, [key]: v };

      if (prev.autoCalculateEnabled) {
        // f 改变 → 更新相关字段
        if (key === "f") {
          newForm.vBar = calculateVBar(newForm.f, newForm.lambdaBar);
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
          newForm.A = calculateRelativeError(newForm.vBar);
        }

        // uf 改变 → 更新相关字段
        if (key === "uf") {
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
        }

        // deltaLBar 改变 → 更新：lambdaBar、vBar、uvRatio、uv、A
        if (key === "deltaLBar") {
          newForm.lambdaBar = calculateLambdaBar(newForm.deltaLBar);
          newForm.vBar = calculateVBar(newForm.f, newForm.lambdaBar);
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
          newForm.A = calculateRelativeError(newForm.vBar);
        }

        // uDeltaL 改变 → 更新：uLambda、uvRatio、uv
        if (key === "uDeltaL") {
          newForm.uLambda = calculateULambda(newForm.uDeltaL);
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
        }

        // lambdaBar 改变 → 更新：vBar、uvRatio、uv、A
        if (key === "lambdaBar") {
          newForm.vBar = calculateVBar(newForm.f, newForm.lambdaBar);
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
          newForm.A = calculateRelativeError(newForm.vBar);
        }

        // uLambda 改变 → 更新：uvRatio、uv
        if (key === "uLambda") {
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
        }

        // vBar 改变 → 更新：uvRatio、uv、A
        if (key === "vBar") {
          newForm.uvRatio = calculateUVRatio(
            newForm.f,
            newForm.uf,
            newForm.lambdaBar,
            newForm.uLambda
          );
          newForm.uv = calculateUV(newForm.vBar, newForm.uvRatio);
          newForm.A = calculateRelativeError(newForm.vBar);
        }
      }

      return newForm;
    });
  }, []);

  const toggleAutoCalculate3 = useCallback(
    () =>
      setForm3((prev) => ({
        ...prev,
        autoCalculateEnabled: !prev.autoCalculateEnabled,
      })),
    []
  );

  const clear3 = useCallback(() => setForm3(INITIAL_FORM_DATA), []);

  // ========================================================================
  // TABLE 4 HANDLERS (Time Difference Method)
  // ========================================================================

  const setL4 = useCallback((i: number, v: string) => {
    setForm4((prev) => {
      const newForm = { ...prev, L: [...prev.L] };
      newForm.L[i] = v;

      if (prev.autoCalculateEnabled && v.trim()) {
        // BUG FIX: Calculate all 5 delta values
        const deltaL = [...newForm.deltaL];
        for (let j = 0; j < 5; j++) {
          deltaL[j] = calculateDeltaL(newForm.L, j);
        }
        newForm.deltaL = deltaL;

        newForm.deltaLBar = calculateDeltaLBarTime(newForm.deltaL);
        newForm.vBar = calculateVBarTime(
          newForm.deltaLBar,
          newForm.deltaTBar
        );
        newForm.A = calculateRelativeError(newForm.vBar);
      }

      return newForm;
    });
  }, []);

  const setT4 = useCallback((i: number, v: string) => {
    setForm4((prev) => {
      const newForm = { ...prev, T: [...prev.T] };
      newForm.T[i] = v;

      if (prev.autoCalculateEnabled && v.trim()) {
        // BUG FIX: Calculate all 5 delta values using offset method
        const deltaT = [...newForm.deltaT];
        for (let j = 0; j < 5; j++) {
          const t1 = parseFloat(newForm.T[j] || "0");
          const t2 = parseFloat(newForm.T[j + 5] || "0");
          if (
            !isNaN(t1) &&
            !isNaN(t2) &&
            newForm.T[j].trim() &&
            newForm.T[j + 5].trim()
          ) {
            deltaT[j] = (t2 - t1).toString();
          } else {
            deltaT[j] = "";
          }
        }
        newForm.deltaT = deltaT;

        newForm.deltaTBar = calculateDeltaTBarTime(newForm.deltaT);
        newForm.vBar = calculateVBarTime(
          newForm.deltaLBar,
          newForm.deltaTBar
        );
        newForm.A = calculateRelativeError(newForm.vBar);
      }

      return newForm;
    });
  }, []);

  const setDeltaL4 = useCallback((i: number, v: string) => {
    setForm4((prev) => {
      const deltaL = [...prev.deltaL];
      deltaL[i] = v;
      const newForm = { ...prev, deltaL };

      if (prev.autoCalculateEnabled) {
        newForm.deltaLBar = calculateDeltaLBarTime(newForm.deltaL);
        newForm.vBar = calculateVBarTime(
          newForm.deltaLBar,
          newForm.deltaTBar
        );
        newForm.A = calculateRelativeError(newForm.vBar);
      }

      return newForm;
    });
  }, []);

  const setDeltaT4 = useCallback((i: number, v: string) => {
    setForm4((prev) => {
      const deltaT = [...prev.deltaT];
      deltaT[i] = v;
      const newForm = { ...prev, deltaT };

      if (prev.autoCalculateEnabled) {
        newForm.deltaTBar = calculateDeltaTBarTime(newForm.deltaT);
        newForm.vBar = calculateVBarTime(
          newForm.deltaLBar,
          newForm.deltaTBar
        );
        newForm.A = calculateRelativeError(newForm.vBar);
      }

      return newForm;
    });
  }, []);

  const setField4 = useCallback((key: keyof FormDataTime, v: string) => {
    setForm4((prev) => {
      const newForm = { ...prev, [key]: v };

      if (prev.autoCalculateEnabled) {
        // deltaLBar 或 deltaTBar 改变 → 更新：vBar、A
        if (key === "deltaLBar" || key === "deltaTBar") {
          newForm.vBar = calculateVBarTime(
            newForm.deltaLBar,
            newForm.deltaTBar
          );
          newForm.A = calculateRelativeError(newForm.vBar);
        }

        // vBar 改变 → 更新：A
        if (key === "vBar") {
          newForm.A = calculateRelativeError(newForm.vBar);
        }
      }

      return newForm;
    });
  }, []);

  const toggleAutoCalculate4 = useCallback(
    () =>
      setForm4((prev) => ({
        ...prev,
        autoCalculateEnabled: !prev.autoCalculateEnabled,
      })),
    []
  );

  const clear4 = useCallback(() => setForm4(INITIAL_FORM_TIME), []);

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-white py-8 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-6 border-b border-slate-300 mb-8">
          <TabButton
            active={activeTab === "Table2"}
            onClick={() => setActiveTab("Table2")}
          >
            表2 驻波法
          </TabButton>
          <TabButton
            active={activeTab === "Table3"}
            onClick={() => setActiveTab("Table3")}
          >
            表3 相位法
          </TabButton>
          <TabButton
            active={activeTab === "Table4"}
            onClick={() => setActiveTab("Table4")}
          >
            表4 时差法
          </TabButton>
        </div>

        {activeTab === "Table2" && (
          <FormTable23
            methodName="驻波法"
            form={form2}
            onSetL={setL2}
            onSetDeltaL={setDeltaL2}
            onSetField={setField2}
            onToggleAutoCalculate={toggleAutoCalculate2}
            onClear={clear2}
          />
        )}

        {activeTab === "Table3" && (
          <FormTable23
            methodName="相位法"
            form={form3}
            onSetL={setL3}
            onSetDeltaL={setDeltaL3}
            onSetField={setField3}
            onToggleAutoCalculate={toggleAutoCalculate3}
            onClear={clear3}
          />
        )}

        {activeTab === "Table4" && (
          <FormTable4
            form={form4}
            onSetL={setL4}
            onSetT={setT4}
            onSetDeltaL={setDeltaL4}
            onSetDeltaT={setDeltaT4}
            onSetField={setField4}
            onToggleAutoCalculate={toggleAutoCalculate4}
            onClear={clear4}
          />
        )}

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-400">
            物理实验数据录入工具 · Designed with ❤️
          </p>
        </div>
      </div>
    </div>
  );
}
