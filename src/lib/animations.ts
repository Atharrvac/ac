/**
 * Animation utilities and presets for consistent motion design
 */

// Animation duration constants
export const durations = {
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
  slowest: 700,
} as const;

// Easing functions
export const easings = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

// Animation presets using Tailwind classes
export const animations = {
  // Fade animations
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-200',
  fadeInUp: 'animate-in fade-in slide-in-from-bottom-4 duration-500',
  fadeInDown: 'animate-in fade-in slide-in-from-top-4 duration-500',
  fadeInLeft: 'animate-in fade-in slide-in-from-left-4 duration-500',
  fadeInRight: 'animate-in fade-in slide-in-from-right-4 duration-500',

  // Scale animations
  scaleIn: 'animate-in zoom-in-95 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-150',
  scaleInBounce: 'animate-in zoom-in-50 duration-500 ease-out',

  // Slide animations
  slideInLeft: 'animate-in slide-in-from-left-full duration-300',
  slideInRight: 'animate-in slide-in-from-right-full duration-300',
  slideInUp: 'animate-in slide-in-from-bottom-full duration-300',
  slideInDown: 'animate-in slide-in-from-top-full duration-300',

  // Special effects
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
  ping: 'animate-ping',

  // Hover animations
  hoverScale: 'transition-transform duration-200 hover:scale-105',
  hoverScaleDown: 'transition-transform duration-200 hover:scale-95',
  hoverGlow: 'transition-all duration-300 hover:shadow-lg hover:shadow-primary/25',
  hoverFloat: 'transition-transform duration-300 hover:-translate-y-1',

  // Card animations
  cardHover: 'transition-all duration-300 hover:shadow-xl hover:-translate-y-2',
  cardPress: 'transition-transform duration-100 active:scale-95',

  // Button animations
  buttonHover: 'transition-all duration-200 hover:shadow-md hover:scale-105',
  buttonPress: 'transition-transform duration-100 active:scale-95',

  // Text animations
  textShimmer: 'bg-gradient-to-r from-foreground via-primary to-foreground bg-size-200 animate-text-shimmer',
  textGlow: 'transition-all duration-300 hover:text-primary hover:drop-shadow-glow',

  // Loading states
  skeletonPulse: 'animate-pulse bg-muted rounded',
  loadingSpinner: 'animate-spin',
  loadingDots: 'animate-bounce',
} as const;

// Stagger animation delays for lists
export const staggerDelays = {
  none: '',
  '75': 'delay-75',
  '100': 'delay-100',
  '150': 'delay-150',
  '200': 'delay-200',
  '300': 'delay-300',
  '500': 'delay-500',
  '700': 'delay-700',
  '1000': 'delay-1000',
} as const;

// Page transition animations
export const pageTransitions = {
  slideLeft: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
    transition: { duration: 0.3 }
  },
  slideRight: {
    initial: { x: -300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 300, opacity: 0 },
    transition: { duration: 0.3 }
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { duration: 0.3 }
  }
} as const;

// Utility functions
export const getStaggerDelay = (index: number, baseDelay = 100): string => {
  const delay = index * baseDelay;
  if (delay <= 75) return staggerDelays['75'];
  if (delay <= 100) return staggerDelays['100'];
  if (delay <= 150) return staggerDelays['150'];
  if (delay <= 200) return staggerDelays['200'];
  if (delay <= 300) return staggerDelays['300'];
  if (delay <= 500) return staggerDelays['500'];
  if (delay <= 700) return staggerDelays['700'];
  return staggerDelays['1000'];
};

export const combineAnimations = (...animationClasses: string[]): string => {
  return animationClasses.filter(Boolean).join(' ');
};

// Intersection Observer for scroll animations
export const useScrollAnimation = (threshold = 0.1) => {
  const observeElement = (element: Element, animationClass: string) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(...animationClass.split(' '));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );
    observer.observe(element);
    return observer;
  };

  return { observeElement };
};

// CSS custom properties for advanced animations
export const cssAnimations = `
  @keyframes text-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(var(--primary), 0.3); }
    50% { box-shadow: 0 0 30px rgba(var(--primary), 0.6); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes slideInFromLeft {
    0% { transform: translateX(-100%); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideInFromRight {
    0% { transform: translateX(100%); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideInFromBottom {
    0% { transform: translateY(100%); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  @keyframes slideInFromTop {
    0% { transform: translateY(-100%); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  .animate-text-shimmer {
    background-size: 200% auto;
    animation: text-shimmer 3s linear infinite;
  }

  .animate-glow {
    animation: glow 2s ease-in-out infinite alternate;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .slide-in-left {
    animation: slideInFromLeft 0.5s ease-out;
  }

  .slide-in-right {
    animation: slideInFromRight 0.5s ease-out;
  }

  .slide-in-bottom {
    animation: slideInFromBottom 0.5s ease-out;
  }

  .slide-in-top {
    animation: slideInFromTop 0.5s ease-out;
  }

  .bg-size-200 {
    background-size: 200% auto;
  }

  .drop-shadow-glow {
    filter: drop-shadow(0 0 8px rgba(var(--primary), 0.6));
  }
`;

export default animations;
