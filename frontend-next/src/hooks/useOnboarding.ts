'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  OnboardingState,
  OnboardingStage,
  OnboardingStep,
  ONBOARDING_STORAGE_KEY,
  DEFAULT_ONBOARDING_STEPS,
} from '@/types/onboarding';

const INITIAL_STATE: OnboardingState = {
  stage: "operational",
  salonName: null,
  steps: DEFAULT_ONBOARDING_STEPS,
  progress: 0,
  launchBlockers: [],
  lastUpdated: new Date().toISOString(),
};

function calculateProgress(steps: OnboardingStep[]): number {
  const requiredSteps = steps.filter((s) => s.required);
  const completedRequired = requiredSteps.filter((s) => s.completed);
  return requiredSteps.length > 0
    ? Math.round((completedRequired.length / requiredSteps.length) * 100)
    : 0;
}

function getLaunchBlockers(steps: OnboardingStep[]): string[] {
  return steps
    .filter((s) => s.required && !s.completed)
    .map((s) => s.title);
}

function determineStage(
  steps: OnboardingStep[],
  salonName: string | null
): OnboardingStage {
  if (!salonName) return 'setup';
  const requiredIncomplete = steps.filter((s) => s.required && !s.completed);
  if (requiredIncomplete.length === 0) return 'ready_to_launch';
  return 'setup';
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as OnboardingState;
        setState(parsed);
      }
    } catch (e) {
      console.warn('Failed to load onboarding state:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persist state to localStorage
  const persistState = useCallback((newState: OnboardingState) => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('Failed to persist onboarding state:', e);
    }
  }, []);

  // Update a specific step
  const completeStep = useCallback(
    (stepId: string) => {
      setState((prev) => {
        const updatedSteps = prev.steps.map((s) =>
          s.id === stepId ? { ...s, completed: true } : s
        );
        const progress = calculateProgress(updatedSteps);
        const launchBlockers = getLaunchBlockers(updatedSteps);
        const stage = determineStage(updatedSteps, prev.salonName);
        const newState: OnboardingState = {
          ...prev,
          steps: updatedSteps,
          progress,
          launchBlockers,
          stage,
          lastUpdated: new Date().toISOString(),
        };
        persistState(newState);
        return newState;
      });
    },
    [persistState]
  );

  // Set salon name
  const setSalonName = useCallback(
    (name: string) => {
      setState((prev) => {
        const stage = determineStage(prev.steps, name);
        const newState: OnboardingState = {
          ...prev,
          salonName: name,
          stage,
          lastUpdated: new Date().toISOString(),
        };
        persistState(newState);
        return newState;
      });
    },
    [persistState]
  );

  // Mark as operational (launched)
  const markOperational = useCallback(() => {
    setState((prev) => {
      const newState: OnboardingState = {
        ...prev,
        stage: 'operational',
        lastUpdated: new Date().toISOString(),
      };
      persistState(newState);
      return newState;
    });
  }, [persistState]);

  // Reset onboarding
  const resetOnboarding = useCallback(() => {
    setState(INITIAL_STATE);
    persistState(INITIAL_STATE);
  }, [persistState]);

  // Computed values
  const isOnboarding = useMemo(() => state.stage !== 'operational', [state.stage]);
  const isReadyToLaunch = useMemo(() => state.stage === 'ready_to_launch', [state.stage]);
  const requiredSteps = useMemo(() => state.steps.filter((s) => s.required), [state.steps]);
  const completedRequired = useMemo(
    () => requiredSteps.filter((s) => s.completed),
    [requiredSteps]
  );

  return {
    // State
    ...state,
    isLoaded,
    isOnboarding,
    isReadyToLaunch,
    requiredSteps,
    completedRequired,
    // Actions
    completeStep,
    setSalonName,
    markOperational,
    resetOnboarding,
  };
}
