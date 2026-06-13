// Capacitor global
declare namespace Capacitor {
  namespace Core {
    function Platform(): {
      isNative: boolean
      isWeb: boolean
    }
  }
}

// Extend Window for Capacitor
interface Window {
  Capacitor?: typeof Capacitor
}