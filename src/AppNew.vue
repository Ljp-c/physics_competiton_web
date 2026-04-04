<script setup lang="ts">
import { ref, computed } from "vue";
import DataInput from "@/components/DataInput.vue";
import TabButton from "@/components/TabButton.vue";
import { useEvaluator } from "@/composables/useEvaluator";
import {
  usePhysicsCalculator,
  usePhysicsCalculatorTime,
  INITIAL_FORM_DATA,
  INITIAL_FORM_TIME,
} from "@/composables/usePhysics";

// State
const { hoveredCell, isLoading, currentResult, error, handleMouseEnter, handleMouseLeave } = useEvaluator();
const activeTab = ref<"Table2" | "Table3" | "Table4">("Table2");

const { form: form2, updateField: updateField2 } = usePhysicsCalculator();
const { form: form3, updateField: updateField3 } = usePhysicsCalculator();
const { form: form4, updateField: updateField4 } = usePhysicsCalculatorTime();

const clearForm2 = () => Object.assign(form2, INITIAL_FORM_DATA);
const clearForm3 = () => Object.assign(form3, INITIAL_FORM_DATA);
const clearForm4 = () => Object.assign(form4, INITIAL_FORM_TIME);

// Computed helpers for Table 2 & 3
const currentForm23 = computed(() => (activeTab.value === "Table2" ? form2 : form3));
const updateField23 = (key: any, value: any, index?: number) => {
  if (activeTab.value === "Table2") {
    updateField2(key, value, index);
  } else {
    updateField3(key, value, index);
  }
};
const currentClear23 = computed(() => (activeTab.value === "Table2" ? clearForm2 : clearForm3));

const getLastFilledIndex = (arr: string[]) => {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].trim() !== "") return i;
  }
  return -1;
};

const isLFieldEnabled23 = (i: number) => {
  const form = currentForm23.value;
  const maxFilled = getLastFilledIndex(form.L);
  return i <= maxFilled + 1;
};

// Computed helpers for Table 4
const isLFieldEnabled4 = (i: number) => {
  const maxFilled = getLastFilledIndex(form4.L);
  return i <= maxFilled + 1;
};

const isTFieldEnabled4 = (i: number) => {
  const maxFilled = getLastFilledIndex(form4.T);
  return i <= maxFilled + 1;
};
</script>

<template>
  <div class="min-h-screen bg-white py-8 px-4 font-sans">
    <div class="max-w-5xl mx-auto">
      <div class="flex gap-6 border-b border-slate-300 mb-8">
        <TabButton :active="activeTab === 'Table2'" @click="activeTab = 'Table2'">
          表2 驻波法
        </TabButton>
        <TabButton :active="activeTab === 'Table3'" @click="activeTab = 'Table3'">
          表3 相位法
        </TabButton>
        <TabButton :active="activeTab === 'Table4'" @click="activeTab = 'Table4'">
          表4 时差法
        </TabButton>
      </div>

      <!-- 表2 和 表3: 驻波法 / 相位法 -->
      <div v-if="activeTab === 'Table2' || activeTab === 'Table3'" class="space-y-6">
        <div class="border-b border-slate-200 pb-4">
          <h1 class="text-2xl font-bold text-slate-800 mb-2">
            表{{ activeTab === 'Table2' ? '2 驻波法' : '3 相位法' }}——音速的测定
          </h1>
          <p class="text-sm text-slate-600">
            {{
              activeTab === 'Table2'
                ? 'Standing Wave Method - Speed of Sound Measurement'
                : 'Phase Method - Speed of Sound Measurement'
            }}
          </p>
          <div class="flex items-center gap-4 mt-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="currentForm23.autoCalculateEnabled"
                class="w-4 h-4 border border-slate-300 rounded cursor-pointer"
              />
              <span class="text-sm text-slate-700">启用自动计算</span>
            </label>
            <button
              @click="currentClear23()"
              class="text-sm px-3 py-1 border border-slate-300 rounded hover:bg-slate-100 transition-colors text-slate-700"
            >
              清空
            </button>
          </div>
        </div>

        <!-- L Input Grid -->
        <div class="border border-slate-200 rounded px-6 py-4">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">位移 L₀...L₉ (mm)</h2>
          <div class="grid grid-cols-5 md:grid-cols-10 gap-3">
            <div v-for="i in 10" :key="i" class="flex flex-col items-center gap-1 relative" @mouseenter="handleMouseEnter(`L_${i-1}`, currentForm23.L[i - 1])" @mouseleave="handleMouseLeave">
              <span class="text-xs text-slate-600 font-mono">
                L<sub>{{ i - 1 }}</sub>
              </span>
              <DataInput
                :modelValue="currentForm23.L[i - 1]"
                @update:modelValue="(v) => updateField23('L', v, i - 1)"
                :placeholder="`L${i - 1}`"
                :disabled="!isLFieldEnabled23(i - 1)"
              />
              
              <!-- Tooltip -->
              <div v-if="hoveredCell === `L_${i-1}`" class="absolute bottom-full mb-2 z-50 w-64 p-3 bg-slate-800 text-white rounded-md shadow-xl text-xs pointer-events-none transition-opacity">
                <div v-if="isLoading" class="flex items-center gap-2">
                  <span class="text-lg animate-spin">⭮</span> 老师正在思考...
                </div>
                <div v-else-if="error" class="text-red-400">
                  {{ error }}
                </div>
                <div v-else class="leading-relaxed">
                  👨‍🏫 {{ currentResult }}
                </div>
                <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ΔL Display Grid -->
        <div class="border border-slate-200 rounded px-6 py-4">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">
            差值 ΔL = L<sub>i+5</sub> - L<sub>i</sub> (mm)
          </h2>
          <div class="grid grid-cols-5 gap-4 max-w-xl">
            <div v-for="i in 5" :key="i" class="flex flex-col items-center gap-1">
              <span class="text-xs text-slate-600 font-mono">
                ΔL<sub>{{ i - 1 }}</sub>
              </span>
              <DataInput
                :modelValue="currentForm23.deltaL[i - 1]"
                @update:modelValue="(v) => updateField23('deltaL', v, i - 1)"
                placeholder=""
                :disabled="currentForm23.autoCalculateEnabled"
              />
            </div>
          </div>
        </div>

        <!-- Calculated Fields -->
        <div class="border border-slate-200 rounded px-6 py-4">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">计算结果</h2>
          <div class="space-y-4">
            <!-- Row 1: ΔL̄ and u_ΔL -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center gap-3 bg-slate-50 rounded p-4">
                <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                  <span style="text-decoration: overline">ΔL</span> = (1/5)Σ
                  <span style="text-decoration: overline">ΔL</span> =
                </div>
                <DataInput
                  :modelValue="currentForm23.deltaLBar"
                  @update:modelValue="(v) => updateField23('deltaLBar', v)"
                  variant="result"
                />
                <span class="text-xs text-slate-500">(mm)</span>
              </div>
              <div class="flex items-center gap-3 bg-slate-50 rounded p-4">
                <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                  u<sub>ΔL</sub> =
                </div>
                <DataInput
                  :modelValue="currentForm23.uDeltaL"
                  @update:modelValue="(v) => updateField23('uDeltaL', v)"
                  variant="result"
                />
                <span class="text-xs text-slate-500">(mm)</span>
              </div>
            </div>

            <!-- Row 2: λ̄ and u_λ -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center gap-3 bg-slate-50 rounded p-4">
                <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                  <span style="text-decoration: overline">λ</span> = (2/5)<span
                    style="text-decoration: overline"
                    >ΔL</span
                  > =
                </div>
                <DataInput
                  :modelValue="currentForm23.lambdaBar"
                  @update:modelValue="(v) => updateField23('lambdaBar', v)"
                  variant="result"
                />
                <span class="text-xs text-slate-500">(mm)</span>
              </div>
              <div class="flex items-center gap-3 bg-slate-50 rounded p-4">
                <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                  u<sub>λ</sub> =
                </div>
                <DataInput
                  :modelValue="currentForm23.uLambda"
                  @update:modelValue="(v) => updateField23('uLambda', v)"
                  variant="result"
                />
                <span class="text-xs text-slate-500">(mm)</span>
              </div>
            </div>

            <!-- Row 3: Frequency f and u_f -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center gap-3 bg-slate-50 rounded p-4">
                <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                  f =
                </div>
                <DataInput
                  :modelValue="currentForm23.f"
                  @update:modelValue="(v) => updateField23('f', v)"
                  variant="normal"
                />
                <span class="text-xs text-slate-500">(kHz)</span>
              </div>
              <div class="flex items-center gap-3 bg-slate-50 rounded p-4">
                <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                  u<sub>f</sub> =
                </div>
                <DataInput
                  :modelValue="currentForm23.uf"
                  @update:modelValue="(v) => updateField23('uf', v)"
                  variant="normal"
                />
                <span class="text-xs text-slate-500">(kHz)</span>
              </div>
            </div>

            <div class="border-t border-slate-200" />

            <!-- Row 4: v̄ and u_v -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center gap-3 bg-blue-50 rounded p-4">
                <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                  <span style="text-decoration: overline">v</span> = f ×
                  <span style="text-decoration: overline">λ</span> =
                </div>
                <DataInput
                  :modelValue="currentForm23.vBar"
                  @update:modelValue="(v) => updateField23('vBar', v)"
                  variant="result"
                />
                <span class="text-xs text-slate-500">(m/s)</span>
              </div>
              <div class="flex items-center gap-3 bg-blue-50 rounded p-4">
                <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                  u<sub>v</sub> =
                </div>
                <DataInput
                  :modelValue="currentForm23.uv"
                  @update:modelValue="(v) => updateField23('uv', v)"
                  variant="result"
                 />
                <span class="text-xs text-slate-500">(m/s)</span>
              </div>
            </div>

            <!-- Row 5: u_v/v̄ -->
            <div class="flex items-center gap-3 bg-slate-50 rounded p-4">
              <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                u<sub>v</sub> / <span style="text-decoration: overline">v</span> =
              </div>
              <DataInput
                :modelValue="currentForm23.uvRatio"
                @update:modelValue="(v) => updateField23('uvRatio', v)"
                variant="result"
              />
              <span class="text-xs text-slate-500">(%)</span>
            </div>
          </div>
        </div>

        <!-- Error Analysis -->
        <div class="border border-slate-200 rounded px-6 py-4 bg-rose-50">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">相对误差</h2>
          <div class="flex items-center gap-3">
            <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
              A = (<span style="text-decoration: overline">v</span> - 340) / 340 × 100% =
            </div>
            <DataInput
              :modelValue="currentForm23.A"
              @update:modelValue="(v) => updateField23('A', v)"
              variant="result"
             />
            <span class="text-xs text-slate-500">(%)</span>
          </div>
        </div>
      </div>

      <!-- 表4: 时差法 -->
      <div v-if="activeTab === 'Table4'" class="space-y-6">
        <div class="border-b border-slate-200 pb-4">
          <h1 class="text-2xl font-bold text-slate-800 mb-2">表4 时差法——音速的测定</h1>
          <p class="text-sm text-slate-600">Time Difference Method - Speed of Sound Measurement</p>
          <div class="flex items-center gap-4 mt-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="form4.autoCalculateEnabled"
                class="w-4 h-4 border border-slate-300 rounded cursor-pointer"
              />
              <span class="text-sm text-slate-700">启用自动计算</span>
            </label>
            <button
              @click="clearForm4()"
              class="text-sm px-3 py-1 border border-slate-300 rounded hover:bg-slate-100 transition-colors text-slate-700"
            >
              清空
            </button>
          </div>
        </div>

        <!-- L Input Grid -->
        <div class="border border-slate-200 rounded px-6 py-4">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">位移 L (mm)</h2>
          <div class="grid grid-cols-5 md:grid-cols-10 gap-3">
            <div v-for="i in 10" :key="i" class="flex flex-col items-center gap-1 relative" @mouseenter="handleMouseEnter(`L_${i-1}`, form4.L[i - 1])" @mouseleave="handleMouseLeave">
              <span class="text-xs text-slate-600 font-mono">
                L<sub>{{ i - 1 }}</sub>
              </span>
              <DataInput
                :modelValue="form4.L[i - 1]"
                @update:modelValue="(v) => updateField4('L', v, i - 1)"
                :placeholder="`L${i - 1}`"
                :disabled="!isLFieldEnabled4(i - 1)"
              />
              
              <!-- Tooltip -->
              <div v-if="hoveredCell === `L_${i-1}`" class="absolute bottom-full mb-2 z-50 w-64 p-3 bg-slate-800 text-white rounded-md shadow-xl text-xs pointer-events-none transition-opacity">
                <div v-if="isLoading" class="flex items-center gap-2">
                  <span class="text-lg animate-spin">⭮</span> 老师正在思考...
                </div>
                <div v-else-if="error" class="text-red-400">
                  {{ error }}
                </div>
                <div v-else class="leading-relaxed">
                  👨‍🏫 {{ currentResult }}
                </div>
                <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- T Input Grid -->
        <div class="border border-slate-200 rounded px-6 py-4">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">时间 T (μs)</h2>
          <div class="grid grid-cols-5 md:grid-cols-10 gap-3">
            <div v-for="i in 10" :key="i" class="flex flex-col items-center gap-1">
              <span class="text-xs text-slate-600 font-mono">
                T<sub>{{ i - 1 }}</sub>
              </span>
              <DataInput
                :modelValue="form4.T[i - 1]"
                @update:modelValue="(v) => updateField4('T', v, i - 1)"
                :placeholder="`T${i - 1}`"
                :disabled="!isTFieldEnabled4(i - 1)"
              />
            </div>
          </div>
        </div>

        <!-- ΔL and ΔT Display Grids -->
        <div class="border border-slate-200 rounded px-6 py-4">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">差值</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-sm font-semibold text-slate-700 mb-3">
                ΔL = L<sub>i+5</sub> - L<sub>i</sub> (mm)
              </h3>
              <div class="grid grid-cols-5 gap-3">
                <div v-for="i in 5" :key="i" class="flex flex-col items-center gap-1">
                  <span class="text-xs text-slate-600 font-mono">
                    ΔL<sub>{{ i - 1 }}</sub>
                  </span>
                  <DataInput
                    :modelValue="form4.deltaL[i - 1]"
                    @update:modelValue="(v) => updateField4('deltaL', v, i - 1)"
                    placeholder=""
                    :disabled="form4.autoCalculateEnabled"
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-700 mb-3">
                ΔT = T<sub>i+5</sub> - T<sub>i</sub> (μs)
              </h3>
              <div class="grid grid-cols-5 gap-3">
                <div v-for="i in 5" :key="i" class="flex flex-col items-center gap-1">
                  <span class="text-xs text-slate-600 font-mono">
                    ΔT<sub>{{ i - 1 }}</sub>
                  </span>
                  <DataInput
                    :modelValue="form4.deltaT[i - 1]"
                    @update:modelValue="(v) => updateField4('deltaT', v, i - 1)"
                    placeholder=""
                    :disabled="form4.autoCalculateEnabled"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Calculated Fields -->
        <div class="border border-slate-200 rounded px-6 py-4">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">计算结果</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center gap-3 bg-slate-50 rounded p-4">
                <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                  <span style="text-decoration: overline">ΔL</span> =
                </div>
                <DataInput
                  :modelValue="form4.deltaLBar"
                  @update:modelValue="(v) => updateField4('deltaLBar', v)"
                  variant="result"
                />
                <span class="text-xs text-slate-500">(mm)</span>
              </div>
              <div class="flex items-center gap-3 bg-slate-50 rounded p-4">
                <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                  <span style="text-decoration: overline">ΔT</span> =
                </div>
                <DataInput
                  :modelValue="form4.deltaTBar"
                  @update:modelValue="(v) => updateField4('deltaTBar', v)"
                  variant="result"
                />
                <span class="text-xs text-slate-500">(μs)</span>
              </div>
            </div>

            <div class="border-t border-slate-200" />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center gap-3 bg-blue-50 rounded p-4">
                <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                  <span style="text-decoration: overline">v</span> =
                  <span style="text-decoration: overline">ΔL</span> /
                  <span style="text-decoration: overline">ΔT</span> =
                </div>
                <DataInput
                  :modelValue="form4.vBar"
                  @update:modelValue="(v) => updateField4('vBar', v)"
                  variant="result"
                />
                <span class="text-xs text-slate-500">(mm/μs)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Analysis -->
        <div class="border border-slate-200 rounded px-6 py-4 bg-rose-50">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">相对误差</h2>
          <div class="flex items-center gap-3">
            <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
              A = (<span style="text-decoration: overline">v</span> - 340) / 340 × 100% =
            </div>
            <DataInput
              :modelValue="form4.A"
              @update:modelValue="(v) => updateField4('A', v)"
              variant="result"
            />
            <span class="text-xs text-slate-500">(%)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
