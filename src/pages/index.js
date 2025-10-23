/**
 * Pages Module - Single Point Import
 * Import all page objects from this file for better organization
 *
 * Usage:
 * import { LoginPage, DashboardPage } from '../pages';
 *
 * const loginPage = new LoginPage();
 * const dashboardPage = new DashboardPage();
 */

import BasePage from './BasePage';
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage';

export {
  BasePage,
  LoginPage,
  DashboardPage,
};

// Default export for convenience
export default {
  BasePage,
  LoginPage,
  DashboardPage,
};
