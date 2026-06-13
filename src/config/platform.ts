// Platform configuration
// 可以通过环境变量或构建参数切换平台

export type PlatformType = 'mobile' | 'desktop'
export type AppMode = 'web' | 'desktop' | 'mobile'

export interface PlatformConfig {
  platform: PlatformType
  appMode: AppMode
  isMobile: boolean
  isDesktop: boolean
  isWeb: boolean
  isCapacitor: boolean
  hasTouch: boolean
}

// 从环境变量读取或检测平台
function detectPlatform(): PlatformConfig {
  // VITE_PLATFORM 可以是 'mobile' | 'desktop'
  const platform = (import.meta.env.VITE_PLATFORM as PlatformType) || 'desktop'
  // VITE_APP_MODE 可以是 'web' | 'desktop' | 'mobile'
  const appMode = (import.meta.env.VITE_APP_MODE as AppMode) || 'web'
  const isCapacitor = !!(window as any).Capacitor

  // 检测是否为移动设备
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  return {
    platform,
    appMode,
    isMobile: platform === 'mobile' || (platform === 'desktop' && isMobileDevice && hasTouch),
    isDesktop: platform === 'desktop',
    isWeb: appMode === 'web',
    isCapacitor,
    hasTouch: hasTouch || isMobileDevice
  }
}

export const platform: PlatformConfig = detectPlatform()

// 便捷方法
export function isMobilePlatform(): boolean {
  return platform.isMobile || platform.appMode === 'mobile'
}

export function isDesktopPlatform(): boolean {
  return platform.isDesktop && !platform.isMobile
}

export function isWebPlatform(): boolean {
  return platform.isWeb
}