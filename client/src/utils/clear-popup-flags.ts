<<<<<<< HEAD
// Clear popup flags utility - simplified and optimized
const POPUP_FLAGS = [
  'hasSeenOnboarding',
  'hasSeenWalkthrough',
  'hasSeenTutorial',
  'tutorialCompleted',
  'onboardingCompleted',
  'walkthroughCompleted'
];

export function clearPopupFlags() {
  let clearedCount = 0;
  
  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    POPUP_FLAGS.forEach(flag => {
      if (localStorage.getItem(flag)) {
        localStorage.removeItem(flag);
        clearedCount++;
      }
    });
    
    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} popup flags from localStorage`);
    }
  });
=======
// Utility to clear all onboarding and tutorial popup flags from localStorage
export function clearAllPopupFlags() {
  try {
    const keysToRemove: string[] = [];
    
    // Find all keys related to popups
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('jacc-onboarding') || 
        key.includes('jacc-tutorial') || 
        key.includes('walkthrough') ||
        key.includes('tutorial-') ||
        key.includes('onboarding-')
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all popup-related flags
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('Cleared popup flag:', key);
    });
    
    console.log(`Cleared ${keysToRemove.length} popup flags from localStorage`);
    return keysToRemove.length;
  } catch (error) {
    console.error('Error clearing popup flags:', error);
    return 0;
  }
}

// Auto-clear on app load
if (typeof window !== 'undefined') {
  clearAllPopupFlags();
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
}