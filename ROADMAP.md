# FixIt App Roadmap

This document outlines the high-level goals and planned features for the FixIt CMMS project. It is a living document and subject to change based on community feedback and contributions.

## Current Focus (v0.1.0 - "MVP Foundation")
- [x] **Core Maintenance**: Work order creation, tracking, and basic workflows.
- [x] **Asset Management**: Equipment inventory, location hierarchy, and QR code integration.
- [x] **Authentication**: Secure role-based access control (Admin, Technician, Operator).
- [x] **Basic Analytics**: Dashboard with key performance indicators (KPIs).
- [x] **Industrial UI**: High-contrast, touch-friendly interface optimized for shop floors.
- [x] **PWA Support**: Offline-first capabilities for mobile devices.

## Near Term (v0.2.0 - "Operational Efficiency")
### Features
- [ ] **Preventive Maintenance Engine**: Advanced scheduling (meter-based triggers, floating intervals).
- [ ] **Enhanced Inventory**: Multi-location stock tracking, low-stock alerts, and usage analytics.
- [ ] **Mobile Experience**: Improved PWA performance, push notifications for work assignments.
- [ ] **Reporting Suite**: Exportable PDF/CSV reports for compliance and audits.

### Technical Debt
- [ ] **Testing Coverage**: Increase unit and E2E test coverage to >80%.
- [ ] **Performance**: Optimize database queries and client-side rendering for large datasets.
- [ ] **Documentation**: Comprehensive API documentation and contribution guides.

## Medium Term (v0.3.0 - "Integration & Automation")
- [ ] **API Webhooks**: Event-driven integrations with other systems (ERP, Slack/Teams).
- [ ] **IoT Connectors**: Ingest data from common industrial protocols (OPC UA, MQTT) for condition-based monitoring.
- [ ] **Vendor Management**: Track external service providers, contracts, and costs.
- [ ] **Workflow Automation**: Rule-based actions (e.g., "If high priority breakdown, SMS plant manager").

## Long Term (v1.0.0 - "Enterprise Ready")
- [ ] **Multi-Site Support**: Manage multiple facilities within a single instance.
- [ ] **Predictive Maintenance**: basic ML models for failure prediction based on historical data.
- [ ] **Custom Form Builder**: Drag-and-drop interface for creating custom inspection checklists.
- [ ] **SSO Integration**: OIDC/SAML support for enterprise identity providers.

## How to Contribute
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

If you have a feature request or idea, please open a [Discussion](https://github.com/0xForelsket/fixit-app/discussions) on GitHub.
