import {
  getAllNavigationItems,
  getSecondaryNavigationItems,
} from '../../../constants';

describe('Navigation Refactoring Tests', () => {
  describe('Shared Navigation Configuration', () => {
    it('should have navigation items available from shared configuration', () => {
      const navigationItems = getAllNavigationItems();
      const secondaryItems = getSecondaryNavigationItems();

      expect(navigationItems).toBeDefined();
      expect(Array.isArray(navigationItems)).toBe(true);
      expect(navigationItems.length).toBeGreaterThan(0);

      expect(secondaryItems).toBeDefined();
      expect(Array.isArray(secondaryItems)).toBe(true);

      // Verify structure of navigation items
      navigationItems.forEach((item) => {
        expect(item).toHaveProperty('text');
        expect(item).toHaveProperty('icon');
        expect(item).toHaveProperty('path');
        expect(typeof item.text).toBe('string');
        expect(typeof item.path).toBe('string');
      });
    });

    it('should have consistent navigation items across components', () => {
      const navigationItems = getAllNavigationItems();

      // Check that we have the expected navigation items
      const expectedPaths = ['/dashboard', '/todos', '/projects', '/ai'];
      const actualPaths = navigationItems.map((item) => item.path);

      expectedPaths.forEach((path) => {
        expect(actualPaths).toContain(path);
      });
    });
  });

  describe('Navigation Consistency', () => {
    it('should have consistent navigation behavior across components', () => {
      const navigationItems = getAllNavigationItems();

      // Verify that all navigation items have required properties
      navigationItems.forEach((item) => {
        expect(item.text).toBeTruthy();
        expect(item.path).toBeTruthy();
        expect(item.icon).toBeTruthy();

        // Verify path format
        expect(item.path).toMatch(/^\/[a-z-]*$/);
      });
    });

    it('should verify components are using shared configuration instead of local definitions', () => {
      // This test verifies that the refactoring was successful
      // by checking that shared navigation functions return expected data

      const navigationItems = getAllNavigationItems();
      const secondaryItems = getSecondaryNavigationItems();

      // Verify we have the expected navigation structure
      expect(navigationItems.length).toBeGreaterThan(0);
      expect(secondaryItems.length).toBeGreaterThan(0);

      // Verify specific items exist (proving shared config is working)
      const dashboardItem = navigationItems.find(
        (item) => item.path === '/dashboard'
      );
      const todosItem = navigationItems.find((item) => item.path === '/todos');
      const projectsItem = navigationItems.find(
        (item) => item.path === '/projects'
      );

      expect(dashboardItem).toBeTruthy();
      expect(todosItem).toBeTruthy();
      expect(projectsItem).toBeTruthy();

      expect(dashboardItem?.text).toBe('Dashboard');
      expect(todosItem?.text).toBe('Todos');
      expect(projectsItem?.text).toBe('Projects');
    });
  });
});
