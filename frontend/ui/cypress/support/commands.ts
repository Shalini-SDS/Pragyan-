// Cypress support file with custom commands

Cypress.Commands.add('login', (hospitalId: string, staffId: string, password: string) => {
  cy.visit('/');
  cy.contains('Get Started').click();
  
  // Select hospital
  cy.get('[data-testid="hospital-select"]').first().click();
  cy.contains('Next').click();
  
  // Enter staff ID
  cy.get('input[placeholder*="Staff ID"]').type(staffId);
  cy.contains('Next').click();
  
  // Enter password
  cy.get('input[type="password"]').type(password);
  cy.contains('Login').click();
  
  // Wait for login to complete
  cy.url().should('not.include', '/');
});

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to perform login flow
     * @example cy.login('hosp-123', 'DOC001', 'password123')
     */
    login(hospitalId: string, staffId: string, password: string): Chainable<void>;
  }
}

export {};
