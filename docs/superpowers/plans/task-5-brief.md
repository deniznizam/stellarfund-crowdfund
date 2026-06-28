# Task 5 Brief: Build page structure with Fluid Milestone Journey UX

## Goal
Create `src/components/CrowdfundPage.tsx` and `src/app/fund/page.tsx` to display the crowdfunding journey.

## Design Aesthetic (Fluid Milestone Journey)
Instead of typical boxy cards, the interface must look like a fluid, interactive digital timeline:
- **SVG Neon Progress Track:** A glowing vertical SVG neon track that connects three Milestone Portals. As the progress percentage increases, the glowing path dynamically fills up to the active milestone node.
- **Portals (Milestones):**
  - **Planning (25%):** Starts as dim/inactive. Becomes active with a cyan pulse once the contract total >= 25% of the goal.
  - **Development (50%):** Becomes active with a violet pulse once total >= 50%.
  - **Production (100%):** Becomes active with an indigo pulse once total >= 100%.
- **Bağışçı Liderlik Tablosu (Top 3 Donors):** A morphing, glassmorphic card listing the top 3 donors with custom medals (🥇, 🥈, 🥉) and animated hover states.
- **Aktivite Akışı (Horizon Tx Feed):** An interface that queries Horizon testnet API for transaction history to display the last 5 transactions sent to the contract, sliding into view.

## Requirements
- Support language toggle (EN/TR) just like the main page.
- Integrate `useWallets` hook for connection and signing.
- Display wallet connection modal showing Freighter, xBull, and Lobstr.
- Handle 3 error types cleanly with distinct styling:
  1. `wallet_not_found`
  2. `user_rejected`
  3. `insufficient_balance`
- Display transaction statuses: pending, success (triggering the `Confetti` component), or failure.
- Auto-refresh campaign data every 5 seconds.
