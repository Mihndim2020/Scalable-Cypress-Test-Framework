/**
 * Pages Module - Single Point Import
 * Import all page objects from this file for better organization
 *
 * Usage:
 * import { LoginPage, DashboardPage } from '../../src/pages/index.js';
 *
 * const loginPage = new LoginPage();
 * const dashboardPage = new DashboardPage();
 */

import BasePage from './BasePage.js';
import LoginPage from './LoginPage.js';
import DashboardPage from './DashboardPage.js';

export {
  BasePage,
  LoginPage,
  DashboardPage,
};
