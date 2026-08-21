# IPlink

Creators can't borrow against income they can't prove. IPlink makes it provable.

A musician earning $2,000/month in royalties can't get a bank loan against that income — there's no way for a lender to verify it independently. IPlink lets creators raise capital against future revenue, where every payment is proven on-chain by the Attestcoin Protocol before a single payout moves.

**Live:** https://iplink-cyan.vercel.app
**Technical write-up:** https://iplink-cyan.vercel.app/docs/iplink-technical-integration.html

Built for BUIDL CTC 2026 Fall — RWA track.

---

## How it works

1. A creator opens a campaign — raise amount, revenue share percentage, return cap, term length.
2. Investors fund it. 40% of the raise stays in the contract to cover payouts; the creator receives 60%.
3. Real revenue arrives on a source chain (Ethereum Sepolia in this build).
4. Anyone generates an inclusion proof and submits it. Creditcoin's Block Prover precompile verifies it on-chain.
5. Only after verification does the campaign credit investors. They claim their share.
6. Once repayments reach the cap, rights revert to the creator.

No oracle operator. No self-reported numbers. Submitting a proof requires no permission — trust comes from the proof, not the submitter.

---

## Attestcoin Protocol integration

This is the core of the project, so it's worth being specific about what's actually happening.

`Campaign.sol` inherits `USCBase`, Creditcoin's reference pattern for Attestcoin smart contracts. When someone calls `execute()` with a proof:

1. A query ID is computed and checked against replay protection.
2. The proof is verified by the Block Prover precompile at `0x0FD2` — Merkle inclusion plus a continuity chain.
3. Only if verification passes does business logic run.
4. The transaction is decoded with Gluwa's `EvmV1Decoder`. We check the receipt succeeded, the `RoyaltyPaid` event came from our registered `RoyaltyPayer`, that the event names *this* campaign, and that the creator matches.
5. The revenue amount is credited.

Verification and business logic happen in the same transaction. There is no asynchronous callback and no intermediate trusted state.

Proof generation runs on a small Node relay (`/relay`) because the Gluwa SDK is Node-oriented and the prover API isn't set up for browser origins. The relay only generates proofs — it holds no keys and cannot move funds.

---

## Deployed contracts

| Contract | Network | Address |
|---|---|---|
| RoyaltyPayer | Ethereum Sepolia | `0xC8DA25fCd256Cd1642F83c78a0ccbD1bC65e52A5` |
| CampaignFactory | Creditcoin CC3 Testnet | `0x5748fAf08a3e543841b2b2c6E677d4fb5F7EC6F1` |
| Campaign — Mira Royalty Share | Creditcoin CC3 Testnet | `0x52Ee0b89eD2255850dE9e8B75C2808B84aB9c82c` |
| Campaign — Nova Forge Share | Creditcoin CC3 Testnet | `0xEF3E6889C4a4d3c8EBD85E4148Da596aE5f4c815` |

Everything is on public testnets. Tokens have no market value.

---

## Repository layout 
contracts/ Solidity contracts, Hardhat setup, tests, deploy scripts
frontend/ React + Vite app and landing page
relay/ Node service that generates Attestcoin inclusion proofs

### Contracts

- **`Campaign.sol`** — funding, verified revenue recording, payouts, refunds. Inherits `USCBase`.
- **`RevenueShareToken.sol`** — ERC-20 representing a share of revenue. Non-transferable (see security notes).
- **`CampaignFactory.sol`** — deploys campaigns, validates terms.
- **`RoyaltyPayer.sol`** — source-chain stand-in for a distributor paying royalties.
- **`USCBase.sol` / `VerifierInterface.sol`** — Creditcoin's reference contracts, used unmodified.

---

## Running locally

You'll need Node 18+, a wallet with Sepolia ETH and Creditcoin testnet CTC, and RPC access to both chains.

```bash
git clone https://github.com/Kingnanaweb3/iplink.git
cd iplink
```

**Contracts**

```bash
cd contracts
npm install
cp .env.example .env    # fill in private keys and RPC URLs
npx hardhat compile
npx hardhat test
```

**Relay**

```bash
cd relay
npm install
npm start               # listens on :8787
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

To point the frontend at a local relay instead of the hosted one, add `VITE_RELAY_URL=http://localhost:8787/generate-proof` to `frontend/.env`.

---

## Security

We audited our own contracts and found ten issues, several severe. All are fixed in the deployed version, with tests covering each one (`npx hardhat test`).

The most serious was a **share token transfer drain**: payout accounting keys off a per-holder checkpoint, so moving tokens to a fresh address reset that checkpoint and let the recipient re-claim the entire revenue history, repeatedly, using other investors' funds. Share tokens are now non-transferable.

Also fixed: capital release over-withdrawal, cross-campaign proof replay, double-investment erasing earnings, missing refunds, false "fully repaid" status, permanent bricking via oversized payments, creator self-investment, and rounding dust.

**What is not solved:**

A creator can take their 60%, never verify any revenue, and disappear. Investors would recover at most the 40% reserve. No contract can force someone to earn money. This is unsecured revenue-share financing and the risk is real — the honest fixes are tranched release tied to revenue milestones, or legal recourse.

Similarly, whitelisting stops third parties fabricating revenue, but a whitelisted creator could still pay themselves. The real fix is pointing at a distributor's actual payout contract, which can't be simulated on testnet.

Full detail in the [technical write-up](https://iplink-cyan.vercel.app/docs/iplink-technical-integration.html).

---

## Known limitations

- Share tokens can't be traded. Secondary market needs checkpointed balances.
- Source-chain revenue amounts map 1:1 to Creditcoin accounting units. Production would need an explicit settlement-asset design.
- Attestcoin currently supports Ethereum mainnet and Sepolia as source chains.
- Campaign metadata (titles, descriptions) is stored in the frontend, not on-chain.

---

## Stack

Solidity 0.8.28 · Hardhat 3 · React 19 · Vite · wagmi + viem · ethers v6 · `@gluwa/usc-sdk` · `@gluwa/usc-contracts`
