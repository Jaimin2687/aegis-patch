'use client';
import { getStageIcon } from '../../lib/formatLog';

const STAGES = ['CLONING', 'SCANNING', 'PATCHING', 'TESTING', 'PUSHING', 'COMPLETE'];

export default function StatusPanel({ currentStage, error }) {
  const currentIndex = STAGES.indexOf(currentStage);
  
  return (
    <div className="w-full max-w-4xl mb-10 overflow-x-auto pb-4">
      <div className="flex items-center justify-between min-w-[600px]">
        {STAGES.map((stage, idx) => {
          const isActive = stage === currentStage && !error;
          const isCompleted = currentIndex > idx || (stage === 'COMPLETE' && currentStage === 'COMPLETE');
          const isError = error && stage === currentStage;
          
          let iconColor = 'text-[#555]';
          let textColor = 'text-[#555]';
          
          if (isCompleted) {
            iconColor = 'text-emerald-400';
            textColor = 'text-emerald-400';
          } else if (isActive) {
            iconColor = 'text-white animate-pulse-glow';
            textColor = 'text-white';
          } else if (isError) {
            iconColor = 'text-red-400';
            textColor = 'text-red-400';
          }
          
          return (
            <div key={stage} className="flex flex-col items-center relative flex-1">
              <div className="flex items-center justify-center z-10 bg-black w-10 h-10 rounded-full border border-[#222] mb-2 shadow-sm">
                <span className={`text-xl ${iconColor}`}>
                  {isCompleted ? '✅' : isError ? '❌' : getStageIcon(stage)}
                </span>
              </div>
              <span className={`text-xs font-medium tracking-wide ${textColor}`}>
                {stage}
              </span>
              
              {/* Connecting line */}
              {idx < STAGES.length - 1 && (
                <div className="absolute top-5 left-[50%] w-full h-[2px] -z-0" style={{ transform: 'translateX(20px)', width: 'calc(100% - 40px)' }}>
                  <div className={`h-full ${isCompleted ? 'bg-emerald-400/50' : 'bg-[#222]'}`}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
