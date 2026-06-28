# Spec: StellarFund — Fluid Crowdfunding dApp Design

## 1. Goal & Concept
StellarFund is a design-first crowdfunding page on Stellar Testnet. Instead of standard boxy cards, it visualizes campaign progress as a fluid, glowing milestone journey. Users can connect multiple wallets (Freighter, xBull, Lobstr) via `StellarWalletsKit` to donate XLM, pushing the progress line forward in real-time.

---

## 2. Smart Contract Architecture (Soroban Rust)

### Storage Layout
- **Campaign (Instance Storage):**
  - `title: String`
  - `goal: i128` (Stroops)
  - `total: i128` (Stroops)
  - `donor_count: u32`
  - `top_donors: Vec<TopDonor>` (Length max 3, sorted descending by amount)
- **Donor Balance (Persistent Storage):**
  - `DataKey::Donor(Address)` -> `i128` (Total amount donated by this address)

### TopDonor Struct
```rust
pub struct TopDonor {
    pub address: Address,
    pub amount: i128,
}
```

### Contract Interface
- `initialize(title: String, goal: i128)`: Can only be called once. Sets up the campaign.
- `fund(donor: Address, amount: i128)`: 
  - Verifies donor signature.
  - Adds to total raised.
  - Updates donor balance.
  - Recalculates and updates the `top_donors` list.
- `get_campaign()`: Returns the Campaign details and the top donors list.
- `get_donor_amount(donor: Address)`: Returns the total contribution of the donor.

---

## 3. UI/UX Design: Fluid Milestone Journey
The page `/fund` avoids standard cards. It features an interactive storytelling structure:

1.  **Neon Journey Track (SVG Path):**
    - A vertical or horizontal glowing neon path connecting three milestone portals:
      - **Portal 1: 25% (Planning)** — Activated when total >= 25% of goal.
      - **Portal 2: 50% (Development)** — Activated when total >= 50% of goal.
      - **Portal 3: 100% (Production)** — Activated when total >= goal.
    - An animated fluid dot moves along the path reflecting the exact percentage of progress.
2.  **Top Donors Leaderboard:**
    - A morphing, glassmorphic leaderboard showcasing the 3 top donors with animated crowns.
3.  **Live activity list:**
    - A chronological feed of recent transactions fetched directly from Horizon testnet, sliding in with smooth fade-in animations.
4.  **Floating Donation Panel:**
    - A sleek, floating interface that morphs when the user connects their wallet, presenting quick donation buttons.

---

## 4. Multi-Wallet Integration
- **Library:** `@creit-tech/stellar-wallets-kit`
- **Supported Wallets:** Freighter, xBull, Lobstr
- **Flow:**
  - Connect triggers the kit's wallet selection modal.
  - Upon selection, the public key is retrieved and saved in state.
  - Balance is fetched from Horizon to check against the donation amount.

---

## 5. Error Classification & Handling
Three types of errors are captured and reported:
1.  **`wallet_not_found`**: Wallet extension not active or installed.
2.  **`user_rejected`**: Signature request declined by user in cüzdan UI.
3.  **`insufficient_balance`**: Donation amount exceeds current wallet balance.

---

## 6. Verification Plan
- **Contract compilation**: `cargo build` with `wasm32v1-none` target.
- **Deploy**: verify contract deployment on Stellar Expert.
- **State polling**: verify local state updates every 5 seconds.
- **Transaction Flow**: end-to-end payment submission and status tracking.
