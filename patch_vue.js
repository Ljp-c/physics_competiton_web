const fs = require('fs');
const path = require('path');

const tooltipHTML = `
              <!-- Tooltip -->
              <div v-if="hoveredCell === \`L_\${i-1}\`" class="absolute bottom-full mb-2 z-50 w-64 p-3 bg-slate-800 text-white rounded-md shadow-xl text-xs pointer-events-none transition-opacity">
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
              </div>`;

function patchFile(filename, isNew) {
  const filepath = path.join(__dirname, 'src', filename);
  if (!fs.existsSync(filepath)) return;
  let text = fs.readFileSync(filepath, 'utf8');

  // Add import
  if (!text.includes('useEvaluator')) {
    text = text.replace(
      'import {',
      'import { useEvaluator } from "@/composables/useEvaluator";\nimport {'
    );
  }

  // Add destructuring right after State declaration
  if (!text.includes('hoveredCell')) {
    text = text.replace(
      '// State',
      '// State\nconst { hoveredCell, isLoading, currentResult, error, handleMouseEnter, handleMouseLeave } = useEvaluator();\n'
    );
  }

  // Find replacing the outer loops for Table 2 and 3
  const findForm = isNew ? 'currentForm23.L[i - 1]' : '(activeTab === \\'Table2\\' ? form2 : form3).L[i - 1]';
  const findGridL23 = `<div v-for="i in 10" :key="i" class="flex flex-col items-center gap-1">
              <span class="text-xs text-slate-600 font-mono">
                L<sub>{{ i - 1 }}</sub>
              </span>
              <DataInput`;
              
  const replGridL23 = `<div v-for="i in 10" :key="i" class="flex flex-col items-center gap-1 relative" @mouseenter="handleMouseEnter(\`L_\${i-1}\`, ${findForm})" @mouseleave="handleMouseLeave">
              <span class="text-xs text-slate-600 font-mono">
                L<sub>{{ i - 1 }}</sub>
              </span>
              <DataInput`;
              
  if (text.includes(findGridL23)) {
      text = text.replace(findGridL23, replGridL23);
  }
  
  // Actually, since there could be multiple DataInputs inside, we just use regex to insert the tooltip before the closing div of "flex-col items-center gap-1"
  // Specifically for Table23
  text = text.replace(/(<div v-for="i in 10" :key="i" class="flex flex-col items-center gap-1 relative"[^>]*>[\s\S]*?<DataInput[\s\S]*?\/>)\s*(<\/div>)/, (match, p1, p2) => {
      // make sure we only insert once per exact block
      if (!match.includes('老师正在思考')) {
        return p1 + tooltipHTML + '\n            ' + p2;
      }
      return match;
  });

  // Table 4 replacement
  const findGridL4 = `<div v-for="i in 10" :key="i" class="flex flex-col items-center gap-1">
              <span class="text-xs text-slate-600 font-mono">
                L<sub>{{ i - 1 }}</sub>
              </span>
              <DataInput
                :modelValue="form4.L[i - 1]"`;
                
  const replGridL4 = `<div v-for="i in 10" :key="i" class="flex flex-col items-center gap-1 relative" @mouseenter="handleMouseEnter(\`L_\${i-1}\`, form4.L[i - 1])" @mouseleave="handleMouseLeave">
              <span class="text-xs text-slate-600 font-mono">
                L<sub>{{ i - 1 }}</sub>
              </span>
              <DataInput
                :modelValue="form4.L[i - 1]"`;
  
  if (text.includes(findGridL4)) {
      text = text.replace(findGridL4, replGridL4);
      text = text.replace(/(<div v-for="i in 10" :key="i" class="flex flex-col items-center gap-1 relative" @mouseenter="handleMouseEnter\(`L_\${i-1}`, form4\.L\[i - 1\]\)"[^>]*>[\s\S]*?<DataInput[\s\S]*?\/>)\s*(<\/div>)/, (match, p1, p2) => {
         if (!match.includes('老师正在思考')) {
           return p1 + tooltipHTML + '\n            ' + p2;
         }
         return match;
      });
  }

  fs.writeFileSync(filepath, text);
}

patchFile('AppNew.vue', true);
patchFile('App.vue', false);

console.log("Patched successfully.");