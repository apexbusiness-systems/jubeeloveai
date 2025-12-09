/**
 * Client-side Parent Journey Verifier Entry Point
 * 
 * Exposes the verifyParentJourney function globally via window object
 * for easy browser console access: await verifyParentJourney()
 */

import { parentJourneyVerifier } from '@/test/parentJourneyVerification';

// Export types for TypeScript consumers
export type { JourneyStep, ParentJourneyResult } from '@/test/parentJourneyVerification';

/**
 * Main verification function exposed globally
 * Usage: await verifyParentJourney() in browser console
 */
export async function verifyParentJourney() {
  try {
    console.log('🎯 Starting Parent User Journey Verification...\n');
    
    const report = await parentJourneyVerifier.runCompleteJourney({
      captureScreenshots: true,
      screenshotQuality: 0.8
    });
    
    // Print detailed report
    console.log('\n' + parentJourneyVerifier.getDetailedReport());
    
    // Print summary
    const emoji = report.overallPass ? '✅' : '❌';
    console.log(`\n${emoji} OVERALL: ${report.overallPass ? 'PASS' : 'FAIL'}`);
    console.log(`   Passed: ${report.passedSteps}/${report.totalSteps} steps`);
    console.log(`   Duration: ${((report.endTime - report.startTime) / 1000).toFixed(2)}s`);
    console.log(`   Screenshots: ${report.screenshots.length} captured`);
    
    if (report.screenshots.length > 0) {
      console.log('\n📸 To view screenshots, run: viewJourneyScreenshots()');
      console.log('📥 To download screenshots, run: downloadJourneyScreenshots()');
    }
    
    return report;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

/**
 * Quick journey variant (skips onboarding)
 */
export async function verifyQuickJourney() {
  try {
    console.log('⚡ Starting Quick Parent Journey Verification...\n');
    
    const report = await parentJourneyVerifier.runQuickJourney({
      captureScreenshots: true,
      screenshotQuality: 0.8
    });
    
    console.log('\n' + parentJourneyVerifier.getDetailedReport());
    
    const emoji = report.overallPass ? '✅' : '❌';
    console.log(`\n${emoji} OVERALL: ${report.overallPass ? 'PASS' : 'FAIL'}`);
    console.log(`   Passed: ${report.passedSteps}/${report.totalSteps} steps`);
    
    return report;
  } catch (error) {
    console.error('❌ Quick verification failed:', error);
    throw error;
  }
}

// Window interface already declared in src/test/parentJourneyVerification.ts

// Expose functions globally for browser console access
if (typeof window !== 'undefined') {
  window.verifyParentJourney = verifyParentJourney;
  window.verifyQuickJourney = verifyQuickJourney;
  window.viewJourneyScreenshots = () => parentJourneyVerifier.viewScreenshots();
  window.downloadJourneyScreenshots = () => parentJourneyVerifier.downloadScreenshots();
  
  console.log('🎯 Parent Journey Verifier loaded. Available commands:');
  console.log('   - await verifyParentJourney()');
  console.log('   - await verifyQuickJourney()');
  console.log('   - viewJourneyScreenshots()');
  console.log('   - downloadJourneyScreenshots()');
}
