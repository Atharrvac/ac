/**
 * Responsive utility functions and constants for consistent design
 */

// Standard breakpoints following Tailwind CSS conventions
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Container padding classes for different screen sizes
export const containerPadding = {
  mobile: 'px-4',
  tablet: 'sm:px-6',
  desktop: 'lg:px-8',
  all: 'px-4 sm:px-6 lg:px-8'
} as const;

// Common responsive grid patterns
export const gridPatterns = {
  // 1 column on mobile, 2 on tablet, 3 on desktop
  responsive3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  // 1 column on mobile, 2 on tablet, 4 on desktop
  responsive4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  // 1 column on mobile, 2 on desktop
  responsive2: 'grid-cols-1 lg:grid-cols-2',
  // Stats cards pattern
  statsCards: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  // Profile stats
  profileStats: 'grid-cols-2 gap-3 sm:gap-4',
} as const;

// Common spacing patterns
export const spacing = {
  section: 'py-12 sm:py-16',
  sectionSmall: 'py-8 sm:py-12',
  cardPadding: 'p-4 sm:p-6',
  cardPaddingSmall: 'p-3 sm:p-4',
  marginBottom: 'mb-6 sm:mb-8',
  marginBottomSmall: 'mb-4 sm:mb-6',
  gap: 'gap-4 sm:gap-6',
  gapSmall: 'gap-3 sm:gap-4',
} as const;

// Typography responsive classes
export const typography = {
  h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
  h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
  h3: 'text-lg sm:text-xl md:text-2xl',
  h4: 'text-base sm:text-lg',
  body: 'text-sm sm:text-base',
  bodyLarge: 'text-base sm:text-lg',
  caption: 'text-xs sm:text-sm',
} as const;

// Icon sizes for different screen sizes
export const iconSizes = {
  small: 'w-4 h-4 sm:w-5 sm:h-5',
  medium: 'w-5 h-5 sm:w-6 sm:h-6',
  large: 'w-6 h-6 sm:w-8 sm:h-8',
  xlarge: 'w-8 h-8 sm:w-10 sm:h-10',
} as const;

// Button responsive classes
export const buttonSizes = {
  responsive: 'w-full sm:w-auto',
  fullMobile: 'w-full sm:w-auto',
} as const;

// Flexbox responsive patterns
export const flexPatterns = {
  stackToRow: 'flex flex-col sm:flex-row',
  responsiveCenter: 'justify-center lg:justify-start',
  responsiveTextCenter: 'text-center lg:text-left',
  responsiveItems: 'items-center',
  responsiveJustify: 'justify-between',
} as const;

// Card responsive patterns
export const cardPatterns = {
  stats: 'p-4 sm:p-6',
  content: 'p-4 sm:p-6',
  header: 'pb-4',
  contentNoTop: 'pt-0',
} as const;

/**
 * Helper function to combine responsive classes
 */
export const cn = (...classes: (string | undefined | false | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Common responsive patterns as utility functions
 */
export const responsive = {
  // Common container pattern
  container: () => cn(containerPadding.all),
  
  // Section padding pattern
  section: (small = false) => cn(
    small ? spacing.sectionSmall : spacing.section,
    containerPadding.all
  ),
  
  // Grid pattern with responsive columns
  grid: (columns: keyof typeof gridPatterns) => cn(
    'grid',
    gridPatterns[columns],
    spacing.gap
  ),
  
  // Card with responsive padding
  card: (variant: keyof typeof cardPatterns = 'content') => cn(
    cardPatterns[variant]
  ),
  
  // Responsive flex layout
  flex: (direction: 'row' | 'col' = 'row') => cn(
    'flex',
    direction === 'row' ? flexPatterns.stackToRow : 'flex-col'
  ),
  
  // Responsive text
  text: (size: keyof typeof typography) => typography[size],
  
  // Responsive icon
  icon: (size: keyof typeof iconSizes) => iconSizes[size],
  
  // Responsive button
  button: (responsive = true) => responsive ? buttonSizes.responsive : '',
} as const;

export default responsive;
