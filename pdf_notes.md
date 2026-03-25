# 369Databottom.pdf – Key Findings

## Book Inspection (DBP and OC tabs)
- Three-panel layout: Left = Inspection History for selected site, Middle = Interactive booking calendar with month/year navigation, Right = Booking form with Site Address dropdown, Reason dropdown, Description textarea
- Calendar: interactive, date selection with visual feedback, today highlighting, hover effects
- History integration: site-specific history, detailed booking records with dates/reasons/descriptions, real-time updates when new bookings created

## History Screen
- System History popup/modal accessible from main dashboard via "History" button
- Columns: Date & Time, Action (badge), Description, Site Address, Operation, User
- Filters: Filter by Site (All Sites dropdown), Filter by Action (All Actions dropdown)
- Every action tracked: Create, Edit, Delete, Order generation, Booking creation
- Detailed info: Action description, Date/Time, Operation deadline, User

## Report Screen – Excel-like Data Interface
- Real-time update by Developer/Builder/Inspector
- Columns A-F (Core Data): Regime, Report #, BWRO #, Location, Observations, Photos (up to 4 thumbnails)
- Columns G-J (Developer): Comments, Responsible Party, Deadline (date picker), Status (color-coded dropdown)
  - Developer Status Colors: Working in Progress (red), Under Investigation (yellow), Design Underway (light blue), Design Resolved/Rationalised/Works to be Completed (light purple), Design Resolved/Submitted for Review (light green), Rectification Completed (light green)
- Columns K-L (OC): OC Comments, OC Status (color-coded dropdown)
  - OC Status Colors: Working in Progress (pink/red), Provide Evidence (yellow), Closed (green)
- Interactive features: Real-time color coding, Editable input fields, Date picker integration, Photo thumbnail display

## Excel Export Capabilities
- Advanced Excel features
- Excel file preview shows: Defect Severity, Report, BWRO, Location, Observations, Photograph, Developer (Ongoing Comments/Direction, Responsible Party, Deadline, Status), OC (Revision Dates, Status, Comments)
- Photos embedded in cells
- Working dropdowns preserved in Excel
- Report header: "FILLING EXAMPLE / NSW OC"
- Section headers: "REPORT ISSUED ON [date]", "FINAL BWRO ISSUED ON [date]", "BWRO April 2024"

## Data Analytics Hub (accessed via "Data" button in header)
Four main sections:
1. **Overview Timeline** – 6-month project timeline view, 37 inspector filtering system, color-coded risk assessment, INTEL & OC Inspection integration
2. **Defects Analysis** – Top 5 defects by category, monthly defect trend reporting, regional defect pattern mapping, NSW inspection activity visualization
3. **Graphics & Analytics** – Multi-tab analytics dashboard, KPI tracking, interactive charts, export capabilities
4. **Portfolio Management** – Workflow management, deadline tracking and alerts, priority-based project organization, Developer/Builder collaboration tools

## Overview Timeline – Actual Design
- Filters: Inspector, Stage, Risk Category, Selected by, Developer, Project Outcome (all dropdowns)
- Table: Address column + 6 month columns (current month highlighted in red/orange)
- Rows: address + stage/risk text in each month cell
- Color coding: High Risk = red, Medium Risk = yellow, Low Risk = green
- Back to Data button top-right

## Defects Analysis Section
- Tabs: Top Defects, Monthly View, Regional Analysis, Inspection Map
- Top Defects tab: Top 5 by category (Waterproofing 142, Fire Safety 98, Structural 76...)
- Right panel: Defect Distribution pie chart, Monthly Summary stats, Regional Hotspots
- Bottom: Advanced Search, NSW Map Integration (blue pins), Monthly Analysis buttons

## Graphics & Analytics Dashboard
- Tabs: Overview, Inspection Metrics, Defect Trends, Status Reports
- Filters bar + Export Data button
- KPI cards: DBP Audits Tracker (24,614), Sum of Cost ($12.35B), Audit Status (Active/Planned/Tracking), Total No. Audits (271)
- Charts: Count of Audit by Reg Class (bar), NSW Audit Locations (map), Audit Type Distribution (pie), Audit Count by Year (line)
- Bottom stats: 95 Active, 49 Closed-out, 33 Planned, 26 Tracking, 68 Other

## Portfolio Management (Outcoming)
- Title: "Portfolio" (NOT "Kanban")
- Kanban-style columns: Funnel, Reviewing, Analysing, Committed, Implementing, Completed
- Each column shows: Projects count, Ideas count, project cards with code/name/priority/size
- Priority: High (red), Medium (yellow), Low (green)
- Size: S, M, L, XL
- Filters + Export button
- Urgent (>60 days) indicator

## Navigation Architecture
Main Dashboard → DATA button → Analytics Hub (4 sections) → Back to Data navigation

## Report button position
- Report button is to the LEFT of ORDER button in the header
