/**
 * Parent Journey Verification Test
 * 
 * Programmatically verifies the complete parent user journey with detailed evidence logging.
 * Can be run directly in the browser console or integrated into system health checks.
 * Includes screenshot capture at each step for visual evidence.
 */

import html2canvas from 'html2canvas';

export type VerificationResult = {
  step: string;
  passed: boolean;
  evidence: string;
  timestamp: number;
  error?: string;
  screenshot?: string; // Base64 data URL
};

export type JourneyReport = {
  testName: string;
  startTime: number;
  endTime: number;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  results: VerificationResult[];
  overallPass: boolean;
  screenshots: string[]; // Array of base64 data URLs
};

export type JourneyStep = VerificationResult; // Alias for external consumers

export type ParentJourneyResult = JourneyReport; // Alias for external consumers

declare global {
  interface Window {
    parentJourneyVerifier: ParentJourneyVerifier;
    verifyParentJourney?: (captureScreenshots?: boolean) => Promise<ParentJourneyResult>;
    verifyQuickJourney?: (captureScreenshots?: boolean) => Promise<ParentJourneyResult>;
    viewJourneyScreenshots?: () => void;
    downloadJourneyScreenshots?: () => void;
  }
}

type ScreenshotOptions = {
  captureScreenshots: boolean;
  screenshotQuality: number; // 0-1
};

class ParentJourneyVerifier {
  private results: VerificationResult[] = [];
  private startTime: number = 0;
  private screenshots: string[] = [];
  private captureScreenshots: boolean = true;
  private screenshotQuality: number = 0.8;

  /**
   * Capture screenshot of current page state
   */
  private async captureScreenshot(stepName: string): Promise<string | undefined> {
    if (!this.captureScreenshots) return undefined;

    try {
      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        scale: 1,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });

      const dataUrl = canvas.toDataURL('image/jpeg', this.screenshotQuality);
      this.screenshots.push(dataUrl);
      
      console.log(`📸 Screenshot captured for: ${stepName}`);
      return dataUrl;
    } catch (error) {
      console.warn(`Failed to capture screenshot for ${stepName}:`, error);
      return undefined;
    }
  }

  private async log(step: string, passed: boolean, evidence: string, error?: string, captureScreenshot: boolean = true) {
    // Capture screenshot before logging
    let screenshot: string | undefined;
    if (captureScreenshot && this.captureScreenshots) {
      screenshot = await this.captureScreenshot(step);
    }

    const result: VerificationResult = {
      step,
      passed,
      evidence,
      timestamp: Date.now(),
      error,
      screenshot,
    };
    this.results.push(result);
    
    const emoji = passed ? '✅' : '❌';
    console.log(`${emoji} ${step}: ${evidence}`);
    if (error) console.error(`   Error: ${error}`);
    if (screenshot) console.log(`   📸 Screenshot captured`);
  }

  /**
   * Configure screenshot capture options
   */
  setScreenshotOptions(options: Partial<ScreenshotOptions>) {
    if (options.captureScreenshots !== undefined) {
      this.captureScreenshots = options.captureScreenshots;
    }
    if (options.screenshotQuality !== undefined) {
      this.screenshotQuality = Math.max(0, Math.min(1, options.screenshotQuality));
    }
  }

  /**
   * Download all screenshots as a zip file
   */
  async downloadScreenshots() {
    if (this.screenshots.length === 0) {
      console.warn('No screenshots to download');
      return;
    }

    // Create download links for each screenshot
    this.screenshots.forEach((dataUrl, index) => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `journey-step-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    console.log(`✅ Downloaded ${this.screenshots.length} screenshots`);
  }

  /**
   * View screenshots in new tabs
   */
  viewScreenshots() {
    if (this.screenshots.length === 0) {
      console.warn('No screenshots to view');
      return;
    }

    this.screenshots.forEach((dataUrl, index) => {
      const win = window.open('', `_blank`);
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Journey Step ${index + 1}</title>
              <style>
                body { margin: 0; padding: 20px; background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 100%; height: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
                .info { color: #fff; text-align: center; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div>
                <div class="info">
                  <h2>Step ${index + 1}: ${this.results[index]?.step || 'Unknown'}</h2>
                  <p>${this.results[index]?.evidence || ''}</p>
                </div>
                <img src="${dataUrl}" alt="Screenshot ${index + 1}" />
              </div>
            </body>
          </html>
        `);
      }
    });

    console.log(`✅ Opened ${this.screenshots.length} screenshots in new tabs`);
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async verifyElement(
    selector: string,
    _description: string,
    timeout: number = 5000
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element && element instanceof HTMLElement) {
        const isVisible = element.offsetParent !== null;
        if (isVisible) {
          return true;
        }
      }
      await this.wait(100);
    }
    
    return false;
  }

  private async verifyMultipleSelectors(
    selectors: string[],
    _description: string,
    timeout: number = 5000
  ): Promise<HTMLElement | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element instanceof HTMLElement && element.offsetParent !== null) {
          return element;
        }
      }
      await this.wait(100);
    }
    
    return null;
  }

  async runCompleteJourney(options?: Partial<ScreenshotOptions>): Promise<JourneyReport> {
    this.startTime = Date.now();
    this.results = [];
    this.screenshots = [];
    
    // Apply screenshot options if provided
    if (options) {
      this.setScreenshotOptions(options);
    }
    
    console.group('🎯 Parent Journey Verification - Complete Flow');
    console.log('Starting comprehensive parent user journey test...');
    console.log(`Screenshot capture: ${this.captureScreenshots ? 'ENABLED' : 'DISABLED'}\n`);

    // STEP 1: Verify page load
    try {
      const isHome = window.location.pathname === '/' || window.location.pathname === '/home';
      await this.log(
        'Step 1: Homepage Load',
        isHome,
        isHome ? 'User successfully landed on homepage' : `User on ${window.location.pathname}`,
        isHome ? undefined : 'Not on homepage'
      );
    } catch (error) {
      await this.log('Step 1: Homepage Load', false, 'Failed to verify page', (error as Error).message);
    }

    await this.wait(500);

    // STEP 2: Verify Jubee mascot presence
    try {
      const jubeeExists = await this.verifyElement(
        '[data-jubee-canvas="true"], canvas',
        'Jubee mascot',
        3000
      );
      await this.log(
        'Step 2: Jubee Mascot Visible',
        jubeeExists,
        jubeeExists 
          ? 'Jubee mascot is rendered and visible to parent' 
          : 'Jubee mascot not found in DOM',
        jubeeExists ? undefined : 'Mascot element missing'
      );
    } catch (error) {
      await this.log('Step 2: Jubee Mascot Visible', false, 'Failed to verify', (error as Error).message);
    }

    await this.wait(500);

    // STEP 3: Wait for onboarding (it starts after 1s delay)
    await this.wait(1500);
    
    try {
      const onboardingElement = await this.verifyMultipleSelectors(
        ['[data-testid="onboarding"]', '[role="dialog"]', '.onboarding-tutorial'],
        'Onboarding tutorial'
      );
      
      const onboardingVisible = onboardingElement !== null;
      await this.log(
        'Step 3: Onboarding Tutorial Appears',
        onboardingVisible,
        onboardingVisible 
          ? 'Onboarding tutorial displayed to first-time parent' 
          : 'Onboarding not found (may be disabled or already completed)',
        onboardingVisible ? undefined : 'Tutorial element not visible'
      );

      // STEP 4: Simulate parent clicking through onboarding
      if (onboardingVisible) {
        await this.wait(800);
        
        const nextButton = document.querySelector<HTMLElement>(
          'button:has-text("Next"), button:has-text("Continue"), button:has-text("Got it")'
        ) || Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent?.toLowerCase().includes('next') ||
          btn.textContent?.toLowerCase().includes('continue') ||
          btn.textContent?.toLowerCase().includes('got it')
        ) as HTMLElement | undefined;

        if (nextButton && nextButton.offsetParent !== null) {
          nextButton.click();
          await this.wait(800);
          await this.log(
            'Step 4: Progress Through Onboarding',
            true,
            'Parent clicked Next/Continue button'
          );
        } else {
          // Try skip button instead
          const skipButton = document.querySelector<HTMLElement>(
            'button:has-text("Skip"), button:has-text("Close")'
          ) || Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent?.toLowerCase().includes('skip') ||
            btn.textContent?.toLowerCase().includes('close')
          ) as HTMLElement | undefined;

          if (skipButton && skipButton.offsetParent !== null) {
            skipButton.click();
            await this.wait(500);
            await this.log(
              'Step 4: Complete Onboarding',
              true,
              'Parent skipped/closed onboarding tutorial'
            );
          }
        }
      }
    } catch (error) {
      await this.log('Step 3-4: Onboarding Flow', false, 'Failed to verify', (error as Error).message);
    }

    await this.wait(1000);

    // STEP 5: Navigate to Stories
    try {
      const storiesLink = document.querySelector<HTMLElement>(
        'a[href*="/stories"], nav a:has-text("Stories")'
      ) || Array.from(document.querySelectorAll('a, button')).find(el => 
        el.textContent?.toLowerCase().includes('stories') ||
        (el instanceof HTMLAnchorElement && el.href.includes('/stories'))
      ) as HTMLElement | undefined;

      const storiesLinkExists = storiesLink !== undefined && storiesLink instanceof HTMLElement && storiesLink.offsetParent !== null;
      await this.log(
        'Step 5: Stories Navigation Available',
        storiesLinkExists,
        storiesLinkExists 
          ? 'Stories navigation button found and visible' 
          : 'Stories navigation not found',
        storiesLinkExists ? undefined : 'Navigation element missing'
      );

      if (storiesLinkExists && storiesLink) {
        storiesLink.click();
        await this.wait(1500);
        
        const onStoriesPage = window.location.pathname.includes('/stories');
        await this.log(
          'Step 6: Navigate to Stories Page',
          onStoriesPage,
          onStoriesPage 
            ? `Successfully navigated to ${window.location.pathname}` 
            : 'Failed to navigate to stories',
          onStoriesPage ? undefined : `Still on ${window.location.pathname}`
        );

        if (onStoriesPage) {
          // STEP 7: Verify story library loads
          await this.wait(1000);
          
          const storyCards = document.querySelectorAll('[data-testid="story-card"], .story-card');
          const storyCardsExist = storyCards.length > 0;
          
          await this.log(
            'Step 7: Story Library Loads',
            storyCardsExist,
            storyCardsExist 
              ? `Parent sees ${storyCards.length} available stories` 
              : 'No story cards found in library',
            storyCardsExist ? undefined : 'Story cards not rendered'
          );

          // STEP 8: Select first story
          if (storyCardsExist) {
            const firstStory = storyCards[0];
            if (!(firstStory instanceof HTMLElement)) {
              const report: JourneyReport = {
                testName: 'Parent User Journey - Complete Flow',
                startTime: this.startTime,
                endTime: Date.now(),
                totalSteps: this.results.length,
                passedSteps: this.results.filter(r => r.passed).length,
                failedSteps: this.results.filter(r => !r.passed).length,
                results: this.results,
                overallPass: this.results.filter(r => r.passed).length >= this.results.length * 0.7,
                screenshots: this.screenshots,
              };
              console.groupEnd();
              return report;
            }
            
            const storyTitle = firstStory.querySelector('h2, h3, [class*="title"]')?.textContent || 'Unknown';
            
            firstStory.click();
            await this.wait(1500);
            
            const onStoryReader = window.location.pathname.match(/\/stories\/.+/);
            await this.log(
              'Step 8: Select Story',
              !!onStoryReader,
              onStoryReader 
                ? `Parent opened story: "${storyTitle}"` 
                : 'Failed to open story reader',
              onStoryReader ? undefined : 'Story reader did not load'
            );

            if (onStoryReader) {
              // STEP 9: Verify story content loads
              const storyText = await this.verifyMultipleSelectors(
                ['[data-testid="story-text"]', '.story-content', 'p'],
                'Story text content'
              );
              
              await this.log(
                'Step 9: Story Content Loads',
                !!storyText,
                storyText 
                  ? 'Story text content rendered successfully' 
                  : 'Story text not found',
                storyText ? undefined : 'Content element missing'
              );

              // STEP 10: Verify audio controls
              const audioControls = await this.verifyMultipleSelectors(
                ['button[aria-label*="play"]', 'button[aria-label*="audio"]', 'audio'],
                'Audio controls'
              );
              
              await this.log(
                'Step 10: Audio Narration Available',
                !!audioControls,
                audioControls 
                  ? 'Audio narration controls present for read-aloud' 
                  : 'Audio controls not found',
                audioControls ? undefined : 'Audio elements missing'
              );

              // STEP 11: Verify navigation controls
              const navControls = await this.verifyMultipleSelectors(
                ['button:has-text("Next")', '[aria-label*="next"]', '.page-indicator'],
                'Navigation controls'
              );
              
              await this.log(
                'Step 11: Story Navigation Controls',
                !!navControls,
                navControls 
                  ? 'Page navigation controls available' 
                  : 'Navigation controls not found',
                navControls ? undefined : 'Navigation elements missing'
              );
            }
          }
        }
      }
    } catch (error) {
      await this.log('Step 5-11: Stories Navigation', false, 'Failed to verify', (error as Error).message);
    }

    // Generate report
    const report: JourneyReport = {
      testName: 'Parent User Journey - Complete Flow',
      startTime: this.startTime,
      endTime: Date.now(),
      totalSteps: this.results.length,
      passedSteps: this.results.filter(r => r.passed).length,
      failedSteps: this.results.filter(r => !r.passed).length,
      results: this.results,
      overallPass: this.results.filter(r => r.passed).length >= this.results.length * 0.7,
      screenshots: this.screenshots,
    };

    console.log('\n📊 Journey Verification Summary');
    console.log('='.repeat(50));
    console.log(`Total Steps: ${report.totalSteps}`);
    console.log(`✅ Passed: ${report.passedSteps}`);
    console.log(`❌ Failed: ${report.failedSteps}`);
    console.log(`📸 Screenshots: ${this.screenshots.length}`);
    console.log(`Duration: ${report.endTime - report.startTime}ms`);
    console.log(`Overall Result: ${report.overallPass ? '✅ PASS' : '❌ FAIL'}`);
    
    if (this.screenshots.length > 0) {
      console.log('\n📸 Screenshot Commands:');
      console.log('  - View screenshots: window.parentJourneyVerifier.viewScreenshots()');
      console.log('  - Download screenshots: window.parentJourneyVerifier.downloadScreenshots()');
    }
    
    console.groupEnd();

    return report;
  }

  async runQuickJourney(options?: Partial<ScreenshotOptions>): Promise<JourneyReport> {
    this.startTime = Date.now();
    this.results = [];
    this.screenshots = [];
    
    if (options) {
      this.setScreenshotOptions(options);
    }
    
    console.group('⚡ Parent Journey Verification - Quick Flow');
    console.log('Testing impatient parent who skips onboarding...');
    console.log(`Screenshot capture: ${this.captureScreenshots ? 'ENABLED' : 'DISABLED'}\n`);

    try {
      window.location.href = '/stories';
      await this.wait(2000);
      
      const onStoriesPage = window.location.pathname.includes('/stories');
      await this.log(
        'Quick Step 1: Direct Stories Navigation',
        onStoriesPage,
        onStoriesPage ? 'Parent bypassed onboarding, went straight to stories' : 'Navigation failed'
      );

      if (onStoriesPage) {
        const storyCards = document.querySelectorAll('[data-testid="story-card"], .story-card');
        const storyCardsExist = storyCards.length > 0;
        
        await this.log(
          'Quick Step 2: Story Library Quick Load',
          storyCardsExist,
          storyCardsExist ? `Quickly found ${storyCards.length} stories` : 'Stories not loaded'
        );

        if (storyCardsExist) {
          (storyCards[0] as HTMLElement).click();
          await this.wait(1500);
          
          const storyText = await this.verifyMultipleSelectors(
            ['[data-testid="story-text"]', '.story-content', 'p'],
            'Story content'
          );
          
          await this.log(
            'Quick Step 3: Story Preview',
            !!storyText,
            storyText ? 'Story loaded for quick preview' : 'Story failed to load'
          );
        }
      }
    } catch (error) {
      await this.log('Quick Journey', false, 'Failed', (error as Error).message);
    }

    const report: JourneyReport = {
      testName: 'Parent User Journey - Quick Flow',
      startTime: this.startTime,
      endTime: Date.now(),
      totalSteps: this.results.length,
      passedSteps: this.results.filter(r => r.passed).length,
      failedSteps: this.results.filter(r => !r.passed).length,
      results: this.results,
      overallPass: this.results.filter(r => r.passed).length === this.results.length,
      screenshots: this.screenshots,
    };

    console.log('\n📊 Quick Journey Summary');
    console.log(`Passed: ${report.passedSteps}/${report.totalSteps}`);
    console.log(`📸 Screenshots: ${this.screenshots.length}`);
    console.log(`Result: ${report.overallPass ? '✅ PASS' : '❌ FAIL'}`);
    
    if (this.screenshots.length > 0) {
      console.log('\n📸 Screenshot Commands:');
      console.log('  - View screenshots: window.parentJourneyVerifier.viewScreenshots()');
      console.log('  - Download screenshots: window.parentJourneyVerifier.downloadScreenshots()');
    }
    
    console.groupEnd();

    return report;
  }

  getDetailedReport(): string {
    if (this.results.length === 0) {
      return 'No test results available. Run a journey test first.';
    }

    let report = '\n📋 DETAILED EVIDENCE REPORT\n';
    report += '='.repeat(60) + '\n\n';

    this.results.forEach((result, index) => {
      report += `${index + 1}. ${result.step}\n`;
      report += `   Status: ${result.passed ? '✅ PASS' : '❌ FAIL'}\n`;
      report += `   Evidence: ${result.evidence}\n`;
      report += `   Timestamp: ${new Date(result.timestamp).toISOString()}\n`;
      if (result.screenshot) {
        report += `   📸 Screenshot: Captured (${result.screenshot.length} bytes)\n`;
      }
      if (result.error) {
        report += `   Error: ${result.error}\n`;
      }
      report += '\n';
    });

    if (this.screenshots.length > 0) {
      report += '\n📸 SCREENSHOT SUMMARY\n';
      report += `Total screenshots captured: ${this.screenshots.length}\n`;
      report += 'Use window.parentJourneyVerifier.viewScreenshots() to view\n';
      report += 'Use window.parentJourneyVerifier.downloadScreenshots() to download\n';
    }

    return report;
  }
}

export const parentJourneyVerifier = new ParentJourneyVerifier();

if (typeof window !== 'undefined') {
  window.parentJourneyVerifier = parentJourneyVerifier;
  
  window.verifyParentJourney = async (captureScreenshots = true) => {
    const report = await parentJourneyVerifier.runCompleteJourney({ captureScreenshots });
    console.log('\n' + parentJourneyVerifier.getDetailedReport());
    return report;
  };

  window.verifyQuickJourney = async (captureScreenshots = true) => {
    const report = await parentJourneyVerifier.runQuickJourney({ captureScreenshots });
    console.log('\n' + parentJourneyVerifier.getDetailedReport());
    return report;
  };
  
  window.viewJourneyScreenshots = () => {
    parentJourneyVerifier.viewScreenshots();
  };
  
  window.downloadJourneyScreenshots = () => {
    parentJourneyVerifier.downloadScreenshots();
  };
}
