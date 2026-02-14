// E2E test for doctors page and filtering

describe('Doctors Page', () => {
  beforeEach(() => {
    cy.login('hosp-123', 'DOC001', 'password123');
    cy.visit('/doctors');
  });

  it('should load and display doctors list', () => {
    cy.contains('Doctor Records').should('be.visible');
    cy.get('[data-testid="doctor-card"]').should('have.length.at.least', 1);
  });

  it('should display doctor statistics', () => {
    cy.contains('Total Doctors').should('be.visible');
    cy.contains('Active').should('be.visible');
    cy.contains('Inactive').should('be.visible');
  });

  it('should search doctors by name', () => {
    cy.get('input[placeholder*="search by name"]').type('John');
    
    // Should filter results
    cy.get('[data-testid="doctor-card"]').should('have.length.at.least', 1);
    cy.get('[data-testid="doctor-card"]').first().should('contain', 'John');
  });

  it('should display no results when search has no matches', () => {
    cy.get('input[placeholder*="search by name"]').type('NonexistentDoctor123');
    
    cy.contains('No doctors found').should('be.visible');
  });

  it('should filter by specialty', () => {
    cy.get('input[placeholder*="search by"]').type('Cardiology');
    
    cy.get('[data-testid="doctor-card"]').first().should('contain', 'Cardiology');
  });

  it('should display doctor details in card', () => {
    cy.get('[data-testid="doctor-card"]').first().within(() => {
      cy.should('contain', /Dr\.|Doctor/);
      cy.should('contain', /Specialty|Specialization|Department/i);
    });
  });

  it('should navigate to doctor detail page', () => {
    cy.get('[data-testid="doctor-card"]').first().click();
    
    cy.url().should('include', '/doctors/');
    cy.contains('Doctor Details').should('be.visible');
  });

  it('should display active status badge', () => {
    cy.get('[data-testid="doctor-card"]').first().within(() => {
      cy.contains(/Active|Inactive/i).should('be.visible');
    });
  });
});

describe('Doctors Page Performance', () => {
  it('should load doctors page within acceptable time', () => {
    cy.login('hosp-123', 'DOC001', 'password123');
    
    const start = Date.now();
    cy.visit('/doctors');
    cy.contains('Doctor Records').should('be.visible');
    
    // Should load within 3 seconds
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(3000);
  });

  it('should handle rapid search queries', () => {
    cy.login('hosp-123', 'DOC001', 'password123');
    cy.visit('/doctors');
    
    const searchInput = cy.get('input[placeholder*="search by"]');
    
    searchInput.type('a{del}{del}');
    searchInput.type('ca{del}');
    searchInput.type('card');
    
    // Should handle gracefully without errors
    cy.get('[data-testid="doctor-card"]').should('exist');
  });
});
