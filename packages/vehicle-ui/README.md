# Vehicle UI

**Professional In-Vehicle Touchscreen Interface for Pitu Platform**

The Vehicle UI is a modern, touch-optimized dashboard application built with Vue.js 3 that provides drivers and passengers with comprehensive vehicle monitoring, control, and entertainment capabilities. Designed specifically for commercial vehicles and RV applications, it delivers real-time telemetry visualization, energy management, navigation, and system controls through an intuitive interface.

## 🎯 Overview

The Vehicle UI serves as the primary human-machine interface (HMI) for the Pitu Platform, offering:

- **Real-Time Dashboard** - Live vehicle telemetry, energy metrics, and system status
- **Touch-Optimized Design** - Finger-friendly controls suitable for vehicle environments
- **3D Vehicle Visualization** - Interactive 3D models showing vehicle state and systems
- **Energy Management** - Victron solar/battery monitoring with control capabilities
- **Navigation Integration** - GPS tracking, route planning, and point-of-interest management
- **Climate Control** - HVAC system monitoring and adjustment
- **Entertainment Hub** - Media playback and connectivity features
- **System Administration** - Vehicle settings, diagnostics, and maintenance tools

## 🚗 Features

### Core Dashboard
- **Live Telemetry Display** - Engine, transmission, battery, and system metrics
- **Energy Management** - Solar generation, battery levels, consumption tracking
- **Vehicle Status** - Doors, lights, climate, and security system states
- **Diagnostic Information** - Fault codes, maintenance reminders, system health

### User Interface
- **Responsive Design** - Optimized for 15"+ touchscreen displays
- **Day/Night Modes** - Automatic brightness adjustment for driving conditions
- **Customizable Layout** - User-configurable dashboard widgets and layouts
- **Multi-Language Support** - Internationalization for global deployments
- **Accessibility Features** - Large touch targets, high contrast options

### Real-Time Integration
- **WebSocket Communication** - Live data streaming from vehicle systems
- **Digital Twin Sync** - Real-time synchronization with cloud-based device twins
- **Offline Capability** - Continued operation during connectivity loss
- **Data Caching** - Local storage for performance and reliability

### Advanced Features
- **3D Vehicle Models** - Interactive visualization of vehicle systems and components
- **Radial Menu System** - Efficient touch navigation for complex controls
- **Map Integration** - GPS tracking with route planning and POI management
- **Voice Control Ready** - Architecture prepared for voice command integration

## 🛠️ Technical Architecture

### Technology Stack
- **Frontend Framework**: Vue.js 3 with Composition API
- **Build Tool**: Vite with TypeScript support
- **State Management**: Pinia store with persistence
- **UI Framework**: Tailwind CSS + DaisyUI components
- **Real-Time Communication**: Socket.io client
- **3D Graphics**: Three.js for vehicle visualization
- **Testing**: Vitest (unit) + Cypress (E2E)
- **Development**: ESLint, TypeScript, hot reload

### Component Architecture
```
src/
├── components/           # Reusable UI components
│   ├── admin/           # Administrative interfaces
│   ├── controls/        # Vehicle control widgets
│   ├── Data.vue         # Real-time data displays
│   ├── Map.vue          # GPS and navigation
│   ├── RadialMenu.vue   # Touch-optimized menus
│   └── VehiclePreview.vue # 3D vehicle visualization
├── views/               # Main application screens
├── stores/              # Pinia state management
├── services/            # API and WebSocket services
├── router/              # Vue Router configuration
├── i18n/                # Internationalization
└── lib/                 # Utility libraries
```

### Real-Time Data Flow
```
Vehicle Systems (CAN Bus, Victron, etc.)
    ↓
AWS Greengrass Components
    ↓
WebSocket Server (ui-socket)
    ↓
Socket.io Client (Vehicle UI)
    ↓
Pinia Stores (State Management)
    ↓
Vue Components (Reactive UI)
```

## 🚀 Quick Start

### Prerequisites
- **Hardware**: Raspberry Pi 4B + 7"+ touchscreen display
- **Software**: Node.js 18+, npm, modern web browser
- **Network**: Connection to Pitu Platform edge device
- **Display**: 1024x600 minimum resolution (1920x1080 recommended)

### Development Setup

1. **Install Dependencies**
   ```bash
   cd packages/vehicle-ui
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Create .env.local for local development
   echo "VITE_API_BASE_URL=http://localhost:9998" > .env.local
   echo "VITE_SOCKET_URL=http://localhost:9999" >> .env.local
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   # Application available at http://localhost:5173
   ```

4. **Generate Type Schemas** (optional)
   ```bash
   npm run generate-schemas
   # Generates TypeScript types from JSON schemas
   ```

### Production Build

1. **Build Application**
   ```bash
   npm run build
   # Generates optimized production build in dist/
   ```

2. **Preview Production Build**
   ```bash
   npm run preview
   # Serves production build locally for testing
   ```

3. **Deploy to Vehicle**
   ```bash
   # Copy dist/ contents to web server on edge device
   rsync -av dist/ pi@vehicle-pi:/var/www/vehicle-ui/
   ```

## 🎨 User Interface

### Dashboard Layout
- **Header Bar** - Navigation, status indicators, system time
- **Main Content** - Primary dashboard widgets and data displays
- **Radial Menu** - Context-sensitive controls and actions
- **Status Bar** - Connectivity, battery, and system health indicators

### Screen Configurations

**Primary Dashboard**
- Vehicle telemetry overview
- Energy system status
- Navigation preview
- Quick action buttons

**Energy Management**
- Solar generation charts
- Battery state visualization
- Power consumption breakdown
- Victron system controls

**Vehicle Controls**
- Lighting system controls
- Climate adjustment
- Door and window status
- Security system management

**Settings & Admin**
- System configuration
- Network settings
- Diagnostic tools
- User preferences

### Touch Optimization
- **Minimum Touch Target**: 44px (11mm) for reliable finger interaction
- **Gesture Support**: Swipe navigation, pinch-to-zoom on maps
- **Feedback**: Visual and haptic feedback for all interactions
- **Error Prevention**: Confirmation dialogs for critical actions

## 📱 Components Reference

### Core Components

**`Data.vue`** - Real-time data display widget
```vue
<Data 
  :source="'victron-battery'" 
  :field="'voltage'" 
  :unit="'V'" 
  :precision="2" 
/>
```

**`Map.vue`** - GPS and navigation interface
```vue
<Map 
  :center="[lat, lng]" 
  :zoom="12" 
  :show-route="true" 
  @location-changed="updateLocation" 
/>
```

**`VehiclePreview.vue`** - 3D vehicle visualization
```vue
<VehiclePreview 
  :model="'sprinter'" 
  :show-systems="['lighting', 'doors']" 
  @system-clicked="handleSystemClick" 
/>
```

**`RadialMenu.vue`** - Touch-optimized circular menu
```vue
<RadialMenu 
  :items="menuItems" 
  :center-icon="'settings'" 
  @item-selected="handleMenuAction" 
/>
```

### Data Integration

**WebSocket Connection**
```typescript
// services/websocket.ts
import { io } from 'socket.io-client'

const socket = io(import.meta.env.VITE_SOCKET_URL)

socket.on('shadows:victron-battery', (data) => {
  batteryStore.updateFromShadow(JSON.parse(data))
})
```

**State Management**
```typescript
// stores/vehicle.ts
import { defineStore } from 'pinia'

export const useVehicleStore = defineStore('vehicle', {
  state: () => ({
    speed: 0,
    engineRpm: 0,
    fuelLevel: 0,
    // ... other vehicle metrics
  }),
  
  actions: {
    updateFromTelemetry(data: VehicleTelemetry) {
      this.speed = data.speed
      this.engineRpm = data.engineRpm
      this.fuelLevel = data.fuelLevel
    }
  }
})
```

## 🔧 Development

### Adding New Features

1. **Create Component**
   ```bash
   # Generate new component
   touch src/components/MyNewComponent.vue
   ```

2. **Add to Router**
   ```typescript
   // src/router/index.ts
   {
     path: '/my-feature',
     component: () => import('@/views/MyFeature.vue')
   }
   ```

3. **Integrate with State**
   ```typescript
   // src/stores/myFeature.ts
   export const useMyFeatureStore = defineStore('myFeature', {
     // Store definition
   })
   ```

### Theming and Styling

**Tailwind Configuration**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'vehicle-primary': '#1e40af',
        'vehicle-success': '#059669',
        'vehicle-warning': '#d97706',
        'vehicle-danger': '#dc2626'
      }
    }
  }
}
```

**DaisyUI Themes**
```css
/* Custom vehicle themes */
[data-theme="vehicle-day"] {
  --primary: #1e40af;
  --secondary: #64748b;
  --accent: #059669;
  --neutral: #374151;
}

[data-theme="vehicle-night"] {
  --primary: #3b82f6;
  --secondary: #94a3b8;
  --accent: #10b981;
  --neutral: #111827;
}
```

### Internationalization

**Adding New Language**
```typescript
// src/i18n/locales/es.json
{
  "dashboard": {
    "title": "Panel de Control",
    "speed": "Velocidad",
    "battery": "Batería"
  }
}
```

**Using Translations**
```vue
<template>
  <h1>{{ $t('dashboard.title') }}</h1>
  <p>{{ $t('dashboard.speed') }}: {{ speed }} km/h</p>
</template>
```

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests with Vitest
npm run test:unit

# Run with coverage
npm run test:unit -- --coverage
```

### End-to-End Tests
```bash
# Development E2E tests
npm run test:e2e:dev

# Production E2E tests
npm run build && npm run test:e2e
```

### Component Testing
```typescript
// tests/components/Data.test.ts
import { mount } from '@vue/test-utils'
import Data from '@/components/Data.vue'

describe('Data Component', () => {
  it('displays formatted value', () => {
    const wrapper = mount(Data, {
      props: {
        value: 12.345,
        unit: 'V',
        precision: 2
      }
    })
    
    expect(wrapper.text()).toContain('12.35 V')
  })
})
```

## 📦 Deployment

### Production Deployment

1. **Build Optimization**
   ```bash
   # Production build with optimizations
   npm run build
   
   # Analyze bundle size
   npx vite-bundle-analyzer dist/
   ```

2. **Web Server Configuration**
   ```nginx
   # nginx.conf for vehicle-ui
   server {
     listen 80;
     root /var/www/vehicle-ui;
     index index.html;
     
     # Single Page Application routing
     location / {
       try_files $uri $uri/ /index.html;
     }
     
     # WebSocket proxy
     location /socket.io/ {
       proxy_pass http://localhost:9999;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
     }
   }
   ```

3. **Performance Optimization**
   - Enable gzip compression
   - Configure caching headers
   - Optimize image assets
   - Lazy load non-critical components

### Kiosk Mode Setup

**Auto-Start Configuration**
```bash
# /etc/xdg/autostart/vehicle-ui.desktop
[Desktop Entry]
Type=Application
Name=Vehicle UI
Exec=chromium-browser --kiosk --no-sandbox http://localhost
```

**Browser Optimization**
```bash
# Chromium flags for vehicle displays
--kiosk
--no-sandbox
--disable-dev-shm-usage
--disable-gpu-sandbox
--disable-software-rasterizer
--disable-background-timer-throttling
--disable-renderer-backgrounding
--disable-backgrounding-occluded-windows
```

## 🔐 Security

### Content Security Policy
```html
<!-- Restrictive CSP for vehicle environment -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';
               connect-src 'self' ws: wss:;">
```

### Network Security
- HTTPS enforcement in production
- WebSocket authentication tokens
- Local network isolation
- Regular security updates

## 🎛️ Configuration

### Environment Variables
```bash
# .env.production
VITE_API_BASE_URL=https://vehicle-api.local
VITE_SOCKET_URL=wss://vehicle-api.local
VITE_MAPS_API_KEY=your_maps_api_key
VITE_ENABLE_DEBUG=false
```

### Application Settings
```typescript
// src/config/vehicle.ts
export const vehicleConfig = {
  display: {
    screenSize: '7inch', // 7inch, 10inch, custom
    orientation: 'landscape',
    brightness: 'auto'
  },
  features: {
    entertainment: true,
    navigation: true,
    diagnostics: true,
    remoteControl: false
  }
}
```

## 🤝 Contributing

### Development Guidelines
- Follow Vue.js 3 best practices and composition API patterns
- Use TypeScript for all new components
- Write unit tests for complex logic
- Follow accessibility guidelines (WCAG 2.1)
- Test on actual touchscreen hardware

### Component Standards
- All components must be touch-friendly (44px minimum targets)
- Support both light and dark themes
- Include proper TypeScript types
- Follow consistent naming conventions
- Document props and events

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Test on physical hardware
5. Submit pull request with description

## 📄 License

This component is part of the Pitu Platform and is licensed under the MIT License.

## 🔗 Related Documentation

- [Main Platform README](../../README.md) - Overall platform architecture
- [Main ECU](../main-ecu/README.md) - Vehicle hardware interface
- [API Documentation](../api/README.md) - Backend API reference
- [UI Socket](../ui-socket/README.md) - WebSocket communication layer

---

**Vehicle UI: The Digital Cockpit of the Future**

*Professional-grade in-vehicle interface combining real-time telemetry, energy management, and intuitive touch controls*
