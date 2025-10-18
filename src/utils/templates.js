/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Canvas Templates - Pre-built Starting Points
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides ready-to-use canvas templates for common use cases.
 * Templates can be selected when creating a new canvas.
 */

const CANVAS_CENTER_X = 15000;
const CANVAS_CENTER_Y = 15000;

/**
 * Generate shape ID
 */
const generateId = () => `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Template: Login Form
 * 
 * Components:
 * - Title
 * - Username field (label + input)
 * - Password field (label + input)
 * - Login button
 * - "Forgot password?" link
 */
export const LOGIN_FORM_TEMPLATE = (userId) => {
  const baseX = CANVAS_CENTER_X - 1500;
  const baseY = CANVAS_CENTER_Y - 2500;
  
  return [
    // Title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 200,
      y: baseY,
      width: 2600,
      height: 300,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Welcome Back',
      fontSize: 180,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Username label
    {
      id: generateId(),
      type: 'text',
      x: baseX,
      y: baseY + 600,
      width: 3000,
      height: 120,
      rotation: 0,
      fill: '#646669',
      text: 'Email or Username',
      fontSize: 80,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Username input field
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY + 750,
      width: 3000,
      height: 300,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Password label
    {
      id: generateId(),
      type: 'text',
      x: baseX,
      y: baseY + 1200,
      width: 3000,
      height: 120,
      rotation: 0,
      fill: '#646669',
      text: 'Password',
      fontSize: 80,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Password input field
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY + 1350,
      width: 3000,
      height: 300,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Login button
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY + 1800,
      width: 3000,
      height: 300,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Button text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 900,
      y: baseY + 1900,
      width: 1200,
      height: 120,
      rotation: 0,
      fill: '#ffffff',
      text: 'Log In',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Forgot password link
    {
      id: generateId(),
      type: 'text',
      x: baseX + 700,
      y: baseY + 2250,
      width: 1600,
      height: 100,
      rotation: 0,
      fill: '#646669',
      text: 'Forgot password?',
      fontSize: 70,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 0.8,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    }
  ];
};

/**
 * Template: Dashboard
 * 
 * Components:
 * - Header bar with title
 * - 3 metric cards
 * - Large content area
 * - Sidebar navigation
 */
export const DASHBOARD_TEMPLATE = (userId) => {
  const baseX = CANVAS_CENTER_X - 4000;
  const baseY = CANVAS_CENTER_Y - 3000;
  
  return [
    // Top header bar
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY,
      width: 8000,
      height: 400,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 1
    },
    // Header title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 200,
      y: baseY + 100,
      width: 2000,
      height: 200,
      rotation: 0,
      fill: '#ffffff',
      text: 'Dashboard',
      fontSize: 120,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Sidebar
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY + 400,
      width: 1200,
      height: 5000,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 1,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Metric card 1
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 1400,
      y: baseY + 600,
      width: 2000,
      height: 800,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Metric 1 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1600,
      y: baseY + 700,
      width: 1600,
      height: 120,
      rotation: 0,
      fill: '#646669',
      text: 'Total Users',
      fontSize: 70,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Metric 1 value
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1600,
      y: baseY + 900,
      width: 1600,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: '12,458',
      fontSize: 140,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Metric card 2
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 3600,
      y: baseY + 600,
      width: 2000,
      height: 800,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Metric 2 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3800,
      y: baseY + 700,
      width: 1600,
      height: 120,
      rotation: 0,
      fill: '#646669',
      text: 'Revenue',
      fontSize: 70,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Metric 2 value
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3800,
      y: baseY + 900,
      width: 1600,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: '$24.5K',
      fontSize: 140,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Metric card 3
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 5800,
      y: baseY + 600,
      width: 2000,
      height: 800,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Metric 3 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 6000,
      y: baseY + 700,
      width: 1600,
      height: 120,
      rotation: 0,
      fill: '#646669',
      text: 'Active Now',
      fontSize: 70,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Metric 3 value
    {
      id: generateId(),
      type: 'text',
      x: baseX + 6000,
      y: baseY + 900,
      width: 1600,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: '573',
      fontSize: 140,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Main content area
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 1400,
      y: baseY + 1600,
      width: 6400,
      height: 3800,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Content title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1600,
      y: baseY + 1750,
      width: 3000,
      height: 150,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Recent Activity',
      fontSize: 100,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    }
  ];
};

/**
 * Template: Landing Page
 * 
 * Components:
 * - Hero section with headline
 * - CTA button
 * - Feature cards (3)
 * - Footer
 */
export const LANDING_PAGE_TEMPLATE = (userId) => {
  const baseX = CANVAS_CENTER_X - 4000;
  const baseY = CANVAS_CENTER_Y - 4000;
  
  return [
    // Hero background
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY,
      width: 8000,
      height: 2500,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 1
    },
    // Main headline
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1000,
      y: baseY + 600,
      width: 6000,
      height: 300,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Build Better Products',
      fontSize: 200,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Subheadline
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1500,
      y: baseY + 1000,
      width: 5000,
      height: 150,
      rotation: 0,
      fill: '#646669',
      text: 'The collaborative design tool for modern teams',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // CTA Button
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 3000,
      y: baseY + 1400,
      width: 2000,
      height: 350,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 10,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // CTA Button text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3400,
      y: baseY + 1525,
      width: 1200,
      height: 120,
      rotation: 0,
      fill: '#ffffff',
      text: 'Get Started',
      fontSize: 100,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Feature card 1
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 400,
      y: baseY + 3000,
      width: 2200,
      height: 1500,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Feature 1 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 600,
      y: baseY + 3200,
      width: 1800,
      height: 120,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Real-Time Collab',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Feature 1 description
    {
      id: generateId(),
      type: 'text',
      x: baseX + 600,
      y: baseY + 3450,
      width: 1800,
      height: 200,
      rotation: 0,
      fill: '#646669',
      text: 'Work together with your team in real-time',
      fontSize: 65,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Feature card 2
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 2900,
      y: baseY + 3000,
      width: 2200,
      height: 1500,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Feature 2 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3100,
      y: baseY + 3200,
      width: 1800,
      height: 120,
      rotation: 0,
      fill: '#2c2e33',
      text: 'AI Assistant',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Feature 2 description
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3100,
      y: baseY + 3450,
      width: 1800,
      height: 200,
      rotation: 0,
      fill: '#646669',
      text: 'Design faster with AI-powered suggestions',
      fontSize: 65,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Feature card 3
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 5400,
      y: baseY + 3000,
      width: 2200,
      height: 1500,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Feature 3 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 5600,
      y: baseY + 3200,
      width: 1800,
      height: 120,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Export Anywhere',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Feature 3 description
    {
      id: generateId(),
      type: 'text',
      x: baseX + 5600,
      y: baseY + 3450,
      width: 1800,
      height: 200,
      rotation: 0,
      fill: '#646669',
      text: 'Export to PNG, SVG, or share instantly',
      fontSize: 65,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Footer
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY + 5000,
      width: 8000,
      height: 600,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 1
    },
    // Footer text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 2500,
      y: baseY + 5200,
      width: 3000,
      height: 150,
      rotation: 0,
      fill: '#ffffff',
      text: '© 2025 Your Company',
      fontSize: 80,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 0.7,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    }
  ];
};

/**
 * Template: Mobile App
 * 
 * Components:
 * - Phone frame
 * - Status bar
 * - Navigation bar
 * - Content cards
 * - Bottom tab bar
 */
export const MOBILE_APP_TEMPLATE = (userId) => {
  const baseX = CANVAS_CENTER_X - 1500;
  const baseY = CANVAS_CENTER_Y - 4000;
  
  return [
    // Phone frame
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY,
      width: 3000,
      height: 6500,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#2c2e33',
      strokeWidth: 40,
      cornerRadius: 80,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Status bar
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 40,
      y: baseY + 40,
      width: 2920,
      height: 200,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 40,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Status bar time
    {
      id: generateId(),
      type: 'text',
      x: baseX + 200,
      y: baseY + 80,
      width: 400,
      height: 100,
      rotation: 0,
      fill: '#2c2e33',
      text: '9:41',
      fontSize: 70,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Navigation bar
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 40,
      y: baseY + 260,
      width: 2920,
      height: 350,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Nav title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 200,
      y: baseY + 380,
      width: 2000,
      height: 120,
      rotation: 0,
      fill: '#ffffff',
      text: 'Home',
      fontSize: 110,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content card 1
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 200,
      y: baseY + 750,
      width: 2600,
      height: 800,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 16,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Card 1 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 350,
      y: baseY + 900,
      width: 2300,
      height: 120,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Recent Activity',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Card 1 subtitle
    {
      id: generateId(),
      type: 'text',
      x: baseX + 350,
      y: baseY + 1100,
      width: 2300,
      height: 100,
      rotation: 0,
      fill: '#646669',
      text: 'View your recent actions',
      fontSize: 65,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content card 2
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 200,
      y: baseY + 1650,
      width: 2600,
      height: 800,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 16,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Card 2 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 350,
      y: baseY + 1800,
      width: 2300,
      height: 120,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Notifications',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Card 2 subtitle
    {
      id: generateId(),
      type: 'text',
      x: baseX + 350,
      y: baseY + 2000,
      width: 2300,
      height: 100,
      rotation: 0,
      fill: '#646669',
      text: '3 new notifications',
      fontSize: 65,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content card 3
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 200,
      y: baseY + 2550,
      width: 2600,
      height: 800,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 16,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Card 3 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 350,
      y: baseY + 2700,
      width: 2300,
      height: 120,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Settings',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Card 3 subtitle
    {
      id: generateId(),
      type: 'text',
      x: baseX + 350,
      y: baseY + 2900,
      width: 2300,
      height: 100,
      rotation: 0,
      fill: '#646669',
      text: 'Manage your preferences',
      fontSize: 65,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Bottom tab bar
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 40,
      y: baseY + 5900,
      width: 2920,
      height: 400,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Tab 1
    {
      id: generateId(),
      type: 'text',
      x: baseX + 300,
      y: baseY + 6050,
      width: 500,
      height: 100,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Home',
      fontSize: 65,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Tab 2
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1000,
      y: baseY + 6050,
      width: 500,
      height: 100,
      rotation: 0,
      fill: '#646669',
      text: 'Search',
      fontSize: 65,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Tab 3
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1700,
      y: baseY + 6050,
      width: 600,
      height: 100,
      rotation: 0,
      fill: '#646669',
      text: 'Profile',
      fontSize: 65,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    }
  ];
};

/**
 * Template: Pricing Page (3-Tier)
 * 
 * Components:
 * - 3 pricing cards
 * - Most Popular badge on middle tier
 * - Feature lists
 * - CTA buttons
 * - Header title
 */
export const PRICING_PAGE_TEMPLATE = (userId) => {
  const baseX = CANVAS_CENTER_X - 4500;
  const baseY = CANVAS_CENTER_Y - 3500;
  
  return [
    // Page title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 2500,
      y: baseY,
      width: 4000,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Choose Your Plan',
      fontSize: 140,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Subtitle
    {
      id: generateId(),
      type: 'text',
      x: baseX + 2000,
      y: baseY + 250,
      width: 5000,
      height: 120,
      rotation: 0,
      fill: '#646669',
      text: 'Select the perfect plan for your needs',
      fontSize: 80,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Basic Plan Card
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY + 600,
      width: 2800,
      height: 3000,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Basic plan name
    {
      id: generateId(),
      type: 'text',
      x: baseX + 400,
      y: baseY + 800,
      width: 2000,
      height: 120,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Basic',
      fontSize: 100,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Basic price
    {
      id: generateId(),
      type: 'text',
      x: baseX + 600,
      y: baseY + 1000,
      width: 1600,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: '$9',
      fontSize: 150,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Basic per month
    {
      id: generateId(),
      type: 'text',
      x: baseX + 600,
      y: baseY + 1200,
      width: 1600,
      height: 80,
      rotation: 0,
      fill: '#646669',
      text: 'per month',
      fontSize: 60,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Basic features
    {
      id: generateId(),
      type: 'text',
      x: baseX + 400,
      y: baseY + 1500,
      width: 2000,
      height: 700,
      rotation: 0,
      fill: '#646669',
      text: '✓ 3 Projects\n✓ Basic Support\n✓ 1GB Storage\n✓ Email Support',
      fontSize: 70,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Basic CTA button
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 400,
      y: baseY + 2500,
      width: 2000,
      height: 300,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Basic button text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 800,
      y: baseY + 2610,
      width: 1200,
      height: 100,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Get Started',
      fontSize: 80,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Pro Plan Card (Most Popular)
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 3100,
      y: baseY + 400,
      width: 2800,
      height: 3400,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#2c2e33',
      strokeWidth: 3,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Most Popular badge
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 3700,
      y: baseY + 500,
      width: 1600,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Badge text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3800,
      y: baseY + 570,
      width: 1400,
      height: 80,
      rotation: 0,
      fill: '#ffffff',
      text: 'Most Popular',
      fontSize: 65,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Pro plan name
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3500,
      y: baseY + 900,
      width: 2000,
      height: 120,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Pro',
      fontSize: 100,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Pro price
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3700,
      y: baseY + 1100,
      width: 1600,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: '$29',
      fontSize: 150,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Pro per month
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3700,
      y: baseY + 1300,
      width: 1600,
      height: 80,
      rotation: 0,
      fill: '#646669',
      text: 'per month',
      fontSize: 60,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Pro features
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3500,
      y: baseY + 1600,
      width: 2000,
      height: 900,
      rotation: 0,
      fill: '#646669',
      text: '✓ Unlimited Projects\n✓ Priority Support\n✓ 100GB Storage\n✓ Team Collaboration\n✓ Advanced Analytics',
      fontSize: 70,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Pro CTA button
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 3500,
      y: baseY + 2900,
      width: 2000,
      height: 300,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Pro button text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3900,
      y: baseY + 3010,
      width: 1200,
      height: 100,
      rotation: 0,
      fill: '#ffffff',
      text: 'Get Started',
      fontSize: 80,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Enterprise Plan Card
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 6200,
      y: baseY + 600,
      width: 2800,
      height: 3000,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Enterprise plan name
    {
      id: generateId(),
      type: 'text',
      x: baseX + 6600,
      y: baseY + 800,
      width: 2000,
      height: 120,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Enterprise',
      fontSize: 100,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Enterprise price
    {
      id: generateId(),
      type: 'text',
      x: baseX + 6600,
      y: baseY + 1000,
      width: 2000,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Custom',
      fontSize: 130,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Enterprise per month
    {
      id: generateId(),
      type: 'text',
      x: baseX + 6800,
      y: baseY + 1200,
      width: 1600,
      height: 80,
      rotation: 0,
      fill: '#646669',
      text: 'contact us',
      fontSize: 60,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Enterprise features
    {
      id: generateId(),
      type: 'text',
      x: baseX + 6600,
      y: baseY + 1500,
      width: 2000,
      height: 700,
      rotation: 0,
      fill: '#646669',
      text: '✓ Everything in Pro\n✓ Dedicated Support\n✓ Custom Integrations\n✓ SLA Guarantee',
      fontSize: 70,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Enterprise CTA button
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 6600,
      y: baseY + 2500,
      width: 2000,
      height: 300,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Enterprise button text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 7000,
      y: baseY + 2610,
      width: 1200,
      height: 100,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Contact Sales',
      fontSize: 75,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    }
  ];
};

/**
 * Template: Email Template
 * 
 * Components:
 * - Header with logo
 * - Hero banner area
 * - Body content sections
 * - CTA button
 * - Footer with social links
 * - Mobile-optimized width (600px = 6000 canvas units)
 */
export const EMAIL_TEMPLATE = (userId) => {
  const baseX = CANVAS_CENTER_X - 3000;
  const baseY = CANVAS_CENTER_Y - 5000;
  
  return [
    // Container background
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY,
      width: 6000,
      height: 10000,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 1
    },
    // Header section
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY,
      width: 6000,
      height: 600,
      rotation: 0,
      fill: '#ffffff',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Logo text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 300,
      y: baseY + 200,
      width: 2000,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: 'YOUR LOGO',
      fontSize: 110,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Unsubscribe link
    {
      id: generateId(),
      type: 'text',
      x: baseX + 4000,
      y: baseY + 250,
      width: 1700,
      height: 100,
      rotation: 0,
      fill: '#646669',
      text: 'Unsubscribe',
      fontSize: 65,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'right',
      opacity: 0.8,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Hero banner
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY + 600,
      width: 6000,
      height: 2500,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Hero title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 500,
      y: baseY + 1200,
      width: 5000,
      height: 300,
      rotation: 0,
      fill: '#ffffff',
      text: 'Big Announcement!',
      fontSize: 160,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Hero subtitle
    {
      id: generateId(),
      type: 'text',
      x: baseX + 800,
      y: baseY + 1600,
      width: 4400,
      height: 200,
      rotation: 0,
      fill: '#ffffff',
      text: 'Discover what\'s new this week',
      fontSize: 85,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 0.9,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Hero CTA
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 2000,
      y: baseY + 2100,
      width: 2000,
      height: 350,
      rotation: 0,
      fill: '#ffffff',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Hero CTA text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 2400,
      y: baseY + 2225,
      width: 1200,
      height: 120,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Read More',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content section 1
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 300,
      y: baseY + 3400,
      width: 5400,
      height: 1800,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 1,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Content 1 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 600,
      y: baseY + 3600,
      width: 4800,
      height: 150,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Feature Highlight',
      fontSize: 100,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content 1 body
    {
      id: generateId(),
      type: 'text',
      x: baseX + 600,
      y: baseY + 3850,
      width: 4800,
      height: 800,
      rotation: 0,
      fill: '#646669',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
      fontSize: 75,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content 1 CTA link
    {
      id: generateId(),
      type: 'text',
      x: baseX + 600,
      y: baseY + 4750,
      width: 2000,
      height: 100,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Learn More →',
      fontSize: 75,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content section 2
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 300,
      y: baseY + 5500,
      width: 5400,
      height: 1800,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 1,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Content 2 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 600,
      y: baseY + 5700,
      width: 4800,
      height: 150,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Latest Updates',
      fontSize: 100,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content 2 body
    {
      id: generateId(),
      type: 'text',
      x: baseX + 600,
      y: baseY + 5950,
      width: 4800,
      height: 800,
      rotation: 0,
      fill: '#646669',
      text: 'Check out our newest features and improvements. We\'ve been working hard to make your experience even better.',
      fontSize: 75,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Footer section
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY + 7600,
      width: 6000,
      height: 2400,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Footer social links
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1500,
      y: baseY + 8000,
      width: 3000,
      height: 150,
      rotation: 0,
      fill: '#ffffff',
      text: 'Twitter  •  Facebook  •  LinkedIn',
      fontSize: 75,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 0.9,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Footer address
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1000,
      y: baseY + 8400,
      width: 4000,
      height: 400,
      rotation: 0,
      fill: '#ffffff',
      text: 'Your Company Inc.\n123 Main Street\nSan Francisco, CA 94102',
      fontSize: 65,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 0.7,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Footer copyright
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1500,
      y: baseY + 9200,
      width: 3000,
      height: 100,
      rotation: 0,
      fill: '#ffffff',
      text: '© 2025 Your Company. All rights reserved.',
      fontSize: 60,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 0.6,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    }
  ];
};

/**
 * Template: Social Media Post (Instagram Square)
 * 
 * Components:
 * - 1080x1080px square format
 * - Image/background area
 * - Text overlay
 * - Logo placement
 * - Hashtag section
 */
export const SOCIAL_MEDIA_POST_TEMPLATE = (userId) => {
  const baseX = CANVAS_CENTER_X - 5400;
  const baseY = CANVAS_CENTER_Y - 5400;
  
  return [
    // Background
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY,
      width: 10800,
      height: 10800,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 1
    },
    // Main text overlay area
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 800,
      y: baseY + 3000,
      width: 9200,
      height: 4000,
      rotation: 0,
      fill: 'rgba(255, 255, 255, 0.15)',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 20,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 1
    },
    // Main headline
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1200,
      y: baseY + 3800,
      width: 8400,
      height: 600,
      rotation: 0,
      fill: '#ffffff',
      text: 'Your Message Here',
      fontSize: 280,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Subtext
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1800,
      y: baseY + 4800,
      width: 7200,
      height: 400,
      rotation: 0,
      fill: '#ffffff',
      text: 'Engage your audience with compelling content',
      fontSize: 120,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 0.9,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Logo area (top left)
    {
      id: generateId(),
      type: 'text',
      x: baseX + 600,
      y: baseY + 600,
      width: 2500,
      height: 300,
      rotation: 0,
      fill: '#ffffff',
      text: 'YOUR LOGO',
      fontSize: 140,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Hashtag section (bottom)
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1000,
      y: baseY + 9400,
      width: 8800,
      height: 300,
      rotation: 0,
      fill: '#ffffff',
      text: '#YourBrand #Marketing #SocialMedia',
      fontSize: 100,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 0.8,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // CTA text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3200,
      y: baseY + 6000,
      width: 4400,
      height: 250,
      rotation: 0,
      fill: '#ffffff',
      text: 'Learn More',
      fontSize: 130,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    }
  ];
};

/**
 * Template: Presentation Slide (16:9)
 * 
 * Components:
 * - Title area
 * - Content sections with icons
 * - Image placeholder
 * - Footer/source area
 * - 1920x1080px aspect ratio
 */
export const PRESENTATION_SLIDE_TEMPLATE = (userId) => {
  const baseX = CANVAS_CENTER_X - 9600;
  const baseY = CANVAS_CENTER_Y - 5400;
  
  return [
    // Background
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY,
      width: 19200,
      height: 10800,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 1
    },
    // Title bar
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY,
      width: 19200,
      height: 1200,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 1
    },
    // Title text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 800,
      y: baseY + 350,
      width: 17600,
      height: 500,
      rotation: 0,
      fill: '#ffffff',
      text: 'Slide Title',
      fontSize: 200,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content section 1
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 800,
      y: baseY + 2000,
      width: 5200,
      height: 3000,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Icon 1
    {
      id: generateId(),
      type: 'circle',
      x: baseX + 2600,
      y: baseY + 2400,
      width: 600,
      height: 600,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 5
    },
    // Content 1 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1200,
      y: baseY + 3200,
      width: 4400,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Key Point 1',
      fontSize: 110,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content 1 body
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1200,
      y: baseY + 3600,
      width: 4400,
      height: 900,
      rotation: 0,
      fill: '#646669',
      text: 'Supporting details and data for this point',
      fontSize: 85,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content section 2
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 7000,
      y: baseY + 2000,
      width: 5200,
      height: 3000,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Icon 2
    {
      id: generateId(),
      type: 'circle',
      x: baseX + 8800,
      y: baseY + 2400,
      width: 600,
      height: 600,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 5
    },
    // Content 2 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 7400,
      y: baseY + 3200,
      width: 4400,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Key Point 2',
      fontSize: 110,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content 2 body
    {
      id: generateId(),
      type: 'text',
      x: baseX + 7400,
      y: baseY + 3600,
      width: 4400,
      height: 900,
      rotation: 0,
      fill: '#646669',
      text: 'Supporting details and data for this point',
      fontSize: 85,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content section 3
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 13200,
      y: baseY + 2000,
      width: 5200,
      height: 3000,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Icon 3
    {
      id: generateId(),
      type: 'circle',
      x: baseX + 15000,
      y: baseY + 2400,
      width: 600,
      height: 600,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 5
    },
    // Content 3 title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 13600,
      y: baseY + 3200,
      width: 4400,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Key Point 3',
      fontSize: 110,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Content 3 body
    {
      id: generateId(),
      type: 'text',
      x: baseX + 13600,
      y: baseY + 3600,
      width: 4400,
      height: 900,
      rotation: 0,
      fill: '#646669',
      text: 'Supporting details and data for this point',
      fontSize: 85,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Image placeholder area
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 800,
      y: baseY + 5800,
      width: 17600,
      height: 3800,
      rotation: 0,
      fill: '#e0e0e0',
      stroke: '#646669',
      strokeWidth: 3,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 1
    },
    // Image placeholder text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 6800,
      y: baseY + 7300,
      width: 5600,
      height: 400,
      rotation: 0,
      fill: '#646669',
      text: 'Image or Chart',
      fontSize: 160,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 0.6,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Footer/Source
    {
      id: generateId(),
      type: 'text',
      x: baseX + 800,
      y: baseY + 10100,
      width: 17600,
      height: 200,
      rotation: 0,
      fill: '#646669',
      text: 'Source: Your Data Source • Slide 1',
      fontSize: 75,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'right',
      opacity: 0.7,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    }
  ];
};

/**
 * Template: Kanban Board
 * 
 * Components:
 * - 4 columns (To Do, In Progress, Done, Blocked)
 * - Card components in each
 * - Column headers with counts
 * - Add card buttons
 */
export const KANBAN_BOARD_TEMPLATE = (userId) => {
  const baseX = CANVAS_CENTER_X - 5400;
  const baseY = CANVAS_CENTER_Y - 4000;
  
  return [
    // Board title
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3000,
      y: baseY,
      width: 4800,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Project Board',
      fontSize: 140,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Column 1: To Do
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY + 600,
      width: 2400,
      height: 6500,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Column 1 header
    {
      id: generateId(),
      type: 'text',
      x: baseX + 200,
      y: baseY + 800,
      width: 1600,
      height: 150,
      rotation: 0,
      fill: '#2c2e33',
      text: 'To Do (3)',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Card 1-1
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 200,
      y: baseY + 1200,
      width: 2000,
      height: 800,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Card 1-1 text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 350,
      y: baseY + 1400,
      width: 1700,
      height: 400,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Design new feature',
      fontSize: 75,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Card 1-2
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 200,
      y: baseY + 2200,
      width: 2000,
      height: 800,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Card 1-2 text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 350,
      y: baseY + 2400,
      width: 1700,
      height: 400,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Write documentation',
      fontSize: 75,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Column 2: In Progress
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 2800,
      y: baseY + 600,
      width: 2400,
      height: 6500,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Column 2 header
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3000,
      y: baseY + 800,
      width: 2000,
      height: 150,
      rotation: 0,
      fill: '#2c2e33',
      text: 'In Progress (2)',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Card 2-1
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 3000,
      y: baseY + 1200,
      width: 2000,
      height: 800,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#2c2e33',
      strokeWidth: 3,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Card 2-1 text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3150,
      y: baseY + 1400,
      width: 1700,
      height: 400,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Build API endpoint',
      fontSize: 75,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Column 3: Done
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 5600,
      y: baseY + 600,
      width: 2400,
      height: 6500,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Column 3 header
    {
      id: generateId(),
      type: 'text',
      x: baseX + 5800,
      y: baseY + 800,
      width: 1600,
      height: 150,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Done (5)',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Card 3-1
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 5800,
      y: baseY + 1200,
      width: 2000,
      height: 800,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 8,
      opacity: 0.7,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Card 3-1 text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 5950,
      y: baseY + 1400,
      width: 1700,
      height: 400,
      rotation: 0,
      fill: '#646669',
      text: 'Setup project',
      fontSize: 75,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Column 4: Blocked
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 8400,
      y: baseY + 600,
      width: 2400,
      height: 6500,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 12,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Column 4 header
    {
      id: generateId(),
      type: 'text',
      x: baseX + 8600,
      y: baseY + 800,
      width: 1800,
      height: 150,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Blocked (1)',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Card 4-1
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 8600,
      y: baseY + 1200,
      width: 2000,
      height: 800,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#e0e0e0',
      strokeWidth: 2,
      cornerRadius: 8,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Card 4-1 text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 8750,
      y: baseY + 1400,
      width: 1700,
      height: 400,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Waiting for approval',
      fontSize: 75,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'left',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    }
  ];
};

/**
 * Template: Certificate/Award
 * 
 * Components:
 * - Border/frame
 * - Organization logo area
 * - Certificate header
 * - Recipient name (large)
 * - Date and signature lines
 * - Decorative elements
 */
export const CERTIFICATE_TEMPLATE = (userId) => {
  const baseX = CANVAS_CENTER_X - 5500;
  const baseY = CANVAS_CENTER_Y - 4000;
  
  return [
    // Outer border
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY,
      width: 11000,
      height: 8000,
      rotation: 0,
      fill: '#ffffff',
      stroke: '#2c2e33',
      strokeWidth: 40,
      cornerRadius: 20,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 1
    },
    // Inner decorative border
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 300,
      y: baseY + 300,
      width: 10400,
      height: 7400,
      rotation: 0,
      fill: 'transparent',
      stroke: '#2c2e33',
      strokeWidth: 4,
      cornerRadius: 15,
      opacity: 0.3,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 1
    },
    // Header text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 2000,
      y: baseY + 1000,
      width: 7000,
      height: 300,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Certificate of Achievement',
      fontSize: 160,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Presented to text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3500,
      y: baseY + 1800,
      width: 4000,
      height: 150,
      rotation: 0,
      fill: '#646669',
      text: 'This certificate is presented to',
      fontSize: 85,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Recipient name (large)
    {
      id: generateId(),
      type: 'text',
      x: baseX + 2000,
      y: baseY + 2400,
      width: 7000,
      height: 400,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Recipient Name',
      fontSize: 200,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Name underline
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 2500,
      y: baseY + 2900,
      width: 6000,
      height: 8,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 0.3,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 2
    },
    // Achievement text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1500,
      y: baseY + 3500,
      width: 8000,
      height: 600,
      rotation: 0,
      fill: '#646669',
      text: 'For outstanding achievement in completing\nthe Professional Development Program',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Date label
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1500,
      y: baseY + 5500,
      width: 3000,
      height: 150,
      rotation: 0,
      fill: '#646669',
      text: 'Date',
      fontSize: 80,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Date line
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 1800,
      y: baseY + 5750,
      width: 2400,
      height: 4,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 0.3,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Date text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1900,
      y: baseY + 5850,
      width: 2200,
      height: 120,
      rotation: 0,
      fill: '#2c2e33',
      text: 'January 1, 2025',
      fontSize: 75,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Signature label
    {
      id: generateId(),
      type: 'text',
      x: baseX + 6500,
      y: baseY + 5500,
      width: 3000,
      height: 150,
      rotation: 0,
      fill: '#646669',
      text: 'Signature',
      fontSize: 80,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Signature line
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 6800,
      y: baseY + 5750,
      width: 2400,
      height: 4,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 0.3,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Signature text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 6900,
      y: baseY + 5850,
      width: 2200,
      height: 120,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Director Name',
      fontSize: 75,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Organization name
    {
      id: generateId(),
      type: 'text',
      x: baseX + 3000,
      y: baseY + 6800,
      width: 5000,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: 'Your Organization',
      fontSize: 110,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    }
  ];
};

/**
 * Template: Quote Card (Instagram Style)
 * 
 * Components:
 * - Large quote text
 * - Attribution line
 * - Background
 * - Logo in corner
 * - Square format (1080x1080px)
 */
export const QUOTE_CARD_TEMPLATE = (userId) => {
  const baseX = CANVAS_CENTER_X - 5400;
  const baseY = CANVAS_CENTER_Y - 5400;
  
  return [
    // Background
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX,
      y: baseY,
      width: 10800,
      height: 10800,
      rotation: 0,
      fill: '#f5f5f5',
      stroke: '#e0e0e0',
      strokeWidth: 4,
      cornerRadius: 0,
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 1
    },
    // Opening quote mark
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1000,
      y: baseY + 1500,
      width: 1000,
      height: 800,
      rotation: 0,
      fill: '#2c2e33',
      text: '"',
      fontSize: 600,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'left',
      opacity: 0.2,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Quote text
    {
      id: generateId(),
      type: 'text',
      x: baseX + 1200,
      y: baseY + 3200,
      width: 8400,
      height: 3500,
      rotation: 0,
      fill: '#2c2e33',
      text: 'The only way to do great work is to love what you do.',
      fontSize: 180,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Attribution line
    {
      id: generateId(),
      type: 'rectangle',
      x: baseX + 4200,
      y: baseY + 7300,
      width: 2400,
      height: 6,
      rotation: 0,
      fill: '#2c2e33',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
      opacity: 0.3,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 3
    },
    // Author name
    {
      id: generateId(),
      type: 'text',
      x: baseX + 2500,
      y: baseY + 7500,
      width: 5800,
      height: 250,
      rotation: 0,
      fill: '#646669',
      text: '— Steve Jobs',
      fontSize: 110,
      fontFamily: 'Roboto Mono',
      fontStyle: 'normal',
      align: 'center',
      opacity: 1,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Logo/Brand (bottom right)
    {
      id: generateId(),
      type: 'text',
      x: baseX + 7500,
      y: baseY + 9500,
      width: 2500,
      height: 200,
      rotation: 0,
      fill: '#2c2e33',
      text: 'YourBrand',
      fontSize: 90,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'right',
      opacity: 0.6,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    },
    // Closing quote mark
    {
      id: generateId(),
      type: 'text',
      x: baseX + 8800,
      y: baseY + 5000,
      width: 1000,
      height: 800,
      rotation: 0,
      fill: '#2c2e33',
      text: '"',
      fontSize: 600,
      fontFamily: 'Roboto Mono',
      fontStyle: 'bold',
      align: 'right',
      opacity: 0.2,
      createdBy: userId,
      createdAt: Date.now(),
      zIndex: 10
    }
  ];
};

/**
 * Template registry
 */
export const TEMPLATES = {
  blank: {
    name: 'Blank Canvas',
    description: 'Start from scratch',
    icon: '◻',
    shapes: () => [] // No shapes for blank canvas
  },
  'login-form': {
    name: 'Login Form',
    description: 'Email, password, and button',
    icon: '🔐',
    shapes: LOGIN_FORM_TEMPLATE
  },
  dashboard: {
    name: 'Dashboard',
    description: 'Metrics, sidebar, and content',
    icon: '📊',
    shapes: DASHBOARD_TEMPLATE
  },
  'landing-page': {
    name: 'Landing Page',
    description: 'Hero, features, and footer',
    icon: '🚀',
    shapes: LANDING_PAGE_TEMPLATE
  },
  'mobile-app': {
    name: 'Mobile App',
    description: 'Phone frame with UI elements',
    icon: '📱',
    shapes: MOBILE_APP_TEMPLATE
  },
  'pricing-page': {
    name: 'Pricing Page',
    description: '3-tier pricing with features',
    icon: '💰',
    shapes: PRICING_PAGE_TEMPLATE
  },
  'email-template': {
    name: 'Email Template',
    description: 'Newsletter with hero & CTA',
    icon: '📧',
    shapes: EMAIL_TEMPLATE
  },
  'social-media-post': {
    name: 'Social Media Post',
    description: 'Instagram square with text',
    icon: '📱',
    shapes: SOCIAL_MEDIA_POST_TEMPLATE
  },
  'presentation-slide': {
    name: 'Presentation Slide',
    description: '16:9 slide with 3 points',
    icon: '📊',
    shapes: PRESENTATION_SLIDE_TEMPLATE
  },
  'kanban-board': {
    name: 'Kanban Board',
    description: '4-column task board',
    icon: '📋',
    shapes: KANBAN_BOARD_TEMPLATE
  },
  'certificate': {
    name: 'Certificate',
    description: 'Award with signature lines',
    icon: '🏆',
    shapes: CERTIFICATE_TEMPLATE
  },
  'quote-card': {
    name: 'Quote Card',
    description: 'Inspiring quote for social',
    icon: '💭',
    shapes: QUOTE_CARD_TEMPLATE
  }
};

