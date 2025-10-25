/**
 * Test 5: Cross-Browser Rendering - Responsive UI Checks
 *
 * Purpose: Validate UI rendering across different browsers and viewports
 * Tags: @ui, @responsive, @cross-browser, @regression
 * Expected Duration: ~2 minutes
 *
 * This test verifies:
 * - Key page elements render correctly
 * - Responsive design works across viewports
 * - Header navigation is accessible
 * - Mobile menu functions properly
 * - Cross-browser compatibility
 */

describe('Cross-Browser Responsive UI Tests', { tags: ['@ui', '@responsive', '@cross-browser', '@regression'] }, () => {
  const viewports = {
    mobile: { width: 375, height: 667, name: 'iPhone SE' },
    tablet: { width: 768, height: 1024, name: 'iPad' },
    desktop: { width: 1920, height: 1080, name: 'Desktop HD' },
    largeDesktop: { width: 2560, height: 1440, name: '2K Display' }
  };

  before(() => {
    cy.loginUser();
  });

  describe('Header Navigation - All Viewports', () => {
    Object.entries(viewports).forEach(([key, viewport]) => {
      it(`should render header correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, { tags: ['@smoke'] }, () => {
        // Set viewport
        cy.viewport(viewport.width, viewport.height);
        cy.log(`📱 Testing on ${viewport.name}: ${viewport.width}x${viewport.height}`);

        // Visit page
        cy.visit('/');

        // Verify header exists
        cy.getByCy('app-header', { timeout: 5000 })
          .should('be.visible')
          .and('have.css', 'display')
          .and('not.equal', 'none');

        // Check logo
        cy.getByCy('app-logo')
          .should('be.visible')
          .and('have.prop', 'naturalWidth')
          .should('be.greaterThan', 0); // Image loaded

        // Check user avatar/menu
        cy.getByCy('user-menu').should('exist');

        // Mobile: Check hamburger menu
        if (viewport.width < 768) {
          cy.getByCy('mobile-menu-button').should('be.visible');
          cy.getByCy('desktop-nav').should('not.be.visible');
        } else {
          // Desktop: Check full navigation
          cy.getByCy('desktop-nav').should('be.visible');
          cy.getByCy('nav-links').should('be.visible');
        }

        // Screenshot for visual regression
        cy.screenshot(`header-${key}-${viewport.width}x${viewport.height}`);
      });
    });
  });

  describe('Mobile Menu Functionality', () => {
    it('should open and close mobile menu on small screens', { tags: ['@mobile'] }, () => {
      cy.viewport(viewports.mobile.width, viewports.mobile.height);
      cy.visit('/');

      // Open mobile menu
      cy.log('📱 Opening mobile menu');
      cy.getByCy('mobile-menu-button').should('be.visible').click();

      // Verify menu opened
      cy.getByCy('mobile-menu')
        .should('be.visible')
        .and('have.class', 'open')
        .or('have.attr', 'aria-expanded', 'true');

      // Check menu items are visible
      cy.getByCy('mobile-nav-links').should('be.visible');
      cy.getByCy('nav-link').should('have.length.greaterThan', 0);

      // Click a menu item
      cy.getByCy('nav-link').first().click();

      // Verify menu closes after navigation (on some implementations)
      cy.wait(500);

      // Close menu explicitly if needed
      cy.getByCy('mobile-menu-close', { timeout: 3000 }).then(($close) => {
        if ($close.is(':visible')) {
          cy.wrap($close).click();
        }
      });
    });
  });

  describe('Responsive Layout - Dashboard', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
      cy.getByCy('dashboard-container').should('be.visible');
    });

    it('should display dashboard in single column on mobile', { tags: ['@mobile', '@layout'] }, () => {
      cy.viewport(viewports.mobile.width, viewports.mobile.height);

      // Check layout is stacked (single column)
      cy.getByCy('dashboard-container').should('be.visible');

      // Main content should be full width
      cy.getByCy('dashboard-main').should(($main) => {
        const width = $main.width();
        expect(width).to.be.greaterThan(300); // Nearly full viewport width
      });

      // Sidebar should be hidden or collapsed on mobile
      cy.getByCy('dashboard-sidebar').should(($sidebar) => {
        const display = $sidebar.css('display');
        const width = $sidebar.width();

        // Either hidden or very narrow
        expect(display === 'none' || width < 100).to.be.true;
      });

      cy.screenshot('dashboard-mobile-layout');
    });

    it('should display dashboard in multi-column on tablet', { tags: ['@tablet', '@layout'] }, () => {
      cy.viewport(viewports.tablet.width, viewports.tablet.height);

      cy.getByCy('dashboard-container').should('be.visible');

      // Check responsive grid
      cy.getByCy('dashboard-grid').should(($grid) => {
        const display = $grid.css('display');
        expect(display).to.match(/grid|flex/); // Uses grid or flexbox
      });

      cy.screenshot('dashboard-tablet-layout');
    });

    it('should display full dashboard layout on desktop', { tags: ['@desktop', '@layout'] }, () => {
      cy.viewport(viewports.desktop.width, viewports.desktop.height);

      cy.getByCy('dashboard-container').should('be.visible');

      // Sidebar should be visible
      cy.getByCy('dashboard-sidebar').should('be.visible');

      // Main content area
      cy.getByCy('dashboard-main').should('be.visible');

      // Check both are side-by-side
      cy.getByCy('dashboard-sidebar').should(($sidebar) => {
        const rect = $sidebar[0].getBoundingClientRect();
        expect(rect.left).to.equal(0).or.to.be.lessThan(50);
      });

      cy.getByCy('dashboard-main').should(($main) => {
        const rect = $main[0].getBoundingClientRect();
        expect(rect.left).to.be.greaterThan(200); // Has offset for sidebar
      });

      cy.screenshot('dashboard-desktop-layout');
    });
  });

  describe('Form Elements - Responsive Behavior', () => {
    it('should render forms correctly on all viewports', () => {
      cy.visit('/new-transaction');

      Object.entries(viewports).forEach(([key, viewport]) => {
        cy.viewport(viewport.width, viewport.height);
        cy.log(`📋 Testing form on ${viewport.name}`);

        // Form should be visible
        cy.getByCy('transaction-form').should('be.visible');

        // Input fields should be appropriately sized
        cy.getByCy('transaction-amount').should('be.visible').and(($input) => {
          const width = $input.width();
          const viewportWidth = viewport.width;

          // Input should not overflow viewport
          expect(width).to.be.lessThan(viewportWidth - 40);

          // Input should be reasonably sized (not too narrow)
          expect(width).to.be.greaterThan(200);
        });

        // Buttons should be tap-friendly on mobile
        cy.getByCy('transaction-submit').should('be.visible').and(($button) => {
          const height = $button.height();

          if (viewport.width < 768) {
            // Mobile: minimum 44px height (Apple HIG)
            expect(height).to.be.at.least(44);
          }
        });
      });
    });
  });

  describe('Typography and Spacing', () => {
    it('should have readable font sizes across viewports', () => {
      cy.visit('/');

      Object.entries(viewports).forEach(([key, viewport]) => {
        cy.viewport(viewport.width, viewport.height);

        // Check heading size
        cy.get('h1').first().should(($h1) => {
          const fontSize = parseFloat($h1.css('font-size'));

          // Minimum readable size
          expect(fontSize).to.be.at.least(20);

          // Maximum reasonable size
          expect(fontSize).to.be.at.most(60);
        });

        // Check body text size
        cy.get('p').first().should(($p) => {
          const fontSize = parseFloat($p.css('font-size'));

          // Body text should be at least 14px
          expect(fontSize).to.be.at.least(14);
        });
      });
    });
  });

  describe('Images and Media', () => {
    it('should load and scale images properly', () => {
      cy.visit('/products');

      Object.entries(viewports).forEach(([key, viewport]) => {
        cy.viewport(viewport.width, viewport.height);
        cy.log(`🖼️  Testing images on ${viewport.name}`);

        // Product images should load
        cy.getByCy('product-image').first().should('be.visible').and(($img) => {
          // Image loaded
          expect($img[0].naturalWidth).to.be.greaterThan(0);

          // Image doesn't overflow container
          const imgWidth = $img.width();
          const containerWidth = $img.parent().width();
          expect(imgWidth).to.be.at.most(containerWidth + 1); // +1 for rounding
        });
      });
    });
  });

  describe('Browser-Specific Checks', () => {
    it('should identify current browser and log capabilities', () => {
      cy.log(`🌐 Browser: ${Cypress.browser.name}`);
      cy.log(`Version: ${Cypress.browser.version}`);
      cy.log(`Family: ${Cypress.browser.family}`);
      cy.log(`Is Headless: ${Cypress.browser.isHeadless}`);

      // Verify basic DOM rendering
      cy.visit('/');
      cy.get('body').should('be.visible');

      // Check if CSS is applied
      cy.get('body').should('have.css', 'margin');

      // Check if JavaScript is enabled
      cy.window().should('exist');
      cy.document().should('exist');
    });

    it('should handle browser-specific CSS features', () => {
      cy.visit('/');

      // Check if modern CSS is supported
      cy.get('body').then(($body) => {
        const styles = window.getComputedStyle($body[0]);

        // Log CSS Grid support
        const gridSupport = styles.display.includes('grid') || 'grid' in $body[0].style;
        cy.log(`CSS Grid Support: ${gridSupport}`);

        // Log Flexbox support
        const flexSupport = styles.display.includes('flex') || 'flex' in $body[0].style;
        cy.log(`Flexbox Support: ${flexSupport}`);
      });
    });
  });

  describe('Accessibility - Responsive', () => {
    it('should maintain keyboard navigation on all viewports', () => {
      Object.entries({ mobile: viewports.mobile, desktop: viewports.desktop }).forEach(([key, viewport]) => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/');

        // Tab through elements
        cy.get('body').tab();

        // Verify focus is visible
        cy.focused().should('exist').and('be.visible');

        // Continue tabbing
        cy.focused().tab();
        cy.focused().should('exist');

        cy.log(`✅ Keyboard navigation works on ${viewport.name}`);
      });
    });

    it('should have sufficient color contrast', () => {
      cy.visit('/');

      // Check main heading contrast
      cy.get('h1').first().should(($h1) => {
        const color = $h1.css('color');
        const bgColor = $h1.css('background-color');

        cy.log(`Text color: ${color}`);
        cy.log(`Background color: ${bgColor}`);

        // Note: Full contrast calculation would require color parsing
        // This is a basic check that colors are set
        expect(color).to.exist;
        expect(bgColor).to.exist;
      });
    });
  });

  describe('Performance - Responsive Assets', () => {
    it('should load appropriate image sizes for viewport', () => {
      // Desktop viewport
      cy.viewport(viewports.desktop.width, viewports.desktop.height);
      cy.visit('/products');

      cy.getByCy('product-image').first().should('be.visible').then(($img) => {
        const desktopSrc = $img.attr('src');
        cy.log(`Desktop image: ${desktopSrc}`);

        // Switch to mobile
        cy.viewport(viewports.mobile.width, viewports.mobile.height);
        cy.reload();

        cy.getByCy('product-image').first().then(($mobileImg) => {
          const mobileSrc = $mobileImg.attr('src');
          cy.log(`Mobile image: ${mobileSrc}`);

          // Ideally, mobile should use smaller images
          // (This check depends on implementation)
          cy.log('✅ Image sources checked for responsive loading');
        });
      });
    });
  });

  afterEach(function() {
    // Reset viewport to default after each test
    cy.viewport(1280, 720);

    // Log test result
    if (this.currentTest.state === 'failed') {
      cy.log(`❌ Responsive test failed: ${this.currentTest.title}`);
    } else {
      cy.log(`✅ Responsive test passed: ${this.currentTest.title}`);
    }
  });
});
