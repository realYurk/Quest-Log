import { ref, computed, onMounted, onUnmounted } from 'vue'
import { isMobilePlatform, platform } from '@/config/platform'

export function useResponsive() {
  const windowWidth = ref(window.innerWidth)
  const windowHeight = ref(window.innerHeight)

  // Breakpoints
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    xxl: 1536
  }

  // Current breakpoint
  const currentBreakpoint = computed(() => {
    const width = windowWidth.value
    if (width >= breakpoints.xxl) return 'xxl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'xs'
  })

  // Responsive states
  const isXs = computed(() => currentBreakpoint.value === 'xs')
  const isSm = computed(() => currentBreakpoint.value === 'sm')
  const isMd = computed(() => currentBreakpoint.value === 'md')
  const isLg = computed(() => currentBreakpoint.value === 'lg')
  const isXl = computed(() => currentBreakpoint.value === 'xl')
  const isXxl = computed(() => currentBreakpoint.value === 'xxl')

  // Common responsive values
  const isMobile = computed(() => windowWidth.value < breakpoints.md || isMobilePlatform())
  const isTablet = computed(() => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg)
  const isDesktop = computed(() => windowWidth.value >= breakpoints.lg)
  const isWide = computed(() => windowWidth.value >= breakpoints.xl)

  // Sidebar visibility
  const showSidebar = computed(() => !isMobile.value)
  const sidebarCollapsed = ref(false)

  // Navigation type
  const useBottomNav = computed(() => isMobile.value)
  const useSideNav = computed(() => !isMobile.value)

  // Touch-friendly mode
  const touchMode = computed(() => platform.hasTouch || isMobile.value)

  function handleResize() {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
    handleResize()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return {
    windowWidth,
    windowHeight,
    breakpoints,
    currentBreakpoint,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    showSidebar,
    sidebarCollapsed,
    useBottomNav,
    useSideNav,
    touchMode,
    platform
  }
}