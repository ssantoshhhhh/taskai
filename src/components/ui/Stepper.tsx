import React, { useState, Children, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => { },
  onFinalStepCompleted = () => { },
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  renderStepIndicator,
  ...rest
}: any) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) onFinalStepCompleted();
    else onStepChange(newStep);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div
      className={`w-full max-w-3xl mx-auto ${stepCircleContainerClassName}`}
      {...rest}
    >
      {!isCompleted ? (
        <React.Fragment>
          <div className={`${stepContainerClassName} flex w-full items-center justify-between mb-8 px-4 relative`}>
            {/* Background line for connection */}
            <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-white/20 -z-10 -translate-y-1/2 rounded-full" />

            {stepsArray.map((_, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;

              return (
                <React.Fragment key={stepNumber}>
                  <div className="relative z-10 p-2 rounded-full backdrop-blur-sm">
                    {renderStepIndicator ? (
                      renderStepIndicator({
                        step: stepNumber,
                        currentStep,
                        onStepClick: (clicked: number) => {
                          setDirection(clicked > currentStep ? 1 : -1);
                          updateStep(clicked);
                        }
                      })
                    ) : (
                      <StepIndicator
                        step={stepNumber}
                        disableStepIndicators={disableStepIndicators}
                        currentStep={currentStep}
                        onClickStep={(clicked: number) => {
                          setDirection(clicked > currentStep ? 1 : -1);
                          updateStep(clicked);
                        }}
                      />
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div className={`relative min-h-[300px] ${contentClassName}`}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {stepsArray[currentStep - 1]}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={`flex justify-center gap-4 mt-8 ${footerClassName}`}>
            {currentStep !== 1 && (
              <button
                onClick={handleBack}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors
                  ${currentStep === 1
                    ? 'opacity-0 pointer-events-none'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                {...backButtonProps}
              >
                {backButtonText}
              </button>
            )}
            <button
              onClick={isLastStep ? handleComplete : handleNext}
              className="px-8 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              {...nextButtonProps}
            >
              {isLastStep ? 'Complete' : nextButtonText}
            </button>
          </div>
        </React.Fragment>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center text-center py-20"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
            <CheckIcon className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">You're All Set!</h3>
          <p className="text-gray-400 max-w-sm mb-8">
            You've explored the basics of Task AI. Ready to create your account and get started?
          </p>
          <button
            onClick={() => setCurrentStep(1)}
            className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors shadow-lg active:scale-95"
          >
            Start Again
          </button>
        </motion.div>
      )}
    </div>
  );
}

export function Step({ children }: { children: React.ReactNode }) {
  return <div className="px-4">{children}</div>;
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators }: any) {
  const isActive = currentStep === step;
  const isCompleted = currentStep > step;
  const status = isActive ? 'active' : isCompleted ? 'complete' : 'inactive';

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) onClickStep(step);
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`relative cursor-pointer flex flex-col items-center gap-2 group`}
      initial={false}
      animate={status}
    >
      <motion.div
        variants={{
          inactive: { scale: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: '#a3a3a3' },
          active: { scale: 1.25, backgroundColor: '#06b6d4', borderColor: '#06b6d4', color: '#000000', boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)' }, // Cyan-500 with glow
          complete: { scale: 1, backgroundColor: '#10b981', borderColor: '#10b981', color: '#ffffff' } // Emerald-500
        }}
        transition={{ duration: 0.2 }}
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold z-20 shadow-lg"
      >
        {status === 'complete' ? (
          <CheckIcon className="h-5 w-5" />
        ) : (
          <span className="text-sm">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

function CheckIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.1, type: 'tween', ease: 'easeOut', duration: 0.3 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
