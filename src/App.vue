<script setup lang="ts">
import { ref } from 'vue'
import {
  usePhysicsCalculator,
  usePhysicsCalculatorTime,
  INITIAL_FORM_DATA,
  INITIAL_FORM_TIME
} from '@/composables/usePhysics'
import DataInput from '@/components/DataInput.vue'
import TabButton from '@/components/TabButton.vue'
import { useEvaluator } from "@/composables/useEvaluator"

// ============================================================================ 
// MAIN APP COMPONENT
// ============================================================================ 

const { hoveredCell, isLoading, currentResult, error, handleMouseEnter, handleMouseLeave } = useEvaluator()

const activeTab = ref<'Table2' | 'Table3' | 'Table4'>('Table2')

const { form: form2, updateField: updateField2 } = usePhysicsCalculator()
const { form: form3, updateField: updateField3 } = usePhysicsCalculator()
const { form: form4, updateField: updateField4 } = usePhysicsCalculatorTime()

function clearForm2() {
  Object.assign(form2, JSON.parse(JSON.stringify(INITIAL_FORM_DATA)))
}

function clearForm3() {
  Object.assign(form3, JSON.parse(JSON.stringify(INITIAL_FORM_DATA)))
}

function clearForm4() {
  Object.assign(form4, JSON.parse(JSON.stringify(INITIAL_FORM_TIME)))
}

// Helpers for UI
function maxFilledIndex(arr: string[]): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i]?.trim() !== "") return i;
  }
  return -1;
}

function isFieldEnabled(arr: string[], i: number): boolean {
  return i <= maxFilledIndex(arr) + 1
}
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

      <!-- ==================================================================== -->
      <!-- TABLE 2 & TABLE 3: Standing Wave / Phase Method -->
      <!-- ==================================================================== -->
      <template v-if="activeTab === 'Table2' || activeTab === 'Table3'">
        <div class="space-y-6">
          <div class="border-b border-slate-200 pb-4">
            <h1 class="text-2xl font-bold text-slate-800 mb-2">
              {{ activeTab === 'Table2' ? '表2 驻波法——音速的测定' : '表3 相位法——音速的测定' }}
            </h1>
            <p class="text-sm text-slate-600">
              {{ activeTab === 'Table2' ? 'Standing Wave Method - Speed of Sound Measurement' : 'Phase Method - Speed of Sound Measurement' }}
            </p>
            <div class="flex items-center gap-4 mt-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  class="w-4 h-4 border border-slate-300 rounded cursor-pointer"
                  :checked="activeTab === 'Table2' ? form2.autoCalculateEnabled : form3.autoCalculateEnabled"
                  @change="() => {
                    if (activeTab === 'Table2') updateField2('autoCalculateEnabled', !form2.autoCalculateEnabled)
                    else updateField3('autoCalculateEnabled', !form3.autoCalculateEnabled)
                  }"
                />
                <span class="text-sm text-slate-700">启用自动计算</span>
              </label>
              <button
                @click="activeTab === 'Table2' ? clearForm2() : clearForm3()"
                class="text-sm px-3 py-1 border border-slate-300 rounded hover:bg-slate-100 transition-colors text-slate-700"
              >
                清空
              </button>
            </div>
          </div>

          <!-- L Input Grid -->
          <div class="border border-slate-200 rounded px-6 py-4">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">
              位移 L₀...L₉ (mm)
            </h2>
            <div class="grid grid-cols-5 md:grid-cols-10 gap-3">
              <div v-for="i in 10" :key="`L-${i-1}`" class="flex flex-col items-center gap-1 relative" @mouseenter="handleMouseEnter(`L_${i-1}`, activeTab === 'Table2' ? form2.L[i - 1] : form3.L[i - 1])" @mouseleave="handleMouseLeave">
                <span class="text-xs text-slate-600 font-mono">
                  L<sub>{{ i - 1 }}</sub>
                </span>
                <DataInput
                  v-if="activeTab === 'Table2'"
                  :modelValue="form2.L[i - 1]"
                  @update:modelValue="v => updateField2('L', v, i - 1)"
                  :placeholder="`L${i - 1}`"
                  :disabled="!isFieldEnabled(form2.L, i - 1)"
                />
                <DataInput
                  v-else
                  :modelValue="form3.L[i - 1]"
                  @update:modelValue="v => updateField3('L', v, i - 1)"
                  :placeholder="`L${i - 1}`"
                  :disabled="!isFieldEnabled(form3.L, i - 1)"
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
              <div v-for="i in 5" :key="`dL-${i-1}`" class="flex flex-col items-center gap-1">
                <span class="text-xs text-slate-600 font-mono">
                  ΔL<sub>{{ i - 1 }}</sub>
                </span>
                <DataInput
                  v-if="activeTab === 'Table2'"
                  :modelValue="form2.deltaL[i - 1]"
                  @update:modelValue="v => updateField2('deltaL', v, i - 1)"
                  :disabled="form2.autoCalculateEnabled"
                />
                <DataInput
                  v-else
                  :modelValue="form3.deltaL[i - 1]"
                  @update:modelValue="v => updateField3('deltaL', v, i - 1)"
                  :disabled="form3.autoCalculateEnabled"
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
                    <span style="text-decoration: overline">ΔL</span> = (1/5)Σ <span style="text-decoration: overline">ΔL</span> =
                  </div>
                  <DataInput
                    v-if="activeTab === 'Table2'"
                    :modelValue="form2.deltaLBar"
                    @update:modelValue="v => updateField2('deltaLBar', v)"
                    variant="result"
                  />
                  <DataInput
                    v-else
                    :modelValue="form3.deltaLBar"
                    @update:modelValue="v => updateField3('deltaLBar', v)"
                    variant="result"
                  />
                  <span class="text-xs text-slate-500">(mm)</span>
                </div>
                <div class="flex items-center gap-3 bg-slate-50 rounded p-4">
                  <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                    u<sub>ΔL</sub> =
                  </div>
                  <DataInput
                     v-if="activeTab === 'Table2'"
                    :modelValue="form2.uDeltaL"
                    @update:modelValue="v => updateField2('uDeltaL', v)"
                    variant="result"
                  />
                  <DataInput
                     v-else
                    :modelValue="form3.uDeltaL"
                    @update:modelValue="v => updateField3('uDeltaL', v)"
                    variant="result"
                  />
                  <span class="text-xs text-slate-500">(mm)</span>
                </div>
              </div>

              <!-- Row 2: λ̄ and u_λ -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex items-center gap-3 bg-slate-50 rounded p-4">
                  <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                    <span style="text-decoration: overline">λ</span> = (2/5)<span style="text-decoration: overline">ΔL</span> =
                  </div>
                  <DataInput
                    v-if="activeTab === 'Table2'"
                    :modelValue="form2.lambdaBar"
                    @update:modelValue="v => updateField2('lambdaBar', v)"
                    variant="result"
                  />
                  <DataInput
                    v-else
                    :modelValue="form3.lambdaBar"
                    @update:modelValue="v => updateField3('lambdaBar', v)"
                    variant="result"
                  />
                  <span class="text-xs text-slate-500">(mm)</span>
                </div>
                <div class="flex items-center gap-3 bg-slate-50 rounded p-4">
                  <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                    u<sub>λ</sub> =
                  </div>
                  <DataInput
                    v-if="activeTab === 'Table2'"
                    :modelValue="form2.uLambda"
                    @update:modelValue="v => updateField2('uLambda', v)"
                    variant="result"
                  />
                  <DataInput
                    v-else
                    :modelValue="form3.uLambda"
                    @update:modelValue="v => updateField3('uLambda', v)"
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
                    v-if="activeTab === 'Table2'"
                    :modelValue="form2.f"
                    @update:modelValue="v => updateField2('f', v)"
                    variant="normal"
                  />
                  <DataInput
                    v-else
                    :modelValue="form3.f"
                    @update:modelValue="v => updateField3('f', v)"
                    variant="normal"
                  />
                  <span class="text-xs text-slate-500">(kHz)</span>
                </div>
                <div class="flex items-center gap-3 bg-slate-50 rounded p-4">
                  <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                    u<sub>f</sub> =
                  </div>
                  <DataInput
                    v-if="activeTab === 'Table2'"
                    :modelValue="form2.uf"
                    @update:modelValue="v => updateField2('uf', v)"
                    variant="normal"
                  />
                  <DataInput
                    v-else
                    :modelValue="form3.uf"
                    @update:modelValue="v => updateField3('uf', v)"
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
                    <span style="text-decoration: overline">v</span> = f × <span style="text-decoration: overline">λ</span> =
                  </div>
                  <DataInput
                    v-if="activeTab === 'Table2'"
                    :modelValue="form2.vBar"
                    @update:modelValue="v => updateField2('vBar', v)"
                    variant="result"
                  />
                  <DataInput
                    v-else
                    :modelValue="form3.vBar"
                    @update:modelValue="v => updateField3('vBar', v)"
                    variant="result"
                  />
                  <span class="text-xs text-slate-500">(m/s)</span>
                </div>
                <div class="flex items-center gap-3 bg-blue-50 rounded p-4">
                  <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                    u<sub>v</sub> =
                  </div>
                  <DataInput
                    v-if="activeTab === 'Table2'"
                    :modelValue="form2.uv"
                    @update:modelValue="v => updateField2('uv', v)"
                    variant="result"
                  />
                  <DataInput
                    v-else
                    :modelValue="form3.uv"
                    @update:modelValue="v => updateField3('uv', v)"
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
                  v-if="activeTab === 'Table2'"
                  :modelValue="form2.uvRatio"
                  @update:modelValue="v => updateField2('uvRatio', v)"
                  variant="result"
                />
                <DataInput
                  v-else
                  :modelValue="form3.uvRatio"
                  @update:modelValue="v => updateField3('uvRatio', v)"
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
                v-if="activeTab === 'Table2'"
                :modelValue="form2.A"
                @update:modelValue="v => updateField2('A', v)"
                variant="result"
              />
              <DataInput
                v-else
                :modelValue="form3.A"
                @update:modelValue="v => updateField3('A', v)"
                variant="result"
              />
              <span class="text-xs text-slate-500">(%)</span>
            </div>
          </div>
        </div>
      </template>

      <!-- ==================================================================== -->
      <!-- TABLE 4: Time Difference Method -->
      <!-- ==================================================================== -->
      <template v-else-if="activeTab === 'Table4'">
        <div class="space-y-6">
          <div class="border-b border-slate-200 pb-4">
            <h1 class="text-2xl font-bold text-slate-800 mb-2">表4 时差法——音速的测定</h1>
            <p class="text-sm text-slate-600">
              Time Difference Method - Speed of Sound Measurement
            </p>
            <div class="flex items-center gap-4 mt-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  class="w-4 h-4 border border-slate-300 rounded cursor-pointer"
                  :checked="form4.autoCalculateEnabled"
                  @change="() => updateField4('autoCalculateEnabled', !form4.autoCalculateEnabled)"
                />
                <span class="text-sm text-slate-700">启用自动计算</span>
              </label>
              <button
                @click="clearForm4"
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
              <div v-for="i in 10" :key="`L4-${i-1}`" class="flex flex-col items-center gap-1 relative" @mouseenter="handleMouseEnter(`L_${i-1}`, form4.L[i - 1])" @mouseleave="handleMouseLeave">
                <span class="text-xs text-slate-600 font-mono">
                  L<sub>{{ i - 1 }}</sub>
                </span>
                <DataInput
                  :modelValue="form4.L[i - 1]"
                  @update:modelValue="v => updateField4('L', v, i - 1)"
                  :placeholder="`L${i - 1}`"
                  :disabled="!isFieldEnabled(form4.L, i - 1)"
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
              <div v-for="i in 10" :key="`T4-${i-1}`" class="flex flex-col items-center gap-1">
                <span class="text-xs text-slate-600 font-mono">
                  T<sub>{{ i - 1 }}</sub>
                </span>
                <DataInput
                  :modelValue="form4.T[i - 1]"
                  @update:modelValue="v => updateField4('T', v, i - 1)"
                  :placeholder="`T${i - 1}`"
                  :disabled="!isFieldEnabled(form4.T, i - 1)"
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
                  <div v-for="i in 5" :key="`dL4-${i-1}`" class="flex flex-col items-center gap-1">
                    <span class="text-xs text-slate-600 font-mono">
                      ΔL<sub>{{ i - 1 }}</sub>
                    </span>
                    <DataInput
                      :modelValue="form4.deltaL[i - 1]"
                      @update:modelValue="v => updateField4('deltaL', v, i - 1)"
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
                  <div v-for="i in 5" :key="`dT4-${i-1}`" class="flex flex-col items-center gap-1">
                    <span class="text-xs text-slate-600 font-mono">
                      ΔT<sub>{{ i - 1 }}</sub>
                    </span>
                    <DataInput
                      :modelValue="form4.deltaT[i - 1]"
                      @update:modelValue="v => updateField4('deltaT', v, i - 1)"
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
                    @update:modelValue="v => updateField4('deltaLBar', v)"
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
                    @update:modelValue="v => updateField4('deltaTBar', v)"
                    variant="result"
                  />
                  <span class="text-xs text-slate-500">(μs)</span>
                </div>
              </div>

              <div class="border-t border-slate-200" />

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex items-center gap-3 bg-blue-50 rounded p-4">
                  <div class="text-sm text-slate-700 font-mono whitespace-nowrap">
                    <span style="text-decoration: overline">v</span> = <span style="text-decoration: overline">ΔL</span> / <span style="text-decoration: overline">ΔT</span> =
                  </div>
                  <DataInput
                    :modelValue="form4.vBar"
                    @update:modelValue="v => updateField4('vBar', v)"
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
                @update:modelValue="v => updateField4('A', v)"
                variant="result"
              />
              <span class="text-xs text-slate-500">(%)</span>
            </div>
          </div>
        </div>
      </template>

      <div class="mt-12 text-center">
        <p class="text-sm text-slate-400">
          物理实验数据录入工具 · Designed with ❤️ Vue 3
        </p>
      </div>
    </div>
  </div>
</template>
