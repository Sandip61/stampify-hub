
// RLS Policy Tests
// These can be run in the browser console or with a test framework like Jest

/**
 * Test 1: Merchant trying to access customer data
 * Expected: RLS denies access
 */
async function testMerchantAccessingCustomerData() {
  try {
    // Step 1: Login as merchant
    const { data: authData, error: loginError } = await merchantSupabase.auth.signInWithPassword({
      email: 'merchant@example.com',
      password: 'password123'
    });
    
    if (loginError) {
      console.error('Login failed:', loginError.message);
      return;
    }
    
    console.log('Logged in as merchant:', authData.user.id);
    
    // Step 2: Try to access a customer-only table/record
    const { data, error } = await merchantSupabase
      .from('customer_stamp_cards')
      .select('*')
      .limit(1);
    
    if (error) {
      // Expected outcome - RLS should deny access
      console.log('✅ Test passed: RLS correctly denied merchant access to customer data');
      console.log('Error message:', error.message);
    } else {
      console.log('❌ Test failed: Merchant was able to access customer data');
      console.log('Retrieved data:', data);
    }
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Clean up - sign out
    await merchantSupabase.auth.signOut();
  }
}

/**
 * Test 2: Customer trying to delete merchant stamp card
 * Expected: RLS denies access
 */
async function testCustomerDeletingMerchantCard() {
  try {
    // Step 1: Login as customer
    const { data: authData, error: loginError } = await customerSupabase.auth.signInWithPassword({
      email: 'customer@example.com',
      password: 'password123'
    });
    
    if (loginError) {
      console.error('Login failed:', loginError.message);
      return;
    }
    
    console.log('Logged in as customer:', authData.user.id);
    
    // Step 2: Try to delete a merchant's stamp card
    const { data, error } = await customerSupabase
      .from('stamp_cards')
      .delete()
      .eq('id', 'some-stamp-card-id');  // Replace with an actual ID
    
    if (error) {
      // Expected outcome - RLS should deny access
      console.log('✅ Test passed: RLS correctly denied customer from deleting merchant data');
      console.log('Error message:', error.message);
    } else {
      console.log('❌ Test failed: Customer was able to delete merchant data');
      console.log('Operation result:', data);
    }
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Clean up - sign out
    await customerSupabase.auth.signOut();
  }
}

// Cypress test example for RLS policies
/*
// In your Cypress test file:
describe('RLS Policy Tests', () => {
  it('should deny merchant access to customer data', () => {
    // Login as merchant
    cy.visit('/merchant/login');
    cy.get('#email').type('merchant@example.com');
    cy.get('#password').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for login to complete
    cy.url().should('include', '/merchant');
    
    // Attempt to access customer data via API and verify it fails
    cy.window().then(win => {
      return win.merchantSupabase
        .from('customer_stamp_cards')
        .select('*')
        .limit(1)
        .then(result => {
          expect(result.error).to.exist;
          expect(result.error.message).to.include('permission denied');
        });
    });
  });

  it('should deny customer from deleting merchant stamp card', () => {
    // Login as customer
    cy.visit('/customer/login');
    cy.get('#email').type('customer@example.com');
    cy.get('#password').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for login to complete
    cy.url().should('include', '/customer');
    
    // Attempt to delete a merchant stamp card and verify it fails
    cy.window().then(win => {
      return win.customerSupabase
        .from('stamp_cards')
        .delete()
        .eq('id', 'some-stamp-card-id')  // Replace with actual ID
        .then(result => {
          expect(result.error).to.exist;
          expect(result.error.message).to.include('permission denied');
        });
    });
  });
});
*/

// Export tests
export { testMerchantAccessingCustomerData, testCustomerDeletingMerchantCard };
