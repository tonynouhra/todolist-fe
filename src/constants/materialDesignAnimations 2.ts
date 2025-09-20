// Material Design 3 Animation Tokens
// Based on Material Design 3 Motion Guidelines

export const materialMotionTokens = {
  // Duration tokens (in milliseconds)
  duration: {
    short1: 50,
    short2: 100,
    short3: 150,
    short4: 200,
    medium1: 250,
    medium2: 300,
    medium3: 350,
    medium4: 400,
    long1: 450,
    long2: 500,
    long3: 550,
    long4: 600,
    extraLong1: 700,
    extraLong2: 800,
    extraLong3: 900,
    extraLong4: 1000,
  },

  // Easing tokens
  easing: {
    linear: 'cubic-bezier(0, 0, 1, 1)',
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    standardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
    standardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  },
} as const;

// Material Design 3 State Layer Animations
export const stateLayerAnimations = {
  hover: {
    duration: materialMotionTokens.duration.short1,
    easing: materialMotionTokens.easing.standard,
  },
  focus: {
    duration: materialMotionTokens.duration.short2,
    easing: materialMotionTokens.easing.standard,
  },
  press: {
    duration: materialMotionTokens.duration.short1,
    easing: materialMotionTokens.easing.standard,
  },
  drag: {
    duration: materialMotionTokens.duration.short4,
    easing: materialMotionTokens.easing.standardDecelerate,
  },
} as const;

// Material Design 3 Component Animations
export const componentAnimations = {
  button: {
    stateLayer: stateLayerAnimations.hover,
    elevation: {
      duration: materialMotionTokens.duration.short2,
      easing: materialMotionTokens.easing.standard,
    },
  },
  card: {
    hover: {
      duration: materialMotionTokens.duration.short3,
      easing: materialMotionTokens.easing.standard,
    },
    elevation: {
      duration: materialMotionTokens.duration.short2,
      easing: materialMotionTokens.easing.standard,
    },
  },
  fab: {
    scale: {
      duration: materialMotionTokens.duration.short2,
      easing: materialMotionTokens.easing.standard,
    },
    elevation: {
      duration: materialMotionTokens.duration.short2,
      easing: materialMotionTokens.easing.standard,
    },
  },
  navigationDrawer: {
    enter: {
      duration: materialMotionTokens.duration.medium2,
      easing: materialMotionTokens.easing.emphasizedDecelerate,
    },
    exit: {
      duration: materialMotionTokens.duration.short4,
      easing: materialMotionTokens.easing.emphasizedAccelerate,
    },
  },
  dialog: {
    enter: {
      duration: materialMotionTokens.duration.medium1,
      easing: materialMotionTokens.easing.emphasizedDecelerate,
    },
    exit: {
      duration: materialMotionTokens.duration.short3,
      easing: materialMotionTokens.easing.emphasizedAccelerate,
    },
  },
  snackbar: {
    enter: {
      duration: materialMotionTokens.duration.short4,
      easing: materialMotionTokens.easing.standardDecelerate,
    },
    exit: {
      duration: materialMotionTokens.duration.short3,
      easing: materialMotionTokens.easing.standardAccelerate,
    },
  },
} as const;

// Material Design 3 Shared Axis Transitions
export const sharedAxisTransitions = {
  x: {
    enter: {
      duration: materialMotionTokens.duration.medium2,
      easing: materialMotionTokens.easing.emphasizedDecelerate,
    },
    exit: {
      duration: materialMotionTokens.duration.short4,
      easing: materialMotionTokens.easing.emphasizedAccelerate,
    },
  },
  y: {
    enter: {
      duration: materialMotionTokens.duration.medium2,
      easing: materialMotionTokens.easing.emphasizedDecelerate,
    },
    exit: {
      duration: materialMotionTokens.duration.short4,
      easing: materialMotionTokens.easing.emphasizedAccelerate,
    },
  },
  z: {
    enter: {
      duration: materialMotionTokens.duration.medium1,
      easing: materialMotionTokens.easing.standard,
    },
    exit: {
      duration: materialMotionTokens.duration.short3,
      easing: materialMotionTokens.easing.standard,
    },
  },
} as const;

// Material Design 3 Fade Through Transitions
export const fadeThroughTransitions = {
  enter: {
    duration: materialMotionTokens.duration.medium1,
    easing: materialMotionTokens.easing.standard,
  },
  exit: {
    duration: materialMotionTokens.duration.short2,
    easing: materialMotionTokens.easing.standard,
  },
} as const;

// Material Design 3 Container Transform Transitions
export const containerTransformTransitions = {
  enter: {
    duration: materialMotionTokens.duration.medium4,
    easing: materialMotionTokens.easing.emphasizedDecelerate,
  },
  exit: {
    duration: materialMotionTokens.duration.short4,
    easing: materialMotionTokens.easing.emphasizedAccelerate,
  },
} as const;

// Utility function to create Material Design transitions
export const createMaterialTransition = (
  properties: string | string[],
  duration: number = materialMotionTokens.duration.short4,
  easing: string = materialMotionTokens.easing.standard,
  delay: number = 0
): string => {
  const props = Array.isArray(properties) ? properties : [properties];
  const transitions = props.map(
    (prop) => `${prop} ${duration}ms ${easing}${delay > 0 ? ` ${delay}ms` : ''}`
  );
  return transitions.join(', ');
};

// Utility function to create staggered animations
export const createStaggeredTransition = (
  properties: string | string[],
  baseDelay: number = 50,
  index: number = 0,
  duration: number = materialMotionTokens.duration.short4,
  easing: string = materialMotionTokens.easing.standard
): string => {
  const delay = baseDelay * index;
  return createMaterialTransition(properties, duration, easing, delay);
};

// Reduced motion utilities
export const getReducedMotionTransition = (
  properties: string | string[],
  fallbackDuration: number = 50
): string => {
  return createMaterialTransition(
    properties,
    fallbackDuration,
    materialMotionTokens.easing.linear
  );
};

// Export all animation constants
export const materialAnimations = {
  motionTokens: materialMotionTokens,
  stateLayer: stateLayerAnimations,
  components: componentAnimations,
  sharedAxis: sharedAxisTransitions,
  fadeThrough: fadeThroughTransitions,
  containerTransform: containerTransformTransitions,
  utils: {
    createTransition: createMaterialTransition,
    createStaggered: createStaggeredTransition,
    getReducedMotion: getReducedMotionTransition,
  },
} as const;

export default materialAnimations;
