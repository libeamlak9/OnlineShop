import { useWindowDimensions } from 'react-native';
import { breakpoints } from '../constants/theme';

export type Breakpoint = 'sm' | 'md' | 'lg';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  let breakpoint: Breakpoint = 'sm';
  if (width >= breakpoints.lg) {
    breakpoint = 'lg';
  } else if (width >= breakpoints.md) {
    breakpoint = 'md';
  }

  return {
    width,
    height,
    breakpoint,
    isTablet: breakpoint === 'md' || breakpoint === 'lg',
    isDesktop: breakpoint === 'lg',
    isPhone: breakpoint === 'sm',
  };
}
