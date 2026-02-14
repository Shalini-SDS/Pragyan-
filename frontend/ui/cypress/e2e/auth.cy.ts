// E2E test for authentication and dashboard flow

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display home page', () => {
    cy.contains('MediTriage').should('exist');
  });

  it('should open auth dialog on button click', () => {
    cy.contains('Get Started').click();
    cy.contains('Select Your Hospital').should('be.visible');
  });

  it('should complete hospital selection flow', () => {
    cy.contains('Get Started').click();
    
    // Select hospital
    cy.get('[data-testid="hospital-select"]').first().click();
    cy.contains('Next').click();
    
    // Enter staff ID
    cy.get('input[placeholder*="Staff ID"]').type('DOC001');
    cy.contains('Next').click();
    
    // Enter password
    cy.get('input[type="password"]').type('password123');
    cy.contains('Login').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/doctors');
  });

  it('should show error on invalid credentials', () => {
    cy.contains('Get Started').click();
    cy.get('[data-testid="hospital-select"]').first().click();
    cy.contains('Next').click();
    cy.get('input[placeholder*="Staff ID"]').type('INVALID');
    cy.contains('Next').click();
    cy.get('input[type="password"]').type('wrongpassword');
    cy.contains('Login').click();
    
    cy.contains(/invalid|failed|unauthorized/i).should('be.visible');
  });

  it('should persist login across page refresh', () => {
    // Assuming user is already logged in from previous test
    cy.login('hosp-123', 'DOC001', 'password123');
    cy.url().should('include', '/doctors');
    
    // Refresh page
    cy.reload();
    
    // Should remain logged in
    cy.url().should('include', '/doctors');
    cy.contains('Doctor Records').should('be.visible');
  });

  it('should logout successfully', () => {
    cy.login('hosp-123', 'DOC001', 'password123');
    
    // Find and click logout button
    cy.get('[data-testid="user-menu"]').click();
    cy.contains('Logout').click();
    
    // Should redirect to home
    cy.url().should('include', '/');
  });
});
