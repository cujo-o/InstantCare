# ⚙️ InstantCare: AI Scoring & Routing Engine (Backend)

The InstantCare backend is a robust Node.js and Express service that acts as the orchestration layer for the InstantCare platform. Built for the GTCO Hackathon, it seamlessly connects user data via Supabase, handles payment provisioning via the HabariPay (Squad) API, and evaluates credit risk using a custom-built Neural Network scoring engine.

## ✨ Core Features
* **Predictive AI Trust Scoring:** Utilizes a custom, dependency-free Single-Layer Perceptron (Sigmoid activation) to calculate split-second credit risk based on savings velocity and debt-to-asset ratios.
* **Automated Account Provisioning:** Integrates directly with the Squad API to generate NIBSS-backed virtual bank accounts using strict KYC validation.
* **Emergency Routing Engine:** Intelligently approves or denies instant health loans based on live AI risk models and logs debt accurately.
* **Hackathon-Resilient Architecture:** Designed with robust fallbacks and clean terminal logging to ensure flawless live demonstrations.

## 🛠️ Tech Stack
* **Runtime/Framework:** Node.js, Express.js
* **Language:** TypeScript
* **Database:** Supabase (PostgreSQL)
* **API Integration:** Squad API (Virtual Accounts & Transfers)
* **AI/ML:** Custom Single-Layer Perceptron (Mathematical Implementation)

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* A Supabase Project
* HabariPay (Squad) Sandbox API Keys

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/cujo-o/instantcare-backend.git](https://github.com/yourusername/instantcare-backend.git)
   cd emergency-health-wallet
   npm run dev
