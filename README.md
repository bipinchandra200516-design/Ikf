# AutoHub — Multi-Category Vehicle Sales Marketplace

AutoHub is a complete, production-oriented vehicle inventory and sales marketplace built to handle both passenger vehicles and heavy commercial fleet equipment across six vehicle categories:

1. **Own Car** — Private and personal passenger mobility
2. **Taxi Car** — Commercial passenger fleets with tourist/commercial permits & dual fuel
3. **SCV** — Small Commercial Vehicles (sub-1.5T last-mile urban logistics)
4. **LCV** — Light Commercial Vehicles (intermediate freight transport)
5. **HCV** — Heavy Commercial Vehicles (multi-axle freight carriers and heavy trucks)
6. **Tractor** — Agricultural tractors and farm equipment

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Outfit & Inter Typography.
- **Backend**: Node.js & Express REST API with persistent relational database engine.
- **Excel Importer**: Native server-side spreadsheet processor with support for XLSX, XLS, and CSV.
- **Security & Auth**: JWT authentication, bcrypt password hashing, SSRF-safe URL validation, strict public API response sanitization.

---

## Exact 16-Column Excel Specification

The import engine recognizes the exact column names without requiring column renaming:

| Excel Source Header | Internal Mapping | Public Visibility | Notes |
| :--- | :--- | :--- | :--- |
| `LOAN_BRANCH` | `branch_location` | Public | Regional yard / branch |
| `LOAN_ID` | `source_loan_id` | **Strictly Private** | Internal identifier for matching & deduplication |
| `CUSTOMER_NAME` | `internal_customer_name` | **Strictly Private** | Operational audit data |
| `Aging_Days` | `internal_aging_days` | **Strictly Private** | Internal inventory age |
| `Sold Data` | `source_sale_status` | Configurable | Mapped to internal statuses via Status Mappings |
| `B>Prices` | `source_price` | Admin Configured | Initial price mapped to configurable public price |
| `LOAN_PRODUCT` | `vehicle_category` | Public | One of 6 recognized categories |
| `VehicleNo` | `registration_number` | Controlled | Configurable via Admin Privacy toggle |
| `YOM` | `manufacturing_year` | Public | Manufacturing year |
| `MAKE&VEHICLE_DESC` | `original_vehicle_description` | Public / Admin | Preserved raw + extracts Make, Model, Variant |
| `CHASIS NUMBER` | `internal_chassis_number` | **Strictly Private** | Vehicle identification number |
| `ENGINE_NUMBER` | `internal_engine_number` | **Strictly Private** | Engine serial number |
| `PIC` | `source_image_url` | Public Image | SSRF-checked image URL |
| `Seized On` | `internal_seized_on` | **Strictly Private** | Seizure date |
| `YardContactNo` | `internal_yard_contact` | **Strictly Private** | Internal yard staff contact |
| `Yard Name` | `yard_name` | Controlled | Configurable via Admin Privacy toggle |

---

## Privacy & Security Guarantees

- **Zero Exposure**: `CUSTOMER_NAME`, `LOAN_ID`, `Aging_Days`, `CHASIS NUMBER`, `ENGINE_NUMBER`, `Seized On`, and `YardContactNo` are stripped server-side before any public response is emitted.
- **Controlled Visibility**: Vehicle Registration Number (`VehicleNo`) and Yard Name can be masked or hidden via the Admin Dealership Settings.
- **SSRF Prevention**: All image URLs in the `PIC` column are checked against private IP ranges, loopback addresses, and cloud metadata services.

---

## Default Administrator Credentials

- **Email**: `admin@autohub.com`
- **Password**: `Admin@AutoHub2026!`
- **Portal URL**: `http://localhost:5173/#admin`

---

## Running the Application Locally

### 1. Start the Backend Server (Port 5000)
```bash
cd server
npm install
npm start
```

### 2. Start the Frontend Client (Port 5173)
```bash
cd client
npm install
npm run dev
```

Visit **`http://localhost:5173`** for the public marketplace, and **`http://localhost:5173/#admin`** for the Administrator Portal.
