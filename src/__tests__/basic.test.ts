// Basic test to verify Jest setup
describe('Basic Test Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have environment variables set', () => {
    expect(process.env.REACT_APP_CLERK_PUBLISHABLE_KEY).toBeDefined();
    expect(process.env.REACT_APP_API_URL).toBeDefined();
  });

  it('should support async/await', async () => {
    const promise = Promise.resolve('test');
    const result = await promise;
    expect(result).toBe('test');
  });
});
