/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hub } from './components/Hub';
import { DecimalAddSubModule } from './components/modules/DecimalAddSubModule';
import { DecimalMulDivModule } from './components/modules/DecimalMulDivModule';
import { NumberLineModule } from './components/modules/NumberLineModule';
import { PlaceValueLab } from './components/modules/PlaceValueLab';
import { ErrorHunterModule } from './components/modules/ErrorHunterModule';
import { WordProblemModule } from './components/modules/WordProblemModule';
import { LogView } from './components/LogView';
import { ComingSoon } from './components/modules/ComingSoon';
import { ModuleId } from './store/progressStore';
import { MODULES } from './constants';
import { useApplySettings } from './lib/useApplySettings';

type View = { kind: 'HUB' } | { kind: 'LOG' } | { kind: 'MODULE'; id: ModuleId };

export default function App() {
  const [view, setView] = useState<View>({ kind: 'HUB' });
  useApplySettings();

  const goHub = () => setView({ kind: 'HUB' });

  const renderModule = (id: ModuleId) => {
    switch (id) {
      case 'decimal-addsub':
        return <DecimalAddSubModule onExit={goHub} />;
      case 'decimal-muldiv':
        return <DecimalMulDivModule onExit={goHub} />;
      case 'number-line':
        return <NumberLineModule onExit={goHub} />;
      case 'place-value':
        return <PlaceValueLab onExit={goHub} />;
      case 'error-hunter':
        return <ErrorHunterModule onExit={goHub} />;
      case 'word-problem':
        return <WordProblemModule onExit={goHub} />;
      default: {
        const meta = MODULES.find((m) => m.id === id);
        return <ComingSoon title={meta?.title ?? ''} onBack={goHub} />;
      }
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden select-none bg-bg">
      <AnimatePresence mode="wait">
        {view.kind === 'HUB' && (
          <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
            <Hub onSelectModule={(id) => setView({ kind: 'MODULE', id })} onOpenLog={() => setView({ kind: 'LOG' })} />
          </motion.div>
        )}

        {view.kind === 'MODULE' && (
          <motion.div key={`module-${view.id}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
            {renderModule(view.id)}
          </motion.div>
        )}

        {view.kind === 'LOG' && (
          <motion.div key="log" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full h-full">
            <LogView onBack={goHub} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 背景のドット装飾 */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1] overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(#1e293b 1.5px, transparent 1.5px)`, backgroundSize: '40px 40px' }} />
      </div>
    </div>
  );
}
