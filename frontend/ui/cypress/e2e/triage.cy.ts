// E2E test for patient triage flow

describe('Patient Triage Flow', () => {
  beforeEach(() => {
    cy.login('hosp-123', 'DOC001', 'password123');
    cy.visit('/triage');
  });

  it('should load triage page', () => {
    cy.contains('Patient Triage').should('be.visible');
    cy.contains('Quick Assessment').should('be.visible');
  });

  it('should complete triage form submission', () => {
    // Fill patient ID
    cy.get('input[placeholder*="Patient ID"]').type('PAT001');
    
    // Select symptoms
    cy.get('[data-testid="symptoms-select"]').click();
    cy.contains('Fever').click();
    cy.contains('Cough').click();
    
    // Enter vital signs
    cy.get('input[placeholder*="Temperature"]').type('39.5');
    cy.get('input[placeholder*="Heart Rate"]').type('95');
    cy.get('input[placeholder*="Blood Pressure"]').type('140/90');
    
    // Submit form
    cy.contains('Analyze').click();
    
    // Should show risk assessment
    cy.contains(/Risk Level|Assessment Result/i).should('be.visible');
  });

  it('should display risk assessment results', () => {
    // Fill and submit form
    cy.get('input[placeholder*="Patient ID"]').type('PAT001');
    cy.get('[data-testid="symptoms-select"]').click();
    cy.contains('Fever').click();
    cy.get('input[placeholder*="Temperature"]').type('39.5');
    cy.get('input[placeholder*="Heart Rate"]').type('95');
    cy.get('input[placeholder*="Blood Pressure"]').type('140/90');
    cy.contains('Analyze').click();
    
    // Check for risk level
    cy.get('[data-testid="risk-level"]').should('contain', /High|Medium|Low/);
    cy.get('[data-testid="risk-score"]').should('exist');
    cy.get('[data-testid="recommended-action"]').should('exist');
  });

  it('should show error on empty form submission', () => {
    cy.contains('Analyze').click();
    
    cy.contains(/required|missing|Please fill/i).should('be.visible');
  });

  it('should validate vital sign ranges', () => {
    cy.get('input[placeholder*="Temperature"]').type('150'); // Invalid
    
    cy.contains(/invalid|out of range/i).should('be.visible');
  });

  it('should save triage assessment to patient record', () => {
    cy.get('input[placeholder*="Patient ID"]').type('PAT001');
    cy.get('[data-testid="symptoms-select"]').click();
    cy.contains('Fever').click();
    cy.get('input[placeholder*="Temperature"]').type('39.5');
    cy.get('input[placeholder*="Heart Rate"]').type('95');
    cy.get('input[placeholder*="Blood Pressure"]').type('140/90');
    cy.contains('Analyze').click();
    
    // Click save/confirm
    cy.contains(/Save|Confirm|Submit/i).click();
    
    cy.contains(/saved|recorded|Assessment created/i).should('be.visible');
  });

  it('should allow printing risk assessment', () => {
    cy.get('input[placeholder*="Patient ID"]').type('PAT001');
    cy.get('[data-testid="symptoms-select"]').click();
    cy.contains('Fever').click();
    cy.get('input[placeholder*="Temperature"]').type('39.5');
    cy.get('input[placeholder*="Heart Rate"]').type('95');
    cy.get('input[placeholder*="Blood Pressure"]').type('140/90');
    cy.contains('Analyze').click();
    
    cy.get('[data-testid="print-btn"]').should('be.visible');
  });
});
