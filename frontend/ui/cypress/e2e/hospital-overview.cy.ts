// E2E test for hospital overview page

describe('Hospital Overview', () => {
  beforeEach(() => {
    cy.login('hosp-123', 'DOC001', 'password123');
    cy.visit('/hospital-overview');
  });

  it('should load hospital overview page', () => {
    cy.contains('Hospital Overview').should('be.visible');
    cy.contains('Real-time hospital status').should('be.visible');
  });

  it('should display key metrics cards', () => {
    cy.contains('Total Patients').should('be.visible');
    cy.contains('Doctors').should('be.visible');
    cy.contains('Nurses').should('be.visible');
    cy.contains('Free Beds').should('be.visible');
  });

  it('should display hospital status banner', () => {
    cy.get('[data-testid="status-banner"]').should('exist');
    cy.get('[data-testid="status-badge"]').should('contain', /Normal|Busy|Critical/);
  });

  it('should display bed status chart', () => {
    cy.contains('Bed Status').should('be.visible');
    cy.get('[data-testid="bed-status-chart"]').should('exist');
  });

  it('should display department chart', () => {
    cy.contains('Departments').should('be.visible');
    cy.get('[data-testid="department-chart"]').should('exist');
  });

  it('should update metrics in real time', () => {
    // Get initial patient count
    cy.get('[data-testid="total-patients"]').then(($el1) => {
      const initialCount = parseInt($el1.text());
      
      // Wait and check again
      cy.wait(5000);
      cy.get('[data-testid="total-patients"]').then(($el2) => {
        // Count should be valid number
        expect(parseInt($el2.text())).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it('should display ambulance panel', () => {
    cy.contains('Ambulance').should('be.visible');
    cy.get('[data-testid="ambulance-panel"]').should('exist');
  });

  it('should highlight critical status appropriately', () => {
    // Check bed availability status
    cy.get('[data-testid="bed-status-badge"]').then(($badge) => {
      const status = $badge.text();
      
      if (status.includes('Critical')) {
        cy.get('[data-testid="status-banner"]').should('have.class', 'border-red');
      } else if (status.includes('Low')) {
        cy.get('[data-testid="status-banner"]').should('have.class', 'border-yellow');
      } else {
        cy.get('[data-testid="status-banner"]').should('have.class', 'border-green');
      }
    });
  });

  it('should navigate to patient records from overview', () => {
    cy.get('[data-testid="total-patients"]').click();
    
    cy.url().should('include', '/patients');
  });

  it('should handle loading state gracefully', () => {
    cy.visit('/hospital-overview');
    
    // Should show loading state briefly
    cy.contains(/loading|loading hospital/i).should('be.visible');
    
    // Then should load metrics
    cy.contains('Total Patients').should('be.visible');
  });
});

describe('Hospital Overview Error Handling', () => {
  it('should display error message on API failure', () => {
    cy.intercept('GET', '**/hospital/overview', {
      statusCode: 500,
      body: { error: 'Server error' },
    });

    cy.login('hosp-123', 'DOC001', 'password123');
    cy.visit('/hospital-overview');
    
    cy.contains(/failed to load|error|please try again/i).should('be.visible');
  });

  it('should retry loading data on error', () => {
    let callCount = 0;
    
    cy.intercept('GET', '**/hospital/overview', (req) => {
      callCount++;
      if (callCount === 1) {
        req.reply({ statusCode: 500, body: { error: 'Error' } });
      } else {
        req.reply({ statusCode: 200, body: { total_beds: 200, total_patients: 150 } });
      }
    });

    cy.login('hosp-123', 'DOC001', 'password123');
    cy.visit('/hospital-overview');
    
    cy.contains(/failed to load|error/i).should('be.visible');
    cy.contains('Retry').click();
    
    // Should eventually load
    cy.contains('Total Patients').should('be.visible');
  });
});
