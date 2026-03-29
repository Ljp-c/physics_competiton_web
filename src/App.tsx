import { useState, useCallback } from "react";

//  Types 
/**
 * Table 2/3: Standing Wave Method & Phase Method
 */
interface FormData {
  L: string[];         // L0L9  (10 values, mm)
  deltaL: string[];    // ΔL0ΔL4  (5 values, mm)
  deltaLBar: string;   // ΔL
  uDeltaL: string;     // u_ΔL
  lambdaBar: string;   // λ
  uLambda: string;     // u_λ
  vBar: string;        // v (m/s)
  uvRatio: string;     // u_v / v (%)
  uv: string;          // u_v
  A: string;           // A (%)
  autoCalculateEnabled: boolean;
}

/**
 * Table 4: Time Difference Method
 */
interface FormDataTime {
  L: string[];         // LL (10 values, mm)
  T: string[];         // TT (10 values, μs)
  deltaL: string[];    // ΔLΔL (5 values, mm)
  deltaT: string[];    // ΔTΔT (5 values, μs)
  deltaLBar: string;   // ΔL
  deltaTBar: string;   // ΔT
  vBar: string;        // v
  A: string;           // A
  autoCalculateEnabled: boolean;
}

const INITIAL_FORM_DATA: FormData = {
  L: Array(10).fill(""),
  deltaL: Array(5).fill(""),
  deltaLBar: "",
  uDeltaL: "",
  lambdaBar: "",
  uLambda: "",
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

//  Calculation Functions 

function calculateDeltaL(L: string[], i: number): string {
  const val1 = parseFloat(L[i] || "0");
  const val2 = parseFloat(L[i + 5] || "0");
  if (isNaN(val1) || isNaN(val2)) return "";
  return (val2 - val1).toString();
}

function calculateDeltaLBar(deltaL: string[]): string {
  const values = deltaL
    .slice(0, 5)
    .map((v) => parseFloat(v || "0"))
    .filter((v) => !isNaN(v));
  if (values.length === 0) return "";
  return (values.reduce((a, b) => a + b, 0) / values.length).toString();
}

function calculateLambdaBar(deltaLBar: string): string {
  const val = parseFloat(deltaLBar || "0");
  if (isNaN(val)) return "";
  return ((2 / 5) * val).toString();
}

function calculateDeltaLBarTime(deltaL: string[]): string {
  const values = deltaL.slice(0, 5).map((v) => parseFloat(v || "0")).filter((v) => !isNaN(v));
  if (values.length === 0) return "";
  return (values.reduce((a, b) => a + b, 0) / values.length).toString();
}

function calculateDeltaTBarTime(deltaT: string[]): string {
  const values = deltaT.slice(0, 5).map((v) => parseFloat(v || "0")).filter((v) => !isNaN(v));
  if (values.length === 0) return "";
  return (values.reduce((a, b) => a + b, 0) / values.length).toString();
}

function calculateVBarTime(deltaLBar: string, deltaTBar: string): string {
  const dl = parseFloat(deltaLBar || "0");
  const dt = parseFloat(deltaTBar || "0");
  if (isNaN(dl) || isNaN(dt) || dt === 0) return "";
  return (dl / dt).toString();
}

//  UI Components 

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
  const variantClass = variant === "result" ? "bg-slate-100 text-slate-700 cursor-default" : "bg-white text-slate-900";
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
        active ? "border-slate-800 text-slate-800" : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

// TableForm components...
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
        <h1 className="text-2xl font-bold text-slate-800 mb-2">表2 {methodName}测空气中的声速</h1>
        <p className="text-sm text-slate-600">
          {methodName === "驻波法" ? "Standing Wave Method  Speed of Sound Measurement" : "Phase Method  Speed of Sound Measurement"}
        </p>
        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.autoCalculateEnabled}
              onChange={onToggleAutoCalculate}
              className="w-4 h-4 border border-slate-300 rounded cursor-pointer"
            />
            <span className="text-sm text-slate-700">自动计算</span>
          </label>
          <button onClick={onClear} className="text-sm px-3 py-1 border border-slate-300 rounded hover:bg-slate-100 transition-colors text-slate-700">
            清除
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">振幅最大位置读数  LL (mm)</h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-600 font-mono">L<sub>{i}</sub></span>
              <DataInput value={form.L[i]} onChange={(v) => onSetL(i, v)} placeholder={`L${i}`} disabled={!isLFieldEnabled(i)} />
            </div>
          ))}
        </div>
      </div>

      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">逐差法 ΔLΔL = L<sub>i+5</sub>  L<sub>i</sub> (mm)</h2>
        <div className="grid grid-cols-5 gap-4 max-w-xl">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-600 font-mono">ΔL<sub>{i}</sub></span>
              <DataInput value={form.deltaL[i]} onChange={(v) => onSetDeltaL(i, v)} placeholder="" disabled={form.autoCalculateEnabled} />
            </div>
          ))}
        </div>
      </div>

      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">计算结果</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap"><span style={{ textDecoration: "overline" }}>ΔL</span> = (1/5)ΔL<sub>i</sub> =</div>
              <DataInput value={form.deltaLBar} onChange={(v) => onSetField("deltaLBar", v)} variant="result" />
              <span className="text-xs text-slate-500">(mm)</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">u<sub>ΔL</sub> =</div>
              <DataInput value={form.uDeltaL} onChange={(v) => onSetField("uDeltaL", v)} variant="result" />
              <span className="text-xs text-slate-500">(mm)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap"><span style={{ textDecoration: "overline" }}>λ</span> = (2/5)<span style={{ textDecoration: "overline" }}>ΔL</span> =</div>
              <DataInput value={form.lambdaBar} onChange={(v) => onSetField("lambdaBar", v)} variant="result" />
              <span className="text-xs text-slate-500">(mm)</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">u<sub>λ</sub> =</div>
              <DataInput value={form.uLambda} onChange={(v) => onSetField("uLambda", v)} variant="result" />
              <span className="text-xs text-slate-500">(mm)</span>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-blue-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap"><span style={{ textDecoration: "overline" }}>v</span> = f  <span style={{ textDecoration: "overline" }}>λ</span> =</div>
              <DataInput value={form.vBar} onChange={(v) => onSetField("vBar", v)} variant="result" />
              <span className="text-xs text-slate-500">(m/s)</span>
            </div>
            <div className="flex items-center gap-3 bg-blue-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap">u<sub>v</sub> =</div>
              <DataInput value={form.uv} onChange={(v) => onSetField("uv", v)} variant="result" />
              <span className="text-xs text-slate-500">(m/s)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
            <div className="text-sm text-slate-700 font-mono whitespace-nowrap">u<sub>v</sub> / <span style={{ textDecoration: "overline" }}>v</span> =</div>
            <DataInput value={form.uvRatio} onChange={(v) => onSetField("uvRatio", v)} variant="result" />
            <span className="text-xs text-slate-500">(%)</span>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded px-6 py-4 bg-rose-50">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">相对误差</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-700 font-mono whitespace-nowrap">A = (<span style={{ textDecoration: "overline" }}>v</span>  v) / v  100% =</div>
          <DataInput value={form.A} onChange={(v) => onSetField("A", v)} variant="result" />
          <span className="text-xs text-slate-500">(%)</span>
        </div>
      </div>
    </div>
  );
}

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
        <h1 className="text-2xl font-bold text-slate-800 mb-2">表4 时差法测空气中的声速</h1>
        <p className="text-sm text-slate-600">Time Difference Method  Speed of Sound Measurement</p>
        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.autoCalculateEnabled} onChange={onToggleAutoCalculate} className="w-4 h-4 border border-slate-300 rounded cursor-pointer" />
            <span className="text-sm text-slate-700">自动计算</span>
          </label>
          <button onClick={onClear} className="text-sm px-3 py-1 border border-slate-300 rounded hover:bg-slate-100 transition-colors text-slate-700">
            清除
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">距离 LL (mm)</h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-600 font-mono">L<sub>{i + 1}</sub></span>
              <DataInput value={form.L[i]} onChange={(v) => onSetL(i, v)} placeholder={`L${i + 1}`} disabled={!isLFieldEnabled(i)} />
            </div>
          ))}
        </div>
      </div>

      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">时间 TT (μs)</h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-600 font-mono">T<sub>{i + 1}</sub></span>
              <DataInput value={form.T[i]} onChange={(v) => onSetT(i, v)} placeholder={`T${i + 1}`} disabled={!isTFieldEnabled(i)} />
            </div>
          ))}
        </div>
      </div>

      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">逐差值 ΔLΔL 和 ΔTΔT</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">ΔL = L<sub>i</sub>  L<sub>i-1</sub> (mm)</h3>
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-600 font-mono">ΔL<sub>{i + 2}</sub></span>
                  <DataInput value={form.deltaL[i]} onChange={(v) => onSetDeltaL(i, v)} placeholder="" disabled={form.autoCalculateEnabled} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">ΔT = T<sub>i</sub>  T<sub>i-1</sub> (μs)</h3>
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-600 font-mono">ΔT<sub>{i + 2}</sub></span>
                  <DataInput value={form.deltaT[i]} onChange={(v) => onSetDeltaT(i, v)} placeholder="" disabled={form.autoCalculateEnabled} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">计算结果</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap"><span style={{ textDecoration: "overline" }}>ΔL</span> =</div>
              <DataInput value={form.deltaLBar} onChange={(v) => onSetField("deltaLBar", v)} variant="result" />
              <span className="text-xs text-slate-500">(mm)</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap"><span style={{ textDecoration: "overline" }}>ΔT</span> =</div>
              <DataInput value={form.deltaTBar} onChange={(v) => onSetField("deltaTBar", v)} variant="result" />
              <span className="text-xs text-slate-500">(μs)</span>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-blue-50 rounded p-4">
              <div className="text-sm text-slate-700 font-mono whitespace-nowrap"><span style={{ textDecoration: "overline" }}>v</span> = <span style={{ textDecoration: "overline" }}>ΔL</span> / <span style={{ textDecoration: "overline" }}>ΔT</span> =</div>
              <DataInput value={form.vBar} onChange={(v) => onSetField("vBar", v)} variant="result" />
              <span className="text-xs text-slate-500">(m/s)</span>
            </div>
            <div />
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded px-6 py-4 bg-rose-50">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">相对误差</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-700 font-mono whitespace-nowrap">A = (<span style={{ textDecoration: "overline" }}>v</span>  v) / v  100% =</div>
          <DataInput value={form.A} onChange={(v) => onSetField("A", v)} variant="result" />
          <span className="text-xs text-slate-500">(%)</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"Table2" | "Table3" | "Table4">("Table2");
  const [form2, setForm2] = useState<FormData>(INITIAL_FORM_DATA);
  const [form3, setForm3] = useState<FormData>(INITIAL_FORM_DATA);
  const [form4, setForm4] = useState<FormDataTime>(INITIAL_FORM_TIME);

  // Table 2 Handlers
  const setL2 = useCallback((i: number, v: string) => {
    setForm2((prev) => {
      const newForm = { ...prev, L: [...prev.L] };
      newForm.L[i] = v;
      if (prev.autoCalculateEnabled && v.trim()) {
        const deltaL = [...newForm.deltaL];
        if (i >= 5) deltaL[i - 5] = calculateDeltaL(newForm.L, i - 5);
        newForm.deltaL = deltaL;
        newForm.deltaLBar = calculateDeltaLBar(newForm.deltaL);
        newForm.lambdaBar = calculateLambdaBar(newForm.deltaLBar);
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
        newForm.lambdaBar = calculateLambdaBar(newForm.deltaLBar);
      }
      return newForm;
    });
  }, []);

  const setField2 = useCallback((key: keyof FormData, v: string) => setForm2((prev) => ({ ...prev, [key]: v })), []);
  const toggleAutoCalculate2 = useCallback(() => setForm2((prev) => ({ ...prev, autoCalculateEnabled: !prev.autoCalculateEnabled })), []);
  const clear2 = useCallback(() => setForm2(INITIAL_FORM_DATA), []);

  // Table 3 Handlers
  const setL3 = useCallback((i: number, v: string) => {
    setForm3((prev) => {
      const newForm = { ...prev, L: [...prev.L] };
      newForm.L[i] = v;
      if (prev.autoCalculateEnabled && v.trim()) {
        const deltaL = [...newForm.deltaL];
        if (i >= 5) deltaL[i - 5] = calculateDeltaL(newForm.L, i - 5);
        newForm.deltaL = deltaL;
        newForm.deltaLBar = calculateDeltaLBar(newForm.deltaL);
        newForm.lambdaBar = calculateLambdaBar(newForm.deltaLBar);
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
        newForm.lambdaBar = calculateLambdaBar(newForm.deltaLBar);
      }
      return newForm;
    });
  }, []);

  const setField3 = useCallback((key: keyof FormData, v: string) => setForm3((prev) => ({ ...prev, [key]: v })), []);
  const toggleAutoCalculate3 = useCallback(() => setForm3((prev) => ({ ...prev, autoCalculateEnabled: !prev.autoCalculateEnabled })), []);
  const clear3 = useCallback(() => setForm3(INITIAL_FORM_DATA), []);

  // Table 4 Handlers
  const setL4 = useCallback((i: number, v: string) => {
    setForm4((prev) => {
      const newForm = { ...prev, L: [...prev.L] };
      newForm.L[i] = v;
      if (prev.autoCalculateEnabled) {
        const deltaL = [...newForm.deltaL];
        if (i < 9) {
          const nextL = parseFloat(newForm.L[i + 1] || "0");
          const currL = parseFloat(v || "0");
          if (!isNaN(currL) && !isNaN(nextL) && newForm.L[i + 1].trim()) deltaL[i] = (nextL - currL).toString();
        }
        if (i > 0) {
          const prevL = parseFloat(newForm.L[i - 1] || "0");
          const currL = parseFloat(v || "0");
          if (!isNaN(prevL) && !isNaN(currL) && newForm.L[i - 1].trim()) deltaL[i - 1] = (currL - prevL).toString();
        }
        newForm.deltaL = deltaL;
        newForm.deltaLBar = calculateDeltaLBarTime(newForm.deltaL);
        newForm.vBar = calculateVBarTime(newForm.deltaLBar, newForm.deltaTBar);
      }
      return newForm;
    });
  }, []);

  const setT4 = useCallback((i: number, v: string) => {
    setForm4((prev) => {
      const newForm = { ...prev, T: [...prev.T] };
      newForm.T[i] = v;
      if (prev.autoCalculateEnabled) {
        const deltaT = [...newForm.deltaT];
        if (i < 9) {
          const nextT = parseFloat(newForm.T[i + 1] || "0");
          const currT = parseFloat(v || "0");
          if (!isNaN(currT) && !isNaN(nextT) && newForm.T[i + 1].trim()) deltaT[i] = (nextT - currT).toString();
        }
        if (i > 0) {
          const prevT = parseFloat(newForm.T[i - 1] || "0");
          const currT = parseFloat(v || "0");
          if (!isNaN(prevT) && !isNaN(currT) && newForm.T[i - 1].trim()) deltaT[i - 1] = (currT - prevT).toString();
        }
        newForm.deltaT = deltaT;
        newForm.deltaTBar = calculateDeltaTBarTime(newForm.deltaT);
        newForm.vBar = calculateVBarTime(newForm.deltaLBar, newForm.deltaTBar);
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
        newForm.vBar = calculateVBarTime(newForm.deltaLBar, newForm.deltaTBar);
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
        newForm.vBar = calculateVBarTime(newForm.deltaLBar, newForm.deltaTBar);
      }
      return newForm;
    });
  }, []);

  const setField4 = useCallback((key: keyof FormDataTime, v: string) => setForm4((prev) => ({ ...prev, [key]: v })), []);
  const toggleAutoCalculate4 = useCallback(() => setForm4((prev) => ({ ...prev, autoCalculateEnabled: !prev.autoCalculateEnabled })), []);
  const clear4 = useCallback(() => setForm4(INITIAL_FORM_TIME), []);

  return (
    <div className="min-h-screen bg-white py-8 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-6 border-b border-slate-300 mb-8">
          <TabButton active={activeTab === "Table2"} onClick={() => setActiveTab("Table2")}>表2：驻波法</TabButton>
          <TabButton active={activeTab === "Table3"} onClick={() => setActiveTab("Table3")}>表3：相位法</TabButton>
          <TabButton active={activeTab === "Table4"} onClick={() => setActiveTab("Table4")}>表4：时差法</TabButton>
        </div>

        {activeTab === "Table2" && <FormTable23 methodName="驻波法" form={form2} onSetL={setL2} onSetDeltaL={setDeltaL2} onSetField={setField2} onToggleAutoCalculate={toggleAutoCalculate2} onClear={clear2} />}
        {activeTab === "Table3" && <FormTable23 methodName="相位法" form={form3} onSetL={setL3} onSetDeltaL={setDeltaL3} onSetField={setField3} onToggleAutoCalculate={toggleAutoCalculate3} onClear={clear3} />}
        {activeTab === "Table4" && <FormTable4 form={form4} onSetL={setL4} onSetT={setT4} onSetDeltaL={setDeltaL4} onSetDeltaT={setDeltaT4} onSetField={setField4} onToggleAutoCalculate={toggleAutoCalculate4} onClear={clear4} />}

        <div className="mt-12 text-center"><p className="text-sm text-slate-400">Physics Lab Data Entry  Designed with </p></div>
      </div>
    </div>
  );
}
